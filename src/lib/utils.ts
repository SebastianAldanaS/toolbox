import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function validateFileType(file: File, acceptedTypes: string[]): boolean {
  // Get file extension first
  const extension = getFileExtension(file.name)
  
  // Map common extensions to MIME types
  const extensionToMimeType: Record<string, string[]> = {
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'doc': ['application/msword'],
    'pdf': ['application/pdf'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'mp3': ['audio/mpeg', 'audio/mp3'],
    'wav': ['audio/wav'],
    'mp4': ['video/mp4'],
    'avi': ['video/avi'],
    'mov': ['video/quicktime']
  }
  
  // Check MIME type if available and valid
  if (file.type && file.type !== '') {
    const mimeTypeMatch = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })
    
    if (mimeTypeMatch) {
      return true
    }
  }
  
  // Fallback: check file extension (more reliable for some file types)
  const possibleMimeTypes = extensionToMimeType[extension] || []
  
  return possibleMimeTypes.some(mimeType => 
    acceptedTypes.includes(mimeType) || 
    acceptedTypes.some(acceptedType => 
      acceptedType.includes('*') && mimeType.startsWith(acceptedType.split('/')[0])
    )
  )
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}
