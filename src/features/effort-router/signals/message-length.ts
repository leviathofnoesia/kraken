/**
 * Signal: messageLength
 * Measures user message complexity by character count.
 * Uses sigmoid normalization centered at 500 chars.
 */

import type { SignalContext, SignalValue } from '../types'

const MIDPOINT = 500
const STEEPNESS = 300

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function extractMessageLength(ctx: SignalContext): SignalValue {
  const raw = ctx.messageText.length
  const value = sigmoid((raw - MIDPOINT) / STEEPNESS)

  return {
    name: 'messageLength',
    value: Math.max(0, Math.min(1, value)),
    confidence: raw > 20 ? 0.9 : 0.5,
  }
}
