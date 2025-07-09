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

export function getReadableFileType(mimeType: string): string {
  const mimeTypeMap: Record<string, string> = {
    // Documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
    'application/msword': 'Documento Word',
    'application/pdf': 'Documento PDF',
    'text/plain': 'Archivo de texto',
    'application/vnd.ms-excel': 'Hoja de cálculo Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de cálculo Excel',
    'application/vnd.ms-powerpoint': 'Presentación PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentación PowerPoint',
    
    // Images
    'image/jpeg': 'Imagen JPEG',
    'image/jpg': 'Imagen JPEG',
    'image/png': 'Imagen PNG',
    'image/gif': 'Imagen GIF',
    'image/webp': 'Imagen WebP',
    'image/svg+xml': 'Imagen SVG',
    'image/bmp': 'Imagen BMP',
    'image/tiff': 'Imagen TIFF',
    
    // Audio
    'audio/mpeg': 'Audio MP3',
    'audio/mp3': 'Audio MP3',
    'audio/wav': 'Audio WAV',
    'audio/ogg': 'Audio OGG',
    'audio/aac': 'Audio AAC',
    'audio/flac': 'Audio FLAC',
    
    // Video
    'video/mp4': 'Video MP4',
    'video/avi': 'Video AVI',
    'video/quicktime': 'Video MOV',
    'video/x-msvideo': 'Video AVI',
    'video/webm': 'Video WebM',
    'video/mkv': 'Video MKV',
    
    // Archive
    'application/zip': 'Archivo ZIP',
    'application/x-rar-compressed': 'Archivo RAR',
    'application/x-7z-compressed': 'Archivo 7Z',
    
    // Other
    'application/json': 'Archivo JSON',
    'application/xml': 'Archivo XML',
    'text/html': 'Archivo HTML',
    'text/css': 'Archivo CSS',
    'application/javascript': 'Archivo JavaScript',
    'text/javascript': 'Archivo JavaScript'
  }
  
  return mimeTypeMap[mimeType] || mimeType
}

export function getReadableFileTypes(mimeTypes: string[]): string {
  if (mimeTypes.length === 0) return 'Cualquier archivo'
  
  const readableTypes = mimeTypes.map(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0]
      switch (baseType) {
        case 'image': return 'Imágenes'
        case 'audio': return 'Audio'
        case 'video': return 'Video'
        case 'text': return 'Texto'
        case 'application': return 'Documentos'
        default: return baseType
      }
    }
    return getReadableFileType(type)
  })
  
  // Remove duplicates and join
  const uniqueTypes = [...new Set(readableTypes)]
  
  if (uniqueTypes.length === 1) {
    return uniqueTypes[0]
  } else if (uniqueTypes.length === 2) {
    return uniqueTypes.join(' y ')
  } else {
    return uniqueTypes.slice(0, -1).join(', ') + ' y ' + uniqueTypes.slice(-1)
  }
}
