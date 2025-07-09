'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileUpload } from '@/types'
import { formatFileSize, generateId, validateFileType, getReadableFileTypes } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  acceptedFileTypes: string[]
  maxFiles?: number
  maxSize?: number
  onFilesSelected: (files: FileUpload[]) => void
  onUpdateProgress?: (id: string, progress: number, status: FileUpload['status'], result?: string, error?: string) => void
  className?: string
}

export function FileUploader({
  acceptedFileTypes,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFilesSelected,
  onUpdateProgress,
  className
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setRejectionError(null)
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      
      if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setRejectionError('Tipo de archivo no válido. Por favor, selecciona un archivo compatible.')
      } else if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setRejectionError(`El archivo es demasiado grande. Máximo permitido: ${formatFileSize(maxSize)}`)
      } else {
        setRejectionError('Error al procesar el archivo.')
      }
      return
    }

    const newFiles: FileUpload[] = acceptedFiles
      .filter(file => validateFileType(file, acceptedFileTypes))
      .slice(0, maxFiles - files.length)
      .map(file => ({
        file,
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading' as const
      }))

    if (newFiles.length === 0 && acceptedFiles.length > 0) {
      const readableTypes = getReadableFileTypes(acceptedFileTypes)
      setRejectionError(`Tipo de archivo no válido. Por favor, selecciona un archivo compatible: ${readableTypes}`)
      return
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }, [files, acceptedFileTypes, maxFiles, onFilesSelected, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: maxFiles > 1,
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        const readableTypes = getReadableFileTypes(acceptedFileTypes)
        setRejectionError(`Tipo de archivo no válido. Por favor, selecciona un archivo compatible: ${readableTypes}`)
      } else if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setRejectionError(`El archivo es demasiado grande. Máximo permitido: ${formatFileSize(maxSize)}`)
      } else {
        setRejectionError('Error al procesar el archivo.')
      }
    }
  })

  const updateFileProgress = (id: string, progress: number, status: FileUpload['status'], result?: string, error?: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.map(file =>
        file.id === id 
          ? { ...file, progress, status, result, error }
          : file
      )
      onFilesSelected(updatedFiles)
      if (onUpdateProgress) {
        onUpdateProgress(id, progress, status, result, error)
      }
      return updatedFiles
    })
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id)
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
    
    // Clear rejection error when removing files
    if (updatedFiles.length === 0) {
      setRejectionError(null)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive
            ? 'Suelta los archivos aquí'
            : 'Arrastra archivos aquí o haz clic para seleccionar'}
        </p>
        <p className="text-sm text-gray-500">
          Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''} de {formatFileSize(maxSize)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tipos permitidos: {getReadableFileTypes(acceptedFileTypes)}
        </p>
      </div>

      {rejectionError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{rejectionError}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                  
                  {file.status === 'processing' && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-blue-600 mt-1">Procesando...</p>
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">✓ Completado</p>
                  )}
                  
                  {file.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">✗ Error: {file.error}</p>
                  )}
                </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
