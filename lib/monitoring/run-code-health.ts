#!/usr/bin/env tsx
/**
 * Code Health Monitor Runner
 *
 * Analyzes codebase health and performance metrics
 */

import { analyzeCodeHealth } from './code-health'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🏥 Running Code Health Monitor...\n')

  const startTime = Date.now()

  // Run analysis
  const report = await analyzeCodeHealth()
  const duration = Date.now() - startTime

  console.log('\n✅ Code health analysis complete!\n')

  // Display bundle analysis
  console.log('📦 Bundle Analysis:')
  console.log(`   Main bundle: ${(report.bundle_analysis.main_bundle_size / 1000).toFixed(0)}KB`)
  console.log(`   Threshold: ${(report.bundle_analysis.threshold / 1000).toFixed(0)}KB`)
  console.log(`   Status: ${report.bundle_analysis.status}`)

  if (report.bundle_analysis.largest_dependencies.length > 0) {
    console.log('\n   Largest dependencies:')
    report.bundle_analysis.largest_dependencies.slice(0, 5).forEach((dep, index) => {
      console.log(`   ${index + 1}. ${dep.name}: ${(dep.size / 1000).toFixed(0)}KB (${dep.percentage.toFixed(1)}%)`)
    })
  }
  console.log()

  // Display cache performance
  console.log('💾 Cache Performance:')
  console.log(`   Prompt cache hit rate: ${(report.cache_performance.prompt_cache_hit_rate * 100).toFixed(0)}%`)
  console.log(`   Tavily cache hit rate: ${(report.cache_performance.tavily_cache_hit_rate * 100).toFixed(0)}%`)
  console.log(`   Monthly cost savings: $${report.cache_performance.cost_savings_monthly.toFixed(2)}`)
  console.log(`   Efficiency score: ${(report.cache_performance.cache_efficiency_score * 100).toFixed(0)}%`)
  console.log()

  // Display dependency health
  console.log('📚 Dependency Health:')
  console.log(`   Total dependencies: ${report.dependency_health.total_dependencies}`)
  console.log(`   Outdated: ${report.dependency_health.outdated_count}`)
  console.log(`   Vulnerable: ${report.dependency_health.vulnerable_count}`)
  console.log(`   Unused: ${report.dependency_health.unused_count}`)

  if (report.dependency_health.largest_dependencies.length > 0) {
    console.log('\n   Largest dependencies:')
    report.dependency_health.largest_dependencies.slice(0, 5).forEach((dep, index) => {
      console.log(`   ${index + 1}. ${dep.name}: ${dep.size_mb.toFixed(1)}MB`)
    })
  }
  console.log()

  // Display code quality
  console.log('📝 Code Quality:')
  console.log(`   Total files: ${report.code_quality.total_files}`)
  console.log(`   Total lines: ${report.code_quality.total_lines.toLocaleString()}`)
  console.log(`   TypeScript coverage: ${(report.code_quality.typescript_coverage * 100).toFixed(0)}%`)
  console.log(`   Code duplication: ${report.code_quality.duplication_percentage.toFixed(0)}%`)

  if (report.code_quality.complexity_hotspots.length > 0) {
    console.log('\n   Complexity hotspots:')
    report.code_quality.complexity_hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(`   ${index + 1}. ${hotspot.file}: complexity ${hotspot.complexity} (${hotspot.lines} lines)`)
    })
  }
  console.log()

  // Display recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:\n')
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`)
    })
    console.log()
  }

  // Create output directory
  const parentDir = join(process.cwd(), '..')
  const insightsDir = join(parentDir, '.ai-insights')
  if (!existsSync(insightsDir)) {
    await mkdir(insightsDir, { recursive: true })
  }

  // Write output
  const outputPath = join(insightsDir, 'code-health.json')
  const output = {
    ...report,
    analysis_duration_ms: duration
  }

  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`💾 Results saved to: ${outputPath}`)
  console.log(`⏱️  Analysis took ${duration}ms\n`)

  // Exit with error if critical issues found
  const hasCriticalIssues = report.recommendations.some(rec => rec.includes('🔴 CRITICAL'))

  if (hasCriticalIssues) {
    console.log('⚠️  WARNING: Critical code health issues detected')
    process.exit(1)
  } else {
    console.log('✨ Code health check passed!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error running code health monitor:', error)
  process.exit(1)
})
