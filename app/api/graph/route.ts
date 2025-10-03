import { NextResponse } from 'next/server'
import { buildLinkGraph } from '@/lib/graph-builder'

export async function GET() {
  try {
    const graph = await buildLinkGraph()

    // Convert Maps and Sets to plain objects for JSON serialization
    const pages = Array.from(graph.pages.values())
    const edges = []

    for (const [from, toSet] of graph.forwardLinks.entries()) {
      for (const to of toSet) {
        edges.push({ from, to })
      }
    }

    return NextResponse.json({
      nodes: pages.map(p => ({
        id: p.slug,
        title: p.title,
        category: p.category,
        keywords: p.keywords,
        url: `https://sacred-madness.vercel.app/wiki/${p.slug}`
      })),
      edges,
      stats: {
        totalPages: pages.length,
        totalLinks: edges.length,
        categories: [...new Set(pages.map(p => p.category).filter(Boolean))]
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to build graph' },
      { status: 500 }
    )
  }
}
