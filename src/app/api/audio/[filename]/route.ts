import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadsDir, filename)

    // Security check - ensure the file is in the uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Access denied', { status: 403 })
    }

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'mp3':
        contentType = 'audio/mpeg'
        break
      case 'wav':
        contentType = 'audio/wav'
        break
      case 'ogg':
        contentType = 'audio/ogg'
        break
      case 'aac':
      case 'm4a':
        contentType = 'audio/aac'
        break
      case 'flac':
        contentType = 'audio/flac'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving audio file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
