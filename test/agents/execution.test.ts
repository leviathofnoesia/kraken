import { describe, it, expect, beforeEach } from 'bun:test'
import {
  AgentPipeline,
  getDefaultPipeline,
  resetDefaultPipeline,
} from '../../src/agents/execution/pipeline'
import {
  formatAgentOutput,
  formatJsonResponse,
  formatErrorResponse,
} from '../../src/agents/execution/output-formatters'
import {
  createContextInjectorMiddleware,
  createStatePublishingMiddleware,
  createDefaultMiddleware,
} from '../../src/agents/execution/context-injectors'
import type {
  AgentExecutionContext,
  AgentExecutionResult,
  DelegationClient,
} from '../../src/agents/execution/types'
import { AgentBus } from '../../src/agents/bus'

function mockClient(responses: string[] = ['Agent response']): DelegationClient {
  let callCount = 0
  return {
    session: {
      create: async () => ({ data: { id: `session-${++callCount}` } }),
      prompt: async () => ({}),
      messages: async () => ({
        data: [
          {
            role: 'assistant',
            parts: [
              { type: 'text', text: responses[Math.min(callCount - 1, responses.length - 1)] },
            ],
          },
        ],
      }),
    },
  }
}

describe('AgentPipeline', () => {
  beforeEach(() => {
    resetDefaultPipeline()
    AgentBus.reset()
  })

  describe('execute', () => {
    it('should execute delegation and return result', async () => {
      const pipeline = new AgentPipeline()
      const client = mockClient()

      const result = await pipeline.execute('Nautilus', 'Search for auth patterns', client)

      expect(result.success).toBe(true)
      expect(result.output).toBe('Agent response')
      expect(result.agent).toBe('Nautilus')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should handle client errors gracefully', async () => {
      const pipeline = new AgentPipeline()
      const client: DelegationClient = {
        session: {
          create: async () => {
            throw new Error('Connection refused')
          },
          prompt: async () => ({}) as any,
          messages: async () => ({}) as any,
        },
      }

      const result = await pipeline.execute('Nautilus', 'Search', client)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection refused')
    })

    it('should handle missing session ID', async () => {
      const pipeline = new AgentPipeline()
      const client: DelegationClient = {
        session: {
          create: async () => ({}),
          prompt: async () => ({}) as any,
          messages: async () => ({}) as any,
        },
      }

      const result = await pipeline.execute('Nautilus', 'Search', client)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create child session')
    })
  })

  describe('middleware', () => {
    it('should run before middleware', async () => {
      const pipeline = new AgentPipeline()
      const client = mockClient()

      pipeline.use({
        name: 'test-before',
        before(ctx) {
          return { ...ctx, enrichedPrompt: ctx.enrichedPrompt + '\n\nINJECTED' }
        },
      })

      const result = await pipeline.execute('Nautilus', 'Search', client)
      expect(result.success).toBe(true)
    })

    it('should run after middleware', async () => {
      const pipeline = new AgentPipeline()
      const client = mockClient()

      pipeline.use({
        name: 'test-after',
        after(ctx, result) {
          return { ...result, output: (result.output ?? '') + ' [MODIFIED]' }
        },
      })

      const result = await pipeline.execute('Nautilus', 'Search', client)
      expect(result.output).toContain('[MODIFIED]')
    })

    it('should run middleware in order (before forward, after reverse)', async () => {
      const pipeline = new AgentPipeline()
      const client = mockClient()
      const order: string[] = []

      pipeline.use({
        name: 'first',
        before(ctx) {
          order.push('before-1')
          return ctx
        },
        after(ctx, result) {
          order.push('after-1')
          return result
        },
      })
      pipeline.use({
        name: 'second',
        before(ctx) {
          order.push('before-2')
          return ctx
        },
        after(ctx, result) {
          order.push('after-2')
          return result
        },
      })

      await pipeline.execute('Nautilus', 'Search', client)
      expect(order).toEqual(['before-1', 'before-2', 'after-2', 'after-1'])
    })

    it('should survive middleware errors', async () => {
      const pipeline = new AgentPipeline()
      const client = mockClient()

      pipeline.use({
        name: 'failing',
        before() {
          throw new Error('middleware boom')
        },
      })

      const result = await pipeline.execute('Nautilus', 'Search', client)
      expect(result.success).toBe(true)
    })
  })

  describe('bus integration', () => {
    it('should publish pipeline:start and pipeline:complete events', async () => {
      const bus = AgentBus.getInstance()
      const events: any[] = []
      bus.subscribe('pipeline:start', (data) => events.push({ type: 'start', ...data }))
      bus.subscribe('pipeline:complete', (data) => events.push({ type: 'complete', ...data }))

      const pipeline = new AgentPipeline()
      await pipeline.execute('Nautilus', 'Search', mockClient())

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('start')
      expect(events[0].agent).toBe('Nautilus')
      expect(events[1].type).toBe('complete')
      expect(events[1].success).toBe(true)
    })

    it('should store results in bus state when parentSessionID provided', async () => {
      const bus = AgentBus.getInstance()
      const pipeline = new AgentPipeline()

      await pipeline.execute('Nautilus', 'Search', mockClient(), {
        parentSessionID: 'parent-1',
      })

      const keys = bus.getSessionKeys('parent-1')
      expect(keys.some((k) => k.startsWith('last_nautilus_result'))).toBe(true)
    })
  })
})

