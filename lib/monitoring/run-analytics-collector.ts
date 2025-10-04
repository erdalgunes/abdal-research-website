#!/usr/bin/env tsx
/**
 * Analytics Collector Runner
 *
 * Collects website analytics and user behavior patterns
 */

import { collectAnalytics, mapAnalyticsToGaps } from './analytics-collector'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('📊 Running Website Analytics Collector...\n')

  const startTime = Date.now()

  // Collect analytics
  const analytics = await collectAnalytics()
  const duration = Date.now() - startTime

  // Map to content gaps
  const contentGaps = mapAnalyticsToGaps(analytics)

  // Summary statistics
  const summary = {
    total_sections: Object.keys(analytics.section_engagement).length,
    high_traffic_sections: Object.entries(analytics.section_engagement)
      .filter(([_, stats]) => stats.views > 200)
      .length,
    problem_sections: analytics.high_bounce_sections.length,
    chat_patterns: analytics.chat_confusion_patterns.length,
    failed_searches: analytics.failed_searches.length,
    content_gaps_identified: contentGaps.length
  }

  console.log('✅ Analytics collection complete!\n')
  console.log(`📈 Summary:`)
  console.log(`   Sections analyzed: ${summary.total_sections}`)
  console.log(`   High-traffic sections: ${summary.high_traffic_sections}`)
  console.log(`   Problem sections (high bounce): ${summary.problem_sections}`)
  console.log(`   Chat confusion patterns: ${summary.chat_patterns}`)
  console.log(`   Failed searches: ${summary.failed_searches}`)
  console.log(`   Content gaps identified: ${summary.content_gaps_identified}`)
  console.log()

  // Show top engagement sections
  const topSections = Object.entries(analytics.section_engagement)
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 5)

  console.log('🔝 Top 5 Sections by Views:\n')
  topSections.forEach(([section, stats], index) => {
    console.log(`${index + 1}. ${section}`)
    console.log(`   Views: ${stats.views}`)
    console.log(`   Avg time: ${stats.avg_time_seconds}s`)
    console.log(`   Scroll depth: ${(stats.scroll_depth_avg * 100).toFixed(0)}%`)
    console.log(`   Bounce rate: ${(stats.bounce_rate * 100).toFixed(0)}%`)
    console.log()
  })

  // Show problem sections
  if (analytics.high_bounce_sections.length > 0) {
    console.log('⚠️  Problem Sections (High Bounce Rate):\n')
    analytics.high_bounce_sections.slice(0, 3).forEach(section => {
      const stats = analytics.section_engagement[section]
      console.log(`- ${section}`)
      console.log(`  Bounce: ${(stats.bounce_rate * 100).toFixed(0)}%, Scroll: ${(stats.scroll_depth_avg * 100).toFixed(0)}%`)
      console.log()
    })
  }

  // Show top chat confusion patterns
  if (analytics.chat_confusion_patterns.length > 0) {
    console.log('💬 Top User Confusion Patterns:\n')
    analytics.chat_confusion_patterns.slice(0, 5).forEach((pattern, index) => {
      console.log(`${index + 1}. "${pattern.query}" (asked ${pattern.frequency} times)`)
      console.log(`   Section: ${pattern.section || 'unknown'}`)
      console.log(`   Suggests: ${pattern.suggests}`)
      console.log()
    })
  }

  // Show content gaps
  if (contentGaps.length > 0) {
    console.log('🔍 Content Gaps Identified:\n')
    contentGaps.slice(0, 5).forEach((gap, index) => {
      console.log(`${index + 1}. [${gap.type.toUpperCase()}] ${gap.section}`)
      console.log(`   Evidence: ${gap.evidence}`)
      console.log(`   Priority: ${gap.priority}`)
      console.log()
    })
  }

  // Create output directory
  const parentDir = join(process.cwd(), '..')
  const insightsDir = join(parentDir, '.ai-insights')
  if (!existsSync(insightsDir)) {
    await mkdir(insightsDir, { recursive: true })
  }

  // Write output
  const outputPath = join(insightsDir, 'user-behavior.json')
  const output = {
    generated_at: new Date().toISOString(),
    collection_duration_ms: duration,
    period: analytics.period,
    summary,
    section_engagement: analytics.section_engagement,
    chat_confusion_patterns: analytics.chat_confusion_patterns,
    failed_searches: analytics.failed_searches,
    high_bounce_sections: analytics.high_bounce_sections,
    low_completion_sections: analytics.low_completion_sections,
    content_gaps: contentGaps
  }

  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`💾 Results saved to: ${outputPath}`)
  console.log(`⏱️  Collection took ${duration}ms\n`)

  if (contentGaps.length > 5) {
    console.log(`⚠️  WARNING: ${contentGaps.length} content gaps identified from user behavior`)
  } else {
    console.log('✨ User behavior analysis complete!')
  }

  process.exit(0)
}

main().catch(error => {
  console.error('❌ Error running analytics collector:', error)
  process.exit(1)
})
