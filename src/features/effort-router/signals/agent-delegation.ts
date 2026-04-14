/**
 * Signal: agentDelegationDepth
 * Counts agent delegations weighted by nesting depth.
 * Normalized against a ceiling of 6 delegation-units.
 */

import type { AgentCallRecord, SignalContext, SignalValue } from '../types'

const CEILING = 6

function countDelegationUnits(calls: AgentCallRecord[]): number {
  let total = 0
  for (const call of calls) {
    total += 1 + call.subCalls.length * 0.5
  }
  return total
}

export function extractAgentDelegationDepth(ctx: SignalContext): SignalValue {
  const raw = countDelegationUnits(ctx.recentAgentCalls)
  const value = Math.min(raw / CEILING, 1.0)

  return {
    name: 'agentDelegationDepth',
    value,
    confidence: raw > 0 ? 0.85 : 0.3,
  }
}
