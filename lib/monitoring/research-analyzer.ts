/**
 * Research Quality Analyzer
 *
 * Scans Typst academic papers for research gaps:
 * - Missing citations (claims without supporting references)
 * - Weak arguments (high assertiveness, no evidence)
 * - Broken citation references (cited but not in .bib)
 * - Outdated references (>15 years old)
 *
 * Part of Layer 1: Perception & Monitoring
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export type GapType = 'missing_citation' | 'weak_argument' | 'broken_reference' | 'outdated_reference'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface ResearchGap {
  gap_id: string
  type: GapType
  file: string
  line: number
  section: string
  context: string
  claim?: string
  assertiveness?: number
  nearby_citations: string[]
  severity: Severity
  suggested_action: string
}

export interface Citation {
  key: string
  line: number
  page?: string
  context: string
}

export interface BibEntry {
  key: string
  type: string
  author?: string
  title?: string
  year?: string
  doi?: string
  isbn?: string
}

/**
 * Extract citations from Typst content
 * Matches patterns: @cite_key, @cite_key[page], @cite_key[pp. 23-45]
 */
export function extractCitations(content: string): Citation[] {
  const citations: Citation[] = []
  const lines = content.split('\n')

  // Regex for Typst citations: @cite_key or @cite_key[page info]
  const citationRegex = /@([a-zA-Z0-9_]+)(?:\[(.*?)\])?/g

  lines.forEach((line, index) => {
    let match
    while ((match = citationRegex.exec(line)) !== null) {
      citations.push({
        key: match[1],
        line: index + 1,
        page: match[2] || undefined,
        context: line.trim()
      })
    }
  })

  return citations
}

/**
 * Parse BibTeX file to extract entries
 * Simple parser for validation purposes
 */
export function parseBibTeX(content: string): Map<string, BibEntry> {
  const entries = new Map<string, BibEntry>()

  // Match @type{key, ...}
  const entryRegex = /@(\w+)\{([^,]+),/g
  let match

  while ((match = entryRegex.exec(content)) !== null) {
    const type = match[1]
    const key = match[2].trim()

    // Extract fields for this entry
    const entryStart = match.index
    const entryEnd = content.indexOf('\n}', entryStart)
    const entryContent = content.substring(entryStart, entryEnd)

    // Extract common fields
    const author = extractField(entryContent, 'author')
    const title = extractField(entryContent, 'title')
    const year = extractField(entryContent, 'year')
    const doi = extractField(entryContent, 'doi')
    const isbn = extractField(entryContent, 'isbn')

    entries.set(key, {
      key,
      type,
      author,
      title,
      year,
      doi,
      isbn
    })
  }

  return entries
}

function extractField(entryContent: string, field: string): string | undefined {
  const regex = new RegExp(`${field}\\s*=\\s*[{"]([^}"]+)[}"]`, 'i')
  const match = entryContent.match(regex)
  return match ? match[1].trim() : undefined
}

/**
 * Split content into sentences for analysis
 */
export function splitIntoSentences(text: string): string[] {
  // Simple sentence splitter (doesn't handle all edge cases)
  return text
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10) // Filter very short fragments
}

/**
 * Calculate assertiveness score for a sentence
 * Higher score = more definitive claim requiring citation
 */
export function calculateAssertiveness(sentence: string): number {
  const lower = sentence.toLowerCase()
  let score = 0.5 // Base score

  // Definitive language (increases assertiveness)
  const definitiveIndicators = [
    /\b(is|was|were|are)\b/,
    /\b(demonstrates?|shows?|proves?)\b/,
    /\b(clearly|obviously|undoubtedly)\b/,
    /\b(therefore|thus|consequently)\b/,
    /\b(always|never|all|none|every)\b/,
    /\b(most|primary|key|central|fundamental)\b/
  ]

  definitiveIndicators.forEach(pattern => {
    if (pattern.test(lower)) score += 0.15
  })

  // Hedging language (decreases assertiveness)
  const hedgingIndicators = [
    /\b(perhaps|possibly|maybe|might|may|could)\b/,
    /\b(suggests?|indicates?|implies?)\b/,
    /\b(seems?|appears?)\b/,
    /\b(likely|probably|presumably)\b/,
    /\b(some|many|often|sometimes)\b/
  ]

  hedgingIndicators.forEach(pattern => {
    if (pattern.test(lower)) score -= 0.15
  })

  // Causal claims (increases assertiveness)
  if (/\b(because|since|due to|caused by)\b/.test(lower)) {
    score += 0.2
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Check if a sentence has nearby citations
 */
export function hasNearbyCitation(
  sentences: string[],
  index: number,
  radius: number = 2
): boolean {
  const start = Math.max(0, index - radius)
  const end = Math.min(sentences.length, index + radius + 1)

  for (let i = start; i < end; i++) {
    if (/@[a-zA-Z0-9_]+/.test(sentences[i])) {
      return true
    }
  }

  return false
}

/**
 * Extract section name from Typst content based on line number
 */
export function extractSection(content: string, lineNumber: number): string {
  const lines = content.split('\n')

  // Find the most recent heading before this line
  for (let i = lineNumber - 1; i >= 0; i--) {
    const line = lines[i]

    // Typst headings: = Heading, == Subheading, === Subsubheading
    const headingMatch = line.match(/^(={1,3})\s+(.+)$/)
    if (headingMatch) {
      return headingMatch[2].trim()
    }
  }

  return 'Unknown Section'
}

/**
 * Detect weak arguments (claims without supporting citations)
 */
export function detectWeakArguments(
  content: string,
  filePath: string
): ResearchGap[] {
  const gaps: ResearchGap[] = []
  const sentences = splitIntoSentences(content)
  const lines = content.split('\n')

  sentences.forEach((sentence, index) => {
    const assertiveness = calculateAssertiveness(sentence)
    const hasCitation = hasNearbyCitation(sentences, index, 2)

    // High assertiveness without citation = weak argument
    if (assertiveness > 0.7 && !hasCitation) {
      // Find line number in original content
      const lineNumber = findLineNumber(lines, sentence)
      const section = extractSection(content, lineNumber)

      const severity: Severity = assertiveness > 0.85 ? 'high' : 'medium'

      gaps.push({
        gap_id: `${filePath}:${lineNumber}:weak-argument`,
        type: 'weak_argument',
        file: filePath,
        line: lineNumber,
        section,
        context: sentence,
        claim: sentence,
        assertiveness,
        nearby_citations: [],
        severity,
        suggested_action: 'Add supporting citation or soften claim language'
      })
    }
  })

  return gaps
}

function findLineNumber(lines: string[], sentence: string): number {
  const cleaned = sentence.slice(0, 50) // First 50 chars

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(cleaned)) {
      return i + 1
    }
  }

  return 1
}

