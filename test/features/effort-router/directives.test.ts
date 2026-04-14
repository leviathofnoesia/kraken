import { describe, it, expect } from 'bun:test'
import {
  evaluateDirectives,
  getBuiltinDirectiveDefinitions,
} from '../../../src/features/effort-router/directives/builtin'
import type {
  EffortRouterSessionState,
  MicroDirective,
} from '../../../src/features/effort-router/types'
import { emptyBudgetSpend } from '../../../src/features/effort-router/types'

function makeSession(overrides: Partial<EffortRouterSessionState> = {}): EffortRouterSessionState {
  return {
    sessionID: 'test',
    currentState: 'STANDARD',
    messageIndex: 5,
    dwellMessages: 0,
    signalHistory: [],
    markovCounts: Array.from({ length: 5 }, () => Array(5).fill(0)),
    thermoclineWindow: [],
    transitionHistory: [],
    crystallizedPatterns: [],
    budgetSpend: emptyBudgetSpend(),
    activeDirectives: [],
    signalWeights: {},
    disabled: false,
    lastClassificationScore: 0.3,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('evaluateDirectives', () => {
  it('should trigger suppress-thinking for TRIVIAL state after message 2', () => {
    const session = makeSession({
      currentState: 'TRIVIAL',
      messageIndex: 3,
      lastClassificationScore: 0.05,
    })

    const directives = evaluateDirectives(session)
    const names = directives.map((d) => d.name)
    expect(names).toContain('suppress-thinking')
  })

  it('should trigger prefer-grep-over-agent for very low TRIVIAL scores', () => {
    const session = makeSession({
      currentState: 'TRIVIAL',
      messageIndex: 1,
      lastClassificationScore: 0.05,
    })

    const directives = evaluateDirectives(session)
    const names = directives.map((d) => d.name)
    expect(names).toContain('prefer-grep-over-agent')
  })

  it('should not trigger disabled directives', () => {
    const session = makeSession({
      currentState: 'TRIVIAL',
      messageIndex: 3,
    })

    const directives = evaluateDirectives(session, ['suppress-thinking'])
    const names = directives.map((d) => d.name)
    expect(names).not.toContain('suppress-thinking')
  })

  it('should decay existing directives by reducing TTL', () => {
    const existing: MicroDirective = {
      name: 'test-directive',
      description: 'test',
      ttl: 3,
      priority: 10,
      remainingTtl: 1,
    }

    const session = makeSession({ activeDirectives: [existing] })
    const directives = evaluateDirectives(session)

    // TTL was 1, now 0, so it should be removed
    const testDirective = directives.find((d) => d.name === 'test-directive')
    expect(testDirective).toBeUndefined()
  })

  it('should keep directives with remaining TTL', () => {
    const existing: MicroDirective = {
      name: 'test-directive',
      description: 'test',
      ttl: 3,
      priority: 10,
      remainingTtl: 3,
    }

    const session = makeSession({ activeDirectives: [existing] })
    const directives = evaluateDirectives(session)

    const testDirective = directives.find((d) => d.name === 'test-directive')
    expect(testDirective).toBeDefined()
    expect(testDirective!.remainingTtl).toBe(2) // 3 - 1
  })
})

describe('getBuiltinDirectiveDefinitions', () => {
  it('should return 6 built-in directives', () => {
    const defs = getBuiltinDirectiveDefinitions()
    expect(defs.length).toBe(6)
  })

  it('should have expected directive names', () => {
    const defs = getBuiltinDirectiveDefinitions()
    const names = defs.map((d) => d.name)
    expect(names).toContain('prefer-grep-over-agent')
    expect(names).toContain('compact-early')
    expect(names).toContain('stall-recovery')
    expect(names).toContain('suppress-thinking')
    expect(names).toContain('agent-escalation')
    expect(names).toContain('context-frugality')
  })
})
