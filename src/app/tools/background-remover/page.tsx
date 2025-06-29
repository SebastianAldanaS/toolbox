'use client'

import { useState } from 'react'
import { ArrowLeft, Download, ImageMinus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/Footer'
import { FileUpload } from '@/types'

export default function BackgroundRemoverPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [processing, setProcessing] = useState(false)

  const handleFilesSelected = (selectedFiles: FileUpload[]) => {
    setFiles(selectedFiles)
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

  const processFiles = async () => {
    setProcessing(true)
    
    try {
      for (const file of files) {
        if (file.status !== 'uploading') continue
        
        // Actualizar estado a procesando
        handleUpdateProgress(file.id, 0, 'processing')
        
        // Crear FormData para enviar archivo
        const formData = new FormData()
        formData.append('file', file.file)
        
        try {
          // Simular progreso de subida
          handleUpdateProgress(file.id, 25, 'processing')
          
          // Llamar a la API
          const response = await fetch('/api/tools/background-remover', {
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
            handleUpdateProgress(file.id, 100, 'completed', result.processedUrl)
          } else {
            throw new Error(result.error || 'Error processing file')
          }
          
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          handleUpdateProgress(file.id, 0, 'error', undefined, 
            error instanceof Error ? error.message : 'Error desconocido')
        }
      }
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
                  <ImageMinus className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quitar Fondo</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Elimina el fondo de tus imágenes automáticamente</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Subir Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
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
                    {processing ? 'Procesando...' : 'Quitar Fondo'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {files.some(file => file.status === 'completed') && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {files
                    .filter(file => file.status === 'completed')
                    .map(file => (
                      <div key={file.id} className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">{file.name}</h4>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {file.result ? (
                              <img 
                                src={file.result} 
                                alt={`Processed ${file.name}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <p className="text-gray-500">Cargando vista previa...</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <a 
                          href={file.result}
                          download={`sin-fondo-${file.name.split('.')[0]}.png`}
                          className="block"
                        >
                          <Button className="w-full" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </a>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <ul className="space-y-2">
                  <li>• Sube una o más imágenes (JPEG, PNG, WebP)</li>
                  <li>• Nuestro algoritmo de IA detecta automáticamente el sujeto principal</li>
                  <li>• Elimina el fondo manteniendo la calidad de la imagen</li>
                  <li>• Descarga tu imagen con fondo transparente</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Consejo:</strong> Para mejores resultados, usa imágenes con buena iluminación 
                    y sujetos claramente definidos.
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
