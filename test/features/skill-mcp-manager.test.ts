import { describe, it, expect, afterEach } from 'bun:test'
import {
  initializeSkillMcpManager,
  getSkillMcpManager,
  resetSkillMcpManager,
} from '../../src/features/skill-mcp-manager'

describe('Skill MCP Manager Feature', () => {
  afterEach(() => {
    resetSkillMcpManager()
  })

  describe('initializeSkillMcpManager', () => {
    it('should initialize skill mcp manager', async () => {
      const result = await initializeSkillMcpManager()
      expect(result).toBeDefined()
    })
  })

  describe('getSkillMcpManager', () => {
    it('should return null before initialization', () => {
      resetSkillMcpManager()
      expect(getSkillMcpManager()).toBeNull()
    })

    it('should return manager after initialization', async () => {
      await initializeSkillMcpManager()
      expect(getSkillMcpManager()).toBeDefined()
    })
  })
})
