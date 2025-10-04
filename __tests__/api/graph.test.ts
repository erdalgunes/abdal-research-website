import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/graph/route'

// Mock the graph-builder module
vi.mock('@/lib/graph-builder', () => ({
  buildLinkGraph: vi.fn(),
}))

describe('/api/graph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return graph data successfully', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map([
        ['page1', {
          slug: 'page1',
          title: 'Page 1',
          category: 'mysticism',
          keywords: ['test', 'keyword']
        }],
        ['page2', {
          slug: 'page2',
          title: 'Page 2',
          category: 'psychology',
          keywords: []
        }]
      ]),
      forwardLinks: new Map([
        ['page1', new Set<string>(['page2'])],
        ['page2', new Set<string>()]
      ]),
      backlinks: new Map([
        ['page2', new Set(['page1'])]
      ])
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('nodes')
    expect(data).toHaveProperty('edges')
    expect(data).toHaveProperty('stats')

    // Check nodes structure
    expect(data.nodes).toHaveLength(2)
    expect(data.nodes[0]).toEqual({
      id: 'page1',
      title: 'Page 1',
      category: 'mysticism',
      keywords: ['test', 'keyword'],
      url: 'https://sacred-madness.vercel.app/wiki/page1'
    })
    expect(data.nodes[1]).toEqual({
      id: 'page2',
      title: 'Page 2',
      category: 'psychology',
      keywords: [],
      url: 'https://sacred-madness.vercel.app/wiki/page2'
    })

    // Check edges structure
    expect(data.edges).toHaveLength(1)
    expect(data.edges[0]).toEqual({
      from: 'page1',
      to: 'page2'
    })

    // Check stats
    expect(data.stats).toEqual({
      totalPages: 2,
      totalLinks: 1,
      categories: ['mysticism', 'psychology']
    })
  })

  it('should handle empty graph', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map(),
      forwardLinks: new Map<string, Set<string>>(),
      backlinks: new Map()
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.nodes).toEqual([])
    expect(data.edges).toEqual([])
    expect(data.stats).toEqual({
      totalPages: 0,
      totalLinks: 0,
      categories: []
    })
  })

  it('should filter out undefined categories from stats', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map([
        ['page1', {
          slug: 'page1',
          title: 'Page 1',
          category: 'mysticism',
          keywords: []
        }],
        ['page2', {
          slug: 'page2',
          title: 'Page 2',
          category: undefined,
          keywords: []
        }],
        ['page3', {
          slug: 'page3',
          title: 'Page 3',
          keywords: []
        }]
      ]),
      forwardLinks: new Map<string, Set<string>>(),
      backlinks: new Map()
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    expect(data.stats.categories).toEqual(['mysticism'])
  })

  it('should handle complex graph with multiple links', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map([
        ['page1', { slug: 'page1', title: 'Page 1', keywords: [] }],
        ['page2', { slug: 'page2', title: 'Page 2', keywords: [] }],
        ['page3', { slug: 'page3', title: 'Page 3', keywords: [] }]
      ]),
      forwardLinks: new Map([
        ['page1', new Set<string>(['page2', 'page3'])],
        ['page2', new Set<string>(['page3'])],
        ['page3', new Set<string>()]
      ]),
      backlinks: new Map([
        ['page2', new Set(['page1'])],
        ['page3', new Set(['page1', 'page2'])]
      ])
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    expect(data.edges).toHaveLength(3)
    expect(data.edges).toContainEqual({ from: 'page1', to: 'page2' })
    expect(data.edges).toContainEqual({ from: 'page1', to: 'page3' })
    expect(data.edges).toContainEqual({ from: 'page2', to: 'page3' })
    expect(data.stats.totalLinks).toBe(3)
  })

  it('should handle buildLinkGraph errors', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    vi.mocked(buildLinkGraph).mockRejectedValueOnce(new Error('File system error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to build graph')
  })

  it('should include all required node properties', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map([
        ['test-page', {
          slug: 'test-page',
          title: 'Test Page',
          description: 'A test page',
          category: 'test-category',
          keywords: ['keyword1', 'keyword2'],
          related: ['other-page'],
          seeAlso: ['another-page']
        }]
      ]),
      forwardLinks: new Map<string, Set<string>>(),
      backlinks: new Map()
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    const node = data.nodes[0]
    expect(node).toEqual({
      id: 'test-page',
      title: 'Test Page',
      category: 'test-category',
      keywords: ['keyword1', 'keyword2'],
      url: 'https://sacred-madness.vercel.app/wiki/test-page'
    })
  })

  it('should deduplicate categories in stats', async () => {
    const { buildLinkGraph } = await import('@/lib/graph-builder')
    
    const mockGraph = {
      pages: new Map([
        ['page1', { slug: 'page1', title: 'Page 1', category: 'mysticism', keywords: [] }],
        ['page2', { slug: 'page2', title: 'Page 2', category: 'mysticism', keywords: [] }],
        ['page3', { slug: 'page3', title: 'Page 3', category: 'psychology', keywords: [] }]
      ]),
      forwardLinks: new Map(),
      backlinks: new Map()
    }

    vi.mocked(buildLinkGraph).mockResolvedValueOnce(mockGraph)

    const response = await GET()
    const data = await response.json()

    expect(data.stats.categories).toEqual(['mysticism', 'psychology'])
  })
})