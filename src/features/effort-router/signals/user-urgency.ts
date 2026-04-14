/**
 * Signal: userUrgencySignal
 * Keyword detection for urgency markers.
 * Classifies as high, low, skip, or neutral urgency.
 */

import type { SignalContext, SignalValue } from '../types'

const URGENCY_HIGH = ['asap', 'urgent', 'critical', 'emergency', 'immediately', 'right now']
const URGENCY_LOW = ['carefully', 'think about', 'consider', 'thoroughly', 'properly', 'precisely']
const URGENCY_SKIP = ['quick', 'fast', 'simple', 'just', 'only', 'briefly']

export function extractUserUrgencySignal(ctx: SignalContext): SignalValue {
  const text = ctx.messageText.toLowerCase()

  // Check high urgency
  for (const keyword of URGENCY_HIGH) {
    if (text.includes(keyword)) {
      return { name: 'userUrgencySignal', value: 0.9, confidence: 0.85 }
    }
  }

  // Check skip/low-effort markers
  for (const keyword of URGENCY_SKIP) {
    if (text.includes(keyword)) {
      return { name: 'userUrgencySignal', value: 0.1, confidence: 0.8 }
    }
  }

  // Check low urgency (careful/thorough)
  for (const keyword of URGENCY_LOW) {
    if (text.includes(keyword)) {
      return { name: 'userUrgencySignal', value: 0.3, confidence: 0.8 }
    }
  }

  // Neutral
  return { name: 'userUrgencySignal', value: 0.5, confidence: 0.3 }
}
