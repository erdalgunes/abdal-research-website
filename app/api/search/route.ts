import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase()

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    const chaptersDir = join(process.cwd(), 'content/chapters')
    const files = await readdir(chaptersDir)
    const results = []

    for (const file of files) {
      if (!file.endsWith('.md')) continue

      const slug = file.replace('.md', '')
      const filePath = join(chaptersDir, file)
      const source = await readFile(filePath, 'utf8')
      const { data: frontmatter, content } = matter(source)

      // Search in title, description, keywords, and content
      const searchableText = [
        frontmatter.title,
        frontmatter.description,
        ...(frontmatter.keywords || []),
        content
      ].join(' ').toLowerCase()

      if (searchableText.includes(query)) {
        // Find context around the match
        const lines = content.split('\n')
        const matchingLines = lines.filter(line =>
          line.toLowerCase().includes(query)
        ).slice(0, 3)

        results.push({
          slug,
          title: frontmatter.title,
          description: frontmatter.description,
          category: frontmatter.category,
          keywords: frontmatter.keywords,
          matches: matchingLines,
          url: `https://sacred-madness.vercel.app/wiki/${slug}`
        })
      }
    }

    return NextResponse.json({
      query,
      count: results.length,
      results
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
