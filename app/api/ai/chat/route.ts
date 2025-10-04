import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { APIErrorHandler, checkRateLimit, validateOrigin, sanitizeInput } from '@/lib/api-error-handler'
import { routeQuery, logRoutingDecision, analyzeQueryComplexity } from '@/lib/ai-router'
import { buildCachedRequest, extractPageContext } from '@/lib/prompt-cache'
import { logClaudeCall } from '@/lib/cost-tracker'

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
    let pageContext: string | undefined
    if (slug) {
      try {
        const sanitizedSlug = sanitizeInput(slug)
        const filePath = join(process.cwd(), 'content/chapters', `${sanitizedSlug}.md`)
        const source = await readFile(filePath, 'utf8')
        const { data: frontmatter, content } = matter(source)
        const fullContext = `Current Page: ${frontmatter.title}\n\n${content}`
        pageContext = extractPageContext(fullContext, 2000)
      } catch (error) {
        // Log but don't fail - page context is optional
        console.warn('Could not load page context for slug:', slug, error)
      }
    }

    // Route query to appropriate model (Haiku vs Sonnet)
    const complexity = analyzeQueryComplexity(sanitizedMessage)
    const modelConfig = routeQuery(sanitizedMessage)
    logRoutingDecision(sanitizedMessage, modelConfig, complexity)

    // Build request with prompt caching
    const requestBody = buildCachedRequest(
      modelConfig.model,
      sanitizedMessage,
      modelConfig.maxTokens,
      pageContext
    )

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sacred-madness.vercel.app',
        'X-Title': 'Sacred Madness Wiki'
      },
      body: JSON.stringify(requestBody)
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

    // Extract token usage and log costs
    const usage = data.usage || {}
    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0
    const cacheHit = cachedTokens > 0

    // Determine model type (haiku or sonnet) from model config
    const modelType = modelConfig.model.includes('haiku') ? 'haiku' : 'sonnet'

    // Log the API call for cost tracking
    logClaudeCall({
      model: modelType,
      inputTokens,
      outputTokens,
      cachedTokens,
      cacheHit,
      success: true
    })

    return NextResponse.json({
      message: data.choices[0].message.content
    })

  }, 'AI Chat API')
}