/**
 * Detect broken citation references
 */
export function detectBrokenReferences(
  typstCitations: Citation[],
  bibEntries: Map<string, BibEntry>,
  filePath: string,
  content: string
): ResearchGap[] {
  const gaps: ResearchGap[] = []

  typstCitations.forEach(citation => {
    if (!bibEntries.has(citation.key)) {
      const section = extractSection(content, citation.line)

      gaps.push({
        gap_id: `${filePath}:${citation.line}:broken-reference`,
        type: 'broken_reference',
        file: filePath,
        line: citation.line,
        section,
        context: citation.context,
        nearby_citations: [citation.key],
        severity: 'critical',
        suggested_action: `Add missing BibTeX entry for '${citation.key}' or remove citation`
      })
    }
  })

  return gaps
}

/**
 * Detect outdated references (>15 years old)
 */
export function detectOutdatedReferences(
  typstCitations: Citation[],
  bibEntries: Map<string, BibEntry>,
  filePath: string,
  content: string
): ResearchGap[] {
  const gaps: ResearchGap[] = []
  const currentYear = new Date().getFullYear()
  const OLD_THRESHOLD = 15

  typstCitations.forEach(citation => {
    const entry = bibEntries.get(citation.key)

    if (entry?.year) {
      const year = parseInt(entry.year)
      const age = currentYear - year

      if (age > OLD_THRESHOLD) {
        const section = extractSection(content, citation.line)

        gaps.push({
          gap_id: `${filePath}:${citation.line}:outdated-reference`,
          type: 'outdated_reference',
          file: filePath,
          line: citation.line,
          section,
          context: citation.context,
          nearby_citations: [citation.key],
          severity: age > 20 ? 'medium' : 'low',
          suggested_action: `Consider updating ${citation.key} (${entry.year}) with more recent scholarship`
        })
      }
    }
  })

  return gaps
}

/**
 * Main analyzer function - scans a Typst file for all gap types
 */
export async function analyzeTypstFile(
  typstPath: string,
  bibPath: string
): Promise<ResearchGap[]> {
  // Check files exist
  if (!existsSync(typstPath)) {
    throw new Error(`Typst file not found: ${typstPath}`)
  }

  const typstContent = await readFile(typstPath, 'utf-8')

  // Load .bib file if exists
  let bibEntries = new Map<string, BibEntry>()
  if (existsSync(bibPath)) {
    const bibContent = await readFile(bibPath, 'utf-8')
    bibEntries = parseBibTeX(bibContent)
  }

  // Extract citations
  const citations = extractCitations(typstContent)

  // Run all detection algorithms
  const allGaps: ResearchGap[] = [
    ...detectWeakArguments(typstContent, typstPath),
    ...detectBrokenReferences(citations, bibEntries, typstPath, typstContent),
    ...detectOutdatedReferences(citations, bibEntries, typstPath, typstContent)
  ]

  // Sort by severity and line number
  return allGaps.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]

    if (severityDiff !== 0) return severityDiff
    return a.line - b.line
  })
}

/**
 * Analyze multiple Typst files
 */
export async function analyzeRepository(
  files: Array<{ typst: string; bib: string }>
): Promise<ResearchGap[]> {
  const allGaps: ResearchGap[] = []

  for (const { typst, bib } of files) {
    try {
      const gaps = await analyzeTypstFile(typst, bib)
      allGaps.push(...gaps)
    } catch (error) {
      console.error(`Error analyzing ${typst}:`, error)
    }
  }

  return allGaps
}
