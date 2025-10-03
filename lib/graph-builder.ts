import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

export interface WikiPage {
  slug: string
  title: string
  description?: string
  category?: string
  keywords?: string[]
  related?: string[]
  seeAlso?: string[]
}

export interface LinkGraph {
  pages: Map<string, WikiPage>
  forwardLinks: Map<string, Set<string>>  // slug -> links to
  backlinks: Map<string, Set<string>>     // slug -> linked from
}

/**
 * Extract wiki links from markdown content
 * Supports: [text](/wiki/slug), [[slug]], /wiki/slug
 */
function extractWikiLinks(content: string): string[] {
  const links: string[] = []

  // Match [text](/wiki/slug)
  const markdownLinks = content.matchAll(/\[([^\]]+)\]\(\/wiki\/([^)]+)\)/g)
  for (const match of markdownLinks) {
    links.push(match[2])
  }

  // Match [[slug]] or [[text|slug]]
  const wikiLinks = content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)
  for (const match of wikiLinks) {
    const slug = match[2] || match[1]
    links.push(slug.toLowerCase().replace(/\s+/g, '-'))
  }

  // Match raw /wiki/slug in text
  const rawLinks = content.matchAll(/\/wiki\/([a-z0-9-]+)/g)
  for (const match of rawLinks) {
    if (!links.includes(match[1])) {
      links.push(match[1])
    }
  }

  return [...new Set(links)]  // Deduplicate
}

/**
 * Build complete link graph from all chapters
 */
export async function buildLinkGraph(): Promise<LinkGraph> {
  const chaptersDir = join(process.cwd(), 'content/chapters')
  const files = await readdir(chaptersDir)

  const pages = new Map<string, WikiPage>()
  const forwardLinks = new Map<string, Set<string>>()
  const backlinks = new Map<string, Set<string>>()

  // First pass: Load all pages
  for (const file of files) {
    if (!file.endsWith('.md')) continue

    const slug = file.replace('.md', '')
    const filePath = join(chaptersDir, file)
    const source = await readFile(filePath, 'utf8')
    const { data: frontmatter, content } = matter(source)

    pages.set(slug, {
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description,
      category: frontmatter.category,
      keywords: frontmatter.keywords || [],
      related: frontmatter.related || [],
      seeAlso: frontmatter.seeAlso || []
    })

    // Extract links from content
    const contentLinks = extractWikiLinks(content)

    // Combine content links + frontmatter related/seeAlso
    const allLinks = new Set([
      ...contentLinks,
      ...(frontmatter.related || []),
      ...(frontmatter.seeAlso || [])
    ])

    forwardLinks.set(slug, allLinks)
  }

  // Second pass: Build backlinks
  for (const [fromSlug, toSlugs] of forwardLinks.entries()) {
    for (const toSlug of toSlugs) {
      if (!backlinks.has(toSlug)) {
        backlinks.set(toSlug, new Set())
      }
      backlinks.get(toSlug)!.add(fromSlug)
    }
  }

  return { pages, forwardLinks, backlinks }
}

/**
 * Get backlinks for a specific page
 */
export function getBacklinks(graph: LinkGraph, slug: string): WikiPage[] {
  const backlinkSlugs = graph.backlinks.get(slug) || new Set()
  return Array.from(backlinkSlugs)
    .map(s => graph.pages.get(s))
    .filter((p): p is WikiPage => p !== undefined)
}

/**
 * Get related pages (forward links + seeAlso)
 */
export function getRelatedPages(graph: LinkGraph, slug: string): WikiPage[] {
  const page = graph.pages.get(slug)
  if (!page) return []

  const relatedSlugs = new Set([
    ...(page.related || []),
    ...(page.seeAlso || [])
  ])

  return Array.from(relatedSlugs)
    .map(s => graph.pages.get(s))
    .filter((p): p is WikiPage => p !== undefined)
}

/**
 * Get pages in the same category
 */
export function getCategoryPages(graph: LinkGraph, slug: string): WikiPage[] {
  const page = graph.pages.get(slug)
  if (!page || !page.category) return []

  return Array.from(graph.pages.values())
    .filter(p => p.category === page.category && p.slug !== slug)
}
