/**
 * AI Model Router - Haiku vs Sonnet Decision Logic
 *
 * Routes queries to appropriate Claude model based on complexity:
 * - Simple queries (40%) → Haiku (12x cheaper)
 * - Complex queries (60%) → Sonnet (higher quality)
 *
 * Cost Savings: ~$100/month for 1000 users
 */

export interface ModelConfig {
  model: string
  maxTokens: number
  inputCostPer1M: number
  outputCostPer1M: number
  description: string
}

export const MODELS = {
  HAIKU: {
    model: 'anthropic/claude-3.5-haiku',
    maxTokens: 400,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    description: 'Fast, cost-effective for simple queries'
  },
  SONNET: {
    model: 'anthropic/claude-sonnet-4.5',
    maxTokens: 600,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    description: 'High quality for complex queries'
  }
} as const

export type QueryComplexity = 'simple' | 'medium' | 'complex'

/**
 * Analyze query complexity based on patterns
 */
export function analyzeQueryComplexity(
  query: string,
  selectedText?: string
): QueryComplexity {
  const lowerQuery = query.toLowerCase().trim()

  // Simple query patterns (route to Haiku)
  const simplePatterns = [
    /^what (is|are|does|do|means?|was|were)\b/i,
    /^define\b/i,
    /^definition of\b/i,
    /^explain.*briefly\b/i,
    /^summarize\b/i,
    /^summary of\b/i,
    /^tldr\b/i,
    /^eli5\b/i,  // Explain Like I'm 5
    /^quick (question|summary)\b/i,
    /^how do (i|you)\b/i,
    /^can you (list|name)\b/i,
    /^who (is|was|were)\b/i,
    /^when (did|was|were)\b/i,
    /^where (is|was|were)\b/i,
  ]

  // Check for simple patterns
  if (simplePatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'simple'
  }

  // Complex query indicators
  const complexIndicators = [
    /compar(e|ison|ative)/i,
    /analyz(e|is)/i,
    /critic(al|ism|ize)/i,
    /evaluat(e|ion)/i,
    /\b(why|how come)\b.*\b(because|since|reason)/i,
    /relationship between/i,
    /implication/i,
    /consequence/i,
    /synthesiz(e|ing)/i,
    /in depth/i,
    /detailed (explanation|analysis)/i,
    /explore.*connection/i,
    /philosophical/i,
    /theological/i,
  ]

  if (complexIndicators.some(indicator => indicator.test(lowerQuery))) {
    return 'complex'
  }

  // Length-based heuristics
  const wordCount = query.split(/\s+/).length
  const hasSelectedText = selectedText && selectedText.length > 100

  // Long queries or substantial selected text → complex
  if (wordCount > 20 || hasSelectedText) {
    return 'medium'
  }

  // Short queries without complex indicators → simple
  if (wordCount <= 10) {
    return 'simple'
  }

  // Default to medium
  return 'medium'
}

/**
 * Route query to appropriate model
 */
export function routeQuery(
  query: string,
  selectedText?: string
): ModelConfig {
  const complexity = analyzeQueryComplexity(query, selectedText)

  // Route simple queries to Haiku for cost savings
  if (complexity === 'simple') {
    return MODELS.HAIKU
  }

  // Route complex queries to Sonnet for quality
  return MODELS.SONNET
}

/**
 * Calculate estimated cost for a query
 */
export function estimateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M
  return inputCost + outputCost
}

/**
 * Estimate token count from text (rough approximation)
 * Average: 1 token ≈ 4 characters or 0.75 words
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Get model recommendation with reasoning
 */
export function getModelRecommendation(
  query: string,
  selectedText?: string
): {
  model: ModelConfig
  complexity: QueryComplexity
  reasoning: string
  estimatedInputTokens: number
} {
  const complexity = analyzeQueryComplexity(query, selectedText)
  const model = routeQuery(query, selectedText)

  // Estimate input tokens
  const queryTokens = estimateTokens(query)
  const selectionTokens = selectedText ? estimateTokens(selectedText) : 0
  const systemPromptTokens = 500 // Approximate
  const estimatedInputTokens = queryTokens + selectionTokens + systemPromptTokens

  let reasoning = ''
  switch (complexity) {
    case 'simple':
      reasoning = 'Simple query pattern detected (definitions, basic questions). Routing to Haiku for cost efficiency.'
      break
    case 'medium':
      reasoning = 'Medium complexity query. Using Sonnet for balanced quality.'
      break
    case 'complex':
      reasoning = 'Complex query requiring analysis or synthesis. Using Sonnet for highest quality.'
      break
  }

  return {
    model,
    complexity,
    reasoning,
    estimatedInputTokens
  }
}

/**
 * Log routing decision (for monitoring)
 */
export function logRoutingDecision(
  query: string,
  model: ModelConfig,
  complexity: QueryComplexity
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🤖 AI Router Decision:', {
      query: query.substring(0, 50) + '...',
      model: model.model,
      complexity,
      maxTokens: model.maxTokens,
      costMultiplier: `${model.inputCostPer1M}/${model.outputCostPer1M}`
    })
  }
}
