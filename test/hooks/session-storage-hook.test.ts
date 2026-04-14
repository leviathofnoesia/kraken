import { describe, it, expect } from 'bun:test'
import { createSessionStorageHook, metadata } from '../../src/hooks/session-storage-hook'

const mockInput = {
  client: {} as any,
} as any

describe('Session Storage Hook', () => {
  describe('createSessionStorageHook', () => {
    it('should create session storage hook', () => {
      const hook = createSessionStorageHook(mockInput)
      expect(hook).toBeDefined()
    })

    it('should have tool execution tracking', () => {
      const hook = createSessionStorageHook(mockInput)
      expect(hook['tool.execute.after']).toBeDefined()
    })

    it('should have chat message handler', () => {
      const hook = createSessionStorageHook(mockInput)
      expect(hook['chat.message']).toBeDefined()
    })

    it('should return empty hooks when disabled', () => {
      const hook = createSessionStorageHook(mockInput, {
        config: { enabled: false },
      })
      expect(Object.keys(hook).length).toBe(0)
    })
  })

  describe('metadata', () => {
    it('should export metadata', () => {
      expect(metadata).toBeDefined()
      expect(metadata.name).toBe('session-storage-hook')
    })

    it('should have priority', () => {
      expect(typeof metadata.priority).toBe('number')
    })
  })
})
