import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const filePath = join(process.cwd(), 'content/chapters', `${slug}.md`)
    const source = await readFile(filePath, 'utf8')
    const { data: frontmatter, content } = matter(source)

    // Return clean content optimized for AI consumption
    return NextResponse.json({
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      category: frontmatter.category,
      keywords: frontmatter.keywords || [],
      related: frontmatter.related || [],
      seeAlso: frontmatter.seeAlso || [],
      content: content,
      wordCount: content.split(/\s+/).length,
      url: `https://sacred-madness.vercel.app/wiki/${slug}`
    })
  } catch {
    return NextResponse.json(
      { error: 'Page not found' },
      { status: 404 }
    )
  }
}
