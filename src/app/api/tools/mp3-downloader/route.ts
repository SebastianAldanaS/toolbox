import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir();

    const { url } = await request.json();
    console.log('Processing URL:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let videoUrl: string;
    try {
      const parsedUrl = new URL(url);
      videoUrl = parsedUrl.toString();
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if URL is a valid YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
      console.log('URL validation failed for:', videoUrl);
      return NextResponse.json(
        { error: 'Invalid YouTube URL or unsupported video platform' },
        { status: 400 }
      );
    }

    console.log('URL validated successfully');

    // Get video info
    let videoInfo;
    try {
      console.log('Getting video info...');
      videoInfo = await ytdl.getInfo(videoUrl);
      console.log('Video info retrieved:', videoInfo.videoDetails.title);
    } catch (error) {
      console.error('Error getting video info:', error);
      return NextResponse.json(
        { error: 'Unable to retrieve video information. The video might be private, age-restricted, or unavailable.' },
        { status: 400 }
      );
    }

    const title = videoInfo.videoDetails.title
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    const filename = `${title}-${Date.now()}.mp3`;
    const outputPath = path.join(UPLOADS_DIR, filename);

    // Check if video has audio
    const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
    console.log('Available audio formats:', audioFormats.length);
    
    if (audioFormats.length === 0) {
      return NextResponse.json(
        { error: 'No audio stream found for this video' },
        { status: 400 }
      );
    }

    // Get the best audio quality
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    if (!audioFormat) {
      // Fallback to any audio format
      const anyAudioFormat = audioFormats[0];
      if (!anyAudioFormat) {
        return NextResponse.json(
          { error: 'No suitable audio format found' },
          { status: 400 }
        );
      }
    }

    console.log('Selected audio format:', audioFormat?.itag || audioFormats[0]?.itag);

    // Download audio stream with options
    const downloadOptions = {
      format: audioFormat || audioFormats[0],
      quality: 'highestaudio' as const,
      filter: 'audioonly' as const,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    };

    console.log('Starting download...');
    const audioStream = ytdl(videoUrl, downloadOptions);

    // Save to file
    const writeStream = createWriteStream(outputPath);
    
    await new Promise<void>((resolve, reject) => {
      let totalSize = 0;
      
      audioStream.on('data', (chunk) => {
        totalSize += chunk.length;
        console.log('Downloaded:', Math.round(totalSize / 1024), 'KB');
      });
      
      audioStream.on('end', () => {
        console.log('Stream ended, total size:', Math.round(totalSize / 1024), 'KB');
      });
      
      audioStream.pipe(writeStream);
      audioStream.on('error', (err) => {
        console.error('Audio stream error:', err);
        reject(err);
      });
      writeStream.on('error', (err) => {
        console.error('Write stream error:', err);
        reject(err);
      });
      writeStream.on('finish', () => {
        console.log('File write completed');
        resolve();
      });
    });

    // Get file stats
    const stats = await fs.stat(outputPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      message: 'Audio downloaded successfully',
      filename,
      downloadUrl: `/uploads/${filename}`,
      originalTitle: videoInfo.videoDetails.title,
      duration: videoInfo.videoDetails.lengthSeconds,
      size: fileSizeInMB + ' MB'
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in MP3 downloader:', err);
    
    // Handle specific YouTube errors
    if (err.message?.includes('Video unavailable')) {
      return NextResponse.json(
        { error: 'Video is unavailable or private' },
        { status: 400 }
      );
    }
    
    if (err.message?.includes('age-restricted')) {
      return NextResponse.json(
        { error: 'Cannot download age-restricted content' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to download audio: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
