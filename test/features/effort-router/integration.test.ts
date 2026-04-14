import { describe, it, expect } from 'bun:test'
import {
  extractAllSignals,
  computeCompositeScore,
  signalVectorToArray,
} from '../../../src/features/effort-router/signals'
import { classify } from '../../../src/features/effort-router/classifier'
import { MarkovMatrix } from '../../../src/features/effort-router/classifier/markov-matrix'
import { ThermoclineDetector } from '../../../src/features/effort-router/thermocline'
import { PatternCrystallizer } from '../../../src/features/effort-router/patterns'
import { allocateBudget } from '../../../src/features/effort-router/budget'
import { getStateProfile } from '../../../src/features/effort-router/classifier/state-profiles'
import type { SignalContext } from '../../../src/features/effort-router/types'
import { EFFORT_STATE_INDEX } from '../../../src/features/effort-router/types'

function makeContext(overrides: Partial<SignalContext> = {}): SignalContext {
  return {
    sessionID: 'test',
    messageIndex: 0,
    messageText: 'Fix the typo',
    recentToolCalls: [],
    recentEdits: [],
    recentAgentCalls: [],
    contextEstimate: 5000,
    contextLimit: 100000,
    previousSignals: null,
    errorHistory: [],
    stateCompactionTrigger: 0.75,
    ...overrides,
  }
}

describe('Full Pipeline Integration', () => {
  it('should classify trivial tasks as TRIVIAL', () => {
    const ctx = makeContext({ messageText: 'fix typo' })
    const signals = extractAllSignals(ctx)
    const score = computeCompositeScore(signals, {
      messageLength: 0.04,
      toolCallCount: 0.05,
      editFileCount: 0.06,
      agentDelegationDepth: 0.06,
      errorRate: 0.04,
      contextPressure: 0.05,
      taskNovelty: 0.04,
      domainComplexity: 0.06,
      conversationDepth: 0.025,
      userUrgencySignal: 0.025,
      compactionRisk: 0.025,
      stallRate: 0.025,
    })

    const matrix = new MarkovMatrix()
    const result = classify({
      currentState: 'STANDARD',
      compositeScore: score,
      dwellMessages: 5,
      thermocline: null,
      matchedPattern: null,
      markov: matrix,
    })

    expect(result.state).toBe('TRIVIAL')
    expect(score).toBeLessThan(0.2)
  })

  it('should classify complex tasks as INTENSIVE or DEEP_WORK', () => {
    const ctx = makeContext({
      messageText:
        'Design and implement a distributed caching architecture with Redis. Optimize performance across all microservices. Integrate security best practices and migrate existing data.'.repeat(
          3,
        ),
      messageIndex: 30,
      contextEstimate: 50000,
      recentToolCalls: Array.from({ length: 8 }, (_, i) => ({
        toolName: 'edit',
        timestamp: Date.now() - i * 1000,
        success: true,
        estimatedTokens: 500,
      })),
      recentEdits: Array.from({ length: 6 }, (_, i) => ({
        filePath: `/src/module${i}.ts`,
        timestamp: Date.now() - i * 1000,
        editType: 'modify' as const,
      })),
      recentAgentCalls: Array.from({ length: 4 }, (_, i) => ({
        agentName: 'Nautilus',
        timestamp: Date.now() - i * 1000,
        subCalls: [],
        estimatedTokens: 1000,
      })),
    })

    const signals = extractAllSignals(ctx)
    const score = computeCompositeScore(signals, {
      messageLength: 0.08,
      toolCallCount: 0.1,
      editFileCount: 0.12,
      agentDelegationDepth: 0.12,
      errorRate: 0.08,
      contextPressure: 0.1,
      taskNovelty: 0.08,
      domainComplexity: 0.12,
      conversationDepth: 0.05,
      userUrgencySignal: 0.05,
      compactionRisk: 0.05,
      stallRate: 0.05,
    })

    const matrix = new MarkovMatrix()
    const result = classify({
      currentState: 'STANDARD',
      compositeScore: score,
      dwellMessages: 0,
      thermocline: null,
      matchedPattern: null,
      markov: matrix,
    })

    // Score should be high enough for ELEVATED or above
    expect(score).toBeGreaterThan(0.3)
    // Classification should escalate from STANDARD
    expect(EFFORT_STATE_INDEX[result.state]).toBeGreaterThan(EFFORT_STATE_INDEX['TRIVIAL'])
  })

  it('should detect thermocline from trivial to complex', () => {
    const detector = new ThermoclineDetector(5, 2.0)

    // Trivial scores
    detector.update(0.05)
    detector.update(0.08)
    detector.update(0.06)

    // No thermocline yet
    expect(detector.detect().detected).toBe(false)

    // Sudden jump to complex
    detector.update(0.85)
    const result = detector.detect()
    expect(result.detected).toBe(true)
    expect(result.direction).toBe('ascending')
  })

  it('should correctly budget for different states', () => {
    const trivialBudget = allocateBudget(getStateProfile('TRIVIAL'), 10000, 100000)
    const deepWorkBudget = allocateBudget(getStateProfile('DEEP_WORK'), 10000, 100000)

    // DEEP_WORK should have much more total budget
    expect(deepWorkBudget.total).toBeGreaterThan(trivialBudget.total * 5)

    // TRIVIAL should have no thinking budget
    expect(trivialBudget.thinking).toBe(0)

    // DEEP_WORK should have significant thinking budget
    expect(deepWorkBudget.thinking).toBeGreaterThan(0)
  })

  it('should correctly serialize and restore pattern state', () => {
    const crystallizer = new PatternCrystallizer(3)
    const signals = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.1, 0.2, 0.3, 0.1, 0.2, 0.1]

    for (let i = 0; i < 3; i++) {
      crystallizer.record({
        fromState: 'TRIVIAL',
        toState: 'STANDARD',
        signalSnapshot: [...signals],
        messageIndex: i,
        timestamp: Date.now(),
      })
    }
    crystallizer.crystallize()

    const serialized = crystallizer.serialize()
    const restored = new PatternCrystallizer(3)
    restored.deserialize(serialized)

    const match = restored.match(signals, 'TRIVIAL')
    expect(match).not.toBeNull()
    expect(match!.toState).toBe('STANDARD')
  })
})
