import { NextResponse } from 'next/server'
import { APIErrorHandler, checkRateLimit, validateOrigin, sanitizeInput } from '@/lib/api-error-handler'
import { searchWithTavily } from '@/lib/tavily-cache'

/**
 * Research API - Tavily Academic Search
 *
 * Provides citation discovery and research assistance:
 * - Searches academic sources via Tavily
 * - Cached for 7 days (semantic similarity matching)
 * - Cost: $0.005 per uncached request
 *
 * Expected cache hit rate: ~95% (saves $25/month)
 */
export async function POST(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin for security
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Rate limiting (stricter for research API - more expensive)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP, 10, 60000)) { // 10 requests per minute
      throw APIErrorHandler.createError('Rate limit exceeded', 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const { query, maxResults, searchDepth, includeDomains, excludeDomains } = body

    // Validate required fields
    APIErrorHandler.validateRequest(body, ['query'])

    // Sanitize input
    const sanitizedQuery = sanitizeInput(query)
    if (!sanitizedQuery || sanitizedQuery.length > 500) {
      throw APIErrorHandler.createError('Invalid query format or length', 400, 'INVALID_QUERY')
    }

    // Validate optional parameters
    if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 20)) {
      throw APIErrorHandler.createError('maxResults must be between 1 and 20', 400, 'INVALID_PARAM')
    }

    if (searchDepth && !['basic', 'advanced'].includes(searchDepth)) {
      throw APIErrorHandler.createError('searchDepth must be "basic" or "advanced"', 400, 'INVALID_PARAM')
    }

    // Perform search with caching
    const result = await searchWithTavily({
      query: sanitizedQuery,
      maxResults,
      searchDepth,
      includeDomains,
      excludeDomains
    })

    return NextResponse.json({
      query: result.query,
      results: result.results,
      cached: result.cached,
      timestamp: result.timestamp,
      meta: {
        resultCount: result.results.length,
        cacheHit: result.cached
      }
    })

  }, 'Research API')
}
