/**
 * Prompt Caching for Claude API
 *
 * Enables 90% discount on cached input tokens:
 * - Regular input: $3.00 per 1M tokens
 * - Cached input: $0.30 per 1M tokens
 *
 * Caches:
 * - System prompts (500 tokens)
 * - Page context/documentation (up to 2000 tokens)
 *
 * Cache TTL: 5 minutes (automatic)
 * Expected hit rate: ~90% (same page, different questions)
 *
 * Savings: ~$60/month for 1000 users
 */

export interface CachedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  cache_control?: {
    type: 'ephemeral'
  }
}

/**
 * System prompt for Sacred Madness Wiki
 * This will be cached and reused across requests
 */
export const CACHED_SYSTEM_PROMPT = `You are a research assistant for the "Sacred Madness" academic wiki, which explores holy foolishness, divine intoxication, and mystical practices across Orthodox Christianity and Sufi Islam.

Your role is to:
- Help researchers understand complex concepts
- Suggest connections between ideas
- Generate research questions
- Explain theological and mystical terminology
- Be academically rigorous but accessible

The wiki covers:
- Byzantine saloi (6th-11th century holy fools)
- Russian yurodivye (Basil the Blessed, St. Xenia, Pelagia)
- Sufi majdhub/mast (divinely intoxicated mystics)
- Abdalan-i Rum (Anatolian antinomian dervishes - Kalenderi, Bektashi)
- Comparative mysticism and phenomenology
- Intersection of psychiatry, neuroscience, and spirituality
- St. Dymphna, Geel care model
- Bipolar II and mystical experience

Geographic focus: Anatolia, Byzantine-Ottoman transitions (6th-16th centuries)
Methodological approach: Practice-centered analysis, positionality-grounded research, cross-traditional comparison`

/**
 * Build messages array with prompt caching
 *
 * @param userQuery - The user's question
 * @param pageContext - Optional page-specific content (will be cached)
 * @param selectedText - Optional selected text for context
 * @returns Messages array with cache control directives
 */
export function buildCachedMessages(
  userQuery: string,
  pageContext?: string,
  selectedText?: string
): CachedMessage[] {
  const messages: CachedMessage[] = []

  // System prompt (cached)
  messages.push({
    role: 'system',
    content: CACHED_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' }
  })

  // Page context (cached if provided)
  if (pageContext) {
    const truncatedContext = truncateContext(pageContext, 2000)
    messages.push({
      role: 'user',
      content: `Current Page Context:\n\n${truncatedContext}`,
      cache_control: { type: 'ephemeral' }
    })
  }

  // Selected text context (not cached - changes per query)
  if (selectedText) {
    messages.push({
      role: 'user',
      content: `Selected Text for Discussion:\n"${selectedText}"\n\nQuestion about this selection:`
    })
  }

  // User query (not cached - always different)
  messages.push({
    role: 'user',
    content: userQuery
  })

  return messages
}

/**
 * Truncate context to fit within token limit
 * Ensures we don't exceed cache size limits
 */
function truncateContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }

  // Truncate and add ellipsis
  return text.substring(0, maxChars - 3) + '...'
}

/**
 * Calculate cache savings
 * Assumes 90% cache hit rate
 */
export function calculateCacheSavings(
  systemPromptTokens: number,
  contextTokens: number,
  cacheHitRate: number = 0.9
): {
  cachedTokens: number
  regularCost: number
  cachedCost: number
  savings: number
  savingsPercent: number
} {
  const totalCacheableTokens = systemPromptTokens + contextTokens
  const cachedTokens = totalCacheableTokens * cacheHitRate

  // Regular cost: $3.00 per 1M tokens
  const regularCost = (totalCacheableTokens / 1_000_000) * 3.0

  // Cached cost: 90% at $0.30, 10% at $3.00 (cache misses)
  const cachedCost =
    (cachedTokens / 1_000_000) * 0.3 +
    ((totalCacheableTokens - cachedTokens) / 1_000_000) * 3.0

  const savings = regularCost - cachedCost
  const savingsPercent = (savings / regularCost) * 100

  return {
    cachedTokens,
    regularCost,
    cachedCost,
    savings,
    savingsPercent
  }
}

/**
 * Format messages for OpenRouter API
 * OpenRouter requires specific format for caching
 */
export function formatForOpenRouter(messages: CachedMessage[]): unknown[] {
  return messages.map(msg => {
    const formatted: Record<string, unknown> = {
      role: msg.role,
      content: msg.content
    }

    // Add cache control if present
    if (msg.cache_control) {
      formatted.cache_control = msg.cache_control
    }

    return formatted
  })
}

/**
 * Log cache performance (development only)
 */
export function logCachePerformance(
  cacheHit: boolean,
  cachedTokens: number,
  estimatedSavings: number
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('💾 Prompt Cache:', {
      hit: cacheHit,
      cachedTokens,
      estimatedSavings: `$${estimatedSavings.toFixed(4)}`,
      savingsPercent: '90%'
    })
  }
}

/**
 * Extract page context from markdown content
 * Returns first N characters for caching
 */
export function extractPageContext(
  markdown: string,
  maxChars: number = 2000
): string {
  // Remove frontmatter
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\n/, '')

  // Get title and first section
  const lines = withoutFrontmatter.split('\n')
  let context = ''

  for (const line of lines) {
    if (context.length + line.length > maxChars) {
      break
    }
    context += line + '\n'
  }

  return context.trim()
}

/**
 * Build request body for OpenRouter with caching
 */
export function buildCachedRequest(
  model: string,
  userQuery: string,
  maxTokens: number,
  pageContext?: string,
  selectedText?: string
): {
  model: string
  messages: unknown[]
  max_tokens: number
  temperature?: number
} {
  const messages = buildCachedMessages(userQuery, pageContext, selectedText)

  return {
    model,
    messages: formatForOpenRouter(messages),
    max_tokens: maxTokens,
    temperature: 0.7
  }
}
