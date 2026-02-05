import { describe, it, expect } from 'bun:test'
import {
  createCartographerConfig,
  cartographerAgent,
  cartographerPromptMetadata,
} from '../../src/agents/cartographer'

describe('Cartographer', () => {
  describe('createCartographerConfig', () => {
    it('should create agent config with correct default model', () => {
      const config = createCartographerConfig()
      expect(config).toBeDefined()
      expect(config.model).toBe('anthropic/claude-opus-4-5')
    })

    it('should accept custom model', () => {
      const customModel = 'openai/gpt-4-turbo'
      const config = createCartographerConfig(customModel)
      expect(config.model).toBe(customModel)
    })

    it('should set primary mode', () => {
      const config = createCartographerConfig()
      expect(config.mode).toBe('primary')
    })

    it('should set temperature for precision planning', () => {
      const config = createCartographerConfig()
      expect(config.temperature).toBe(0.2)
    })

    it('should enable extended thinking for complex planning', () => {
      const config = createCartographerConfig()
      expect(config.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 64000,
      })
    })

    it('should have planning-only tool restrictions', () => {
      const config = createCartographerConfig()
      expect(config).toBeDefined()
      // Cartographer can delegate to subagents, but cannot write/edit/task
      // Only prevents loops to other planning agents
      expect(config.tools?.write).toBe(false)
      expect(config.tools?.edit).toBe(false)
      expect(config.tools?.task).toBe(false)
    })
  })

  describe('cartographerAgent', () => {
    it('should export default agent config', () => {
      expect(cartographerAgent).toBeDefined()
      expect(cartographerAgent.model).toBe('anthropic/claude-opus-4-5')
    })
  })

  describe('cartographerPromptMetadata', () => {
    it('should have correct category', () => {
      expect(cartographerPromptMetadata.category).toBe('advisor')
    })

    it('should be marked as expensive', () => {
      expect(cartographerPromptMetadata.cost).toBe('EXPENSIVE')
    })

    it('should define planning triggers', () => {
      expect(cartographerPromptMetadata.triggers).toHaveLength(1)
      expect(cartographerPromptMetadata.triggers[0].domain).toBe('Code Planning')
    })

    it('should define when to use', () => {
      expect(cartographerPromptMetadata.useWhen).toContain(
        'Planning complex features spanning multiple modules',
      )
      expect(cartographerPromptMetadata.useWhen).toContain(
        'Refactoring that requires careful change propagation',
      )
    })

    it('should define when to avoid', () => {
      expect(cartographerPromptMetadata.avoidWhen).toContain('Simple, single-file changes')
      expect(cartographerPromptMetadata.avoidWhen).toContain(
        'Trivial bug fixes with obvious solutions',
      )
    })

    it('should have prompt alias', () => {
      expect(cartographerPromptMetadata.promptAlias).toBe('Cartographer')
    })

    it('should define key trigger', () => {
      expect(cartographerPromptMetadata.keyTrigger).toBe(
        'Complex planning task → consult Cartographer',
      )
    })
  })

  describe('agent characteristics', () => {
    it('should mention subagent delegation in description', () => {
      const config = createCartographerConfig()
      const desc = config.description
      expect(desc).toContain('subagent delegation')
      expect(desc).toContain('fixed order')
    })
  })
})
