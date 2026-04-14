/**
 * Signal: stallRate
 * Messages with no productive output (no file edits, no agent completions).
 * Normalized against a ceiling of 4 stalled messages.
 */

import type { SignalContext, SignalValue } from '../types'

const CEILING = 4

export function extractStallRate(ctx: SignalContext): SignalValue {
  const hasEdits = ctx.recentEdits.length > 0
  const hasAgentCalls = ctx.recentAgentCalls.length > 0

  if (hasEdits || hasAgentCalls) {
    return { name: 'stallRate', value: 0, confidence: 0.9 }
  }

  // Count recent tool calls — if we have tool calls but no edits/agents,
  // that's a moderate stall indicator
  const toolCallCount = ctx.recentToolCalls.length

  // No edits, no agents, some tools = moderate stall
  // No edits, no agents, no tools = full stall
  const stalledEstimate = toolCallCount === 0 ? CEILING : Math.ceil(CEILING / 2)

  const value = Math.min(stalledEstimate / CEILING, 1.0)

  return {
    name: 'stallRate',
    value,
    confidence: 0.5,
  }
}
