import { notFound } from 'next/navigation'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote/rsc'
import WikiLayout from '@/components/WikiLayout'
import { mdxComponents } from '@/lib/mdx-components'
import { extractTOC } from '@/lib/toc'
import { buildLinkGraph, getBacklinks } from '@/lib/graph-builder'
import { Backlinks } from '@/components/Backlinks'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  // Return all possible wiki page slugs from content/chapters
  const chaptersDir = join(process.cwd(), 'content/chapters')

  try {
    const files = await readdir(chaptersDir)
    return files
      .filter((file: string) => file.endsWith('.md'))
      .map((file: string) => ({
        slug: file.replace('.md', '')
      }))
  } catch {
    return []
  }
}

export default async function WikiPage({ params }: PageProps) {
  const { slug } = await params

  try {
    // Try to read from chapters first
    const filePath = join(process.cwd(), 'content/chapters', `${slug}.md`)
    const source = await readFile(filePath, 'utf8')
    const { data: frontmatter, content } = matter(source)

    // Extract TOC from content
    const tocItems = extractTOC(content)

    // Build link graph for backlinks (with error handling)
    let backlinks: any[] = []
    try {
      const graph = await buildLinkGraph()
      backlinks = getBacklinks(graph, slug)
    } catch (error) {
      console.error('Error building link graph:', error)
      // Graceful degradation: continue without backlinks
    }

    // Generate breadcrumbs
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Wiki', href: '/wiki' },
      { label: frontmatter.title || slug }
    ]

    return (
      <WikiLayout
        breadcrumbs={breadcrumbs}
        tocItems={tocItems}
      >
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: 'wrap' }]
              ]
            }
          }}
        />

        {/* Zettelkasten-style backlinks */}
        {backlinks.length > 0 && (
          <Backlinks pages={backlinks} />
        )}
      </WikiLayout>
    )
  } catch (error) {
    console.error('Error loading wiki page:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  try {
    const filePath = join(process.cwd(), 'content/chapters', `${slug}.md`)
    const source = await readFile(filePath, 'utf8')
    const { data: frontmatter } = matter(source)

    return {
      title: `${frontmatter.title || slug} | Sacred Madness Wiki`,
      description: frontmatter.description || `Learn about ${frontmatter.title || slug}`,
      keywords: frontmatter.keywords || [],
      openGraph: {
        title: frontmatter.title || slug,
        description: frontmatter.description,
        type: 'article',
        url: `https://sacred-madness.vercel.app/wiki/${slug}`,
      },
    }
  } catch {
    return {
      title: 'Page Not Found | Sacred Madness Wiki',
    }
  }
}
