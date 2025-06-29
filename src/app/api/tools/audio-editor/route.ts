import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Audio processing with real cutting capabilities using FFmpeg when available

interface AudioEditRequest {
  operation: string
  startTime: string
  endTime: string
}

interface AudioEditResult {
  originalName: string
  editedUrl: string
  fileId: string
  originalDuration: number
  editedDuration: number
  startTime: number
  endTime: number
  operation: string
  originalSize: number
  editedSize: number
}

// Check if FFmpeg is available on the system
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch {
    return false
  }
}

// Get real audio duration using FFprobe (if available)
async function getRealAudioDuration(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`)
    const duration = parseFloat(stdout.trim())
    return isNaN(duration) ? null : duration
  } catch {
    return null
  }
}

// Real audio cutting using FFmpeg
async function cutAudioWithFFmpeg(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<boolean> {
  try {
    const duration = endTime - startTime
    await execAsync(`ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`)
    return existsSync(outputPath)
  } catch {
    return false
  }
}

// Helper function to get audio duration (fallback estimation)
function estimateAudioDuration(buffer: Buffer, filename: string): number {
  // This is a mock implementation that tries to be more realistic
  // In reality, you would need to parse the audio file headers
  // or use a library like node-ffmpeg to get the actual duration
  
  // Different estimates based on audio format
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp3'
  
  let bytesPerSecond: number
  
  switch (extension) {
    case 'mp3':
      bytesPerSecond = 16000 // ~128kbps MP3
      break
    case 'wav':
      bytesPerSecond = 176400 // CD quality WAV (44.1kHz, 16-bit, stereo)
      break
    case 'flac':
      bytesPerSecond = 100000 // FLAC compression varies
      break
    case 'aac':
    case 'm4a':
      bytesPerSecond = 12000 // ~96kbps AAC
      break
    case 'ogg':
      bytesPerSecond = 20000 // ~160kbps OGG
      break
    default:
      bytesPerSecond = 16000 // Default to MP3 estimate
  }
  
  // Estimate duration based on file size and format
  // Subtract some bytes for headers/metadata
  const audioDataSize = Math.max(0, buffer.length - 1000)
  const estimatedDuration = audioDataSize / bytesPerSecond
  
  // Reasonable bounds: 1 second to 30 minutes
  return Math.min(1800, Math.max(1, estimatedDuration))
}

// Helper function to simulate audio cutting (fallback when FFmpeg is not available)
function simulateAudioCut(buffer: Buffer, startTime: number, endTime: number, originalDuration: number, filename: string): Buffer {
  // For demonstration purposes, we return the original file when FFmpeg is not available
  // This ensures the file remains valid and playable in the browser
  console.log(`[SERVIDOR] Simulando corte de audio: ${startTime}s a ${endTime}s (FFmpeg no disponible en el servidor)`)
  return buffer
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const operation = formData.get('operation') as string
    const startTimeStr = formData.get('startTime') as string
    const endTimeStr = formData.get('endTime') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!operation) {
      return NextResponse.json({ error: 'No se especificó operación' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'El archivo debe ser de audio' }, { status: 400 })
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Parse and validate time parameters
    const startTime = parseFloat(startTimeStr || '0')
    const endTime = parseFloat(endTimeStr || '0')

    if (isNaN(startTime) || isNaN(endTime)) {
      return NextResponse.json({ error: 'Los tiempos de inicio y fin deben ser números válidos' }, { status: 400 })
    }

    if (startTime < 0 || endTime < 0) {
      return NextResponse.json({ error: 'Los tiempos no pueden ser negativos' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'El tiempo de inicio debe ser menor al tiempo de fin' }, { status: 400 })
    }

    if (endTime - startTime < 0.1) {
      return NextResponse.json({ error: 'La duración mínima del corte debe ser de 0.1 segundos' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const originalSize = buffer.length

    // Validate minimum file size
    if (buffer.length < 1000) {
      return NextResponse.json({ error: 'El archivo de audio es demasiado pequeño' }, { status: 400 })
    }

    // Generate unique file ID and paths
    const fileId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const originalExtension = file.name.split('.').pop() || 'mp3'
    const tempOriginalFileName = `${fileId}_original.${originalExtension}`
    const editedFileName = `${fileId}_edited.${originalExtension}`
    const tempOriginalPath = join(uploadsDir, tempOriginalFileName)
    const editedFilePath = join(uploadsDir, editedFileName)

    // Save the original file temporarily for FFmpeg processing
    await writeFile(tempOriginalPath, buffer)

    // Check if FFmpeg is available and try to get real duration
    const ffmpegAvailable = await checkFFmpegAvailable()
    let originalDuration: number
    
    if (ffmpegAvailable) {
      const realDuration = await getRealAudioDuration(tempOriginalPath)
      originalDuration = realDuration || estimateAudioDuration(buffer, file.name)
    } else {
      originalDuration = estimateAudioDuration(buffer, file.name)
    }
    
    // Validate time range against actual duration
    if (endTime > originalDuration) {
      return NextResponse.json({ 
        error: `El tiempo de fin (${endTime.toFixed(1)}s) excede la duración estimada del archivo (${originalDuration.toFixed(1)}s)` 
      }, { status: 400 })
    }

    let processedBuffer: Buffer
    let editedDuration: number
    let isRealProcessing = false

    switch (operation) {
      case 'cut':
        editedDuration = endTime - startTime
        
        if (ffmpegAvailable) {
          // Try real audio cutting with FFmpeg
          const success = await cutAudioWithFFmpeg(tempOriginalPath, editedFilePath, startTime, endTime)
          
          if (success) {
            // Read the processed file
            processedBuffer = await readFile(editedFilePath)
            isRealProcessing = true
            console.log(`[SERVIDOR] Audio cortado exitosamente con FFmpeg: ${startTime}s a ${endTime}s`)
          } else {
            // Fallback to simulation
            processedBuffer = simulateAudioCut(buffer, startTime, endTime, originalDuration, file.name)
            await writeFile(editedFilePath, processedBuffer)
            console.log('[SERVIDOR] Procesamiento con FFmpeg falló, usando simulación')
          }
        } else {
          // Fallback to simulation when FFmpeg is not available
          processedBuffer = simulateAudioCut(buffer, startTime, endTime, originalDuration, file.name)
          await writeFile(editedFilePath, processedBuffer)
          console.log('[SERVIDOR] FFmpeg no disponible, usando simulación')
        }
        break
      
      default:
        return NextResponse.json({ error: `Operación "${operation}" no soportada` }, { status: 400 })
    }

    // Validate processed buffer
    if (processedBuffer.length < 100) {
      return NextResponse.json({ error: 'Error al procesar el audio: resultado demasiado pequeño' }, { status: 500 })
    }

    // Ensure the edited file exists
    if (!existsSync(editedFilePath)) {
      return NextResponse.json({ error: 'Error al guardar el archivo procesado' }, { status: 500 })
    }

    // Calculate actual or simulated edited size
    const actualEditedSize = isRealProcessing ? processedBuffer.length : Math.round(originalSize * (editedDuration / originalDuration))

    // Create the result object
    const result: AudioEditResult = {
      originalName: file.name,
      editedUrl: `/api/audio/${editedFileName}`,
      fileId,
      originalDuration: Math.round(originalDuration * 100) / 100,
      editedDuration: Math.round(editedDuration * 100) / 100,
      startTime: Math.round(startTime * 100) / 100,
      endTime: Math.round(endTime * 100) / 100,
      operation: isRealProcessing ? 'Corte de audio (procesado)' : 'Corte de audio (simulado)',
      originalSize,
      editedSize: actualEditedSize
    }

    // Schedule cleanup of temporary files after 1 hour
    setTimeout(async () => {
      try {
        if (existsSync(editedFilePath)) {
          await unlink(editedFilePath)
          console.log(`Cleaned up edited file: ${editedFileName}`)
        }
        if (existsSync(tempOriginalPath)) {
          await unlink(tempOriginalPath)
          console.log(`Cleaned up original file: ${tempOriginalFileName}`)
        }
      } catch (error) {
        console.error('Error cleaning up files:', error)
      }
    }, 60 * 60 * 1000) // 1 hour

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error processing audio:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid file')) {
        return NextResponse.json({ error: 'Archivo inválido o corrupto' }, { status: 400 })
      }
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json({ error: 'No hay espacio suficiente en el servidor' }, { status: 507 })
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el audio' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const ffmpegAvailable = await checkFFmpegAvailable()
  
  return NextResponse.json({
    message: 'Audio Editor API',
    supportedOperations: ['cut'],
    supportedFormats: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'],
    maxFileSize: '100MB',
    ffmpegAvailable,
    processingMode: ffmpegAvailable ? 'Real audio processing with FFmpeg' : 'Simulated processing (FFmpeg not available)',
    note: ffmpegAvailable ? 'Using real FFmpeg for audio processing' : 'Install FFmpeg for real audio processing capabilities'
  })
}
