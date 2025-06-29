export interface FileUpload {
  file: File
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  result?: string
  error?: string
}

export interface ImageProcessingOptions {
  removeBackground?: boolean
  format?: 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp'
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  maintainTransparency?: boolean
}

export interface DocumentConversionOptions {
  inputFormat: 'pdf' | 'docx'
  outputFormat: 'pdf' | 'docx'
  preserveFormatting?: boolean
}

export interface AudioProcessingOptions {
  format?: 'mp3' | 'wav' | 'flac' | 'aac'
  quality?: 'low' | 'medium' | 'high'
  bitrate?: number
  startTime?: number
  endTime?: number
  volume?: number
}

export interface Tool {
  id: string
  name: string
  description: string
  category: 'image' | 'document' | 'audio'
  icon: string
  path: string
  acceptedFileTypes: string[]
}

export interface ProcessingResult {
  success: boolean
  data?: any
  error?: string
  downloadUrl?: string
}
