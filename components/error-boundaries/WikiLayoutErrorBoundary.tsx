'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BookOpen, RefreshCw, AlertTriangle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WikiLayoutErrorBoundaryProps {
  children: React.ReactNode
}

export function WikiLayoutErrorBoundary({ children }: WikiLayoutErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Wiki Layout Error:', error, errorInfo)
    
    // Report layout-specific errors
    if (process.env.NODE_ENV === 'production') {
      // Could send to analytics: reportLayoutError(error, errorInfo)
    }
  }

  const fallbackUI = (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <AlertTriangle className="h-20 w-20 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Wiki Content Error</h1>
        <p className="text-lg text-muted-foreground mb-6">
          The wiki layout encountered an error while rendering this page. 
          This could be due to content structure issues or component failures.
        </p>
        
        <div className="bg-muted/50 p-6 rounded-lg mb-8">
          <h3 className="font-semibold mb-3">What you can do:</h3>
          <ul className="text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try refreshing the page
            </li>
            <li className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Return to the home page
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Browse other wiki content
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/wiki">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Wiki
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary
      level="component"
      onError={handleError}
      fallback={fallbackUI}
    >
      {children}
    </ErrorBoundary>
  )
}