describe('getDefaultPipeline', () => {
  beforeEach(() => {
    resetDefaultPipeline()
  })

  it('should return a singleton pipeline', () => {
    const a = getDefaultPipeline()
    const b = getDefaultPipeline()
    expect(a).toBe(b)
  })

  it('should return a new pipeline after reset', () => {
    const a = getDefaultPipeline()
    resetDefaultPipeline()
    const b = getDefaultPipeline()
    expect(a).not.toBe(b)
  })
})

describe('output formatters', () => {
  describe('formatAgentOutput', () => {
    it('should format with metadata', () => {
      const result: AgentExecutionResult = {
        success: true,
        output: 'Hello',
        agent: 'Nautilus',
        duration: 123,
        metadata: {},
      }
      const output = formatAgentOutput(result)
      expect(output).toContain('Hello')
      expect(output).toContain('agent: Nautilus')
      expect(output).toContain('duration_ms: 123')
    })

    it('should format without metadata when disabled', () => {
      const result: AgentExecutionResult = {
        success: true,
        output: 'Hello',
        agent: 'Nautilus',
        duration: 123,
        metadata: {},
      }
      const output = formatAgentOutput(result, { includeMetadata: false })
      expect(output).toBe('Hello')
    })

    it('should truncate long output', () => {
      const result: AgentExecutionResult = {
        success: true,
        output: 'A'.repeat(200),
        agent: 'Nautilus',
        duration: 0,
        metadata: {},
      }
      const output = formatAgentOutput(result, { maxOutputLength: 50, includeMetadata: false })
      expect(output.length).toBeLessThan(200)
      expect(output).toContain('truncated')
    })
  })

  describe('formatJsonResponse', () => {
    it('should format as JSON with taskId from metadata', () => {
      const result: AgentExecutionResult = {
        success: true,
        output: 'done',
        agent: 'Nautilus',
        duration: 100,
        metadata: { taskId: 'task-123' },
      }
      const json = formatJsonResponse(result)
      const parsed = JSON.parse(json)
      expect(parsed.success).toBe(true)
      expect(parsed.taskId).toBe('task-123')
      expect(parsed.agent).toBe('Nautilus')
    })
  })

  describe('formatErrorResponse', () => {
    it('should create an error result', () => {
      const ctx: AgentExecutionContext = {
        agent: 'Nautilus',
        task: 'test',
        delegationDepth: 0,
        enrichedPrompt: 'test',
        metadata: {},
        startTime: Date.now() - 50,
      }
      const result = formatErrorResponse('Nautilus', 'Something broke', ctx)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Something broke')
      expect(result.duration).toBeGreaterThanOrEqual(50)
    })
  })
})

describe('context injectors', () => {
  describe('createContextInjectorMiddleware', () => {
    it('should inject context for known agents', () => {
      const mw = createContextInjectorMiddleware()
      expect(mw.name).toBe('context-injector')
      expect(mw.before).toBeDefined()
    })

    it('should enrich Nautilus prompt with project info', () => {
      const mw = createContextInjectorMiddleware()
      const ctx: AgentExecutionContext = {
        agent: 'Nautilus',
        task: 'Find patterns',
        delegationDepth: 0,
        enrichedPrompt: 'Find patterns',
        metadata: {},
        startTime: Date.now(),
      }
      const enriched = mw.before!(ctx) as AgentExecutionContext
      expect(enriched.enrichedPrompt.length).toBeGreaterThan(ctx.enrichedPrompt.length)
    })

    it('should inject MCP tool hints for Abyssal', () => {
      const mw = createContextInjectorMiddleware()
      const ctx: AgentExecutionContext = {
        agent: 'Abyssal',
        task: 'Research React hooks',
        delegationDepth: 0,
        enrichedPrompt: 'Research React hooks',
        metadata: {},
        startTime: Date.now(),
      }
      const enriched = mw.before!(ctx) as AgentExecutionContext
      expect(enriched.enrichedPrompt).toContain('websearch')
    })
  })

  describe('createStatePublishingMiddleware', () => {
    it('should publish state on after hook', () => {
      AgentBus.reset()
      const bus = AgentBus.getInstance()

      const mw = createStatePublishingMiddleware()
      const ctx: AgentExecutionContext = {
        agent: 'Nautilus',
        task: 'test',
        delegationDepth: 0,
        enrichedPrompt: 'test',
        metadata: {},
        startTime: Date.now(),
        parentSessionID: 'parent-1',
      }
      const result: AgentExecutionResult = {
        success: true,
        output: 'found it',
        agent: 'Nautilus',
        duration: 100,
        metadata: {},
      }

      mw.after!(ctx, result)
      const keys = bus.getSessionKeys('parent-1')
      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe('createDefaultMiddleware', () => {
    it('should return two middlewares', () => {
      const mw = createDefaultMiddleware()
      expect(mw).toHaveLength(2)
      expect(mw[0].name).toBe('context-injector')
      expect(mw[1].name).toBe('state-publisher')
    })
  })
})
