#!/usr/bin/env tsx
/**
 * Research Quality Analyzer Runner
 *
 * Scans all Typst papers in the parent repository and outputs gaps to .ai-insights/
 */

import { analyzeRepository } from './research-analyzer'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🔍 Running Research Quality Analyzer...\n')

  // Define papers to analyze (relative to parent repo)
  const parentDir = join(process.cwd(), '..')
  const papers = [
    {
      typst: join(parentDir, 'sacred_madness.typ'),
      bib: join(parentDir, 'sacred_madness.bib')
    },
    {
      typst: join(parentDir, 'abdal-continuity-paper', 'paper.typ'),
      bib: join(parentDir, 'abdal-continuity-paper', 'references.bib')
    }
  ]

  // Filter to only existing files
  const existingPapers = papers.filter(p => existsSync(p.typst))

  console.log(`📄 Analyzing ${existingPapers.length} papers:\n`)
  existingPapers.forEach(p => console.log(`   - ${p.typst}`))
  console.log()

  // Run analysis
  const startTime = Date.now()
  const gaps = await analyzeRepository(existingPapers)
  const duration = Date.now() - startTime

  // Summary by type
  const summary = {
    total: gaps.length,
    by_type: {
      weak_argument: gaps.filter(g => g.type === 'weak_argument').length,
      broken_reference: gaps.filter(g => g.type === 'broken_reference').length,
      outdated_reference: gaps.filter(g => g.type === 'outdated_reference').length,
      missing_citation: gaps.filter(g => g.type === 'missing_citation').length
    },
    by_severity: {
      critical: gaps.filter(g => g.severity === 'critical').length,
      high: gaps.filter(g => g.severity === 'high').length,
      medium: gaps.filter(g => g.severity === 'medium').length,
      low: gaps.filter(g => g.severity === 'low').length
    }
  }

  console.log('✅ Analysis complete!\n')
  console.log(`📊 Summary:`)
  console.log(`   Total gaps found: ${summary.total}`)
  console.log(`   - Weak arguments: ${summary.by_type.weak_argument}`)
  console.log(`   - Broken references: ${summary.by_type.broken_reference}`)
  console.log(`   - Outdated references: ${summary.by_type.outdated_reference}`)
  console.log(`   - Missing citations: ${summary.by_type.missing_citation}`)
  console.log()
  console.log(`⚠️  Severity breakdown:`)
  console.log(`   - Critical: ${summary.by_severity.critical}`)
  console.log(`   - High: ${summary.by_severity.high}`)
  console.log(`   - Medium: ${summary.by_severity.medium}`)
  console.log(`   - Low: ${summary.by_severity.low}`)
  console.log()
  console.log(`⏱️  Analysis took ${duration}ms\n`)

  // Create output directory
  const insightsDir = join(parentDir, '.ai-insights')
  if (!existsSync(insightsDir)) {
    await mkdir(insightsDir, { recursive: true })
  }

  // Write output
  const outputPath = join(insightsDir, 'research-gaps.json')
  const output = {
    generated_at: new Date().toISOString(),
    analysis_duration_ms: duration,
    papers_analyzed: existingPapers.map(p => p.typst),
    summary,
    gaps
  }

  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`💾 Results saved to: ${outputPath}`)

  // Show top 5 high-priority gaps
  const highPriority = gaps
    .filter(g => g.severity === 'critical' || g.severity === 'high')
    .slice(0, 5)

  if (highPriority.length > 0) {
    console.log(`\n🔴 Top ${highPriority.length} High-Priority Gaps:\n`)

    highPriority.forEach((gap, index) => {
      console.log(`${index + 1}. [${gap.severity.toUpperCase()}] ${gap.type}`)
      console.log(`   File: ${gap.file}:${gap.line}`)
      console.log(`   Section: ${gap.section}`)
      console.log(`   Context: ${gap.context.slice(0, 80)}...`)
      console.log(`   Action: ${gap.suggested_action}`)
      console.log()
    })
  }

  // Exit with error code if critical gaps found
  if (summary.by_severity.critical > 0) {
    console.log(`⚠️  WARNING: ${summary.by_severity.critical} critical gaps require immediate attention`)
    process.exit(1)
  } else {
    console.log('✨ No critical gaps found!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error running analyzer:', error)
  process.exit(1)
})
