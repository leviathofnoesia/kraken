import { describe, it, expect } from 'bun:test'
import {
  loadClaudeCodeSettings,
  isFeatureEnabled,
  isPluginEnabled,
  executeSettingsHooks,
} from '../../src/features/claude-code-compatibility'
import type { ClaudeCodeConfig } from '../../src/features/claude-code-compatibility'

describe('Claude Code Compatibility Feature', () => {
  describe('loadClaudeCodeSettings', () => {
    it('should return empty config when no settings files exist', async () => {
      const config = await loadClaudeCodeSettings()
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return true when feature is not set', () => {
      const config: ClaudeCodeConfig = {}
      expect(isFeatureEnabled(config, 'mcp')).toBe(true)
    })

    it('should return the boolean value when set', () => {
      const config: ClaudeCodeConfig = { mcp: false }
      expect(isFeatureEnabled(config, 'mcp')).toBe(false)
    })

    it('should return true when feature is enabled', () => {
      const config: ClaudeCodeConfig = { commands: true }
      expect(isFeatureEnabled(config, 'commands')).toBe(true)
    })
  })

  describe('isPluginEnabled', () => {
    it('should return true when plugin not in config', () => {
      const config: ClaudeCodeConfig = {}
      expect(isPluginEnabled(config, 'my-plugin')).toBe(true)
    })

    it('should return false when plugin disabled', () => {
      const config: ClaudeCodeConfig = { plugins: { 'my-plugin': false } }
      expect(isPluginEnabled(config, 'my-plugin')).toBe(false)
    })
  })

  describe('executeSettingsHooks', () => {
    it('should not throw when no hooks configured', async () => {
      await expect(executeSettingsHooks('PreToolUse', {})).resolves.toBeUndefined()
    })
  })
})
