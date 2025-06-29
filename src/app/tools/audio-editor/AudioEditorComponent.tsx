'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Scissors, Download, Upload, RotateCcw, Volume2, Music, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/types'
import { useFFmpeg } from '@/hooks/useFFmpeg'

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

export default function AudioEditorComponent() {
  const [audioFile, setAudioFile] = useState<FileUpload | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([80])
  
  // Edit controls
  const [startTime, setStartTime] = useState([0])
  const [endTime, setEndTime] = useState([100])
  const [processing, setProcessing] = useState(false)
  const [editResult, setEditResult] = useState<AudioEditResult | null>(null)
  const [processingMethod, setProcessingMethod] = useState<'server' | 'client'>('client')
  
  // Preview controls
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(0)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // FFmpeg hook for client-side processing
  const { 
    isLoading: ffmpegLoading, 
    isReady: ffmpegReady, 
    progress: ffmpegProgress, 
    error: ffmpegError, 
    load: loadFFmpeg, 
    cutAudio 
  } = useFFmpeg()

  // Auto-load FFmpeg when client method is selected and FFmpeg is not ready
  useEffect(() => {
    if (typeof window !== 'undefined' && processingMethod === 'client' && !ffmpegReady && !ffmpegLoading) {
      loadFFmpeg()
    }
  }, [processingMethod, ffmpegReady, ffmpegLoading, loadFFmpeg])

  // Clean up blob URLs when editResult changes
  useEffect(() => {
    return () => {
      // Cleanup function to revoke blob URLs
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl)
      }
    }
  }, [previewBlobUrl])

  // Create blob URL when previewBlob changes
  useEffect(() => {
    if (previewBlob) {
      // Validate blob before creating URL
      if (previewBlob.size === 0) {
        console.error('Cannot create URL for empty blob')
        return
      }
      
      if (!previewBlob.type.startsWith('audio/')) {
        console.error('Cannot create URL for non-audio blob:', previewBlob.type)
        return
      }
      
      // Clean up previous blob URL
      if (previewBlobUrl) {
        console.log('Cleaning up previous blob URL:', previewBlobUrl)
        URL.revokeObjectURL(previewBlobUrl)
      }
      
      // Create new blob URL
      try {
        const newBlobUrl = URL.createObjectURL(previewBlob)
        console.log('Created new blob URL:', newBlobUrl, 'for blob:', {
          size: previewBlob.size,
          type: previewBlob.type
        })
        setPreviewBlobUrl(newBlobUrl)
      } catch (error) {
        console.error('Failed to create blob URL:', error)
      }
    } else {
      // Clean up when blob is removed
      if (previewBlobUrl) {
        console.log('Cleaning up blob URL (blob removed):', previewBlobUrl)
        URL.revokeObjectURL(previewBlobUrl)
        setPreviewBlobUrl(null)
      }
    }
  }, [previewBlob]) // Remove previewBlobUrl from dependencies to avoid infinite loop

  // Update audio src when previewBlobUrl or editResult changes
  useEffect(() => {
    if (editResult && previewAudioRef.current) {
      const newSrc = previewBlobUrl || editResult.editedUrl
      
      // Only update if we have a valid source
      if (newSrc && newSrc !== 'client_blob_' && !newSrc.startsWith('client_blob_')) {
        console.log('Updating audio source to:', newSrc)
        console.log('Using blob URL:', !!previewBlobUrl)
        
        // Set source and load
        previewAudioRef.current.src = newSrc
        previewAudioRef.current.load()
      } else {
        console.log('Skipping audio source update - invalid source:', newSrc)
        // Clear the source if invalid
        previewAudioRef.current.src = ''
      }
    }
  }, [editResult, previewBlobUrl])

  // Handle file selection
  const handleFileSelected = (files: FileUpload[]) => {
    if (files.length > 0) {
      const file = files[0]
      setAudioFile(file)
      
      // Create object URL for preview
      const url = URL.createObjectURL(file.file)
      setAudioUrl(url)
      
      // Reset edit controls and blob states
      setStartTime([0])
      setEndTime([100])
      setEditResult(null)
      setPreviewBlob(null)
      // previewBlobUrl will be cleaned up by the useEffect
    }
  }

  // Audio controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        // Pause preview audio if playing
        if (previewPlaying && previewAudioRef.current) {
          previewAudioRef.current.pause()
          setPreviewPlaying(false)
        }
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setEndTime([audioRef.current.duration])
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = value[0] / 100
    }
  }

  // Preview audio controls
  const togglePreviewPlayPause = () => {
    if (previewAudioRef.current) {
      if (previewPlaying) {
        previewAudioRef.current.pause()
      } else {
        // Pause main audio if playing
        if (isPlaying && audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
        previewAudioRef.current.play()
      }
      setPreviewPlaying(!previewPlaying)
    }
  }

  const handlePreviewTimeUpdate = () => {
    if (previewAudioRef.current) {
      setPreviewCurrentTime(previewAudioRef.current.currentTime)
    }
  }

  const handlePreviewLoadedMetadata = () => {
    if (previewAudioRef.current) {
      setPreviewDuration(previewAudioRef.current.duration)
      // Set initial volume
      previewAudioRef.current.volume = volume[0] / 100
    }
  }

  const handlePreviewSeek = (value: number[]) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = value[0]
      setPreviewCurrentTime(value[0])
    }
  }

  // Edit functions
  const handleCut = async () => {
    if (!audioFile) return

    setProcessing(true)
    setPreviewBlob(null)
    
    try {
      let result: AudioEditResult | null = null
      
      if (processingMethod === 'client' && ffmpegReady) {
        // Use client-side FFmpeg processing
        const blob = await cutAudio(audioFile.file, startTime[0], endTime[0])
        
        if (blob && blob.size > 0 && blob.type.startsWith('audio/')) {
          console.log('FFmpeg produced valid audio blob:', {
            size: blob.size,
            type: blob.type
          })
          
          // Set the blob for preview (URL will be created by useEffect)
          setPreviewBlob(blob)
          
          // Create mock result for UI
          result = {
            originalName: audioFile.file.name,
            editedUrl: `client_blob_${Date.now()}`, // Placeholder URL
            fileId: `client_${Date.now()}`,
            originalDuration: duration,
            editedDuration: endTime[0] - startTime[0],
            startTime: startTime[0],
            endTime: endTime[0],
            operation: 'Corte de audio (procesado en navegador)',
            originalSize: audioFile.file.size,
            editedSize: blob.size
          }
        } else {
          console.error('FFmpeg produced invalid blob:', {
            blob: blob,
            size: blob?.size || 0,
            type: blob?.type || 'unknown'
          })
          throw new Error('Error al procesar el audio con FFmpeg - blob inválido')
        }
      } else {
        // Use server-side processing - clear any client blob
        setPreviewBlob(null)
        
        const formData = new FormData()
        formData.append('file', audioFile.file)
        formData.append('operation', 'cut')
        formData.append('startTime', (startTime[0]).toString())
        formData.append('endTime', (endTime[0]).toString())

        const response = await fetch('/api/tools/audio-editor', {
          method: 'POST',
          body: formData,
        })

        result = await response.json()

        if (!response.ok) {
          throw new Error((result as any)?.error || 'Error al procesar el audio')
        }
      }

      if (result) {
        setEditResult(result)
        
        // Verify the audio file is accessible
        if (previewBlob) {
          // For client-processed blobs, check after the blob URL is created
          setTimeout(async () => {
            if (previewBlobUrl) {
              const isAccessible = await checkAudioFile(previewBlobUrl)
              if (!isAccessible) {
                console.error('Blob URL is not accessible:', previewBlobUrl)
                alert('⚠️ El archivo de audio procesado (blob) no está disponible. Esto puede ocurrir con problemas de memoria o procesamiento.')
              }
            }
          }, 1500) // Give more time for blob URL creation
        } else if (!result.editedUrl.startsWith('blob:') && !result.editedUrl.startsWith('client_blob_')) {
          // For server-processed files, check if the file exists
          setTimeout(async () => {
            const isAccessible = await checkAudioFile(result.editedUrl)
            if (!isAccessible) {
              console.error('Audio file is not accessible:', result.editedUrl)
              alert('⚠️ El archivo de audio procesado no está disponible. Esto puede ocurrir con el procesamiento simulado.')
            }
          }, 1000)
        }
        
        // Reset preview state
        setPreviewPlaying(false)
        setPreviewCurrentTime(0)
        setPreviewDuration(0)
        // Pause audio if playing
        if (isPlaying && audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
        
        // Show warning if using server simulation
        if (processingMethod === 'server') {
          setTimeout(() => {
            alert('⚠️ Procesamiento simulado: El preview reproduce el archivo original. Para un preview real del audio cortado, usa el método "Navegador" con FFmpeg.')
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al procesar el audio: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!editResult) return

    if (previewBlob && previewBlobUrl) {
      // Download the client-processed blob
      const link = document.createElement('a')
      link.href = previewBlobUrl
      link.download = `edited_${editResult.originalName}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Download from server
      const link = document.createElement('a')
      link.href = editResult.editedUrl
      link.download = `edited_${editResult.originalName}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetEditor = () => {
    setAudioFile(null)
    setAudioUrl(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setStartTime([0])
    setEndTime([100])
    setEditResult(null)
    
    // Reset preview state and blobs
    setPreviewPlaying(false)
    setPreviewCurrentTime(0)
    setPreviewDuration(0)
    setPreviewBlob(null)
    // previewBlobUrl will be cleaned up by useEffect
    
    // Clean up URLs
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    if (previewBlob && editResult?.editedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editResult.editedUrl)
    }
    setPreviewBlob(null)
  }

  // Format time helper
  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Check if blob URL is accessible
  const checkBlobUrl = async (url: string): Promise<boolean> => {
    try {
      // For blob URLs, we can't use fetch, so we'll try to create an audio element
      const audio = new Audio()
      return new Promise((resolve) => {
        const cleanup = () => {
          audio.removeEventListener('canplay', onCanPlay)
          audio.removeEventListener('error', onError)
          audio.src = ''
        }
        
        const onCanPlay = () => {
          cleanup()
          resolve(true)
        }
        
        const onError = () => {
          cleanup()
          resolve(false)
        }
        
        audio.addEventListener('canplay', onCanPlay)
        audio.addEventListener('error', onError)
        audio.src = url
        
        // Timeout after 3 seconds
        setTimeout(() => {
          cleanup()
          resolve(false)
        }, 3000)
      })
    } catch {
      return false
    }
  }

  // Check if audio file is accessible
  const checkAudioFile = async (url: string): Promise<boolean> => {
    if (url.startsWith('blob:')) {
      return checkBlobUrl(url)
    }
    
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-white">
                  <Scissors className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor de Audio</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Corta, edita y modifica archivos de audio</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Info Alert */}
          <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <Music className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>💡 Importante:</strong> Para obtener un preview real del audio cortado, usa el método 
              <strong> "Navegador"</strong> que procesa el audio con FFmpeg. El método "Servidor" solo simula 
              el corte y no permite preview real. FFmpeg se carga una sola vez (~30MB).
            </AlertDescription>
          </Alert>

          {/* Upload Section */}
          {!audioFile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Subir Archivo de Audio
                </CardTitle>
                <CardDescription>
                  Selecciona un archivo de audio para comenzar a editar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFilesSelected={handleFileSelected}
                  acceptedFileTypes={['audio/*']}
                  maxFiles={1}
                  maxSize={100 * 1024 * 1024} // 100MB
                />
              </CardContent>
            </Card>
          )}

          {/* Audio Player & Editor */}
          {audioFile && audioUrl && (
            <>
              {/* Audio Player */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Reproductor de Audio
                  </CardTitle>
                  <CardDescription>
                    {audioFile.name} - {formatTime(duration)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Waveform Placeholder */}
                  <div className="bg-gradient-to-r from-indigo-100 to-cyan-100 h-24 rounded-lg flex items-center justify-center border-2 border-dashed border-indigo-300">
                    <div className="text-center text-indigo-600">
                      <Music className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Visualización de onda (simulada)</p>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={togglePlayPause}
                        variant="outline"
                        size="sm"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1">
                        <Slider
                          value={[currentTime]}
                          max={duration}
                          step={0.1}
                          onValueChange={handleSeek}
                          className="w-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[60px]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Volume2 className="h-4 w-4" />
                      <Slider
                        value={volume}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">{volume[0]}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Herramientas de Edición
                  </CardTitle>
                  <CardDescription>
                    Selecciona la parte del audio que deseas conservar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tiempo de inicio: {formatTime(startTime[0])}
                      </label>
                      <Slider
                        value={startTime}
                        max={duration}
                        step={0.1}
                        onValueChange={(value) => {
                          setStartTime(value)
                          // Ensure start time is always less than end time
                          if (value[0] >= endTime[0]) {
                            setEndTime([Math.min(duration, value[0] + 1)])
                          }
                        }}
                        className="w-full"
                        disabled={processing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tiempo de fin: {formatTime(endTime[0])}
                      </label>
                      <Slider
                        value={endTime}
                        max={duration}
                        step={0.1}
                        onValueChange={(value) => {
                          setEndTime(value)
                          // Ensure end time is always greater than start time
                          if (value[0] <= startTime[0]) {
                            setStartTime([Math.max(0, value[0] - 1)])
                          }
                        }}
                        className="w-full"
                        disabled={processing}
                      />
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duración seleccionada:</span>
                          <p>{formatTime(Math.max(0, endTime[0] - startTime[0]))}</p>
                        </div>
                        <div>
                          <span className="font-medium">Archivo original:</span>
                          <p>{formatTime(duration)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tamaño del archivo:</span>
                          <p>{formatFileSize(audioFile?.file.size || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Method Selection */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Método de procesamiento:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant={processingMethod === 'server' ? 'default' : 'outline'}
                        onClick={() => setProcessingMethod('server')}
                        className={`justify-start h-auto p-4 ${processingMethod === 'server' ? 'ring-2 ring-amber-400' : ''}`}
                      >
                        <div className="text-left">
                          <div className="font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Servidor (Simulado)
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ⚠️ Solo demo - NO permite preview real
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        variant={processingMethod === 'client' ? 'default' : 'outline'}
                        onClick={() => setProcessingMethod('client')}
                        disabled={!ffmpegReady && !ffmpegLoading}
                        className={`justify-start h-auto p-4 ${processingMethod === 'client' ? 'ring-2 ring-green-400' : ''}`}
                      >
                        <div className="text-left">
                          <div className="font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Navegador {ffmpegReady && '✅'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {ffmpegReady ? '🎵 Procesamiento REAL - Preview funciona' : 
                             ffmpegLoading ? '⏳ Cargando FFmpeg...' : 
                             '🚀 Haz clic para cargar FFmpeg'}
                          </div>
                        </div>
                      </Button>
                    </div>
                    
                    {processingMethod === 'client' && !ffmpegReady && !ffmpegLoading && typeof window !== 'undefined' && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                          💡 FFmpeg se cargará automáticamente para procesamiento real de audio.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {ffmpegLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">Cargando FFmpeg... {ffmpegProgress}%</span>
                        </div>
                        <Progress value={ffmpegProgress} className="w-full" />
                      </div>
                    )}
                    
                    {ffmpegError && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                          Error al cargar FFmpeg: {ffmpegError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCut}
                      disabled={processing || startTime[0] >= endTime[0] || (endTime[0] - startTime[0]) < 0.1}
                      className="flex-1"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      {processing ? 'Procesando...' : 'Cortar Audio'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetEditor}
                      disabled={processing}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </Button>
                  </div>

                  {/* Progress indicator */}
                  {processing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {processingMethod === 'client' ? 'Procesando con FFmpeg...' : 'Procesando audio...'}
                        </span>
                      </div>
                      <Progress 
                        value={processingMethod === 'client' && ffmpegProgress > 0 ? ffmpegProgress : 50} 
                        className="w-full" 
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        {processingMethod === 'client' ? 
                          'Cortando audio con FFmpeg en el navegador' : 
                          'Simulando el corte del archivo de audio'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Results */}
          {editResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Resultado de Edición
                </CardTitle>
                <CardDescription>
                  Tu archivo de audio editado está listo. Puedes reproducirlo antes de descargarlo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info about preview */}
                <Alert className={previewBlob ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                  <Music className={`h-4 w-4 ${previewBlob ? "text-green-600" : "text-amber-600"}`} />
                  <AlertDescription className={previewBlob ? "text-green-800" : "text-amber-800"}>
                    {previewBlob ? (
                      <>
                        <strong>✅ Procesamiento Real:</strong> El archivo fue cortado con FFmpeg. 
                        La vista previa reproduce exactamente el audio editado.
                        <br />
                        <small>Tamaño del blob: {formatFileSize(previewBlob.size)}</small>
                      </>
                    ) : (
                      <>
                        <strong>⚠️ Procesamiento Simulado:</strong> Este preview reproduce el archivo original completo. 
                        Para obtener un preview real del audio cortado, usa el método "Navegador" con FFmpeg.
                        <br />
                        <small>URL del archivo: {editResult.editedUrl}</small>
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Preview Player */}
                <div className={`p-4 border rounded-lg ${previewBlob ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <h4 className={`font-medium mb-4 flex items-center gap-2 ${previewBlob ? 'text-green-800' : 'text-amber-800'}`}>
                    <Play className="h-4 w-4" />
                    {previewBlob ? 'Vista Previa - Archivo Cortado (REAL)' : 'Vista Previa - Archivo Original (SIMULADO)'}
                    <span className={`text-sm font-normal ${previewBlob ? 'text-green-600' : 'text-amber-600'}`}>
                      (Duración{previewBlob ? '' : ' teórica'}: {formatTime(editResult.editedDuration)})
                    </span>
                  </h4>
                  
                  <audio
                    ref={previewAudioRef}
                    onTimeUpdate={handlePreviewTimeUpdate}
                    onLoadedMetadata={handlePreviewLoadedMetadata}
                    onEnded={() => setPreviewPlaying(false)}
                    onError={(e) => {
                      const audioElement = e.currentTarget as HTMLAudioElement
                      const currentSrc = audioElement.src
                      
                      // Only log error if we actually have a source
                      if (currentSrc && currentSrc !== '' && currentSrc !== window.location.href) {
                        console.error('Error loading preview audio:', e)
                        console.error('Audio URL:', previewBlobUrl || editResult.editedUrl)
                        console.error('Current audio src:', currentSrc)
                        console.error('Preview blob exists:', !!previewBlob)
                        console.error('Preview blob URL exists:', !!previewBlobUrl)
                        console.error('Using blob source:', !!previewBlob)
                        console.error('Audio error code:', audioElement.error?.code)
                        console.error('Audio error message:', audioElement.error?.message)
                        
                        // Show user-friendly error only for actual sources
                        if (currentSrc.startsWith('blob:') || currentSrc.startsWith('http')) {
                          console.warn('Audio preview failed to load. This may happen with invalid blob URLs or inaccessible files.')
                        }
                      }
                    }}
                    onCanPlay={() => {
                      console.log('Audio can play - preview ready')
                    }}
                    onLoadStart={() => {
                      console.log('Audio load started')
                    }}
                    preload="metadata"
                  />

                  {/* Preview Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={togglePreviewPlayPause}
                        variant="outline"
                        size="sm"
                        className={`${previewBlob ? 'border-green-600 text-green-700 hover:bg-green-100' : 'border-amber-600 text-amber-700 hover:bg-amber-100'}`}
                        disabled={previewDuration === 0}
                      >
                        {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="ml-2 text-xs">
                          {previewPlaying ? 'Pausar' : 'Reproducir'}
                        </span>
                      </Button>
                      <div className="flex-1">
                        <Slider
                          value={[previewCurrentTime]}
                          max={previewDuration || 1}
                          step={0.1}
                          onValueChange={handlePreviewSeek}
                          className="w-full"
                          disabled={previewDuration === 0}
                        />
                      </div>
                      <span className="text-sm text-green-700 min-w-[60px]">
                        {formatTime(previewCurrentTime)} / {formatTime(previewDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Volume2 className="h-4 w-4 text-green-600" />
                      <Slider
                        value={volume}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="w-32"
                      />
                      <span className="text-sm text-green-700">{volume[0]}%</span>
                    </div>

                    {previewDuration === 0 && (
                      <div className="text-center text-sm text-green-600">
                        Cargando vista previa...
                      </div>
                    )}
                  </div>
                </div>

                {/* File Information */}
                <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-indigo-800 mb-3">
                        Audio Editado: {editResult.originalName}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-indigo-700">
                        <div>
                          <span className="font-medium">Operación:</span>
                          <p>{editResult.operation}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duración original:</span>
                          <p>{formatTime(editResult.originalDuration)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Nueva duración:</span>
                          <p>{formatTime(editResult.editedDuration)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Rango:</span>
                          <p>{formatTime(editResult.startTime)} - {formatTime(editResult.endTime)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tamaño original:</span>
                          <p>{formatFileSize(editResult.originalSize)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tamaño editado:</span>
                          <p>{formatFileSize(editResult.editedSize)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Reducción:</span>
                          <p>{Math.round(((editResult.originalSize - editResult.editedSize) / editResult.originalSize) * 100)}%</p>
                        </div>
                        <div>
                          <span className="font-medium">ID del archivo:</span>
                          <p className="font-mono text-xs">{editResult.fileId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={handleDownload}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Audio Editado
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditResult(null)}
                      className="border-indigo-600 text-indigo-700 hover:bg-indigo-100"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Hacer Otro Corte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acerca del Editor de Audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Funciones Disponibles</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Cortar Audio:</strong> Extrae una sección específica del archivo</li>
                  <li>• <strong>Reproductor integrado:</strong> Previsualiza el audio antes de editar</li>
                  <li>• <strong>Vista previa del resultado:</strong> Reproduce el audio editado antes de descargarlo</li>
                  <li>• <strong>Control de tiempo:</strong> Selección precisa de inicio y fin</li>
                  <li>• <strong>Control de volumen:</strong> Ajusta el volumen de reproducción</li>
                  <li>• <strong>Múltiples ediciones:</strong> Realiza varios cortes sin recargar</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Formatos Soportados</h3>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, AAC, OGG, FLAC, M4A y otros formatos de audio comunes
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Limitaciones Importantes</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Implementación simulada:</strong> No procesa audio real, solo simula el corte</li>
                  <li>• <strong>Duración estimada:</strong> Se calcula basándose en el tamaño del archivo</li>
                  <li>• <strong>Tamaño máximo:</strong> 100MB por archivo</li>
                  <li>• <strong>Funciones limitadas:</strong> Solo corte de audio disponible</li>
                  <li>• <strong>Archivos temporales:</strong> Se eliminan automáticamente después de 1 hora</li>
                  <li>• <strong>Para uso real:</strong> Se requiere FFmpeg para procesamiento real de audio</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recomendaciones</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Para edición profesional: <strong>Audacity</strong> (gratuito)</li>
                  <li>• Para desarrollo web con audio real: Implementar <strong>FFmpeg.wasm</strong> o servidor con FFmpeg</li>
                  <li>• Para archivos grandes: Usar herramientas de escritorio especializadas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
