import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    console.log('Testing URL:', url);
    
    // Test URL validation
    const isValid = ytdl.validateURL(url);
    console.log('URL is valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid YouTube URL' 
      });
    }

    // Test getting basic info
    try {
      const info = await ytdl.getBasicInfo(url);
      console.log('Basic info retrieved:', info.videoDetails.title);
      
      return NextResponse.json({
        valid: true,
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        viewCount: info.videoDetails.viewCount
      });
    } catch (error) {
      console.error('Error getting basic info:', error);
      return NextResponse.json({
        valid: false,
        error: 'Could not retrieve video information'
      });
    }

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
