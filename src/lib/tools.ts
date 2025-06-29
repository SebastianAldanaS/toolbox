import { Tool } from '@/types'

export const tools: Tool[] = [
  {
    id: 'background-remover',
    name: 'Quitar Fondo',
    description: 'Elimina el fondo de imágenes automáticamente',
    category: 'image',
    icon: 'ImageMinus',
    path: '/tools/background-remover',
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'image-converter',
    name: 'Convertir Imagen',
    description: 'Convierte entre diferentes formatos de imagen',
    category: 'image',
    icon: 'FileImage',
    path: '/tools/image-converter',
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    id: 'image-resizer',
    name: 'Redimensionar Imagen',
    description: 'Cambia el tamaño de imágenes manteniendo la calidad',
    category: 'image',
    icon: 'Maximize',
    path: '/tools/image-resizer',
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'pdf-to-word',
    name: 'PDF a Word',
    description: 'Convierte documentos PDF a formato Word',
    category: 'document',
    icon: 'FileType',
    path: '/tools/pdf-to-word',
    acceptedFileTypes: ['application/pdf']
  },
  {
    id: 'word-to-pdf',
    name: 'Word a PDF',
    description: 'Convierte documentos Word a formato PDF',
    category: 'document',
    icon: 'FileText',
    path: '/tools/word-to-pdf',
    acceptedFileTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  },
  {
    id: 'audio-downloader',
    name: 'Descargar MP3',
    description: 'Descarga audio MP3 desde URLs de video',
    category: 'audio',
    icon: 'Download',
    path: '/tools/audio-downloader',
    acceptedFileTypes: []
  },
  {
    id: 'audio-converter',
    name: 'Convertir Audio',
    description: 'Convierte entre diferentes formatos de audio',
    category: 'audio',
    icon: 'Music',
    path: '/tools/audio-converter',
    acceptedFileTypes: ['audio/*']
  },
  {
    id: 'audio-editor',
    name: 'Editor de Audio',
    description: 'Corta, edita y modifica archivos de audio',
    category: 'audio',
    icon: 'Scissors',
    path: '/tools/audio-editor',
    acceptedFileTypes: ['audio/*']
  }
]

export const categories = [
  { id: 'image', name: 'Imágenes', icon: 'Image' },
  { id: 'document', name: 'Documentos', icon: 'FileText' },
  { id: 'audio', name: 'Audio', icon: 'Music' }
] as const
