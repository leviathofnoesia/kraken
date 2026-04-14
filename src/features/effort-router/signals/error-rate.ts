/**
 * Signal: errorRate
 * Ratio of failed tool calls to total tool calls.
 */

import type { SignalContext, SignalValue } from '../types'

export function extractErrorRate(ctx: SignalContext): SignalValue {
  const total = ctx.recentToolCalls.length

  if (total === 0) {
    return { name: 'errorRate', value: 0, confidence: 0.3 }
  }

  const failed = ctx.recentToolCalls.filter((t) => !t.success).length
  const value = failed / total

  return {
    name: 'errorRate',
    value,
    confidence: total >= 3 ? 0.9 : 0.6,
  }
}
