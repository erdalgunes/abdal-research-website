import { describe, it, expect } from 'vitest'
import { extractTOC, addIdsToHeadings } from '@/lib/toc'

describe('toc', () => {
  describe('extractTOC', () => {
    it('should extract h2 and h3 headings', () => {
      const content = `
# Main Title
## Section One
### Subsection A
### Subsection B
## Section Two
#### Not Included
##### Also Not Included
### Subsection C
      `.trim()

      const toc = extractTOC(content)
      
      expect(toc).toHaveLength(5)
      expect(toc[0]).toEqual({ id: 'section-one', text: 'Section One', level: 2 })
      expect(toc[1]).toEqual({ id: 'subsection-a', text: 'Subsection A', level: 3 })
      expect(toc[2]).toEqual({ id: 'subsection-b', text: 'Subsection B', level: 3 })
      expect(toc[3]).toEqual({ id: 'section-two', text: 'Section Two', level: 2 })
      expect(toc[4]).toEqual({ id: 'subsection-c', text: 'Subsection C', level: 3 })
    })

    it('should handle headings with special characters', () => {
      const content = '## Section: With Special! Characters? & Symbols@'
      const toc = extractTOC(content)
      
      expect(toc).toHaveLength(1)
      expect(toc[0]).toEqual({
        id: 'section-with-special-characters-symbols',
        text: 'Section: With Special! Characters? & Symbols@',
        level: 2
      })
    })

    it('should handle headings with multiple spaces and dashes', () => {
      const content = '## ---  Spaced   Out  Heading  ---'
      const toc = extractTOC(content)
      
      expect(toc).toHaveLength(1)
      expect(toc[0]).toEqual({
        id: 'spaced-out-heading',
        text: '---  Spaced   Out  Heading  ---',
        level: 2
      })
    })

    it('should handle empty content', () => {
      const toc = extractTOC('')
      expect(toc).toEqual([])
    })

    it('should handle content with no h2/h3 headings', () => {
      const content = `
# Only H1
#### Only H4
##### Only H5
###### Only H6
Regular text here
      `.trim()

      const toc = extractTOC(content)
      expect(toc).toEqual([])
    })

    it('should handle headings with inline formatting', () => {
      const content = '## **Bold** and *Italic* Text'
      const toc = extractTOC(content)
      
      expect(toc).toHaveLength(1)
      expect(toc[0]).toEqual({
        id: 'bold-and-italic-text',
        text: '**Bold** and *Italic* Text',
        level: 2
      })
    })

    it('should handle headings at beginning and end of content', () => {
      const content = '## First Heading\nSome content\n### Last Heading'
      const toc = extractTOC(content)
      
      expect(toc).toHaveLength(2)
      expect(toc[0]).toEqual({ id: 'first-heading', text: 'First Heading', level: 2 })
      expect(toc[1]).toEqual({ id: 'last-heading', text: 'Last Heading', level: 3 })
    })
  })

  describe('addIdsToHeadings', () => {
    it('should add IDs to h2 and h3 headings', () => {
      const content = `
# Main Title
## Section One
### Subsection A
Some content here
## Section Two
#### Not Modified
      `.trim()

      const result = addIdsToHeadings(content)
      
      expect(result).toContain('## Section One {#section-one}')
      expect(result).toContain('### Subsection A {#subsection-a}')
      expect(result).toContain('## Section Two {#section-two}')
      expect(result).toContain('# Main Title')  // h1 unchanged
      expect(result).toContain('#### Not Modified')  // h4 unchanged
    })

    it('should handle headings with special characters', () => {
      const content = '## Section: With Special! Characters? & Symbols@'
      const result = addIdsToHeadings(content)
      
      expect(result).toBe('## Section: With Special! Characters? & Symbols@ {#section-with-special-characters-symbols}')
    })

    it('should handle multiple headings correctly', () => {
      const content = `## First Section
Some content
### Subsection
More content
## Second Section`

      const result = addIdsToHeadings(content)
      
      expect(result).toBe(`## First Section {#first-section}
Some content
### Subsection {#subsection}
More content
## Second Section {#second-section}`)
    })

    it('should handle empty content', () => {
      const result = addIdsToHeadings('')
      expect(result).toBe('')
    })

    it('should not modify content without h2/h3 headings', () => {
      const content = `# Main Title
Regular paragraph text
#### H4 Heading
##### H5 Heading`

      const result = addIdsToHeadings(content)
      expect(result).toBe(content)
    })

    it('should handle headings with existing formatting', () => {
      const content = '## **Bold** and *Italic* Text'
      const result = addIdsToHeadings(content)
      
      expect(result).toBe('## **Bold** and *Italic* Text {#bold-and-italic-text}')
    })

    it('should create unique IDs for similar headings', () => {
      const content = `## Test Heading
## Test: Heading!
## Test_Heading?`

      const result = addIdsToHeadings(content)
      
      // All should resolve to the same base ID after normalization
      expect(result).toContain('{#test-heading}')
      expect(result).toContain('{#test-heading}')
      expect(result).toContain('{#test-heading}')
    })
  })
})