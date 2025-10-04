import { describe, it, expect } from 'vitest'
import { getBacklinks, getRelatedPages, getCategoryPages } from '@/lib/graph-builder'
import type { LinkGraph, WikiPage } from '@/lib/graph-builder'

describe('graph-builder', () => {
  describe('getBacklinks', () => {
    it('should return backlinks for a given page', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { slug: 'page1', title: 'Page 1', keywords: [], related: [], seeAlso: [] }],
          ['page2', { slug: 'page2', title: 'Page 2', keywords: [], related: [], seeAlso: [] }],
          ['page3', { slug: 'page3', title: 'Page 3', keywords: [], related: [], seeAlso: [] }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map([
          ['page1', new Set(['page2', 'page3'])]
        ])
      }

      const backlinks = getBacklinks(mockGraph, 'page1')
      expect(backlinks).toHaveLength(2)
      expect(backlinks.map(p => p.slug)).toEqual(expect.arrayContaining(['page2', 'page3']))
    })

    it('should return empty array when page has no backlinks', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { slug: 'page1', title: 'Page 1', keywords: [], related: [], seeAlso: [] }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const backlinks = getBacklinks(mockGraph, 'page1')
      expect(backlinks).toEqual([])
    })

    it('should filter out non-existent pages', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { slug: 'page1', title: 'Page 1', keywords: [], related: [], seeAlso: [] }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map([
          ['page1', new Set(['page2', 'non-existent'])]
        ])
      }

      const backlinks = getBacklinks(mockGraph, 'page1')
      expect(backlinks).toEqual([])
    })
  })

  describe('getRelatedPages', () => {
    it('should return related pages from frontmatter', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { 
            slug: 'page1', 
            title: 'Page 1', 
            keywords: [], 
            related: ['page2'], 
            seeAlso: ['page3'] 
          }],
          ['page2', { slug: 'page2', title: 'Page 2', keywords: [], related: [], seeAlso: [] }],
          ['page3', { slug: 'page3', title: 'Page 3', keywords: [], related: [], seeAlso: [] }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const related = getRelatedPages(mockGraph, 'page1')
      expect(related).toHaveLength(2)
      expect(related.map(p => p.slug)).toEqual(expect.arrayContaining(['page2', 'page3']))
    })

    it('should return empty array when page does not exist', () => {
      const mockGraph: LinkGraph = {
        pages: new Map(),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const related = getRelatedPages(mockGraph, 'non-existent')
      expect(related).toEqual([])
    })
  })

  describe('getCategoryPages', () => {
    it('should return pages in the same category', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { 
            slug: 'page1', 
            title: 'Page 1', 
            category: 'mysticism',
            keywords: [], 
            related: [], 
            seeAlso: [] 
          }],
          ['page2', { 
            slug: 'page2', 
            title: 'Page 2', 
            category: 'mysticism',
            keywords: [], 
            related: [], 
            seeAlso: [] 
          }],
          ['page3', { 
            slug: 'page3', 
            title: 'Page 3', 
            category: 'psychology',
            keywords: [], 
            related: [], 
            seeAlso: [] 
          }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const categoryPages = getCategoryPages(mockGraph, 'page1')
      expect(categoryPages).toHaveLength(1)
      expect(categoryPages[0].slug).toBe('page2')
    })

    it('should exclude the source page from results', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { 
            slug: 'page1', 
            title: 'Page 1', 
            category: 'mysticism',
            keywords: [], 
            related: [], 
            seeAlso: [] 
          }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const categoryPages = getCategoryPages(mockGraph, 'page1')
      expect(categoryPages).toEqual([])
    })

    it('should return empty array when page has no category', () => {
      const mockGraph: LinkGraph = {
        pages: new Map([
          ['page1', { 
            slug: 'page1', 
            title: 'Page 1', 
            keywords: [], 
            related: [], 
            seeAlso: [] 
          }]
        ]),
        forwardLinks: new Map<string, Set<string>>(),
        backlinks: new Map()
      }

      const categoryPages = getCategoryPages(mockGraph, 'page1')
      expect(categoryPages).toEqual([])
    })
  })
})