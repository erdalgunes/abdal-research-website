'use client'

import React from 'react'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FileText, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MDXErrorBoundaryProps {
  children: React.ReactNode
  contentTitle?: string
}

export function MDXErrorBoundary({ children, contentTitle }: MDXErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('MDX Rendering Error:', error, errorInfo)
    
    // Report MDX-specific errors
    if (process.env.NODE_ENV === 'production') {
      // Could send to analytics: reportMDXError(error, errorInfo, contentTitle)
    }
  }

  const fallbackUI = (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-4">Content Rendering Error</h2>
        <p className="text-muted-foreground mb-6">
          {contentTitle 
            ? `Unable to render "${contentTitle}". The content may contain formatting errors or unsupported elements.`
            : 'Unable to render this content. The content may contain formatting errors or unsupported elements.'
          }
        </p>
        
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-2">Possible causes:</h3>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• Malformed MDX syntax</li>
            <li>• Missing or invalid component imports</li>
            <li>• Corrupted content file</li>
            <li>• Incompatible markdown extensions</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          <Button asChild>
            <Link href="/">
              <FileText className="h-4 w-4 mr-2" />
              Browse Other Content
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