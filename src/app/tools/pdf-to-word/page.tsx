'use client'

import { useState } from 'react'
import { ArrowLeft, Download, FileText, Upload, File } from 'lucide-react'
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
  alternativeUrl?: string
  fileId: string
  originalFormat: string
  convertedFormat: string
  alternativeFormat?: string
  originalSize: number
  convertedSize: number
  alternativeSize?: number
  pageCount: number
  textExtracted?: boolean
  fileSizeKB: string
  extractionMethod?: string
}

export default function PDFToWordPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [processing, setProcessing] = useState(false)
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([])

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

        const response = await fetch('/api/tools/pdf-to-word', {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
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
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PDF to Word</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convert PDF documents to Word format</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload PDF Files
              </CardTitle>
              <CardDescription>
                Select one or more PDF files to convert to Word format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Formatos soportados:</strong> .pdf (Portable Document Format)
                  <br />
                  <strong>Tamaño máximo:</strong> 10 MB por archivo
                  <br />
                  <strong>Máximo archivos:</strong> 5 archivos simultáneamente
                </p>
              </div>

              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Nota importante:</strong> La conversión extrae únicamente el texto del PDF.
                  El documento Word resultará en formato de texto simple y puede no conservar el diseño original,
                  imágenes, tablas complejas, fuentes especiales o elementos gráficos del PDF original.
                  Los PDFs escaneados (imágenes) no son compatibles.
                </p>
              </div>
              
              <FileUploader
                onFilesSelected={handleFilesChange}
                acceptedFileTypes={['application/pdf']}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
              />

              {/* Show selected files */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Selected files:</h4>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {file.progress !== undefined && (
                        <div className="w-24">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {file.status === 'uploading' && 'Uploading...'}
                        {file.status === 'processing' && 'Converting...'}
                        {file.status === 'completed' && 'Done'}
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
                    {processing ? 'Converting...' : `Convert ${files.length} file${files.length > 1 ? 's' : ''}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={processing}
                  >
                    Clear
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
                  Conversion Results
                </CardTitle>
                <CardDescription>
                  Your converted Word documents are ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-green-800 dark:text-green-200">
                            {result.originalName}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-green-700 dark:text-green-300">
                            <div>
                              <span className="font-medium">Format:</span>
                              <p>{result.convertedFormat}</p>
                            </div>
                            <div>
                              <span className="font-medium">Pages:</span>
                              <p>{result.pageCount}</p>
                            </div>
                            <div>
                              <span className="font-medium">Text:</span>
                              <p>{result.textExtracted ? 'Extracted' : 'Not found'}</p>
                            </div>
                            <div>
                              <span className="font-medium">Original:</span>
                              <p>{(result.originalSize / 1024).toFixed(1)} KB</p>
                            </div>
                            <div>
                              <span className="font-medium">Converted:</span>
                              <p>{result.fileSizeKB}</p>
                            </div>
                          </div>
                          {result.extractionMethod && (
                            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                              Method: {result.extractionMethod}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <Button
                            onClick={() => handleDownload(result.convertedUrl, `${result.originalName.replace('.pdf', '')}.docx`)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            DOCX
                          </Button>
                          {result.alternativeUrl && (
                            <Button
                              onClick={() => handleDownload(result.alternativeUrl!, `${result.originalName.replace('.pdf', '')}.rtf`)}
                              size="sm"
                              variant="outline"
                              className="border-green-600 dark:border-green-400 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              RTF
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    📝 Los documentos Word generados contienen únicamente el texto extraído del PDF.
                    Formato, imágenes y elementos gráficos no se conservan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acerca de la Conversión PDF a Word</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Formatos Soportados</h3>
                <p className="text-sm text-muted-foreground">
                  Entrada: Archivos PDF • Salida: DOCX (Microsoft Word) + RTF (Solo texto extraído)
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Características</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Extracción de texto</strong> de PDFs basados en texto</li>
                  <li>• Extrae metadatos e información de páginas</li>
                  <li>• Detección automática de PDFs sin texto</li>
                  <li>• Salida en formatos DOCX y RTF</li>
                  <li>• Soporte para procesamiento de múltiples archivos</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-amber-700 dark:text-amber-400">⚠️ Limitaciones Importantes</h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• <strong>Solo texto:</strong> El documento Word contendrá únicamente texto</li>
                  <li>• <strong>Sin formato:</strong> No se conservan estilos, colores, fuentes especiales</li>
                  <li>• <strong>Sin imágenes:</strong> Las imágenes del PDF original no se incluyen</li>
                  <li>• <strong>Sin tablas:</strong> Las tablas se convierten a texto simple</li>
                  <li>• <strong>Sin elementos gráficos:</strong> Formas, gráficos y diagramas se pierden</li>
                  <li>• <strong>PDFs escaneados:</strong> No compatibles (requieren OCR)</li>
                  <li>• <strong>PDFs protegidos:</strong> No pueden procesarse</li>
                  <li>• <strong>Diseño perdido:</strong> La estructura visual del PDF no se mantiene</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Métodos de Extracción</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Motor PDF.js:</strong> Procesamiento PDF de Mozilla Firefox</li>
                  <li>• <strong>Análisis pdf-lib:</strong> Extracción de estructura y metadatos</li>
                  <li>• <strong>Detección Inteligente:</strong> Identifica contenido de texto vs imagen</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Qué Esperar</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>PDFs con texto:</strong> Extracción del texto disponible</li>
                  <li>• <strong>PDFs escaneados:</strong> Detección y mensaje de incompatibilidad</li>
                  <li>• <strong>Contenido mixto:</strong> Solo se extrae el texto legible</li>
                  <li>• <strong>Resultado final:</strong> Documento Word con texto simple</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Restricciones Técnicas</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tamaño máximo: 10MB por archivo</li>
                  <li>• Máximo 5 archivos simultáneamente</li>
                  <li>• Solo PDFs basados en texto (no escaneados)</li>
                  <li>• No compatible con PDFs protegidos con contraseña</li>
                </ul>
              </div>

              <Alert>
                <File className="h-4 w-4" />
                <AlertDescription>
                  <strong>Herramienta de extracción de texto:</strong> Esta herramienta está diseñada para extraer 
                  únicamente el texto de PDFs. Si necesitas conservar el formato original, imágenes, tablas complejas 
                  o diseño del documento, considera usar software especializado como Adobe Acrobat Pro o alternativas 
                  de conversión profesional.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
