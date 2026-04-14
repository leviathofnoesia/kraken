/**
 * Signal: compactionRisk
 * Proximity to compaction trigger threshold.
 * Scales from 0 (safe) to 1 (at threshold).
 */

import type { SignalContext, SignalValue } from '../types'

export function extractCompactionRisk(ctx: SignalContext): SignalValue {
  if (ctx.contextLimit <= 0) {
    return { name: 'compactionRisk', value: 0, confidence: 0.1 }
  }

  const currentPressure = ctx.contextEstimate / ctx.contextLimit
  const threshold = ctx.stateCompactionTrigger

  // Start ramping up 15% before threshold
  const rampStart = threshold - 0.15

  if (currentPressure < rampStart) {
    return { name: 'compactionRisk', value: 0, confidence: 0.9 }
  }

  const value = Math.min((currentPressure - rampStart) / 0.15, 1.0)

  return {
    name: 'compactionRisk',
    value: Math.max(0, value),
    confidence: 0.9,
  }
}
