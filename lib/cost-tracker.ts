/**
 * Cost Tracking and Monitoring System
 *
 * Logs all API calls with estimated costs:
 * - Claude API (Haiku vs Sonnet)
 * - Tavily research API
 * - Prompt cache hit/miss tracking
 *
 * Features:
 * - Real-time cost calculation
 * - Daily/weekly/monthly aggregation
 * - Alert when approaching budget threshold
 * - Export for analysis
 */

export interface APICallLog {
  timestamp: number
  service: 'claude' | 'tavily'
  model?: string // For Claude: haiku vs sonnet
  endpoint: string
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  cacheHit: boolean
  estimatedCost: number
  userId?: string
  queryId?: string
  success: boolean
  error?: string
}

export interface CostSummary {
  period: 'daily' | 'weekly' | 'monthly'
  totalCost: number
  claudeCost: number
  tavilyCost: number
  callCount: number
  cacheHitRate: number
  averageCostPerCall: number
  breakdown: {
    haiku: { calls: number; cost: number }
    sonnet: { calls: number; cost: number }
    tavily: { calls: number; cost: number }
  }
}

// In-memory store (for development)
// In production, use Vercel KV or Postgres
const costLogs: APICallLog[] = []

/**
 * Log an API call
 */
export function logAPICall(log: APICallLog): void {
  costLogs.push(log)

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('💰 Cost Tracker:', {
      service: log.service,
      model: log.model,
      cost: `$${log.estimatedCost.toFixed(6)}`,
      cached: log.cacheHit,
      success: log.success
    })
  }

  // Check if approaching budget threshold
  const dailyCost = calculateDailyCost()
  const DAILY_BUDGET_THRESHOLD = 3 // $3/day = $90/month

  if (dailyCost > DAILY_BUDGET_THRESHOLD) {
    logBudgetAlert('daily', dailyCost, DAILY_BUDGET_THRESHOLD)
  }
}

/**
 * Calculate Claude API cost
 */
export function calculateClaudeCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  model: 'haiku' | 'sonnet'
): number {
  let inputCost: number
  let outputCost: number

  if (model === 'haiku') {
    // Haiku: $0.25/$1.25 per 1M tokens
    inputCost = (inputTokens / 1_000_000) * 0.25
    outputCost = (outputTokens / 1_000_000) * 1.25
  } else {
    // Sonnet: $3/$15 per 1M tokens
    inputCost = (inputTokens / 1_000_000) * 3.0
    outputCost = (outputTokens / 1_000_000) * 15.0
  }

  // Apply cache discount (90% off for cached tokens)
  const cachedCost = (cachedTokens / 1_000_000) * (model === 'haiku' ? 0.025 : 0.3)
  const regularInputCost = ((inputTokens - cachedTokens) / 1_000_000) * (model === 'haiku' ? 0.25 : 3.0)

  return cachedCost + regularInputCost + outputCost
}

/**
 * Calculate Tavily API cost
 * $0.005 per request (Starter tier)
 */
export function calculateTavilyCost(cached: boolean): number {
  return cached ? 0 : 0.005
}

/**
 * Log Claude API call
 */
export function logClaudeCall(params: {
  model: 'haiku' | 'sonnet'
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  cacheHit: boolean
  userId?: string
  queryId?: string
  success: boolean
  error?: string
}): void {
  const cost = calculateClaudeCost(
    params.inputTokens,
    params.outputTokens,
    params.cachedTokens,
    params.model
  )

  logAPICall({
    timestamp: Date.now(),
    service: 'claude',
    model: params.model,
    endpoint: '/api/ai/chat',
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cachedTokens: params.cachedTokens,
    cacheHit: params.cacheHit,
    estimatedCost: cost,
    userId: params.userId,
    queryId: params.queryId,
    success: params.success,
    error: params.error
  })
}

/**
 * Log Tavily API call
 */
export function logTavilyCall(params: {
  cached: boolean
  userId?: string
  queryId?: string
  success: boolean
  error?: string
}): void {
  const cost = calculateTavilyCost(params.cached)

  logAPICall({
    timestamp: Date.now(),
    service: 'tavily',
    endpoint: '/api/documentation/research',
    cacheHit: params.cached,
    estimatedCost: cost,
    userId: params.userId,
    queryId: params.queryId,
    success: params.success,
    error: params.error
  })
}

/**
 * Calculate total cost for a time period
 */
