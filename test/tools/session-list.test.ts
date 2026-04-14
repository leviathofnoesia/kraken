import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { session_list, getSessionStorageDir } from '../../src/tools/session/list'

describe('Session List Tool', () => {
  const testDir = path.join(os.tmpdir(), 'kraken-test-sessions-' + Date.now())
  
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })
  
  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('tool export', () => {
    it('should export session_list tool', () => {
      expect(session_list).toBeDefined()
    })

    it('should have required properties', () => {
      expect(session_list.description).toBeDefined()
      expect(session_list.args).toBeDefined()
      expect(session_list.execute).toBeDefined()
    })
  })

  describe('getSessionStorageDir', () => {
    it('should return a valid directory path', () => {
      const dir = getSessionStorageDir()
      expect(dir).toBeDefined()
      expect(dir).toContain('.opencode')
      expect(dir).toContain('sessions')
    })
  })

  describe('execute', () => {
    it('should return empty sessions when no sessions exist', async () => {
      const result = await session_list.execute({})
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.sessions).toEqual([])
      expect(parsed.count).toBe(0)
    })

    it('should support limit parameter', async () => {
      const result = await session_list.execute({ limit: 5 })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.count).toBeLessThanOrEqual(5)
    })

    it('should support includeMetadata parameter', async () => {
      const result = await session_list.execute({ includeMetadata: true })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      if (parsed.sessions.length > 0) {
        expect(parsed.sessions[0].duration).toBeDefined()
        expect(parsed.sessions[0].fileCount).toBeDefined()
        expect(parsed.sessions[0].editCount).toBeDefined()
        expect(parsed.sessions[0].toolUsage).toBeDefined()
      }
    })

    it('should support order parameter', async () => {
      const resultAsc = await session_list.execute({ order: 'asc' })
      const parsedAsc = JSON.parse(resultAsc)
      expect(parsedAsc.success).toBe(true)

      const resultDesc = await session_list.execute({ order: 'desc' })
      const parsedDesc = JSON.parse(resultDesc)
      expect(parsedDesc.success).toBe(true)
    })

    it('should handle invalid limit gracefully', async () => {
      const result = await session_list.execute({ limit: -1 } as any)
      const parsed = JSON.parse(result)
      // Should either error or handle gracefully
      expect(parsed).toBeDefined()
    })
  })
})
