'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Maximize, Settings, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/types'

interface ResizeResult {
  originalName: string
  resizedUrl: string
  fileId: string
  original: {
    width: number
    height: number
    size: number
    format: string
  }
  resized: {
    width: number
    height: number
    size: number
    format: string
  }
  settings: {
    requestedWidth: number | null
    requestedHeight: number | null
    maintainAspectRatio: boolean
    resizeMode: string
    quality: number
  }
}

export default function ImageResizerPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [processing, setProcessing] = useState(false)
  const [resizeResults, setResizeResults] = useState<ResizeResult[]>([])
  
  // Opciones de redimensionamiento
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [resizeMode, setResizeMode] = useState('cover')
  const [quality, setQuality] = useState(80)
  const [outputFormat, setOutputFormat] = useState('original')

  // Presets de dimensiones comunes
  const presets = [
    { name: 'HD (1920x1080)', width: 1920, height: 1080 },
    { name: 'Full HD (1920x1080)', width: 1920, height: 1080 },
    { name: '4K (3840x2160)', width: 3840, height: 2160 },
    { name: 'Instagram Square (1080x1080)', width: 1080, height: 1080 },
    { name: 'Instagram Story (1080x1920)', width: 1080, height: 1920 },
    { name: 'Facebook Cover (1200x630)', width: 1200, height: 630 },
    { name: 'YouTube Thumbnail (1280x720)', width: 1280, height: 720 },
    { name: 'Avatar (512x512)', width: 512, height: 512 },
  ]

  const handleFilesSelected = (selectedFiles: FileUpload[]) => {
    setFiles(selectedFiles)
    setResizeResults([]) // Limpiar resultados anteriores
  }

  const handleUpdateProgress = (id: string, progress: number, status: FileUpload['status'], result?: string, error?: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id 
          ? { ...file, progress, status, result, error }
          : file
      )
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const applyPreset = (preset: { width: number; height: number }) => {
    setWidth(preset.width)
    setHeight(preset.height)
  }

  const processFiles = async () => {
    if (!width && !height) {
      alert('Por favor, especifica al menos el ancho o la altura')
      return
    }

    setProcessing(true)
    const results: ResizeResult[] = []
    
    try {
      for (const file of files) {
        if (file.status !== 'uploading') continue
        
        // Actualizar estado a procesando
        handleUpdateProgress(file.id, 0, 'processing')
        
        // Crear FormData para enviar archivo
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('width', width.toString())
        formData.append('height', height.toString())
        formData.append('maintainAspectRatio', maintainAspectRatio.toString())
        formData.append('resizeMode', resizeMode)
        formData.append('quality', quality.toString())
        formData.append('outputFormat', outputFormat)
        
        try {
          // Simular progreso de subida
          handleUpdateProgress(file.id, 25, 'processing')
          
          // Llamar a la API
          const response = await fetch('/api/tools/image-resizer', {
            method: 'POST',
            body: formData
          })
          
          handleUpdateProgress(file.id, 75, 'processing')
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          
          if (result.success) {
            // Archivo procesado exitosamente
            handleUpdateProgress(file.id, 100, 'completed', result.resizedUrl)
            results.push(result)
          } else {
            throw new Error(result.error || 'Error processing file')
          }
          
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          handleUpdateProgress(file.id, 0, 'error', undefined, 
            error instanceof Error ? error.message : 'Error desconocido')
        }
      }
      
      setResizeResults(results)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
                  <Maximize className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redimensionar Imagen</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cambia el tamaño de imágenes manteniendo la calidad</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Configuración de Redimensionamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Redimensionamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                
                {/* Presets */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Presets de dimensiones
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {presets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="text-xs"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dimensiones personalizadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ancho (píxeles)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ej: 1920"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alto (píxeles)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ej: 1080"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Opciones avanzadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Mantener aspecto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Proporciones
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="aspectRatio"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="aspectRatio" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        Mantener proporción
                      </label>
                    </div>
                  </div>

                  {/* Modo de redimensionamiento */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Modo de ajuste
                    </label>
                    <select
                      value={resizeMode}
                      onChange={(e) => setResizeMode(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="cover">Cubrir (recortar)</option>
                      <option value="contain">Contener (agregar padding)</option>
                      <option value="fill">Rellenar (estirar)</option>
                      <option value="inside">Solo reducir</option>
                      <option value="outside">Cubrir mínimo</option>
                    </select>
                  </div>

                  {/* Formato de salida */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Formato de salida
                    </label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="original">Original</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                </div>

                {/* Calidad */}
                {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Calidad ({quality}%)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Menor tamaño</span>
                      <span>Mayor calidad</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subir Archivos */}
          <Card>
            <CardHeader>
              <CardTitle>Subir Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']}
                maxFiles={10}
                maxSize={50 * 1024 * 1024} // 50MB
                onFilesSelected={handleFilesSelected}
                onUpdateProgress={handleUpdateProgress}
              />
              
              {files.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={processFiles}
                    disabled={processing || (!width && !height)}
                    size="lg"
                  >
                    {processing ? 'Redimensionando...' : 'Redimensionar Imágenes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          {resizeResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Redimensionamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {resizeResults.map((result, index) => (
                    <div key={result.fileId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Vista previa */}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vista previa</h4>
                          <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg overflow-hidden border dark:border-gray-600">
                            <img 
                              src={result.resizedUrl} 
                              alt={`Resized ${result.originalName}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Información y descarga */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Información del redimensionamiento</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Archivo original:</span>
                                <span className="font-medium dark:text-white">{result.originalName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Dimensiones:</span>
                                <span className="font-medium dark:text-white">
                                  {result.original.width} × {result.original.height} → {result.resized.width} × {result.resized.height}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tamaño:</span>
                                <span className="font-medium dark:text-white">
                                  {formatFileSize(result.original.size)} → {formatFileSize(result.resized.size)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Formato:</span>
                                <span className="font-medium dark:text-white">
                                  {result.original.format?.toUpperCase()} → {result.resized.format.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Modo:</span>
                                <span className="font-medium dark:text-white capitalize">{result.settings.resizeMode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Reducción de tamaño:</span>
                                <span className={`font-medium ${result.resized.size < result.original.size ? 'text-green-600' : 'text-red-600'}`}>
                                  {result.resized.size < result.original.size ? '-' : '+'}
                                  {Math.abs(((result.resized.size - result.original.size) / result.original.size * 100)).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <a 
                            href={result.resizedUrl}
                            download={`resized-${result.originalName.split('.')[0]}-${result.resized.width}x${result.resized.height}.${result.resized.format}`}
                            className="block"
                          >
                            <Button className="w-full" size="lg">
                              <Download className="h-4 w-4 mr-2" />
                              Descargar ({result.resized.width}×{result.resized.height})
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información sobre modos de redimensionamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Modos de Redimensionamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Cubrir (Cover)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Redimensiona la imagen para cubrir toda el área objetivo. 
                    Puede recortar partes de la imagen para mantener las proporciones.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Contener (Contain)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Redimensiona la imagen para que quepa completamente dentro del área objetivo. 
                    Puede agregar padding transparente.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Rellenar (Fill)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Estira la imagen para llenar exactamente las dimensiones objetivo. 
                    Puede distorsionar la imagen.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Solo Reducir (Inside)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Solo redimensiona la imagen si es más grande que las dimensiones objetivo. 
                    No agranda imágenes pequeñas.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Cubrir Mínimo (Outside)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Redimensiona para que la imagen sea al menos tan grande como las dimensiones objetivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
