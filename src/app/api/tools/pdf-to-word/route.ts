import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Import PDF text extraction
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse-fork');
  console.log('pdf-parse-fork loaded successfully');
} catch (error) {
  console.warn('pdf-parse-fork not available, using fallback');
}

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    console.log('Processing PDF:', file.name);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF document
    let pdfDoc: PDFDocument | null = null;
    try {
      pdfDoc = await PDFDocument.load(buffer);
    } catch (error) {
      console.error('Error loading PDF:', error);
      return NextResponse.json(
        { error: 'Invalid or corrupted PDF file' },
        { status: 400 }
      );
    }

    // Extract basic information and attempt advanced text extraction
    let extractedText = '';
    let cleanRawText = ''; // For RTF use
    let pageCount = 0;
    let hasRealText = false;
    
    // Load PDF with pdf-lib to get basic information
    try {
      pdfDoc = await PDFDocument.load(buffer);
      pageCount = pdfDoc.getPageCount();
      console.log('PDF loaded successfully, pages:', pageCount);
      
      // Try text extraction with pdf-parse-fork
      if (pdfParse) {
        try {
          console.log('Attempting text extraction with pdf-parse-fork...');
          
          const pdfData = await pdfParse(buffer);
          const extractedTextRaw = pdfData.text || '';
          
          console.log('Raw text length:', extractedTextRaw.length);
          console.log('PDF info:', pdfData.info);
          
          if (extractedTextRaw && extractedTextRaw.trim().length > 20) {
            // Store the raw text for RTF use
            cleanRawText = extractedTextRaw
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .replace(/\f/g, '\n')
              .replace(/\t/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .trim();
            
            // Advanced text cleaning and formatting algorithm
            let cleanedText = extractedTextRaw;
            
            // Step 1: Normalize whitespace and line breaks
            cleanedText = cleanedText
              .replace(/\r\n/g, '\n') // Normalize line endings
              .replace(/\r/g, '\n')   // Handle old Mac line endings
              .replace(/\f/g, '\n')   // Replace form feeds with line breaks
              .replace(/\t/g, ' ')    // Replace tabs with spaces
              .trim();
            
            // Step 2: Pre-process common PDF artifacts
            cleanedText = cleanedText
              .replace(/([a-záéíóúü])([A-ZÁÉÍÓÚÜ])/g, '$1 $2') // Fix missing spaces between words
              .replace(/(\w)(\d+)/g, '$1 $2') // Space between text and numbers
              .replace(/(\d+)([A-Za-z])/g, '$1 $2') // Space between numbers and text
              .replace(/\s{2,}/g, ' ') // Multiple spaces to single space
              .replace(/([.!?])\s*\n\s*([a-záéíóúü])/g, '$1\n\n$2') // Paragraph breaks after sentences
              .replace(/([.!?])\s+([A-ZÁÉÍÓÚÜ])/g, '$1\n\n$2'); // Separate sentences into paragraphs
            
            // Step 3: Advanced line processing and structure detection
            const lines = cleanedText.split('\n');
            const processedLines: Array<{content: string, type: string, level: number}> = [];
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
              const prevLine = i > 0 ? lines[i - 1].trim() : '';
              
              if (!line) {
                processedLines.push({content: '', type: 'empty', level: 0});
                continue;
              }
              
              // Detect different types of content
              let lineType = 'paragraph';
              let level = 0;
              
              // 1. Main titles (all caps, centered, short, and not part of a sentence)
              if (line.length < 50 && line.match(/^[A-ZÁÉÍÓÚÜ\s\d\-]+$/) && 
                  !line.match(/^[A-Z]\.\s/) && !line.includes('**') && 
                  line.split(' ').length <= 8) {
                lineType = 'title';
                level = 1;
              }
              // 2. Chapter/section headers - more restrictive
              else if (line.length < 60 && !line.match(/[.!?]$/) && 
                       line.match(/^[A-ZÁÉÍÓÚÜ]/) && !line.includes('**') &&
                       !line.match(/\b(el|la|de|del|en|con|por|para|un|una|este|esta|que|se|ser|debe|puede)\b/i)) {
                const wordCount = line.split(' ').length;
                if (wordCount <= 6) {
                  lineType = 'header';
                  level = 2;
                }
              }
              // 3. Numbered sections (1., 1.1., A., I.)
              else if (line.match(/^(\d+\.|\d+\.\d+\.?|[A-Z]\.?|\b[IVX]+\.?)\s+[A-ZÁÉÍÓÚÜ]/)) {
                lineType = 'numbered-header';
                level = line.match(/^\d+\.\d+/) ? 3 : 2;
              }
              // 4. Bullet points and lists
              else if (line.match(/^[•\-\*]\s+/) || line.match(/^(\d+)\.\s+/) || line.match(/^[a-z]\)\s+/)) {
                lineType = 'list-item';
                level = 0;
              }
              // 5. Special formatting (NOTA:, IMPORTANTE:, etc.)
              else if (line.match(/^(NOTA|IMPORTANTE|ATENCIÓN|OBSERVACIÓN|ADVERTENCIA|TIP|CONSEJO):/i)) {
                lineType = 'note';
                level = 0;
              }
              // 6. Dates and metadata
              else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || line.match(/^Fecha:|^Date:|^Versión:|^Version:/i)) {
                lineType = 'metadata';
                level = 0;
              }
              // 7. Table-like content (multiple columns separated by spaces/tabs)
              else if (line.match(/\s{3,}/) && line.split(/\s{3,}/).length >= 3) {
                lineType = 'table-row';
                level = 0;
              }
              
              processedLines.push({content: line, type: lineType, level});
            }
            
            // Step 4: Generate formatted output
            const formattedLines: string[] = [];
            
            for (let i = 0; i < processedLines.length; i++) {
              const {content, type, level} = processedLines[i];
              const nextItem = i < processedLines.length - 1 ? processedLines[i + 1] : null;
              const prevItem = i > 0 ? processedLines[i - 1] : null;
              
              switch (type) {
                case 'empty':
                  formattedLines.push('');
                  break;
                  
                case 'title':
                  // Add spacing before major titles
                  if (prevItem && prevItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  formattedLines.push(`# ${content}`);
                  formattedLines.push('');
                  break;
                  
                case 'header':
                  if (prevItem && prevItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  formattedLines.push(`## ${content}`);
                  formattedLines.push('');
                  break;
                  
                case 'numbered-header':
                  if (prevItem && prevItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  const headerPrefix = level === 3 ? '###' : '##';
                  formattedLines.push(`${headerPrefix} ${content}`);
                  formattedLines.push('');
                  break;
                  
                case 'list-item':
                  // Ensure proper spacing before lists
                  if (prevItem && prevItem.type !== 'list-item' && prevItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  formattedLines.push(content);
                  // Add spacing after lists if next item is not a list
                  if (nextItem && nextItem.type !== 'list-item' && nextItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  break;
                  
                case 'note':
                  if (prevItem && prevItem.type !== 'empty') {
                    formattedLines.push('');
                  }
                  formattedLines.push(`**${content}**`);
                  formattedLines.push('');
                  break;
                  
                case 'metadata':
                  formattedLines.push(`*${content}*`);
                  break;
                  
                case 'table-row':
                  // Format table-like content
                  const columns = content.split(/\s{3,}/);
                  formattedLines.push(columns.join(' | '));
                  break;
                  
                default: // paragraph
                  // Regular paragraph text
                  if (content.length > 150) {
                    // Long paragraphs - ensure proper spacing
                    if (prevItem && prevItem.type !== 'empty' && prevItem.type !== 'paragraph') {
                      formattedLines.push('');
                    }
                    formattedLines.push(content);
                    if (nextItem && nextItem.type !== 'empty' && nextItem.type !== 'paragraph') {
                      formattedLines.push('');
                    }
                  } else {
                    formattedLines.push(content);
                  }
                  break;
              }
            }
            
            // Step 5: Final cleanup and formatting
            let finalText = formattedLines.join('\n')
              .replace(/\n{3,}/g, '\n\n') // Limit multiple line breaks
              .replace(/([.!?])\s*\n\s*#/g, '$1\n\n#') // Space before headers
              .replace(/([.!?])\s*\n\s*\*/g, '$1\n\n*') // Space before emphasized text
              .replace(/\n\s*\n\s*([•\-\*]|\d+\.)/g, '\n\n$1') // Proper list formatting
              .trim();
            
            // Step 6: Enhance specific patterns - more conservative approach
            finalText = finalText
              .replace(/\bOpción\s+(\d+)/gi, '\n**Opción $1**')
              .replace(/\bMenú\s+Principal/gi, '\n**Menú Principal**')
              .replace(/\bRegistro\s+de\s+/gi, '\n**Registro de **')
              .replace(/\b(DESCRIPCIÓN|OBJETIVO|METODOLOGÍA|RESULTADOS|CONCLUSIÓN):/gi, '\n## $1\n')
              .trim();
            
            extractedText = finalText;
            hasRealText = true;
            
            console.log('Text extraction and formatting successful!');
            console.log('Original length:', extractedTextRaw.length);
            console.log('Formatted length:', extractedText.length);
            console.log('First 300 chars:', extractedText.substring(0, 300));
          }
          
        } catch (parseError) {
          console.error('Error with pdf-parse-fork:', parseError);
          if (parseError instanceof Error) {
            console.error('Error details:', parseError.message);
          }
        }
      }
      
      // If no real text was extracted, create informative content
      if (!hasRealText) {
        // Get PDF info and metadata
        const pdfInfo = {
          title: pdfDoc.getTitle(),
          author: pdfDoc.getAuthor(),
          subject: pdfDoc.getSubject(),
          creator: pdfDoc.getCreator(),
          producer: pdfDoc.getProducer(),
          creationDate: pdfDoc.getCreationDate(),
          modificationDate: pdfDoc.getModificationDate()
        };
        
        console.log('PDF metadata:', pdfInfo);
        
        // Create comprehensive document content
        extractedText = `PDF Document Successfully Converted\n\n`;
        
        // Add metadata if available
        if (pdfInfo.title) {
          extractedText += `Title: ${pdfInfo.title}\n`;
        }
        if (pdfInfo.author) {
          extractedText += `Author: ${pdfInfo.author}\n`;
        }
        if (pdfInfo.subject) {
          extractedText += `Subject: ${pdfInfo.subject}\n`;
        }
        if (pdfInfo.creator) {
          extractedText += `Created with: ${pdfInfo.creator}\n`;
        }
        if (pdfInfo.creationDate) {
          extractedText += `Created: ${pdfInfo.creationDate.toLocaleString()}\n`;
        }
        
        extractedText += `\nDocument Information:\n`;
        extractedText += `• Original filename: ${file.name}\n`;
        extractedText += `• Total pages: ${pageCount}\n`;
        extractedText += `• File size: ${(file.size / 1024).toFixed(1)} KB\n`;
        extractedText += `• Processing date: ${new Date().toLocaleString()}\n`;
        extractedText += `• Conversion tool: ToolBox PDF to Word Converter\n\n`;
        
        extractedText += `Advanced Text Extraction Results:\n`;
        extractedText += `This PDF was processed with multiple text extraction methods:\n`;
        extractedText += `• pdf-parse-fork (Enhanced PDF parser) - ${pdfParse ? 'Attempted' : 'Not available'}\n`;
        extractedText += `• pdf-lib (Document structure analysis) - Completed\n\n`;
        
        extractedText += `Analysis Results:\n`;
        extractedText += `• Document structure: Successfully analyzed\n`;
        extractedText += `• Page count: ${pageCount} pages detected\n`;
        extractedText += `• Extractable text: ${hasRealText ? 'Found' : 'Not found'}\n`;
        
        // Special note for Word-generated PDFs
        if (pdfInfo.creator === 'Word' || pdfInfo.title?.includes('Word')) {
          extractedText += `• Document type: Word-generated PDF (should contain extractable text)\n\n`;
          extractedText += `⚠️ IMPORTANT: This PDF was created from Microsoft Word and should contain extractable text.\n`;
          extractedText += `If no text was extracted, this suggests:\n`;
          extractedText += `• The Word document may have been converted to images during PDF creation\n`;
          extractedText += `• PDF security settings may be preventing text extraction\n`;
          extractedText += `• The original document had text as images or shapes\n\n`;
          extractedText += `Try these solutions:\n`;
          extractedText += `1. Re-export from Word: File → Save As → PDF → Options → ensure text is not flattened\n`;
          extractedText += `2. Copy text directly from the original Word document\n`;
          extractedText += `3. If you can select text in a PDF viewer, copy and paste it manually\n`;
        } else {
          extractedText += `• Document type: Likely ${hasRealText ? 'text-based' : 'image-based or scanned'}\n\n`;
          extractedText += `This suggests your PDF contains:\n`;
          extractedText += `• Scanned pages (images of text, not actual text)\n`;
          extractedText += `• Graphics or images without text layer\n`;
          extractedText += `• Protected content that cannot be extracted\n`;
          extractedText += `• Complex layouts with embedded fonts\n\n`;
        }
        
        extractedText += `Next Steps for Text Extraction:\n`;
        extractedText += `1. OCR Software: Use Adobe Acrobat Pro, ABBYY FineReader, or Tesseract\n`;
        extractedText += `2. Online OCR: Try online services like SmallPDF, ILovePDF OCR\n`;
        extractedText += `3. Google Drive: Upload to Google Drive, it will OCR automatically\n`;
        extractedText += `4. Manual Copy: If you can select text in a PDF viewer, copy and paste it here\n\n`;
        
        extractedText += `Using This RTF File:\n`;
        extractedText += `• Open in Microsoft Word: File → Open → Browse → select this RTF\n`;
        extractedText += `• Open in Google Docs: File → Open → Upload files → select this RTF\n`;
        extractedText += `• Edit and add your content manually\n`;
        extractedText += `• Save as .docx when done for full Word compatibility\n\n`;
        
        extractedText += `Professional Tip:\n`;
        extractedText += `If this is an academic paper or important document, consider:\n`;
        extractedText += `• Using Adobe Acrobat Pro's OCR feature for best results\n`;
        extractedText += `• Checking if the original document source is available in editable format\n`;
        extractedText += `• Converting to high-quality images first, then applying OCR`;
      } else {
        // We have real text! Prepare it properly
        extractedText = `PDF Document - Text Successfully Extracted!\n\n` +
                       `Original file: ${file.name}\n` +
                       `Pages: ${pageCount}\n` +
                       `Extraction method: pdf-parse-fork (Advanced)\n` +
                       `Converted on: ${new Date().toLocaleString()}\n\n` +
                       `=== DOCUMENT CONTENT ===\n\n` +
                       extractedText;
      }
      
    } catch (error) {
      console.error('Error loading PDF with pdf-lib:', error);
      return NextResponse.json(
        { error: 'Invalid or corrupted PDF file' },
        { status: 400 }
      );
    }

    // Prepare content for RTF (simple, clean text)
    let simpleTextContent = '';
    if (hasRealText) {
      // Use clean raw text without markdown formatting for RTF
      simpleTextContent = cleanRawText;
    } else {
      simpleTextContent = extractedText;
    }

    // Prepare content for Word document (with basic info)
    let documentContent = `PDF to Word Conversion\n`;
    documentContent += `Original file: ${file.name}\n`;
    documentContent += `Pages: ${pageCount}\n`;
    documentContent += `Converted on: ${new Date().toLocaleString()}\n`;
    documentContent += `Text extraction: ${hasRealText ? 'Successful' : 'Fallback mode'}\n\n`;
    documentContent += `--- Document Content ---\n\n`;
    documentContent += simpleTextContent;

    // Generate unique filename
    const fileId = randomUUID();
    const originalName = file.name.replace('.pdf', '');
    
    // Create both RTF and DOCX files
    const rtfFilename = `${fileId}-${originalName}.rtf`;
    const docxFilename = `${fileId}-${originalName}.docx`;
    const rtfPath = join(UPLOADS_DIR, rtfFilename);
    const docxPath = join(UPLOADS_DIR, docxFilename);

    // Create RTF content (simple, without markdown formatting)
    const rtfContent = createRTFDocument(documentContent, file.name);
    await writeFile(rtfPath, rtfContent, 'utf8');

    // Create DOCX document (with advanced formatting from extractedText)
    const docxDoc = await createDOCXDocument(extractedText, file.name, pageCount, hasRealText);
    const docxBuffer = await Packer.toBuffer(docxDoc);
    await writeFile(docxPath, docxBuffer);

    // Get file stats for both files
    const rtfStats = await require('fs').promises.stat(rtfPath);
    const docxStats = await require('fs').promises.stat(docxPath);

    return NextResponse.json({
      success: true,
      originalName: file.name,
      // Return DOCX as primary download
      convertedUrl: `/uploads/${docxFilename}`,
      alternativeUrl: `/uploads/${rtfFilename}`, // RTF as alternative
      fileId: fileId,
      originalFormat: 'PDF',
      convertedFormat: 'DOCX (Microsoft Word)',
      alternativeFormat: 'RTF (Universal)',
      originalSize: file.size,
      convertedSize: docxStats.size,
      alternativeSize: rtfStats.size,
      pageCount: pageCount,
      textExtracted: hasRealText,
      fileSizeKB: (docxStats.size / 1024).toFixed(2) + ' KB',
      extractionMethod: pdfParse ? 'pdf-parse-fork + pdf-lib' : 'pdf-lib only'
    });

  } catch (error) {
    console.error('Error converting PDF to Word:', error);
    return NextResponse.json(
      { error: 'Error converting PDF to Word: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

async function createDOCXDocument(content: string, originalFilename: string, pageCount: number, hasRealText: boolean): Promise<Document> {
  const children: any[] = [];
  
  // Title section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "PDF to Word Conversion",
          bold: true,
          size: 32,
          color: "2563EB"
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 }
    })
  );

  // File Information section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Document Information",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Original file: `, bold: true }),
        new TextRun({ text: originalFilename })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Pages: `, bold: true }),
        new TextRun({ text: pageCount.toString() })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Converted on: `, bold: true }),
        new TextRun({ text: new Date().toLocaleString() })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Text extraction: `, bold: true }),
        new TextRun({ 
          text: hasRealText ? "Successful" : "Fallback mode",
          color: hasRealText ? "16A34A" : "DC2626"
        })
      ],
      spacing: { after: 400 }
    })
  );

  // Separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "━".repeat(50),
          color: "6B7280"
        })
      ],
      spacing: { after: 300 }
    })
  );

  // Document Content Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Extracted Content",
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 }
    })
  );

  // Process content with advanced formatting
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line.trim()) {
      // Empty line - add spacing
      children.push(new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { after: 100 }
      }));
      continue;
    }
    
    // Parse markdown-like formatting
    if (line.startsWith('# ')) {
      // Main title
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: line.substring(2),
            bold: true,
            size: 28,
            color: "1D4ED8"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    } else if (line.startsWith('## ')) {
      // Section header
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: line.substring(3),
            bold: true,
            size: 24,
            color: "2563EB"
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      }));
    } else if (line.startsWith('### ')) {
      // Subsection header
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: line.substring(4),
            bold: true,
            size: 22,
            color: "3B82F6"
          })
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 250, after: 125 }
      }));
    } else if (line.match(/^\*\*(.+)\*\*$/)) {
      // Bold/emphasized text
      const boldText = line.replace(/^\*\*(.+)\*\*$/, '$1');
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: boldText,
            bold: true,
            color: "059669"
          })
        ],
        spacing: { before: 150, after: 150 }
      }));
    } else if (line.match(/^\*(.+)\*$/)) {
      // Italic/metadata text
      const italicText = line.replace(/^\*(.+)\*$/, '$1');
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: italicText,
            italics: true,
            color: "6B7280"
          })
        ],
        spacing: { after: 100 }
      }));
    } else if (line.match(/^[\d]+\.\s+/) || line.match(/^[•\-\*]\s+/)) {
      // List items (numbered or bulleted)
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 22
          })
        ],
        spacing: { after: 100 },
        indent: { left: 360 } // Indent list items
      }));
    } else if (line.includes(' | ')) {
      // Table-like content
      const columns = line.split(' | ');
      const tableText = columns.join('    ');
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: tableText,
            font: "Courier New",
            size: 20
          })
        ],
        spacing: { after: 100 }
      }));
    } else {
      // Regular paragraph
      // Check if it's a long paragraph for different spacing
      const isLongParagraph = line.length > 150;
      
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 22
          })
        ],
        spacing: { 
          after: isLongParagraph ? 200 : 150,
          lineRule: "auto"
        }
        // Remove automatic centering - let content flow naturally
      }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: children
    }]
  });

  return doc;
}

function createRTFDocument(content: string, originalFilename: string): string {
  // Create a simple RTF document - back to basic formatting
  const rtfHeader = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0\\froman Times New Roman;}{\\f1\\fswiss Arial;}{\\f2\\fmodern Courier New;}}`;
  const colorTable = `{\\colortbl;\\red0\\green0\\blue0;\\red0\\green0\\blue255;\\red255\\green0\\blue0;}`;
  
  // Title section
  const rtfTitle = `\\f1\\fs28\\b\\cf2 PDF to Word Conversion\\cf1\\b0\\par\\par`;
  
  // Metadata section
  const rtfMeta = `\\f0\\fs20\\b File Information:\\b0\\par`;
  const rtfMeta2 = `Original file: ${originalFilename.replace(/\\/g, '\\\\')}\\par`;
  const rtfMeta3 = `Converted on: ${new Date().toLocaleString()}\\par`;
  const rtfMeta4 = `Conversion tool: ToolBox PDF to Word Converter\\par\\par`;
  
  // Separator line
  const separator = `\\f2\\fs18 ${'='.repeat(60)}\\par\\par`;
  
  // Convert content to RTF format with simple formatting
  let rtfContent = content
    // Escape RTF special characters
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    // Convert line breaks - keep it simple
    .replace(/\n\n/g, '\\par\\par ')
    .replace(/\n/g, '\\par ')
    // Convert tabs
    .replace(/\t/g, '\\tab ')
    // Very basic header formatting only
    .replace(/^([A-Z\s]+:)/gm, '\\b $1\\b0');

  const rtfDocument = `${rtfHeader}${colorTable}\\f0\\fs20 ${rtfTitle}${rtfMeta}${rtfMeta2}${rtfMeta3}${rtfMeta4}${separator}\\fs18 ${rtfContent}\\par}`;
  
  return rtfDocument;
}