export function calculateCostForPeriod(
  startTime: number,
  endTime: number
): CostSummary {
  const logs = costLogs.filter(
    log => log.timestamp >= startTime && log.timestamp <= endTime
  )

  const totalCost = logs.reduce((sum, log) => sum + log.estimatedCost, 0)
  const claudeCost = logs
    .filter(log => log.service === 'claude')
    .reduce((sum, log) => sum + log.estimatedCost, 0)
  const tavilyCost = logs
    .filter(log => log.service === 'tavily')
    .reduce((sum, log) => sum + log.estimatedCost, 0)

  const cacheableLogs = logs.filter(log => log.cachedTokens !== undefined || log.service === 'tavily')
  const cacheHits = cacheableLogs.filter(log => log.cacheHit).length
  const cacheHitRate = cacheableLogs.length > 0 ? cacheHits / cacheableLogs.length : 0

  const haikuLogs = logs.filter(log => log.model === 'haiku')
  const sonnetLogs = logs.filter(log => log.model === 'sonnet')
  const tavilyLogs = logs.filter(log => log.service === 'tavily')

  return {
    period: getPeriodType(startTime, endTime),
    totalCost,
    claudeCost,
    tavilyCost,
    callCount: logs.length,
    cacheHitRate,
    averageCostPerCall: logs.length > 0 ? totalCost / logs.length : 0,
    breakdown: {
      haiku: {
        calls: haikuLogs.length,
        cost: haikuLogs.reduce((sum, log) => sum + log.estimatedCost, 0)
      },
      sonnet: {
        calls: sonnetLogs.length,
        cost: sonnetLogs.reduce((sum, log) => sum + log.estimatedCost, 0)
      },
      tavily: {
        calls: tavilyLogs.length,
        cost: tavilyLogs.reduce((sum, log) => sum + log.estimatedCost, 0)
      }
    }
  }
}

/**
 * Get period type based on time range
 */
function getPeriodType(startTime: number, endTime: number): 'daily' | 'weekly' | 'monthly' {
  const duration = endTime - startTime
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay

  if (duration <= oneDay) return 'daily'
  if (duration <= oneWeek) return 'weekly'
  return 'monthly'
}

/**
 * Calculate daily cost (last 24 hours)
 */
export function calculateDailyCost(): number {
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const summary = calculateCostForPeriod(oneDayAgo, now)
  return summary.totalCost
}

/**
 * Calculate weekly cost (last 7 days)
 */
export function calculateWeeklyCost(): number {
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const summary = calculateCostForPeriod(oneWeekAgo, now)
  return summary.totalCost
}

/**
 * Calculate monthly cost (last 30 days)
 */
export function calculateMonthlyCost(): number {
  const now = Date.now()
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
  const summary = calculateCostForPeriod(oneMonthAgo, now)
  return summary.totalCost
}

/**
 * Get cost summary for all periods
 */
export function getAllCostSummaries(): {
  daily: CostSummary
  weekly: CostSummary
  monthly: CostSummary
} {
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

  return {
    daily: calculateCostForPeriod(oneDayAgo, now),
    weekly: calculateCostForPeriod(oneWeekAgo, now),
    monthly: calculateCostForPeriod(oneMonthAgo, now)
  }
}

/**
 * Export cost logs to JSON (for analysis)
 */
export function exportCostLogs(
  startTime?: number,
  endTime?: number
): APICallLog[] {
  if (!startTime && !endTime) {
    return [...costLogs]
  }

  return costLogs.filter(log => {
    if (startTime && log.timestamp < startTime) return false
    if (endTime && log.timestamp > endTime) return false
    return true
  })
}

/**
 * Clear old logs (keep last 30 days)
 */
export function cleanupOldLogs(): void {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const validLogs = costLogs.filter(log => log.timestamp >= thirtyDaysAgo)

  // Clear and repopulate
  costLogs.length = 0
  costLogs.push(...validLogs)

  if (process.env.NODE_ENV === 'development') {
    console.log(`🧹 Cleaned up old logs. Kept ${validLogs.length} logs from last 30 days.`)
  }
}

/**
 * Log budget alert
 */
function logBudgetAlert(
  period: 'daily' | 'weekly' | 'monthly',
  actual: number,
  threshold: number
): void {
  console.warn(`⚠️ Budget Alert: ${period} cost $${actual.toFixed(2)} exceeds threshold $${threshold.toFixed(2)}`)

  // In production, send email or webhook notification
  if (process.env.COST_ALERT_WEBHOOK) {
    fetch(process.env.COST_ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert: 'cost_threshold_exceeded',
        period,
        actualCost: actual,
        threshold,
        timestamp: Date.now()
      })
    }).catch(console.error)
  }
}

/**
 * Get cost projections based on current usage
 */
export function getProjections(): {
  dailyProjected: number
  monthlyProjected: number
  onTrackFor: 'under' | 'over' | 'on_target'
  targetBudget: number
} {
  const dailyCost = calculateDailyCost()
  const monthlyProjected = dailyCost * 30
  const targetBudget = 87 // From COST_OPTIMIZATION_ANALYSIS.md

  let onTrackFor: 'under' | 'over' | 'on_target'
  if (monthlyProjected < targetBudget * 0.9) {
    onTrackFor = 'under'
  } else if (monthlyProjected > targetBudget * 1.1) {
    onTrackFor = 'over'
  } else {
    onTrackFor = 'on_target'
  }

  return {
    dailyProjected: dailyCost,
    monthlyProjected,
    onTrackFor,
    targetBudget
  }
}
