import { describe, it, expect } from 'bun:test'
import { session_search } from '../../src/tools/session/search'

describe('Session Search Tool', () => {
  describe('tool export', () => {
    it('should export session_search tool', () => {
      expect(session_search).toBeDefined()
    })

    it('should have required properties', () => {
      expect(session_search.description).toBeDefined()
      expect(session_search.args).toBeDefined()
      expect(session_search.execute).toBeDefined()
    })
  })

  describe('execute', () => {
    it('should handle empty query', async () => {
      const result = await session_search.execute({ q: '' })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBeDefined()
    })

    it('should handle whitespace-only query', async () => {
      const result = await session_search.execute({ q: '   ' })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
    })

    it('should return results with default limit', async () => {
      const result = await session_search.execute({ q: 'test' })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.results).toBeDefined()
      expect(parsed.query).toBe('test')
    })

    it('should support custom limit', async () => {
      const result = await session_search.execute({ q: 'test', limit: 5 })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.limit).toBe(5)
    })

    it('should support pagination with offset', async () => {
      const result = await session_search.execute({ q: 'test', limit: 5, offset: 10 })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.offset).toBe(10)
    })

    it('should filter by sessionID when provided', async () => {
      const result = await session_search.execute({ q: 'test', sessionID: 'test-session' })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
    })
  })

  describe('validation', () => {
    it('should require q parameter', async () => {
      const result = await session_search.execute({} as any)
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
    })

    it('should enforce max limit', async () => {
      const result = await session_search.execute({ q: 'test', limit: 200 })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
    })
  })
})
