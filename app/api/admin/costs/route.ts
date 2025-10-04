import { NextResponse } from 'next/server'
import { APIErrorHandler, validateOrigin } from '@/lib/api-error-handler'
import {
  getAllCostSummaries,
  getProjections,
  exportCostLogs,
  cleanupOldLogs
} from '@/lib/cost-tracker'
import { getCacheStats } from '@/lib/tavily-cache'

/**
 * Admin Cost Monitoring Endpoint
 *
 * Provides real-time cost analytics and projections:
 * - Daily/weekly/monthly cost summaries
 * - Cache hit rates (Claude + Tavily)
 * - Model usage breakdown (Haiku vs Sonnet)
 * - Budget projections
 * - Cost logs export
 *
 * Protected by ADMIN_API_KEY environment variable
 */
export async function GET(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Admin authentication via API key
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY

    if (!adminKey) {
      throw APIErrorHandler.createError('Admin endpoint not configured', 503, 'SERVICE_UNAVAILABLE')
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw APIErrorHandler.createError('Missing authorization header', 401, 'UNAUTHORIZED')
    }

    const providedKey = authHeader.substring(7) // Remove "Bearer "

    if (providedKey !== adminKey) {
      throw APIErrorHandler.createError('Invalid API key', 403, 'FORBIDDEN')
    }

    // Get cost summaries
    const summaries = getAllCostSummaries()
    const projections = getProjections()
    const tavilyCache = getCacheStats()

    // Cleanup old logs (optional query param)
    const url = new URL(request.url)
    if (url.searchParams.get('cleanup') === 'true') {
      cleanupOldLogs()
    }

    return NextResponse.json({
      status: 'success',
      timestamp: Date.now(),
      costs: {
        daily: {
          total: summaries.daily.totalCost,
          claude: summaries.daily.claudeCost,
          tavily: summaries.daily.tavilyCost,
          callCount: summaries.daily.callCount,
          cacheHitRate: summaries.daily.cacheHitRate,
          averageCostPerCall: summaries.daily.averageCostPerCall,
          breakdown: summaries.daily.breakdown
        },
        weekly: {
          total: summaries.weekly.totalCost,
          claude: summaries.weekly.claudeCost,
          tavily: summaries.weekly.tavilyCost,
          callCount: summaries.weekly.callCount,
          cacheHitRate: summaries.weekly.cacheHitRate,
          averageCostPerCall: summaries.weekly.averageCostPerCall,
          breakdown: summaries.weekly.breakdown
        },
        monthly: {
          total: summaries.monthly.totalCost,
          claude: summaries.monthly.claudeCost,
          tavily: summaries.monthly.tavilyCost,
          callCount: summaries.monthly.callCount,
          cacheHitRate: summaries.monthly.cacheHitRate,
          averageCostPerCall: summaries.monthly.averageCostPerCall,
          breakdown: summaries.monthly.breakdown
        }
      },
      projections: {
        dailyAverage: projections.dailyProjected,
        monthlyProjected: projections.monthlyProjected,
        targetBudget: projections.targetBudget,
        status: projections.onTrackFor,
        remainingBudget: projections.targetBudget - projections.monthlyProjected,
        percentOfBudget: (projections.monthlyProjected / projections.targetBudget) * 100
      },
      cache: {
        tavily: {
          size: tavilyCache.size,
          oldestEntryAge: tavilyCache.oldestEntry,
          newestEntryAge: tavilyCache.newestEntry
        }
      },
      meta: {
        period: 'real-time',
        calculatedAt: new Date().toISOString()
      }
    })

  }, 'Admin Costs API')
}

/**
 * Export cost logs (POST with date range)
 */
export async function POST(request: Request) {
  return APIErrorHandler.withErrorHandling(async () => {
    // Validate origin
    if (!validateOrigin(request)) {
      throw APIErrorHandler.createError('Forbidden origin', 403, 'INVALID_ORIGIN')
    }

    // Admin authentication
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY

    if (!adminKey) {
      throw APIErrorHandler.createError('Admin endpoint not configured', 503, 'SERVICE_UNAVAILABLE')
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw APIErrorHandler.createError('Missing authorization header', 401, 'UNAUTHORIZED')
    }

    const providedKey = authHeader.substring(7)

    if (providedKey !== adminKey) {
      throw APIErrorHandler.createError('Invalid API key', 403, 'FORBIDDEN')
    }

    // Parse request body
    const body = await request.json()
    const { startTime, endTime } = body

    // Validate time range
    if (startTime && typeof startTime !== 'number') {
      throw APIErrorHandler.createError('startTime must be a timestamp', 400, 'INVALID_PARAM')
    }

    if (endTime && typeof endTime !== 'number') {
      throw APIErrorHandler.createError('endTime must be a timestamp', 400, 'INVALID_PARAM')
    }

    // Export logs
    const logs = exportCostLogs(startTime, endTime)

    return NextResponse.json({
      status: 'success',
      logs,
      meta: {
        logCount: logs.length,
        startTime: startTime || 'beginning',
        endTime: endTime || 'now',
        exportedAt: new Date().toISOString()
      }
    })

  }, 'Admin Costs Export API')
}
