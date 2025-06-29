'use client';

import { useState } from 'react';
import { ArrowLeft, Download, Clock, HardDrive, Music } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { Footer } from '@/components/Footer';

interface DownloadResult {
  filename: string;
  downloadUrl: string;
  originalTitle: string;
  duration: string;
  size: string;
}

export default function MP3DownloaderPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const formatDuration = (seconds: string) => {
    const mins = Math.floor(parseInt(seconds) / 60);
    const secs = parseInt(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    if (!isYouTubeUrl(url)) {
      setError('Currently only YouTube URLs are supported');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/tools/mp3-downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download audio');
      }

      setResult(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'An error occurred while downloading');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (result?.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClear = () => {
    setUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
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
                  <Music className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MP3 Downloader</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download audio from YouTube videos as MP3 files</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Download Audio
            </CardTitle>
            <CardDescription>
              Enter a YouTube video URL to download its audio as an MP3 file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium dark:text-white">
                Video URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={isLoading || !url.trim()}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Download MP3'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </Button>
            </div>

            {result && (
              <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">
                    Download Ready!
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Music className="h-4 w-4 mt-0.5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Title</p>
                        <p className="text-sm text-muted-foreground">{result.originalTitle}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">Duration</p>
                          <p className="text-muted-foreground">{formatDuration(result.duration)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">Size</p>
                          <p className="text-muted-foreground">{result.size}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleDownloadFile}
                      className="w-full"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download MP3 File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="mb-2">
                <strong>Supported platforms:</strong> YouTube
              </p>
              <p className="mb-2">
                <strong>Note:</strong> Only public videos can be downloaded. Private, age-restricted, or copyrighted content may not be available.
              </p>
              <p>
                <strong>Legal notice:</strong> Please respect copyright laws and only download content you have permission to use.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to use</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Copy the URL of a YouTube video</li>
                <li>Paste it in the input field above</li>
                <li>Click &quot;Download MP3&quot; to process the video</li>
                <li>Once ready, click &quot;Download MP3 File&quot; to save it to your device</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
