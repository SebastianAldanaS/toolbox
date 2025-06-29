import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const outputFormat = formData.get('outputFormat') as string
    const quality = parseInt(formData.get('quality') as string) || 80
    const maintainTransparency = formData.get('maintainTransparency') === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validar formato de salida
    const supportedFormats = ['jpeg', 'png', 'webp']
    if (!supportedFormats.includes(outputFormat)) {
      return NextResponse.json(
        { error: 'Unsupported output format' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar nombre único para el archivo convertido
    const fileId = randomUUID()
    const originalName = file.name.split('.')[0]
    const outputFilename = `${fileId}-${originalName}.${outputFormat}`
    
    // Asegurar que el directorio de uploads existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    const outputPath = join(uploadsDir, outputFilename)

    // Procesar imagen
    const convertedImage = await convertImage(buffer, outputFormat, quality, maintainTransparency)
    
    // Guardar imagen convertida
    await writeFile(outputPath, convertedImage)

    // Obtener información del archivo original y convertido
    const originalInfo = await sharp(buffer).metadata()
    const convertedInfo = await sharp(convertedImage).metadata()

    return NextResponse.json({
      success: true,
      originalName: file.name,
      convertedUrl: `/uploads/${outputFilename}`,
      fileId: fileId,
      originalFormat: originalInfo.format,
      convertedFormat: outputFormat,
      originalSize: file.size,
      convertedSize: convertedImage.length,
      dimensions: {
        width: originalInfo.width,
        height: originalInfo.height
      },
      quality: outputFormat === 'png' ? 100 : quality
    })

  } catch (error) {
    console.error('Error converting image:', error)
    return NextResponse.json(
      { error: 'Error converting image' },
      { status: 500 }
    )
  }
}

async function convertImage(
  imageBuffer: Buffer, 
  outputFormat: string, 
  quality: number,
  maintainTransparency: boolean
): Promise<Buffer> {
  try {
    let pipeline = sharp(imageBuffer)

    // Configurar pipeline según el formato de salida
    switch (outputFormat) {
      case 'jpeg':
        // JPEG no soporta transparencia
        if (!maintainTransparency) {
          pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
        }
        pipeline = pipeline.jpeg({ 
          quality: Math.max(1, Math.min(100, quality)),
          progressive: true,
          mozjpeg: true
        })
        break

      case 'png':
        pipeline = pipeline.png({ 
          quality: Math.max(1, Math.min(100, quality)),
          progressive: true,
          compressionLevel: 9
        })
        break

      case 'webp':
        pipeline = pipeline.webp({ 
          quality: Math.max(1, Math.min(100, quality)),
          effort: 6
        })
        break

      default:
        throw new Error(`Unsupported format: ${outputFormat}`)
    }

    const result = await pipeline.toBuffer()
    return result

  } catch (error) {
    console.error('Error in convertImage:', error)
    throw error
  }
}
