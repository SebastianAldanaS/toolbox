import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename not provided' },
        { status: 400 }
      )
    }

    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    const tempDir = join(process.cwd(), 'temp')
    const filePath = join(tempDir, filename)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    try {
      // Read the file
      const fileBuffer = await readFile(filePath)
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream'
      if (filename.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (filename.endsWith('.docx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (filename.endsWith('.mp3')) {
        contentType = 'audio/mpeg'
      } else if (filename.endsWith('.wav')) {
        contentType = 'audio/wav'
      }

      // Set headers for download
      const headers = new Headers()
      headers.set('Content-Type', contentType)
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      headers.set('Content-Length', fileBuffer.length.toString())

      // Clean up the file after a delay (don't wait for it)
      setTimeout(async () => {
        try {
          await unlink(filePath)
        } catch (error) {
          console.error('Failed to clean up file:', filename, error)
        }
      }, 5000) // Delete after 5 seconds

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })

    } catch (readError) {
      console.error('Failed to read file:', filename, readError)
      return NextResponse.json(
        { error: 'Failed to read file' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
