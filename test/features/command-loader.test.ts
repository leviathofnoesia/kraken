import { describe, it, expect, afterEach } from 'bun:test'
import {
  initializeCommandLoader,
  getCommandLoader,
  resetCommandLoader,
} from '../../src/features/command-loader'

describe('Command Loader Feature', () => {
  afterEach(() => {
    resetCommandLoader()
  })

  describe('initializeCommandLoader', () => {
    it('should initialize command loader', async () => {
      const result = await initializeCommandLoader()
      expect(result).toBeDefined()
    })
  })

  describe('getCommandLoader', () => {
    it('should return null before initialization', () => {
      resetCommandLoader()
      expect(getCommandLoader()).toBeNull()
    })

    it('should return loader after initialization', async () => {
      await initializeCommandLoader()
      expect(getCommandLoader()).toBeDefined()
    })
  })

  describe('resetCommandLoader', () => {
    it('should reset loader to null', async () => {
      await initializeCommandLoader()
      resetCommandLoader()
      expect(getCommandLoader()).toBeNull()
    })
  })
})
