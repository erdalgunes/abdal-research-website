/**
 * Website Analytics Collector
 *
 * Tracks user behavior patterns to identify content gaps:
 * - AI chat queries (confusion patterns)
 * - Section engagement (scroll depth, time spent)
 * - Failed searches (missing content)
 * - Page abandonment (low completion rates)
 *
 * Part of Layer 1: Perception & Monitoring
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export interface ChatQuery {
  query: string
  timestamp: number
  section?: string
  resolved: boolean
}

export interface SectionEngagement {
  section: string
  views: number
  avg_time_seconds: number
  scroll_depth_avg: number
  bounce_rate: number
  completion_rate: number
}

export interface SearchPattern {
  query: string
  attempts: number
  success_rate: number
  suggests: 'missing_content' | 'unclear_navigation' | 'terminology_gap'
}

export interface UserBehaviorAnalysis {
  period: string
  section_engagement: Record<string, SectionEngagement>
  chat_confusion_patterns: Array<{
    query: string
    frequency: number
    section?: string
    suggests: string
  }>
  failed_searches: SearchPattern[]
  high_bounce_sections: string[]
  low_completion_sections: string[]
}

/**
 * Analyze chat queries to identify confusion patterns
 */
export function analyzeChatQueries(queries: ChatQuery[]): Array<{
  query: string
  frequency: number
  section?: string
  suggests: string
}> {
  // Group similar queries
  const queryGroups = new Map<string, ChatQuery[]>()

  queries.forEach(q => {
    const normalized = normalizeQuery(q.query)
    const existing = queryGroups.get(normalized) || []
    existing.push(q)
    queryGroups.set(normalized, existing)
  })

  const patterns: Array<{
    query: string
    frequency: number
    section?: string
    suggests: string
  }> = []

  // Identify frequently asked questions (suggests missing/unclear content)
  queryGroups.forEach((group, normalizedQuery) => {
    if (group.length >= 3) { // Asked 3+ times = pattern
      const mostCommonSection = findMostCommonSection(group)
      const suggestion = inferSuggestion(normalizedQuery, group)

      patterns.push({
        query: normalizedQuery,
        frequency: group.length,
        section: mostCommonSection,
        suggests: suggestion
      })
    }
  })

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[?!.,]/g, '')
    .replace(/\s+/g, ' ')
}

function findMostCommonSection(queries: ChatQuery[]): string | undefined {
  const sectionCounts = new Map<string, number>()

  queries.forEach(q => {
    if (q.section) {
      sectionCounts.set(q.section, (sectionCounts.get(q.section) || 0) + 1)
    }
  })

  if (sectionCounts.size === 0) return undefined

  return Array.from(sectionCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0]
}

function inferSuggestion(query: string, queries: ChatQuery[]): string {
  const lower = query.toLowerCase()

  // Definition requests
  if (/what (is|are|does|mean)/.test(lower)) {
    return 'missing_definition'
  }

  // Explanation requests
  if (/why|how (do|does)/.test(lower)) {
    return 'insufficient_explanation'
  }

  // Comparison requests
  if (/difference between|compare/.test(lower)) {
    return 'missing_comparison'
  }

  // Example requests
  if (/example|instance/.test(lower)) {
    return 'needs_examples'
  }

  // Many unresolved queries = confusing content
  const unresolvedRate = queries.filter(q => !q.resolved).length / queries.length
  if (unresolvedRate > 0.7) {
    return 'confusing_content'
  }

  return 'general_confusion'
}

/**
 * Identify sections with high bounce rates (users leave quickly)
 */
export function identifyHighBounceSections(
  engagement: Record<string, SectionEngagement>,
  threshold: number = 0.5
): string[] {
  return Object.entries(engagement)
    .filter(([_, stats]) => stats.bounce_rate > threshold)
    .sort((a, b) => b[1].bounce_rate - a[1].bounce_rate)
    .map(([section, _]) => section)
}

/**
 * Identify sections with low scroll depth (users don't read fully)
 */
