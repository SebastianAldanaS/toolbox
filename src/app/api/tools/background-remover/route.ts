import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar nombre único para el archivo procesado
    const fileId = randomUUID()
    const outputFilename = `${fileId}.png`
    
    // Asegurar que el directorio de uploads existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    const outputPath = join(uploadsDir, outputFilename)

    // Procesar imagen para quitar fondo
    // Nota: Esta es una implementación básica que detecta colores similares al fondo
    const processedImage = await removeBackground(buffer)
    
    // Guardar imagen procesada
    await writeFile(outputPath, processedImage)

    return NextResponse.json({
      success: true,
      originalName: file.name,
      processedUrl: `/uploads/${outputFilename}`,
      fileId: fileId
    })

  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Error processing image' },
      { status: 500 }
    )
  }
}

async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Obtener metadatos de la imagen
    const { width, height } = await sharp(imageBuffer).metadata()
    
    if (!width || !height) {
      throw new Error('Could not get image dimensions')
    }

    // Convertir a RGBA para tener canal alpha
    const { data } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Algoritmo simple de remoción de fondo
    // Detecta el color dominante en las esquinas y lo hace transparente
    const newData = Buffer.from(data)
    
    // Obtener color de referencia de las esquinas
    const cornerColors = [
      [data[0], data[1], data[2]], // top-left
      [data[(width - 1) * 4], data[(width - 1) * 4 + 1], data[(width - 1) * 4 + 2]], // top-right
      [data[(height - 1) * width * 4], data[(height - 1) * width * 4 + 1], data[(height - 1) * width * 4 + 2]], // bottom-left
      [data[((height - 1) * width + (width - 1)) * 4], data[((height - 1) * width + (width - 1)) * 4 + 1], data[((height - 1) * width + (width - 1)) * 4 + 2]] // bottom-right
    ]
    
    // Usar el color más común en las esquinas como color de fondo
    const backgroundColor = cornerColors[0] // Simplificado: usar esquina superior izquierda
    
    // Tolerance para colores similares
    const tolerance = 30
    
    // Iterar sobre cada pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calcular diferencia con el color de fondo
      const diffR = Math.abs(r - backgroundColor[0])
      const diffG = Math.abs(g - backgroundColor[1])
      const diffB = Math.abs(b - backgroundColor[2])
      
      // Si el color es similar al fondo, hacerlo transparente
      if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
        newData[i + 3] = 0 // Hacer transparente (alpha = 0)
      }
    }

    // Convertir de vuelta a imagen PNG con transparencia
    const result = await sharp(newData, {
      raw: {
        width: width,
        height: height,
        channels: 4
      }
    })
    .png()
    .toBuffer()

    return result

  } catch (error) {
    console.error('Error in removeBackground:', error)
    throw error
  }
}
