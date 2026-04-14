import { describe, it, expect } from 'bun:test'
import {
  activateMode,
  deactivateMode,
  getActiveMode,
  isModeActive,
  clearAllModes,
  getActiveModeCount,
} from '../../src/hooks/think-mode/mode-switcher'

describe('Mode Switcher', () => {
  afterEach(() => {
    clearAllModes()
  })

  describe('activateMode', () => {
    it('should activate blitzkrieg mode', () => {
      const result = activateMode('session-1', 'blitzkrieg')
      expect(result).toBe(true)
      expect(getActiveModeCount()).toBe(1)
    })

    it('should return false for unknown mode', () => {
      const result = activateMode('session-1', 'nonexistent-mode')
      expect(result).toBe(false)
    })
  })

  describe('deactivateMode', () => {
    it('should deactivate active mode', () => {
      activateMode('session-1', 'blitzkrieg')
      deactivateMode('session-1')
      expect(getActiveMode('session-1')).toBeUndefined()
    })
  })

  describe('isModeActive', () => {
    it('should return true when mode is active', () => {
      activateMode('session-1', 'blitzkrieg')
      expect(isModeActive('session-1', 'blitzkrieg')).toBe(true)
    })

    it('should return false when different mode is active', () => {
      activateMode('session-1', 'blitzkrieg')
      expect(isModeActive('session-1', 'ultrathink')).toBe(false)
    })
  })

  describe('clearAllModes', () => {
    it('should clear all active modes', () => {
      activateMode('session-1', 'blitzkrieg')
      activateMode('session-2', 'ultrathink')
      clearAllModes()
      expect(getActiveModeCount()).toBe(0)
    })
  })
})
