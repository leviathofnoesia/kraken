import { describe, it, expect } from 'bun:test'
import { MarkovMatrix } from '../../../src/features/effort-router/classifier/markov-matrix'
import {
  classifyByScore,
  shouldTransition,
  applyThermoclineOverride,
  HYSTERESIS,
} from '../../../src/features/effort-router/classifier/rules-fallback'
import { classify } from '../../../src/features/effort-router/classifier'
import type { EffortState, ThermoclineResult } from '../../../src/features/effort-router/types'
import { EFFORT_STATE_INDEX } from '../../../src/features/effort-router/types'

describe('MarkovMatrix', () => {
  it('should start with uniform probabilities', () => {
    const matrix = new MarkovMatrix()
    const prediction = matrix.predict('STANDARD')

    expect(prediction.confidence).toBeCloseTo(0.2, 1) // 1/5 = 0.2
  })

  it('should learn from observations', () => {
    const matrix = new MarkovMatrix()

    // Observe STANDARD → ELEVATED many times
    for (let i = 0; i < 10; i++) {
      matrix.observe('STANDARD', 'ELEVATED')
    }

    const prediction = matrix.predict('STANDARD')
    expect(prediction.state).toBe('ELEVATED')
    expect(prediction.confidence).toBeGreaterThan(0.6)
  })

  it('should serialize and deserialize', () => {
    const matrix = new MarkovMatrix()
    matrix.observe('TRIVIAL', 'STANDARD')
    matrix.observe('STANDARD', 'ELEVATED')

    const data = matrix.serialize()
    const restored = new MarkovMatrix()
    restored.deserialize(data)

    const pred1 = matrix.predict('STANDARD')
    const pred2 = restored.predict('STANDARD')
    expect(pred1.state).toBe(pred2.state)
    expect(pred1.confidence).toBeCloseTo(pred2.confidence, 5)
  })
})

describe('classifyByScore', () => {
  it('should classify TRIVIAL for low scores', () => {
    expect(classifyByScore(0.05)).toBe('TRIVIAL')
    expect(classifyByScore(0.15)).toBe('TRIVIAL')
  })

  it('should classify STANDARD for mid-low scores', () => {
    expect(classifyByScore(0.25)).toBe('STANDARD')
    expect(classifyByScore(0.35)).toBe('STANDARD')
  })

  it('should classify ELEVATED for mid scores', () => {
    expect(classifyByScore(0.45)).toBe('ELEVATED')
    expect(classifyByScore(0.55)).toBe('ELEVATED')
  })

  it('should classify INTENSIVE for mid-high scores', () => {
    expect(classifyByScore(0.65)).toBe('INTENSIVE')
    expect(classifyByScore(0.75)).toBe('INTENSIVE')
  })

  it('should classify DEEP_WORK for high scores', () => {
    expect(classifyByScore(0.85)).toBe('DEEP_WORK')
    expect(classifyByScore(0.95)).toBe('DEEP_WORK')
  })
})

describe('shouldTransition', () => {
  it('should allow escalations that cross threshold + hysteresis', () => {
    const ok = shouldTransition('STANDARD', 'ELEVATED', 0.45, 0)
    expect(ok).toBe(true) // 0.45 >= 0.40 + 0.05
  })

  it('should reject escalations below threshold + hysteresis', () => {
    const ok = shouldTransition('STANDARD', 'ELEVATED', 0.42, 0)
    expect(ok).toBe(false) // 0.42 < 0.40 + 0.05
  })

  it('should reject de-escalations below minimum dwell time', () => {
    const ok = shouldTransition('ELEVATED', 'STANDARD', 0.3, 1)
    expect(ok).toBe(false)
  })

  it('should allow de-escalations after minimum dwell time', () => {
    const ok = shouldTransition('ELEVATED', 'STANDARD', 0.3, 5)
    expect(ok).toBe(true)
  })
})

describe('applyThermoclineOverride', () => {
  it('should return null when no thermocline', () => {
    expect(applyThermoclineOverride('STANDARD', null)).toBe(null)
  })

  it('should return null when thermocline not detected', () => {
    const t: ThermoclineResult = { detected: false, direction: null, magnitude: 0 }
    expect(applyThermoclineOverride('STANDARD', t)).toBe(null)
  })

  it('should escalate on ascending thermocline', () => {
    const t: ThermoclineResult = { detected: true, direction: 'ascending', magnitude: 1.5 }
    expect(applyThermoclineOverride('STANDARD', t)).toBe('ELEVATED')
  })

  it('should double-escalate on strong ascending thermocline', () => {
    const t: ThermoclineResult = { detected: true, direction: 'ascending', magnitude: 2.5 }
    expect(applyThermoclineOverride('STANDARD', t)).toBe('INTENSIVE')
  })

  it('should de-escalate on descending thermocline', () => {
    const t: ThermoclineResult = { detected: true, direction: 'descending', magnitude: 1.0 }
    expect(applyThermoclineOverride('ELEVATED', t)).toBe('STANDARD')
  })
})

describe('classify (integration)', () => {
  it('should use rules fallback when Markov has no data', () => {
    const matrix = new MarkovMatrix()
    const result = classify({
      currentState: 'STANDARD',
      compositeScore: 0.65,
      dwellMessages: 5,
      thermocline: null,
      matchedPattern: null,
      markov: matrix,
    })

    // Markov confidence is low (0.2), so rules should be used
    expect(result.source).toBe('rules')
  })

  it('should detect thermocline override', () => {
    const matrix = new MarkovMatrix()
    const result = classify({
      currentState: 'TRIVIAL',
      compositeScore: 0.5,
      dwellMessages: 0,
      thermocline: { detected: true, direction: 'ascending', magnitude: 2.0 },
      matchedPattern: null,
      markov: matrix,
    })

    expect(result.source).toBe('thermocline')
    expect(result.state).toBe('ELEVATED') // TRIVIAL + 2 steps = ELEVATED
  })
})
