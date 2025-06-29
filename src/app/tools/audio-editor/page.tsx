'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Import the audio editor component dynamically to avoid SSR issues with FFmpeg
const AudioEditorComponent = dynamic(() => import('./AudioEditorComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Cargando Editor de Audio...</CardTitle>
            <CardDescription>
              Inicializando componentes de audio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <Progress value={33} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

export default function AudioEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={0} className="w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <AudioEditorComponent />
      
    </Suspense>
  )
}