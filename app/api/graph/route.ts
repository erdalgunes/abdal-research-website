import { NextResponse } from 'next/server'
import { buildLinkGraph } from '@/lib/graph-builder'
import { APIErrorHandler, checkRateLimit, validateOrigin } from '@/lib/api-error-handler'

export async function GET(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin for security
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Rate limiting for graph API (less restrictive as it's read-only)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP, 60, 60000)) { // 60 requests per minute
      throw APIErrorHandler.createError('Rate limit exceeded', 429, 'RATE_LIMITED')
    }

    const graph = await buildLinkGraph()

    if (!graph || !graph.pages) {
      throw APIErrorHandler.createError('Graph data unavailable', 503, 'GRAPH_BUILD_FAILED')
    }

    // Convert Maps and Sets to plain objects for JSON serialization
    const pages = Array.from(graph.pages.values())
    const edges = []

    for (const [from, toSet] of graph.forwardLinks.entries()) {
      for (const to of toSet) {
        edges.push({ from, to })
      }
    }

    return NextResponse.json({
      nodes: pages.map(p => ({
        id: p.slug,
        title: p.title,
        category: p.category,
        keywords: p.keywords,
        url: `https://sacred-madness.vercel.app/wiki/${p.slug}`
      })),
      edges,
      stats: {
        totalPages: pages.length,
        totalLinks: edges.length,
        categories: [...new Set(pages.map(p => p.category).filter(Boolean))]
      }
    })

  }, 'Graph API')
}
