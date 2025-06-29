'use client'

import { useState } from 'react'
import { ArrowLeft, Download, FileImage, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/Footer'
import { FileUpload, ImageProcessingOptions } from '@/types'

interface ConversionResult {
  originalName: string
  convertedUrl: string
  fileId: string
  originalFormat: string
  convertedFormat: string
  originalSize: number
  convertedSize: number
  dimensions: {
    width: number
    height: number
  }
  quality: number
}

export default function ImageConverterPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [processing, setProcessing] = useState(false)
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([])
  
  // Opciones de conversión
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
  const [quality, setQuality] = useState(80)
  const [maintainTransparency, setMaintainTransparency] = useState(true)

  const handleFilesSelected = (selectedFiles: FileUpload[]) => {
    setFiles(selectedFiles)
    setConversionResults([]) // Limpiar resultados anteriores
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

  const processFiles = async () => {
    setProcessing(true)
    const results: ConversionResult[] = []
    
    try {
      for (const file of files) {
        if (file.status !== 'uploading') continue
        
        // Actualizar estado a procesando
        handleUpdateProgress(file.id, 0, 'processing')
        
        // Crear FormData para enviar archivo
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('outputFormat', outputFormat)
        formData.append('quality', quality.toString())
        formData.append('maintainTransparency', maintainTransparency.toString())
        
        try {
          // Simular progreso de subida
          handleUpdateProgress(file.id, 25, 'processing')
          
          // Llamar a la API
          const response = await fetch('/api/tools/image-converter', {
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
            handleUpdateProgress(file.id, 100, 'completed', result.convertedUrl)
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
      
      setConversionResults(results)
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
                  <FileImage className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Convertir Imagen</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convierte entre diferentes formatos de imagen</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Configuración de Conversión */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Opciones de Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Formato de salida */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Formato de salida
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                {/* Calidad */}
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
                    disabled={outputFormat === 'png'}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Menor tamaño</span>
                    <span>Mayor calidad</span>
                  </div>
                </div>

                {/* Transparencia */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Opciones
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="transparency"
                      checked={maintainTransparency}
                      onChange={(e) => setMaintainTransparency(e.target.checked)}
                      disabled={outputFormat === 'jpeg'}
                      className="rounded"
                    />
                    <label htmlFor="transparency" className="text-sm text-gray-600">
                      Mantener transparencia
                    </label>
                  </div>
                  {outputFormat === 'jpeg' && (
                    <p className="text-xs text-gray-500">
                      JPEG no soporta transparencia
                    </p>
                  )}
                </div>
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
                    disabled={processing}
                    size="lg"
                  >
                    {processing ? 'Convirtiendo...' : `Convertir a ${outputFormat.toUpperCase()}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          {conversionResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {conversionResults.map((result, index) => (
                    <div key={result.fileId} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Vista previa */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Vista previa</h4>
                          <div className="aspect-video bg-white rounded-lg overflow-hidden border">
                            <img 
                              src={result.convertedUrl} 
                              alt={`Converted ${result.originalName}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Información y descarga */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Información del archivo</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Archivo original:</span>
                                <span className="font-medium">{result.originalName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Formato:</span>
                                <span className="font-medium">
                                  {result.originalFormat?.toUpperCase()} → {result.convertedFormat.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Dimensiones:</span>
                                <span className="font-medium">
                                  {result.dimensions.width} × {result.dimensions.height}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tamaño:</span>
                                <span className="font-medium">
                                  {formatFileSize(result.originalSize)} → {formatFileSize(result.convertedSize)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Calidad:</span>
                                <span className="font-medium">{result.quality}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Reducción:</span>
                                <span className={`font-medium ${result.convertedSize < result.originalSize ? 'text-green-600' : 'text-red-600'}`}>
                                  {result.convertedSize < result.originalSize ? '-' : '+'}
                                  {Math.abs(((result.convertedSize - result.originalSize) / result.originalSize * 100)).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <a 
                            href={result.convertedUrl}
                            download={`converted-${result.originalName.split('.')[0]}.${result.convertedFormat}`}
                            className="block"
                          >
                            <Button className="w-full" size="lg">
                              <Download className="h-4 w-4 mr-2" />
                              Descargar {result.convertedFormat.toUpperCase()}
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

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle>Información sobre Formatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">JPEG</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mejor para fotografías</li>
                    <li>• Tamaño de archivo más pequeño</li>
                    <li>• No soporta transparencia</li>
                    <li>• Compresión ajustable</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">PNG</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mejor para gráficos y logos</li>
                    <li>• Soporta transparencia</li>
                    <li>• Sin pérdida de calidad</li>
                    <li>• Tamaño de archivo mayor</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">WebP</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mejor compresión que JPEG</li>
                    <li>• Soporta transparencia</li>
                    <li>• Formato moderno y eficiente</li>
                    <li>• Compatible con navegadores modernos</li>
                  </ul>
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
