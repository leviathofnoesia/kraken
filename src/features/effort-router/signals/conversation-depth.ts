/**
 * Signal: conversationDepth
 * How deep into the session we are, normalized against 50 messages.
 */

import type { SignalContext, SignalValue } from '../types'

const DEPTH_CEILING = 50

export function extractConversationDepth(ctx: SignalContext): SignalValue {
  const value = Math.min(ctx.messageIndex / DEPTH_CEILING, 1.0)

  return {
    name: 'conversationDepth',
    value,
    confidence: 0.95,
  }
}
