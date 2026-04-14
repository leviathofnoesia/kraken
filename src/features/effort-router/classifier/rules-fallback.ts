/**
 * Rules-Based Fallback Classifier
 * Deterministic threshold rules for state classification.
 * Used when Markov confidence is too low.
 */

import type { EffortState, ThermoclineResult } from '../types'
import { clampState, EFFORT_STATE_INDEX } from '../types'
import type { CrystallizedPattern } from '../types'

export interface ClassificationThresholds {
  trivial: number
  standard: number
  elevated: number
  intensive: number
}

export const DEFAULT_THRESHOLDS: ClassificationThresholds = {
  trivial: 0.2,
  standard: 0.4,
  elevated: 0.6,
  intensive: 0.8,
}

export const HYSTERESIS = 0.05
export const MIN_DWELL_MESSAGES = 3

/**
 * Classify effort state from a composite score using threshold rules.
 */
export function classifyByScore(
  score: number,
  thresholds: ClassificationThresholds = DEFAULT_THRESHOLDS,
): EffortState {
  if (score < thresholds.trivial) return 'TRIVIAL'
  if (score < thresholds.standard) return 'STANDARD'
  if (score < thresholds.elevated) return 'ELEVATED'
  if (score < thresholds.intensive) return 'INTENSIVE'
  return 'DEEP_WORK'
}

/**
 * Get the threshold boundary for a target state.
 */
function thresholdFor(state: EffortState, thresholds: ClassificationThresholds): number {
  switch (state) {
    case 'TRIVIAL':
      return 0
    case 'STANDARD':
      return thresholds.trivial
    case 'ELEVATED':
      return thresholds.standard
    case 'INTENSIVE':
      return thresholds.elevated
    case 'DEEP_WORK':
      return thresholds.intensive
  }
}

/**
 * Check if a transition should proceed given hysteresis constraints.
 */
export function shouldTransition(
  currentState: EffortState,
  candidateState: EffortState,
  score: number,
  dwellMessages: number,
  thresholds: ClassificationThresholds = DEFAULT_THRESHOLDS,
): boolean {
  if (candidateState === currentState) return true // no transition needed

  const isEscalation = EFFORT_STATE_INDEX[candidateState] > EFFORT_STATE_INDEX[currentState]

  if (isEscalation) {
    // Upward: must exceed threshold + hysteresis
    const required = thresholdFor(candidateState, thresholds) + HYSTERESIS
    return score >= required
  } else {
    // Downward: must fall below threshold - hysteresis AND satisfy dwell time
    if (dwellMessages < MIN_DWELL_MESSAGES) return false
    const lowerBound = thresholdFor(currentState, thresholds) - HYSTERESIS
    return score < lowerBound
  }
}

/**
 * Apply thermocline override to classification.
 */
export function applyThermoclineOverride(
  currentState: EffortState,
  thermocline: ThermoclineResult | null,
): EffortState | null {
  if (!thermocline || !thermocline.detected) return null

  if (thermocline.direction === 'ascending') {
    const steps = thermocline.magnitude > 1.5 ? 2 : 1
    return clampState(currentState, steps)
  }

  if (thermocline.direction === 'descending') {
    return clampState(currentState, -1)
  }

  return null
}

/**
 * Apply crystallized pattern match to classification.
 */
export function applyPatternOverride(pattern: CrystallizedPattern | null): EffortState | null {
  if (!pattern || pattern.confidence < 0.7) return null
  return pattern.toState
}