export function identifyLowCompletionSections(
  engagement: Record<string, SectionEngagement>,
  threshold: number = 0.5
): string[] {
  return Object.entries(engagement)
    .filter(([_, stats]) => stats.scroll_depth_avg < threshold)
    .sort((a, b) => a[1].scroll_depth_avg - b[1].scroll_depth_avg)
    .map(([section, _]) => section)
}

/**
 * Calculate user impact score for a section
 * Higher score = more users interact with this section
 */
export function calculateUserImpact(
  section: string,
  engagement: Record<string, SectionEngagement>,
  chatPatterns: Array<{ query: string; frequency: number; section?: string }>
): number {
  const sectionStats = engagement[section]
  if (!sectionStats) return 0

  // Page views (normalized to 0-1)
  const viewScore = Math.min(sectionStats.views / 100, 1.0)

  // Chat mentions about this section
  const chatMentions = chatPatterns
    .filter(p => p.section === section)
    .reduce((sum, p) => sum + p.frequency, 0)
  const chatScore = Math.min(chatMentions / 10, 1.0)

  // High bounce = problem area (increases impact)
  const bounceScore = sectionStats.bounce_rate > 0.5 ? 0.8 : 0.2

  // Low scroll depth = confusion (increases impact)
  const scrollScore = sectionStats.scroll_depth_avg < 0.5 ? 0.8 : 0.2

  return (viewScore * 0.4) + (chatScore * 0.3) + (bounceScore * 0.15) + (scrollScore * 0.15)
}

/**
 * Mock function to simulate Vercel Analytics data
 * In production, this would query Vercel Analytics API
 */
export async function fetchVercelAnalytics(
  startDate: Date,
  endDate: Date
): Promise<UserBehaviorAnalysis> {
  // This is a mock - in production, use Vercel Analytics API
  // https://vercel.com/docs/analytics/api

  console.log('⚠️  Using mock analytics data (Vercel Analytics not configured)')

  // Mock data based on typical academic website patterns
  const mockEngagement: Record<string, SectionEngagement> = {
    'chapter-1-introduction': {
      section: 'chapter-1-introduction',
      views: 342,
      avg_time_seconds: 187,
      scroll_depth_avg: 0.78,
      bounce_rate: 0.23,
      completion_rate: 0.72
    },
    'chapter-2-byzantine-saloi': {
      section: 'chapter-2-byzantine-saloi',
      views: 289,
      avg_time_seconds: 245,
      scroll_depth_avg: 0.68,
      bounce_rate: 0.31,
      completion_rate: 0.65
    },
    'chapter-2-sufi-parallels': {
      section: 'chapter-2-sufi-parallels',
      views: 156,
      avg_time_seconds: 123,
      scroll_depth_avg: 0.45,
      bounce_rate: 0.58,
      completion_rate: 0.42
    },
    'abdal-continuity-introduction': {
      section: 'abdal-continuity-introduction',
      views: 98,
      avg_time_seconds: 156,
      scroll_depth_avg: 0.82,
      bounce_rate: 0.19,
      completion_rate: 0.81
    }
  }

  const mockChatPatterns = [
    {
      query: 'what does wahdat al-wujud mean',
      frequency: 12,
      section: 'chapter-2-sufi-parallels',
      suggests: 'missing_definition'
    },
    {
      query: 'difference between saloi and yurodivye',
      frequency: 8,
      section: 'chapter-2-byzantine-saloi',
      suggests: 'missing_comparison'
    },
    {
      query: 'examples of holy foolishness',
      frequency: 6,
      section: 'chapter-1-introduction',
      suggests: 'needs_examples'
    },
    {
      query: 'what is kenosis',
      frequency: 5,
      section: 'chapter-1-introduction',
      suggests: 'missing_definition'
    }
  ]

  const mockSearches: SearchPattern[] = [
    {
      query: 'Hızır Elijah syncretism',
      attempts: 5,
      success_rate: 0.2,
      suggests: 'missing_content'
    },
    {
      query: 'Abdalan Rum practices',
      attempts: 3,
      success_rate: 0.33,
      suggests: 'unclear_navigation'
    }
  ]

  return {
    period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    section_engagement: mockEngagement,
    chat_confusion_patterns: mockChatPatterns,
    failed_searches: mockSearches,
    high_bounce_sections: identifyHighBounceSections(mockEngagement, 0.5),
    low_completion_sections: identifyLowCompletionSections(mockEngagement, 0.5)
  }
}

