'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIChatErrorBoundaryProps {
  children: React.ReactNode
}

export function AIChatErrorBoundary({ children }: AIChatErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('AI Chat Error:', error, errorInfo)
    
    // Report specific AI Chat errors
    if (process.env.NODE_ENV === 'production') {
      // Could send to analytics: reportAIChatError(error, errorInfo)
    }
  }

  const fallbackUI = (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-background border rounded-lg shadow-2xl p-6">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold mb-2">AI Chat Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The AI research assistant encountered an error. This might be due to:
        </p>
        <ul className="text-xs text-muted-foreground text-left mb-4 space-y-1">
          <li>• Network connectivity issues</li>
          <li>• API service unavailability</li>
          <li>• Configuration problems</li>
        </ul>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry AI Chat
        </Button>
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