/**
 * State Classifier
 * Combines Markov prediction, rules fallback, thermocline detection,
 * and pattern crystallization into a single classification decision.
 */

import type { EffortState, ThermoclineResult, CrystallizedPattern } from '../types'
import { MarkovMatrix } from './markov-matrix'
import {
  classifyByScore,
  shouldTransition,
  applyThermoclineOverride,
  applyPatternOverride,
} from './rules-fallback'

export interface ClassificationInput {
  currentState: EffortState
  compositeScore: number
  dwellMessages: number
  thermocline: ThermoclineResult | null
  matchedPattern: CrystallizedPattern | null
  markov: MarkovMatrix
}

export interface ClassificationResult {
  state: EffortState
  source: 'markov' | 'rules' | 'thermocline' | 'pattern' | 'unchanged'
  confidence: number
  markovConfidence: number
}

const MARKOV_CONFIDENCE_THRESHOLD = 0.6

/**
 * Classify the current effort state.
 *
 * Priority order for overrides:
 * 1. Thermocline detection (immediate escalation/de-escalation)
 * 2. Crystallized pattern match
 * 3. Markov prediction (if confidence >= 0.6)
 * 4. Rules-based fallback
 */
export function classify(input: ClassificationInput): ClassificationResult {
  const { currentState, compositeScore, dwellMessages, thermocline, matchedPattern, markov } = input

  // Get Markov prediction
  const prediction = markov.predict(currentState)

  // Determine base candidate
  let candidate: EffortState
  let source: ClassificationResult['source']

  // Check thermocline first (highest priority override)
  const thermoclineOverride = applyThermoclineOverride(currentState, thermocline)
  if (thermoclineOverride !== null) {
    candidate = thermoclineOverride
    source = 'thermocline'
  } else {
    // Check crystallized pattern
    const patternOverride = applyPatternOverride(matchedPattern)
    if (patternOverride !== null) {
      candidate = patternOverride
      source = 'pattern'
    } else if (prediction.confidence >= MARKOV_CONFIDENCE_THRESHOLD) {
      // Use Markov prediction
      candidate = prediction.state
      source = 'markov'
    } else {
      // Fall back to rules
      candidate = classifyByScore(compositeScore)
      source = 'rules'
    }
  }

  // Apply hysteresis and dwell constraints
  if (candidate !== currentState) {
    const transitionOk = shouldTransition(currentState, candidate, compositeScore, dwellMessages)
    if (!transitionOk) {
      // Thermocline overrides dwell constraints for escalations
      if (source === 'thermocline' && thermocline?.direction === 'ascending') {
        // Allow immediate escalation on ascending thermocline
      } else {
        candidate = currentState
        source = 'unchanged'
      }
    }
  } else {
    source = 'unchanged'
  }

  return {
    state: candidate,
    source,
    confidence: source === 'markov' ? prediction.confidence : 0.8,
    markovConfidence: prediction.confidence,
  }
}
