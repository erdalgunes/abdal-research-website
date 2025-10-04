import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { query } = await request.json()

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        include_domains: [
          'scholar.google.com',
          'jstor.org',
          'academia.edu',
          'researchgate.net',
          'ncbi.nlm.nih.gov',
          'tandfonline.com',
          'cambridge.org',
          'oxford.ac.uk'
        ],
        max_results: 5
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Citation search failed' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      query,
      sources: data.results.map((result: { title: string; url: string; content: string; score: number }) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score
      }))
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to search for citations' },
      { status: 500 }
    )
  }
}
