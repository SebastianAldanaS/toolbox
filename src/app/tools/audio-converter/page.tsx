'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Music, Upload, File, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/types'

interface ConversionResult {
  originalName: string
  convertedUrl: string
  fileId: string
  originalFormat: string
  convertedFormat: string
  originalSize: number
  convertedSize: number
  quality: string
  audioInfo: {
    duration: string
    bitrate: string
    sampleRate: string
    channels: string
  }
  fileSizeKB: string
  compressionRatio: string
}

export default function AudioConverterPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [processing, setProcessing] = useState(false)
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([])
  const [targetFormat, setTargetFormat] = useState('mp3')
  const [quality, setQuality] = useState('normal')

  const audioFormats = [
    { value: 'mp3', label: 'MP3', description: 'Formato universal, buena compresión' },
    { value: 'wav', label: 'WAV', description: 'Sin compresión, alta calidad' },
    { value: 'aac', label: 'AAC', description: 'Buena calidad, menor tamaño' },
    { value: 'ogg', label: 'OGG', description: 'Código abierto, buena compresión' },
    { value: 'flac', label: 'FLAC', description: 'Sin pérdida, archivo grande' },
    { value: 'm4a', label: 'M4A', description: 'Compatible con Apple' }
  ]

  const qualityOptions = [
    { value: 'low', label: 'Baja', description: 'Menor tamaño, calidad básica' },
    { value: 'normal', label: 'Normal', description: 'Equilibrio calidad/tamaño' },
    { value: 'high', label: 'Alta', description: 'Mejor calidad, mayor tamaño' }
  ]

  const handleFilesChange = (newFiles: FileUpload[]) => {
    setFiles(newFiles)
    setConversionResults([])
  }

  const handleUpdateProgress = (
    fileId: string, 
    progress: number, 
    status: 'uploading' | 'processing' | 'completed' | 'error',
    result?: any,
    error?: string
  ) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, progress, status, result, error }
        : file
    ))
  }

  const handleConvert = async () => {
    if (files.length === 0) return

    setProcessing(true)
    const results: ConversionResult[] = []

    for (const file of files) {
      try {
        handleUpdateProgress(file.id, 0, 'processing')

        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('format', targetFormat)
        formData.append('quality', quality)

        const response = await fetch('/api/tools/audio-converter', {
          method: 'POST',
          body: formData,
        })

        handleUpdateProgress(file.id, 50, 'processing')

        const result = await response.json()

        if (response.ok) {
          results.push(result)
          handleUpdateProgress(file.id, 100, 'completed', result)
        } else {
          throw new Error(result.error || 'Error processing file')
        }
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        handleUpdateProgress(file.id, 0, 'error', undefined, 
          error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    setConversionResults(results)
    setProcessing(false)
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = () => {
    setFiles([])
    setConversionResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
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
                  <Music className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Convertidor de Audio</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convierte entre diferentes formatos de audio</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Smart Processing Alert */}
          

          {/* Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Conversión
              </CardTitle>
              <CardDescription>
                Selecciona el formato de salida y la calidad deseada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Formato de Salida</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {audioFormats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setTargetFormat(format.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        targetFormat === format.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-muted-foreground">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Calidad</label>
                <div className="grid grid-cols-3 gap-3">
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        quality === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Archivos de Audio
              </CardTitle>
              <CardDescription>
                Selecciona uno o más archivos de audio para convertir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFilesSelected={handleFilesChange}
                acceptedFileTypes={[
                  'audio/*',
                  'video/mp4',
                  'video/avi',
                  'video/mov',
                  'video/quicktime'
                ]}
                maxFiles={5}
                maxSize={50 * 1024 * 1024} // 50MB
              />

              {/* Show selected files */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      {file.progress !== undefined && (
                        <div className="w-24">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {file.status === 'uploading' && 'Subiendo...'}
                        {file.status === 'processing' && 'Convirtiendo...'}
                        {file.status === 'completed' && 'Listo'}
                        {file.status === 'error' && 'Error'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {files.length > 0 && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleConvert}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing 
                      ? 'Convirtiendo...' 
                      : `Convertir ${files.length} archivo${files.length > 1 ? 's' : ''} a ${targetFormat.toUpperCase()}`
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={processing}
                  >
                    Limpiar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {conversionResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Resultados de Conversión
                </CardTitle>
                <CardDescription>
                  Tus archivos de audio convertidos están listos para descargar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-purple-50 border-purple-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-purple-800">
                            {result.originalName}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-700">
                            <div>
                              <span className="font-medium">Conversión:</span>
                              <p>{result.originalFormat} → {result.convertedFormat}</p>
                            </div>
                            <div>
                              <span className="font-medium">Calidad:</span>
                              <p className="capitalize">{result.quality}</p>
                            </div>
                            <div>
                              <span className="font-medium">Tamaño original:</span>
                              <p>{(result.originalSize / (1024 * 1024)).toFixed(1)} MB</p>
                            </div>
                            <div>
                              <span className="font-medium">Nuevo tamaño:</span>
                              <p>{result.fileSizeKB}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-purple-600">
                            <span className="font-medium">Compresión: </span>
                            {result.compressionRatio}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            onClick={() => handleDownload(
                              result.convertedUrl, 
                              `${result.originalName.replace(/\.[^/.]+$/, '')}.${result.convertedFormat.toLowerCase()}`
                            )}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar {result.convertedFormat}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acerca del Convertidor de Audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Formatos Soportados</h3>
                <p className="text-sm text-muted-foreground">
                  Entrada: MP3, WAV, AAC, OGG, FLAC, M4A, MP4 (audio), AVI (audio), MOV (audio)
                </p>
                <p className="text-sm text-muted-foreground">
                  Salida: MP3, WAV, AAC, OGG, FLAC, M4A
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Características</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Procesamiento de archivos</strong> con simulación de conversión</li>
                  <li>• Múltiples niveles de calidad (Baja, Normal, Alta)</li>
                  <li>• Soporte para archivos de hasta 50MB</li>
                  <li>• Procesamiento por lotes de múltiples archivos</li>
                  <li>• Detección automática de formato de entrada</li>
                  <li>• Información detallada de archivos procesados</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recomendaciones de Formato</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>MP3:</strong> Universal, compatible con todos los dispositivos</li>
                  <li>• <strong>WAV:</strong> Sin compresión, ideal para audio profesional</li>
                  <li>• <strong>AAC:</strong> Mejor que MP3 en calidad/tamaño, compatible con Apple</li>
                  <li>• <strong>OGG:</strong> Código abierto, buena compresión</li>
                  <li>• <strong>FLAC:</strong> Sin pérdida de calidad, archivos grandes</li>
                  <li>• <strong>M4A:</strong> Formato de Apple, buena calidad</li>
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
