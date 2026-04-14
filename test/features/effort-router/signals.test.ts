import { describe, it, expect } from 'bun:test'
import {
  extractAllSignals,
  computeCompositeScore,
  signalVectorToArray,
} from '../../../src/features/effort-router/signals'
import type { SignalContext } from '../../../src/features/effort-router/types'
import { SIGNAL_NAMES, emptySignalVector } from '../../../src/features/effort-router/types'

function makeContext(overrides: Partial<SignalContext> = {}): SignalContext {
  return {
    sessionID: 'test-session',
    messageIndex: 0,
    messageText: 'Fix the typo in the README',
    recentToolCalls: [],
    recentEdits: [],
    recentAgentCalls: [],
    contextEstimate: 1000,
    contextLimit: 100000,
    previousSignals: null,
    errorHistory: [],
    stateCompactionTrigger: 0.75,
    ...overrides,
  }
}

describe('Signal Extractors', () => {
  it('should extract all 12 signals', () => {
    const ctx = makeContext()
    const vector = extractAllSignals(ctx)

    expect(Object.keys(vector).length).toBe(12)
    for (const name of SIGNAL_NAMES) {
      expect(vector[name]).toBeDefined()
      expect(vector[name].name).toBe(name)
      expect(vector[name].value).toBeGreaterThanOrEqual(0)
      expect(vector[name].value).toBeLessThanOrEqual(1)
    }
  })

  it('should return low values for trivial tasks', () => {
    const ctx = makeContext({
      messageText: 'fix typo',
      recentToolCalls: [],
      recentEdits: [],
      recentAgentCalls: [],
    })
    const vector = extractAllSignals(ctx)

    expect(vector.messageLength.value).toBeLessThan(0.3)
    expect(vector.toolCallCount.value).toBe(0)
    expect(vector.editFileCount.value).toBe(0)
    expect(vector.agentDelegationDepth.value).toBe(0)
  })

  it('should return high values for complex tasks', () => {
    const ctx = makeContext({
      messageText:
        'Design and implement a distributed caching layer with Redis for our microservices architecture, including cache invalidation strategies and performance optimization across all service boundaries'.repeat(
          5,
        ),
      messageIndex: 45,
      contextEstimate: 85000,
      recentToolCalls: Array.from({ length: 12 }, (_, i) => ({
        toolName: 'edit',
        timestamp: Date.now() - i * 1000,
        success: true,
        estimatedTokens: 500,
      })),
      recentEdits: Array.from({ length: 8 }, (_, i) => ({
        filePath: `/src/module${i}.ts`,
        timestamp: Date.now() - i * 1000,
        editType: 'modify' as const,
      })),
      recentAgentCalls: Array.from({ length: 5 }, (_, i) => ({
        agentName: 'Nautilus',
        timestamp: Date.now() - i * 1000,
        subCalls: [],
        estimatedTokens: 1000,
      })),
    })
    const vector = extractAllSignals(ctx)

    expect(vector.messageLength.value).toBeGreaterThan(0.5)
    expect(vector.toolCallCount.value).toBe(1.0)
    expect(vector.editFileCount.value).toBe(1.0)
    expect(vector.agentDelegationDepth.value).toBeGreaterThan(0.5)
    expect(vector.contextPressure.value).toBeGreaterThan(0.5)
    expect(vector.conversationDepth.value).toBeGreaterThan(0.5)
  })

  it('should detect high urgency keywords', () => {
    const ctx = makeContext({ messageText: "Fix this ASAP, it's critical!" })
    const vector = extractAllSignals(ctx)
    expect(vector.userUrgencySignal.value).toBe(0.9)
  })

  it('should detect low urgency keywords', () => {
    const ctx = makeContext({ messageText: 'Carefully refactor the authentication module' })
    const vector = extractAllSignals(ctx)
    expect(vector.userUrgencySignal.value).toBe(0.3)
  })

  it('should detect skip urgency keywords', () => {
    const ctx = makeContext({ messageText: 'Just a quick rename' })
    const vector = extractAllSignals(ctx)
    expect(vector.userUrgencySignal.value).toBe(0.1)
  })

  it('should detect domain complexity keywords', () => {
    const ctx = makeContext({ messageText: 'Redesign the architecture for distributed caching' })
    const vector = extractAllSignals(ctx)
    expect(vector.domainComplexity.value).toBeGreaterThan(0.3)
  })

  it('should detect error rate correctly', () => {
    const ctx = makeContext({
      recentToolCalls: [
        { toolName: 'edit', timestamp: Date.now(), success: false, estimatedTokens: 100 },
        { toolName: 'edit', timestamp: Date.now(), success: false, estimatedTokens: 100 },
        { toolName: 'grep', timestamp: Date.now(), success: true, estimatedTokens: 100 },
        { toolName: 'grep', timestamp: Date.now(), success: true, estimatedTokens: 100 },
      ],
    })
    const vector = extractAllSignals(ctx)
    expect(vector.errorRate.value).toBe(0.5)
  })

  it('should detect compaction risk', () => {
    const ctx = makeContext({
      contextEstimate: 70000,
      contextLimit: 100000,
      stateCompactionTrigger: 0.75,
    })
    const vector = extractAllSignals(ctx)
    expect(vector.compactionRisk.value).toBeGreaterThan(0)
  })
})

describe('computeCompositeScore', () => {
  it('should return a score in [0, 1]', () => {
    const ctx = makeContext()
    const vector = extractAllSignals(ctx)
    const weights: Record<string, number> = {}
    for (const name of SIGNAL_NAMES) weights[name] = 1 / 12

    const score = computeCompositeScore(vector, weights)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('should return low score for trivial tasks', () => {
    const ctx = makeContext({ messageText: 'fix typo' })
    const vector = extractAllSignals(ctx)
    const weights: Record<string, number> = {}
    for (const name of SIGNAL_NAMES) weights[name] = 1 / 12

    const score = computeCompositeScore(vector, weights)
    expect(score).toBeLessThan(0.3)
  })
})

describe('signalVectorToArray', () => {
  it('should return 12 numbers', () => {
    const vector = emptySignalVector()
    const arr = signalVectorToArray(vector)
    expect(arr.length).toBe(12)
    for (const v of arr) {
      expect(typeof v).toBe('number')
    }
  })
})
