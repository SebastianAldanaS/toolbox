import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const width = parseInt(formData.get('width') as string) || null
    const height = parseInt(formData.get('height') as string) || null
    const maintainAspectRatio = formData.get('maintainAspectRatio') === 'true'
    const resizeMode = formData.get('resizeMode') as string || 'cover'
    const quality = parseInt(formData.get('quality') as string) || 80
    const outputFormat = formData.get('outputFormat') as string || 'original'
    
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

    // Validar dimensiones
    if (!width && !height) {
      return NextResponse.json(
        { error: 'At least width or height must be provided' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Obtener información original
    const originalInfo = await sharp(buffer).metadata()
    
    if (!originalInfo.width || !originalInfo.height) {
      return NextResponse.json(
        { error: 'Could not get image dimensions' },
        { status: 400 }
      )
    }

    // Calcular dimensiones finales
    const finalDimensions = calculateDimensions(
      originalInfo.width,
      originalInfo.height,
      width,
      height,
      maintainAspectRatio
    )

    // Determinar formato de salida
    const finalFormat = outputFormat === 'original' 
      ? (originalInfo.format || 'jpeg')
      : outputFormat

    // Generar nombre único para el archivo redimensionado
    const fileId = randomUUID()
    const originalName = file.name.split('.')[0]
    const outputFilename = `${fileId}-${originalName}-${finalDimensions.width}x${finalDimensions.height}.${finalFormat}`
    
    // Asegurar que el directorio de uploads existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    const outputPath = join(uploadsDir, outputFilename)

    // Redimensionar imagen
    const resizedImage = await resizeImage(
      buffer, 
      finalDimensions.width, 
      finalDimensions.height,
      resizeMode,
      finalFormat,
      quality
    )
    
    // Guardar imagen redimensionada
    await writeFile(outputPath, resizedImage)

    // Obtener información del archivo redimensionado
    const resizedInfo = await sharp(resizedImage).metadata()

    return NextResponse.json({
      success: true,
      originalName: file.name,
      resizedUrl: `/uploads/${outputFilename}`,
      fileId: fileId,
      original: {
        width: originalInfo.width,
        height: originalInfo.height,
        size: file.size,
        format: originalInfo.format
      },
      resized: {
        width: resizedInfo.width,
        height: resizedInfo.height,
        size: resizedImage.length,
        format: finalFormat
      },
      settings: {
        requestedWidth: width,
        requestedHeight: height,
        maintainAspectRatio,
        resizeMode,
        quality
      }
    })

  } catch (error) {
    console.error('Error resizing image:', error)
    return NextResponse.json(
      { error: 'Error resizing image' },
      { status: 500 }
    )
  }
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number | null,
  targetHeight: number | null,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  
  if (!maintainAspectRatio) {
    return {
      width: targetWidth || originalWidth,
      height: targetHeight || originalHeight
    }
  }

  const aspectRatio = originalWidth / originalHeight

  if (targetWidth && targetHeight) {
    // Ambas dimensiones especificadas, mantener aspecto ratio
    const widthRatio = targetWidth / originalWidth
    const heightRatio = targetHeight / originalHeight
    const ratio = Math.min(widthRatio, heightRatio)
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    }
  } else if (targetWidth) {
    // Solo ancho especificado
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio)
    }
  } else if (targetHeight) {
    // Solo alto especificado
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight
    }
  }

  return { width: originalWidth, height: originalHeight }
}

async function resizeImage(
  imageBuffer: Buffer,
  width: number,
  height: number,
  resizeMode: string,
  outputFormat: string,
  quality: number
): Promise<Buffer> {
  try {
    let pipeline = sharp(imageBuffer)

    // Aplicar redimensionamiento según el modo
    switch (resizeMode) {
      case 'cover':
        // Cubrir toda el área, recortar si es necesario
        pipeline = pipeline.resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        break
      
      case 'contain':
        // Contener toda la imagen, agregar padding si es necesario
        pipeline = pipeline.resize(width, height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        break
      
      case 'fill':
        // Estirar para llenar exactamente las dimensiones
        pipeline = pipeline.resize(width, height, {
          fit: 'fill'
        })
        break
      
      case 'inside':
        // Redimensionar solo si es más grande que las dimensiones objetivo
        pipeline = pipeline.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        break
      
      case 'outside':
        // Redimensionar para que la imagen sea al menos tan grande como las dimensiones objetivo
        pipeline = pipeline.resize(width, height, {
          fit: 'outside'
        })
        break
      
      default:
        // Por defecto, usar cover
        pipeline = pipeline.resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
    }

    // Aplicar formato de salida
    switch (outputFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality: Math.max(1, Math.min(100, quality)),
          progressive: true,
          mozjpeg: true
        })
        break

      case 'png':
        pipeline = pipeline.png({ 
          compressionLevel: 9,
          progressive: true
        })
        break

      case 'webp':
        pipeline = pipeline.webp({ 
          quality: Math.max(1, Math.min(100, quality)),
          effort: 6
        })
        break
    }

    const result = await pipeline.toBuffer()
    return result

  } catch (error) {
    console.error('Error in resizeImage:', error)
    throw error
  }
}
