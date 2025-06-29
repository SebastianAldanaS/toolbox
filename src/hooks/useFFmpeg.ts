'use client'

import { useCallback, useState, useEffect } from 'react'

export interface UseFFmpegReturn {
  isLoading: boolean
  isReady: boolean
  progress: number
  error: string | null
  load: () => Promise<void>
  cutAudio: (file: File, startTime: number, endTime: number) => Promise<Blob | null>
}

export function useFFmpeg(): UseFFmpegReturn {
  const [ffmpeg, setFFmpeg] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const load = useCallback(async () => {
    if (!isClient || isReady || isLoading) return

    setIsLoading(true)
    setError(null)
    setProgress(0)
    
    try {
      // Dynamic import to avoid SSR issues
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      
      const ffmpegInstance = new FFmpeg()
      
      // Load FFmpeg WebAssembly
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      // Set up progress listener
      ffmpegInstance.on('progress', ({ progress }: any) => {
        setProgress(Math.round(progress * 100))
      })

      ffmpegInstance.on('log', ({ message }: any) => {
        console.log('FFmpeg log:', message)
      })

      setFFmpeg(ffmpegInstance)
      setIsReady(true)
      console.log('FFmpeg loaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FFmpeg'
      setError(errorMessage)
      console.error('Failed to load FFmpeg:', err)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }, [isClient, isReady, isLoading])

  const cutAudio = useCallback(async (file: File, startTime: number, endTime: number): Promise<Blob | null> => {
    if (!isClient || !isReady || !ffmpeg) {
      setError('FFmpeg is not ready. Please load it first.')
      return null
    }

    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      // Get file extension
      const extension = file.name.split('.').pop() || 'mp3'
      const inputName = `input.${extension}`
      const outputName = `output.mp3` // Always output as MP3 for better compatibility

      // Write input file to FFmpeg virtual filesystem
      const arrayBuffer = await file.arrayBuffer()
      await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer))

      // Calculate duration for the cut
      const duration = endTime - startTime

      // Execute FFmpeg command to cut audio
      // Use explicit audio codec to ensure valid output
      const command = [
        '-i', inputName,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-acodec', 'mp3', // Force MP3 output for better compatibility
        '-y', // Overwrite output file
        outputName
      ]
      
      console.log('FFmpeg command:', command.join(' '))
      await ffmpeg.exec(command)

      // Read the output file
      const data = await ffmpeg.readFile(outputName)
      
      // Validate output
      if (!data || data.length === 0) {
        throw new Error('FFmpeg produced empty output')
      }
      
      // Clean up
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)

      // Determine correct MIME type - always MP3 since we force that output
      const mimeType = 'audio/mpeg'

      // Convert to blob
      const blob = new Blob([data], { type: mimeType })
      
      console.log(`Audio cut successfully: ${startTime}s to ${endTime}s`, {
        inputSize: arrayBuffer.byteLength,
        outputSize: data.length,
        mimeType: mimeType
      })
      return blob

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cut audio'
      setError(errorMessage)
      console.error('Failed to cut audio:', err)
      return null
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }, [isClient, isReady, ffmpeg])

  return {
    isLoading,
    isReady: isReady && isClient,
    progress,
    error,
    load,
    cutAudio
  }
}
