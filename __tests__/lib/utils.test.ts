import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500')
      expect(result).toBe('px-2 py-1 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'other-class')
      expect(result).toBe('base-class other-class')
    })

    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle object inputs', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      })
      expect(result).toBe('class1 class3')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle complex mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { 'obj1': true, 'obj2': false },
        true && 'conditional',
        undefined,
        'final'
      )
      expect(result).toBe('base array1 array2 obj1 conditional final')
    })
  })
})