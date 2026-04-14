/**
 * Signal: toolCallCount
 * Counts tool invocations in recent messages.
 * Normalized against a ceiling of 10 calls.
 */

import type { SignalContext, SignalValue } from '../types'

const CEILING = 10

export function extractToolCallCount(ctx: SignalContext): SignalValue {
  const raw = ctx.recentToolCalls.length
  const value = Math.min(raw / CEILING, 1.0)

  return {
    name: 'toolCallCount',
    value,
    confidence: raw > 0 ? 0.9 : 0.4,
  }
}
