import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { APIErrorHandler, checkRateLimit, validateOrigin, sanitizeInput } from '@/lib/api-error-handler'

export async function GET(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin for security
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Rate limiting for search API
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP, 30, 60000)) { // 30 searches per minute
      throw APIErrorHandler.createError('Rate limit exceeded', 429, 'RATE_LIMITED')
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q')

    if (!rawQuery) {
      throw APIErrorHandler.createError('Query parameter required', 400, 'MISSING_QUERY')
    }

    // Sanitize and validate query
    const query = sanitizeInput(rawQuery).toLowerCase()
    if (!query || query.length < 2) {
      throw APIErrorHandler.createError('Query must be at least 2 characters', 400, 'INVALID_QUERY')
    }

    if (query.length > 100) {
      throw APIErrorHandler.createError('Query too long (max 100 characters)', 400, 'QUERY_TOO_LONG')
    }

    const chaptersDir = join(process.cwd(), 'content/chapters')
    
    let files: string[]
    try {
      files = await readdir(chaptersDir)
    } catch {
      throw APIErrorHandler.createError('Content directory not accessible', 503, 'CONTENT_UNAVAILABLE')
    }

    const results = []
    const maxResults = 50 // Limit results to prevent performance issues

    for (const file of files) {
      if (!file.endsWith('.md')) continue
      if (results.length >= maxResults) break

      try {
        const slug = file.replace('.md', '')
        const filePath = join(chaptersDir, file)
        const source = await readFile(filePath, 'utf8')
        const { data: frontmatter, content } = matter(source)

        // Search in title, description, keywords, and content
        const searchableText = [
          frontmatter.title || '',
          frontmatter.description || '',
          ...(frontmatter.keywords || []),
          content || ''
        ].join(' ').toLowerCase()

        if (searchableText.includes(query)) {
          // Find context around the match
          const lines = content.split('\n')
          const matchingLines = lines
            .filter(line => line.toLowerCase().includes(query))
            .slice(0, 3)
            .map(line => line.trim())
            .filter(line => line.length > 0)

          results.push({
            slug,
            title: frontmatter.title || slug,
            description: frontmatter.description || '',
            category: frontmatter.category || null,
            keywords: frontmatter.keywords || [],
            matches: matchingLines,
            url: `https://sacred-madness.vercel.app/wiki/${slug}`
          })
        }
      } catch (fileError) {
        // Log individual file errors but continue processing
        console.warn(`Error processing file ${file}:`, fileError)
        continue
      }
    }

    return NextResponse.json({
      query: rawQuery,
      sanitizedQuery: query,
      count: results.length,
      results: results.slice(0, maxResults), // Ensure we don't exceed limit
      maxResults
    })

  }, 'Search API')
}