/**
 * Load chat logs from cost tracker
 * In production, query from database or logs
 */
export async function loadChatLogs(): Promise<ChatQuery[]> {
  // This would query actual logs in production
  // For now, return mock data

  console.log('⚠️  Using mock chat logs (database not configured)')

  return [
    {
      query: 'What does wahdat al-wujud mean?',
      timestamp: Date.now() - 3600000,
      section: 'chapter-2-sufi-parallels',
      resolved: true
    },
    {
      query: 'What is the difference between saloi and yurodivye?',
      timestamp: Date.now() - 7200000,
      section: 'chapter-2-byzantine-saloi',
      resolved: true
    },
    {
      query: 'Give me examples of holy foolishness',
      timestamp: Date.now() - 10800000,
      section: 'chapter-1-introduction',
      resolved: false
    }
  ]
}

/**
 * Main analytics collection function
 */
export async function collectAnalytics(): Promise<UserBehaviorAnalysis> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7) // Last 7 days

  // Fetch analytics data
  const analytics = await fetchVercelAnalytics(startDate, endDate)

  // Enhance with chat logs if available
  try {
    const chatLogs = await loadChatLogs()
    const chatPatterns = analyzeChatQueries(chatLogs)

    // Merge with existing patterns
    analytics.chat_confusion_patterns.push(...chatPatterns)
  } catch (error) {
    console.warn('Could not load chat logs:', error)
  }

  return analytics
}

/**
 * Map analytics insights to research gaps
 */
export function mapAnalyticsToGaps(
  analytics: UserBehaviorAnalysis
): Array<{
  type: 'missing_definition' | 'missing_comparison' | 'missing_content' | 'confusing_content'
  section: string
  evidence: string
  priority: number
}> {
  const gaps: Array<{
    type: 'missing_definition' | 'missing_comparison' | 'missing_content' | 'confusing_content'
    section: string
    evidence: string
    priority: number
  }> = []

  // Chat confusion patterns → content gaps
  analytics.chat_confusion_patterns.forEach(pattern => {
    if (pattern.section) {
      const type = pattern.suggests.includes('definition')
        ? 'missing_definition'
        : pattern.suggests.includes('comparison')
        ? 'missing_comparison'
        : pattern.suggests.includes('content')
        ? 'missing_content'
        : 'confusing_content'

      gaps.push({
        type,
        section: pattern.section,
        evidence: `Users asked "${pattern.query}" ${pattern.frequency} times`,
        priority: pattern.frequency
      })
    }
  })

  // High bounce + low scroll = confusing content
  analytics.high_bounce_sections.forEach(section => {
    const stats = analytics.section_engagement[section]
    if (stats && stats.scroll_depth_avg < 0.5) {
      gaps.push({
        type: 'confusing_content',
        section,
        evidence: `${(stats.bounce_rate * 100).toFixed(0)}% bounce rate, ${(stats.scroll_depth_avg * 100).toFixed(0)}% scroll depth`,
        priority: Math.round(stats.views * stats.bounce_rate)
      })
    }
  })

  // Failed searches → missing content
  analytics.failed_searches.forEach(search => {
    gaps.push({
      type: 'missing_content',
      section: 'unknown',
      evidence: `Search "${search.query}" failed ${search.attempts} times (${(search.success_rate * 100).toFixed(0)}% success)`,
      priority: search.attempts
    })
  })

  return gaps.sort((a, b) => b.priority - a.priority)
}
