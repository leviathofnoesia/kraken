import { describe, it, expect } from 'bun:test'
import {
  createCartographerConfig,
  cartographerAgent,
  cartographerPromptMetadata,
} from '../../src/agents/cartographer'

describe('Cartographer v2', () => {
  describe('createCartographerConfig', () => {
    it('should create agent config with correct default model', () => {
      const config = createCartographerConfig()
      expect(config).toBeDefined()
      expect(config.model).toBe('anthropic/claude-opus-4-5')
    })

    it('should accept custom model', () => {
      const config = createCartographerConfig('openai/gpt-4-turbo')
      expect(config.model).toBe('openai/gpt-4-turbo')
    })

    it('should default to primary mode', () => {
      const config = createCartographerConfig()
      expect(config.mode).toBe('primary')
    })

    it('should support subagent mode', () => {
      const config = createCartographerConfig(undefined, { mode: 'subagent' })
      expect(config.mode).toBe('subagent')
    })

    it('should set temperature for precision', () => {
      const config = createCartographerConfig()
      expect(config.temperature).toBe(0.2)
    })

    it('should enable extended thinking with 100k budget for Claude models', () => {
      const config = createCartographerConfig()
      expect(config.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 100000,
      })
    })

    it('should use reasoningEffort for GPT models', () => {
      const config = createCartographerConfig('openai/gpt-4-turbo')
      expect((config as any).reasoningEffort).toBe('high')
    })

    it('should block write and edit but allow task delegation', () => {
      const config = createCartographerConfig()
      expect(config.tools?.write).toBe(false)
      expect(config.tools?.edit).toBe(false)
      // task should NOT be disabled - Cartographer must delegate to subagents
      expect(config.tools?.task).toBeUndefined()
    })

    it('should inject PRIMARY MODE context when interactive', () => {
      const config = createCartographerConfig(undefined, { interactive: true })
      expect(config.prompt).toContain('PRIMARY MODE')
    })

    it('should inject SUBAGENT MODE context when not interactive', () => {
      const config = createCartographerConfig(undefined, { interactive: false })
      expect(config.prompt).toContain('SUBAGENT MODE')
    })

    it('should default to interactive in primary mode', () => {
      const config = createCartographerConfig(undefined, { mode: 'primary' })
      expect(config.prompt).toContain('PRIMARY MODE')
    })

    it('should default to non-interactive in subagent mode', () => {
      const config = createCartographerConfig(undefined, { mode: 'subagent' })
      expect(config.prompt).toContain('SUBAGENT MODE')
    })

    it('should append available agents when provided', () => {
      const config = createCartographerConfig(undefined, {
        availableAgents: ['Nautilus', 'Abyssal'],
      })
      expect(config.prompt).toContain('Available Agents')
      expect(config.prompt).toContain('Nautilus')
      expect(config.prompt).toContain('Abyssal')
    })

    it('should append available tools when provided', () => {
      const config = createCartographerConfig(undefined, {
        availableTools: ['grep', 'glob', 'lsp_find_references'],
      })
      expect(config.prompt).toContain('Available Tools')
      expect(config.prompt).toContain('grep')
    })
  })

  describe('system prompt content', () => {
    const config = createCartographerConfig()
    const prompt = config.prompt as string

    it('should include 4-phase methodology', () => {
      expect(prompt).toContain('Phase 1: Understand')
      expect(prompt).toContain('Phase 2: Gather')
      expect(prompt).toContain('Phase 3: Synthesize')
      expect(prompt).toContain('Phase 4: Verify')
    })

    it('should include verification gates', () => {
      expect(prompt).toContain('Arithmetic check')
      expect(prompt).toContain('Feasibility check')
      expect(prompt).toContain('Completeness check')
      expect(prompt).toContain('Never Skip')
    })

    it('should include quantitative rigor module', () => {
      expect(prompt).toContain('Quantitative Rigor Module')
      expect(prompt).toContain('Multi-seed search')
      expect(prompt).toContain('Local search improvement')
      expect(prompt).toContain('CHECK')
      expect(prompt).toContain('Slack analysis')
    })

    it('should include user interaction protocol', () => {
      expect(prompt).toContain('User Interaction Protocol')
      expect(prompt).toContain('Ask questions when')
      expect(prompt).toContain('Present checkpoints when')
    })

    it('should include anti-patterns as hard rules', () => {
      expect(prompt).toContain('Never claim optimality without evidence')
      expect(prompt).toContain('Never output unverified arithmetic')
      expect(prompt).toContain('Never narrate your process')
      expect(prompt).toContain('Never leave slack uninvestigated')
    })

    it('should NOT contain self-congratulatory language', () => {
      expect(prompt).not.toContain('bleeding-edge')
      expect(prompt).not.toContain('sophisticated')
      expect(prompt).not.toContain('Great plans enable great code')
    })

    it('should include subagent delegation guidance', () => {
      expect(prompt).toContain('Nautilus')
      expect(prompt).toContain('Abyssal')
      expect(prompt).toContain('Atlas')
      expect(prompt).toContain('Never delegate to yourself')
    })

    it('should include backup plan derivation rules', () => {
      expect(prompt).toContain('Derive backup plans from the main plan')
      expect(prompt).toContain('Never build backup plans from scratch')
    })
  })

  describe('cartographerAgent default export', () => {
    it('should export a valid default config', () => {
      expect(cartographerAgent).toBeDefined()
      expect(cartographerAgent.model).toBe('anthropic/claude-opus-4-5')
      expect(cartographerAgent.mode).toBe('primary')
    })
  })

  describe('cartographerPromptMetadata', () => {
    it('should have correct category', () => {
      expect(cartographerPromptMetadata.category).toBe('advisor')
    })

    it('should be marked as expensive', () => {
      expect(cartographerPromptMetadata.cost).toBe('EXPENSIVE')
    })

    it('should include optimization trigger', () => {
      const triggers = cartographerPromptMetadata.triggers
      const hasOptimization = triggers.some((t) => t.domain === 'Constrained Optimization')
      expect(hasOptimization).toBe(true)
    })

    it('should include code planning trigger', () => {
      const triggers = cartographerPromptMetadata.triggers
      const hasPlanning = triggers.some((t) => t.domain === 'Code Planning')
      expect(hasPlanning).toBe(true)
    })

    it('should define quantitative constraint use case', () => {
      expect(cartographerPromptMetadata.useWhen).toContain(
        'Tasks with quantitative constraints (budget, time, capacity)',
      )
    })

    it('should avoid when Kraken can plan inline', () => {
      expect(cartographerPromptMetadata.avoidWhen).toContain(
        'Tasks where Kraken can plan inline during PDSA',
      )
    })

    it('should have prompt alias', () => {
      expect(cartographerPromptMetadata.promptAlias).toBe('Cartographer')
    })

    it('should define key trigger', () => {
      expect(cartographerPromptMetadata.keyTrigger).toBe(
        'Complex planning task OR constrained optimization → consult Cartographer',
      )
    })
  })

  describe('config merge resilience', () => {
    it('should retain mode when merged with user overrides', () => {
      const config = createCartographerConfig()
      const merged = { ...config, model: 'openai/gpt-5' }
      expect(merged.mode).toBe('primary')
    })

    it('should retain thinking config when only temperature overridden', () => {
      const config = createCartographerConfig()
      const merged = { ...config, temperature: 0.5 }
      expect(merged.thinking).toBeDefined()
      expect(merged.prompt).toBeDefined()
      expect(merged.temperature).toBe(0.5)
    })

    it('should not lose mode when user override explicitly sets other fields', () => {
      const config = createCartographerConfig()
      const userOverride = { tools: { write: true, edit: true } }
      const merged = { ...config, ...userOverride }
      expect(merged.mode).toBe('primary')
      expect(merged.tools?.write).toBe(true)
    })
  })
})
