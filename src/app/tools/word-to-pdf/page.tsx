'use client'

import { useState } from 'react'
import { ArrowLeft, FileText, Download, Upload, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileUploader } from '@/components/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import { FileUpload } from '@/types'

interface ConversionResult {
  success: boolean
  filename: string
  downloadUrl: string
  originalSize: number
  convertedSize: number
  error?: string
}

export default function WordToPdfPage() {
  const [file, setFile] = useState<FileUpload | null>(null)
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = (files: FileUpload[]) => {
    if (files.length > 0) {
      setFile(files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleConvert = async () => {
    if (!file) return

    setConverting(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file.file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 20
        })
      }, 500)

      const response = await fetch('/api/tools/word-to-pdf', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al convertir el archivo')
      }

      const result = await response.json()
      setResult(result)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setConverting(false)
      setProgress(0)
    }
  }

  const handleDownload = () => {
    if (result?.downloadUrl) {
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetTool = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Word a PDF</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Convierte documentos Word a formato PDF</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Archivo Word
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Formatos soportados:</strong> .docx (Word 2007+) y .doc (Word 97-2003)
                  <br />
                  <strong>Tamaño máximo:</strong> 50 MB
                </p>
              </div>

              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>⚠️ Nota importante:</strong> La conversión extrae únicamente el texto del documento.
                  El PDF resultante será en formato de texto simple y puede no conservar el formato original,
                  imágenes, tablas complejas, estilos avanzados o elementos gráficos del documento Word.
                </p>
              </div>
              
              <FileUploader
                acceptedFileTypes={[
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/msword'
                ]}
                maxSize={50 * 1024 * 1024} // 50MB
                maxFiles={1}
                onFilesSelected={handleFileSelected}
              />
              
              {file && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{formatFileSize(file.file.size)}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleConvert}
                      disabled={converting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {converting ? 'Convirtiendo...' : 'Convertir a PDF'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {converting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Convirtiendo documento...</h3>
                    <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Procesando el documento Word y generando el archivo PDF...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && result.success && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Download className="h-5 w-5" />
                  Conversión Completada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    ✅ Tu documento Word ha sido convertido exitosamente a PDF.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Información del archivo</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><span className="font-medium">Archivo:</span> {result.filename}</p>
                      <p><span className="font-medium">Tamaño original:</span> {formatFileSize(result.originalSize)}</p>
                      <p><span className="font-medium">Tamaño PDF:</span> {formatFileSize(result.convertedSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">PDF generado</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTool}
                    className="border-blue-600 text-blue-700 hover:bg-blue-100"
                  >
                    Convertir Otro Archivo
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600">
                    📝 El PDF generado contiene únicamente el texto del documento original.
                    Formato, imágenes y elementos gráficos no se conservan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acerca del Convertidor Word a PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-600">
                <h4 className="text-base font-medium text-gray-900 mb-2">Características:</h4>
                <ul className="space-y-1">
                  <li>• Extrae y convierte el texto de documentos Word a PDF</li>
                  <li>• Soporte para archivos .docx y .doc</li>
                  <li>• Procesamiento rápido y seguro</li>
                  <li>• Sin límites de tamaño (hasta 50MB)</li>
                </ul>
                
                <h4 className="text-base font-medium text-gray-900 mt-4 mb-2">Formatos soportados:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Entrada:</strong> .docx (Microsoft Word 2007+) - Recomendado</li>
                  <li>• <strong>Entrada:</strong> .doc (Microsoft Word 97-2003) - Soporte básico</li>
                  <li>• <strong>Salida:</strong> .pdf (Portable Document Format - Solo texto)</li>
                </ul>

                <h4 className="text-base font-medium text-gray-900 mt-4 mb-2">⚠️ Limitaciones importantes:</h4>
                <ul className="space-y-1 text-amber-700">
                  <li>• <strong>Solo texto:</strong> El PDF resultante contendrá únicamente texto</li>
                  <li>• <strong>Sin formato:</strong> No se conservan estilos, colores, fuentes especiales</li>
                  <li>• <strong>Sin imágenes:</strong> Las imágenes del documento original no se incluyen</li>
                  <li>• <strong>Sin tablas:</strong> Las tablas se convierten a texto simple</li>
                  <li>• <strong>Sin elementos gráficos:</strong> Formas, gráficos y diagramas se pierden</li>
                </ul>

                <h4 className="text-base font-medium text-gray-900 mt-4 mb-2">Notas de seguridad:</h4>
                <ul className="space-y-1">
                  <li>• Los archivos se procesan localmente por seguridad</li>
                  <li>• No se almacenan archivos en el servidor</li>
                  <li>• Para documentos .doc antiguos, primero conviértelos a .docx para mejores resultados</li>
                </ul>

                <h4 className="text-base font-medium text-gray-900 mt-4 mb-2">Consejos para mejores resultados:</h4>
                <ul className="space-y-1">
                  <li>• Use fuentes estándar como Times New Roman o Arial</li>
                  <li>• Evite elementos muy complejos como WordArt o gráficos incrustados</li>
                  <li>• Verifique que el documento no esté protegido con contraseña</li>
                  <li>• Asegúrese de que el archivo .docx no esté corrupto</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
