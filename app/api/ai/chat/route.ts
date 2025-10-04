import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { APIErrorHandler, checkRateLimit, validateOrigin, sanitizeInput } from '@/lib/api-error-handler'

export async function POST(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin for security
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP, 20, 60000)) { // 20 requests per minute
      throw APIErrorHandler.createError('Rate limit exceeded', 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const { message, slug } = body

    // Validate required fields
    APIErrorHandler.validateRequest(body, ['message'])

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)
    if (!sanitizedMessage || sanitizedMessage.length > 2000) {
      throw APIErrorHandler.createError('Invalid message format or length', 400, 'INVALID_MESSAGE')
    }

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw APIErrorHandler.createError('AI service not configured', 503, 'SERVICE_UNAVAILABLE')
    }

    // Get page content if slug provided
    let pageContext = ''
    if (slug) {
      try {
        const sanitizedSlug = sanitizeInput(slug)
        const filePath = join(process.cwd(), 'content/chapters', `${sanitizedSlug}.md`)
        const source = await readFile(filePath, 'utf8')
        const { data: frontmatter, content } = matter(source)
        pageContext = `\n\nCurrent Page: ${frontmatter.title}\n\n${content.substring(0, 2000)}`
      } catch (error) {
        // Log but don't fail - page context is optional
        console.warn('Could not load page context for slug:', slug, error)
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sacred-madness.vercel.app',
        'X-Title': 'Sacred Madness Wiki'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: `You are a research assistant for the "Sacred Madness" academic wiki, which explores holy foolishness, divine intoxication, and mystical practices across Orthodox Christianity and Sufi Islam.

Your role is to:
- Help researchers understand complex concepts
- Suggest connections between ideas
- Generate research questions
- Explain theological and mystical terminology
- Be academically rigorous but accessible

The wiki covers: Byzantine saloi, Russian yurodivye, Sufi majdhub/mast, Abdals, Kalenderi dervishes, comparative mysticism, and the intersection of psychiatry and spirituality.${pageContext}`
          },
          {
            role: 'user',
            content: sanitizedMessage
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw APIErrorHandler.createError(
        errorData.error?.message || 'AI service error',
        response.status,
        'AI_SERVICE_ERROR',
        errorData
      )
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw APIErrorHandler.createError('Invalid AI response format', 502, 'INVALID_AI_RESPONSE')
    }

    return NextResponse.json({
      message: data.choices[0].message.content
    })

  }, 'AI Chat API')
}
