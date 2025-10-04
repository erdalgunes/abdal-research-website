import { NextResponse } from 'next/server'

export class APIError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown>

  constructor(message: string, status: number = 500, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class APIErrorHandler {
  static createError(message: string, status: number = 500, code?: string, details?: Record<string, unknown>): APIError {
    return new APIError(message, status, code, details)
  }

  static handleError(error: unknown, context?: string): NextResponse {
    // Log error for monitoring
    console.error('API Error:', {
      context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    // In production, report to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportToErrorService(error, context)
    }

    // Handle different error types
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && { details: error.details })
        },
        { status: error.status }
      )
    }

    // Handle network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'External service unavailable' },
        { status: 503 }
      )
    }

    // Handle file system errors
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Default server error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: 500 }
    )
  }

  static validateRequest(data: Record<string, unknown>, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw this.createError(`Missing required field: ${field}`, 400, 'VALIDATION_ERROR')
      }
    }
  }

  static async withErrorHandling<T>(
    handler: () => Promise<T>,
    context?: string
  ): Promise<NextResponse | T> {
    try {
      return await handler()
    } catch (error) {
      return this.handleError(error, context)
    }
  }
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const current = requestCounts.get(identifier)
  
  if (!current || current.resetTime < windowStart) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// Security helpers
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim()
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://sacred-madness.vercel.app',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ]
  
  return !origin || allowedOrigins.includes(origin)
}