import { describe, it, expect } from 'bun:test'
import { ThermoclineDetector } from '../../../src/features/effort-router/thermocline'
import { PatternCrystallizer } from '../../../src/features/effort-router/patterns'
import {
  cosineSimilarity,
  vectorMean,
} from '../../../src/features/effort-router/patterns/similarity'
import type { EffortState, TransitionRecord } from '../../../src/features/effort-router/types'

describe('ThermoclineDetector', () => {
  it('should not detect thermocline with fewer than 3 values', () => {
    const detector = new ThermoclineDetector()
    detector.update(0.3)
    detector.update(0.4)

    const result = detector.detect()
    expect(result.detected).toBe(false)
  })

  it('should detect ascending thermocline', () => {
    const detector = new ThermoclineDetector(5, 2.0)

    // Gradual scores
    detector.update(0.1)
    detector.update(0.12)
    detector.update(0.15)
    // Sudden jump
    detector.update(0.75)

    const result = detector.detect()
    expect(result.detected).toBe(true)
    expect(result.direction).toBe('ascending')
    expect(result.magnitude).toBeGreaterThan(0)
  })

  it('should detect descending thermocline', () => {
    const detector = new ThermoclineDetector(5, 2.0)

    // High scores
    detector.update(0.8)
    detector.update(0.78)
    detector.update(0.75)
    // Sudden drop
    detector.update(0.1)

    const result = detector.detect()
    expect(result.detected).toBe(true)
    expect(result.direction).toBe('descending')
  })

  it('should not detect thermocline for gradual changes', () => {
    const detector = new ThermoclineDetector(5, 2.0)

    detector.update(0.2)
    detector.update(0.25)
    detector.update(0.3)
    detector.update(0.35)

    const result = detector.detect()
    expect(result.detected).toBe(false)
  })

  it('should serialize and restore window', () => {
    const detector = new ThermoclineDetector()
    detector.update(0.1)
    detector.update(0.2)
    detector.update(0.3)

    const window = detector.getWindow()
    expect(window.length).toBe(3)

    const restored = new ThermoclineDetector()
    restored.setWindow(window)
    expect(restored.getWindow()).toEqual(window)
  })
})

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0, 5)
  })

  it('should return 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })

  it('should return 0 for empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0)
  })

  it('should handle different lengths', () => {
    expect(cosineSimilarity([1, 2], [1])).toBe(0)
  })
})

describe('vectorMean', () => {
  it('should compute centroid of vectors', () => {
    const result = vectorMean([
      [1, 2],
      [3, 4],
    ])
    expect(result[0]).toBeCloseTo(2, 5)
    expect(result[1]).toBeCloseTo(3, 5)
  })

  it('should return empty for no vectors', () => {
    expect(vectorMean([])).toEqual([])
  })
})

describe('PatternCrystallizer', () => {
  function makeTransition(from: EffortState, to: EffortState, msgIdx: number): TransitionRecord {
    return {
      fromState: from,
      toState: to,
      signalSnapshot: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.1, 0.2, 0.3, 0.1, 0.2, 0.1],
      messageIndex: msgIdx,
      timestamp: Date.now(),
    }
  }

  it('should not crystallize with fewer than threshold transitions', () => {
    const crystallizer = new PatternCrystallizer(3)
    crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', 1))
    crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', 2))

    const pattern = crystallizer.crystallize()
    expect(pattern).toBeNull()
  })

  it('should crystallize after threshold transitions with similar signals', () => {
    const crystallizer = new PatternCrystallizer(3)

    // Record 3 similar transitions
    for (let i = 0; i < 3; i++) {
      crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', i))
    }

    const pattern = crystallizer.crystallize()
    expect(pattern).not.toBeNull()
    expect(pattern!.fromState).toBe('TRIVIAL')
    expect(pattern!.toState).toBe('STANDARD')
    expect(pattern!.occurrences).toBe(3)
  })

  it('should match signals against crystallized patterns', () => {
    const crystallizer = new PatternCrystallizer(3)
    const signals = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.1, 0.2, 0.3, 0.1, 0.2, 0.1]

    for (let i = 0; i < 3; i++) {
      crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', i))
    }
    crystallizer.crystallize()

    const match = crystallizer.match(signals, 'TRIVIAL')
    expect(match).not.toBeNull()
    expect(match!.toState).toBe('STANDARD')
  })

  it('should decay stale patterns', () => {
    const crystallizer = new PatternCrystallizer(3, 5, 20)

    for (let i = 0; i < 3; i++) {
      crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', i))
    }
    crystallizer.crystallize()

    expect(crystallizer.getPatterns().length).toBe(1)

    // Decay at message 25 (last seen at message 2, decay at 20)
    crystallizer.decay(25)
    expect(crystallizer.getPatterns().length).toBe(0)
  })

  it('should serialize and deserialize patterns', () => {
    const crystallizer = new PatternCrystallizer(3)

    for (let i = 0; i < 3; i++) {
      crystallizer.record(makeTransition('TRIVIAL', 'STANDARD', i))
    }
    crystallizer.crystallize()

    const data = crystallizer.serialize()
    expect(data.length).toBe(1)

    const restored = new PatternCrystallizer(3)
    restored.deserialize(data)
    expect(restored.getPatterns().length).toBe(1)
    expect(restored.getPatterns()[0].fromState).toBe('TRIVIAL')
  })
})
