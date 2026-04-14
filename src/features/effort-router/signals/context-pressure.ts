/**
 * Signal: contextPressure
 * How close the conversation is to the model's context window limit.
 */

import type { SignalContext, SignalValue } from '../types'

export function extractContextPressure(ctx: SignalContext): SignalValue {
  if (ctx.contextLimit <= 0) {
    return { name: 'contextPressure', value: 0, confidence: 0.1 }
  }

  const value = Math.min(ctx.contextEstimate / ctx.contextLimit, 1.0)

  return {
    name: 'contextPressure',
    value,
    confidence: 0.95,
  }
}
