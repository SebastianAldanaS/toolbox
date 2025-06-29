import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import mammoth from 'mammoth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Function to clean text of problematic characters
function cleanTextForPDF(text: string): string {
  return text
    // Replace common problematic Unicode characters
    .replace(/[""]/g, '"') // Smart quotes
    .replace(/['']/g, "'") // Smart apostrophes
    .replace(/[—–]/g, '-') // Em/en dashes
    .replace(/[…]/g, '...') // Ellipsis
    .replace(/[█▓▒░]/g, '') // Block characters
    .replace(/[\u2000-\u206F]/g, ' ') // General punctuation range
    .replace(/[\u2070-\u209F]/g, '') // Superscripts and subscripts
    .replace(/[\u20A0-\u20CF]/g, '') // Currency symbols
    .replace(/[\u2100-\u214F]/g, '') // Letterlike symbols
    .replace(/[\u2150-\u218F]/g, '') // Number forms
    .replace(/[\u2190-\u21FF]/g, '') // Arrows
    .replace(/[\u2200-\u22FF]/g, '') // Mathematical operators
    .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
    .replace(/[\u2400-\u243F]/g, '') // Control pictures
    .replace(/[\u2440-\u245F]/g, '') // Optical character recognition
    .replace(/[\u2460-\u24FF]/g, '') // Enclosed alphanumerics
    .replace(/[\u2500-\u257F]/g, '') // Box drawing
    .replace(/[\u2580-\u259F]/g, '') // Block elements
    .replace(/[\u25A0-\u25FF]/g, '') // Geometric shapes
    .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous symbols
    .replace(/[\u2700-\u27BF]/g, '') // Dingbats
    // Replace any remaining non-ASCII characters that might cause issues
    .replace(/[^\x00-\x7F]/g, function(char) {
      // Keep common accented characters, replace others
      const code = char.charCodeAt(0)
      if (code <= 255) return char // Keep Latin-1 characters
      return '' // Remove everything else
    })
    // Clean up multiple spaces and normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      return NextResponse.json(
        { error: 'Solo se soportan archivos .docx y .doc. Para archivos .doc, la conversión puede ser limitada.' },
        { status: 400 }
      )
    }

    // Create temporary directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFilePath = join(tempDir, `input_${Date.now()}.docx`)
    
    await writeFile(tempFilePath, buffer)

    try {
      // Extract HTML from DOCX using mammoth for better formatting preservation
      const result = await mammoth.convertToHtml({ path: tempFilePath })
      const html = result.value
      const messages = result.messages
      
      // Log any conversion messages
      if (messages.length > 0) {
        console.log('Mammoth conversion messages:', messages)
      }

      if (!html || html.trim().length === 0) {
        throw new Error('No content found in the document')
      }

      // Create a simple HTML document for conversion
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.4;
              margin: 40px;
              color: #000;
            }
            p { margin: 0 0 10px 0; }
            h1, h2, h3, h4, h5, h6 { 
              margin: 20px 0 10px 0; 
              font-weight: bold;
            }
            h1 { font-size: 18pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            strong, b { font-weight: bold; }
            em, i { font-style: italic; }
            ul, ol { margin: 10px 0; padding-left: 25px; }
            li { margin: 5px 0; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `

      // For a more basic approach without puppeteer, let's extract plain text
      // and create a better formatted PDF
      const textResult = await mammoth.extractRawText({ path: tempFilePath })
      let text = textResult.value
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the document')
      }

      // Clean text of problematic characters
      text = cleanTextForPDF(text)
      
      if (!text || text.trim().length === 0) {
        throw new Error('Document content could not be processed - may contain only unsupported characters')
      }

      // Create PDF using pdf-lib with better formatting
      const pdfDoc = await PDFDocument.create()
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      
      const fontSize = 11
      const lineHeight = 14
      const margin = 60
      const pageWidth = 595.28 // A4 width in points
      const pageHeight = 841.89 // A4 height in points
      const maxWidth = pageWidth - (margin * 2)
      
      // Split text into paragraphs and lines
      const paragraphs = text.split(/\n\s*\n/)
      const lines = []
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          const words = paragraph.trim().split(/\s+/)
          let currentLine = ''
          
          for (const word of words) {
            // Clean each word individually as a safety measure
            const cleanWord = cleanTextForPDF(word)
            if (!cleanWord) continue // Skip if word becomes empty after cleaning
            
            const testLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord
            
            try {
              const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize)
              
              if (textWidth <= maxWidth) {
                currentLine = testLine
              } else {
                if (currentLine) {
                  lines.push({ text: currentLine, type: 'normal' })
                }
                currentLine = cleanWord
              }
            } catch (error) {
              console.warn('Error measuring text width for word:', cleanWord, error)
              // Skip problematic words but continue processing
              continue
            }
          }
          
          if (currentLine) {
            lines.push({ text: currentLine, type: 'normal' })
          }
          
          // Add paragraph break
          lines.push({ text: '', type: 'break' })
        }
      }

      // Remove last break
      if (lines.length > 0 && lines[lines.length - 1].type === 'break') {
        lines.pop()
      }

      // Calculate lines per page
      const linesPerPage = Math.floor((pageHeight - (margin * 2)) / lineHeight)
      
      // Create pages and add text
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      let currentY = pageHeight - margin
      let lineCount = 0
      
      for (const line of lines) {
        if (line.type === 'break') {
          currentY -= lineHeight / 2 // Half line for paragraph break
          lineCount += 0.5
          continue
        }
        
        if (lineCount >= linesPerPage - 1) {
          // Create new page
          currentPage = pdfDoc.addPage([pageWidth, pageHeight])
          currentY = pageHeight - margin
          lineCount = 0
        }
        
        try {
          // Clean the text one more time before drawing
          const cleanLineText = cleanTextForPDF(line.text)
          if (cleanLineText.trim()) {
            currentPage.drawText(cleanLineText, {
              x: margin,
              y: currentY,
              size: fontSize,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            })
          }
        } catch (error) {
          console.warn('Error drawing text line:', line.text, error)
          // Draw a placeholder or skip the problematic line
          try {
            currentPage.drawText('[Content could not be displayed]', {
              x: margin,
              y: currentY,
              size: fontSize,
              font: timesRomanFont,
              color: rgb(0.5, 0.5, 0.5),
            })
          } catch (fallbackError) {
            console.warn('Even fallback text failed:', fallbackError)
          }
        }
        
        currentY -= lineHeight
        lineCount++
      }

      // Add metadata to PDF
      pdfDoc.setTitle(file.name.replace('.docx', ''))
      pdfDoc.setCreator('ToolBox Word to PDF Converter')
      pdfDoc.setProducer('ToolBox')
      pdfDoc.setCreationDate(new Date())

      // Save PDF
      const pdfBytes = await pdfDoc.save()
      const outputFileName = `${file.name.replace('.docx', '')}_converted.pdf`
      const outputPath = join(tempDir, outputFileName)
      
      await writeFile(outputPath, pdfBytes)

      // Clean up input file
      await unlink(tempFilePath)

      // Return success response with download URL
      return NextResponse.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/api/download/${outputFileName}`,
        originalSize: file.size,
        convertedSize: pdfBytes.length
      })

    } catch (conversionError) {
      // Clean up input file in case of error
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Failed to clean up input file:', cleanupError)
      }
      
      console.error('Conversion error:', conversionError)
      
      // Return a more user-friendly error for common issues
      if (conversionError instanceof Error) {
        if (conversionError.message.includes('No text content') || 
            conversionError.message.includes('No content found')) {
          return NextResponse.json({
            success: false,
            error: 'El documento parece estar vacío o no contiene texto extraíble. Verifique que el archivo no esté corrupto.'
          }, { status: 400 })
        }
        
        if (conversionError.message.includes('not a valid zip file') ||
            conversionError.message.includes('invalid zip file')) {
          return NextResponse.json({
            success: false,
            error: 'El archivo no parece ser un documento Word válido (.docx). Asegúrese de que el archivo no esté corrupto.'
          }, { status: 400 })
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error al procesar el documento. Verifique que el archivo sea un documento Word válido (.docx).'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Word to PDF conversion error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
