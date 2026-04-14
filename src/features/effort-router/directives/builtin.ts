/**
 * Built-in Micro-Directives
 * Composable behavioral overlays that don't warrant a full state change.
 */

import type { EffortRouterSessionState, MicroDirective } from '../types'

interface DirectiveDefinition {
  name: string
  description: string
  ttl: number
  priority: number
  trigger: (state: EffortRouterSessionState) => boolean
}

const BUILTIN_DIRECTIVES: DirectiveDefinition[] = [
  {
    name: 'prefer-grep-over-agent',
    description: 'Prefer direct grep over agent delegation for search tasks in TRIVIAL state',
    ttl: 3,
    priority: 10,
    trigger: (s) => s.currentState === 'TRIVIAL' && s.lastClassificationScore < 0.1,
  },
  {
    name: 'compact-early',
    description: 'Lower compaction trigger threshold due to budget pressure',
    ttl: 5,
    priority: 20,
    trigger: (s) => {
      const pressure = s.budgetSpend.total / 80000 // rough estimate
      return pressure > 0.8
    },
  },
  {
    name: 'stall-recovery',
    description: 'Suggest state reclassification after stalled messages',
    ttl: 1,
    priority: 15,
    trigger: (s) => s.dwellMessages >= 3 && s.budgetSpend.tools === 0,
  },
  {
    name: 'suppress-thinking',
    description: 'Disable thinking budget for confirmed TRIVIAL tasks',
    ttl: 3,
    priority: 5,
    trigger: (s) => s.currentState === 'TRIVIAL' && s.messageIndex > 2,
  },
  {
    name: 'agent-escalation',
    description: 'Allow EXPENSIVE agents temporarily during ascending thermocline',
    ttl: 3,
    priority: 25,
    trigger: (s) => {
      const window = s.thermoclineWindow
      if (window.length < 2) return false
      const last = window[window.length - 1]
      const prev = window[window.length - 2]
      return last - prev > 0.2 // rapid ascent
    },
  },
  {
    name: 'context-frugality',
    description: 'Reduce tool output limits when context window is filling up',
    ttl: 5,
    priority: 15,
    trigger: (s) => {
      // Rough heuristic: if we've been running a while and spending is high
      return s.messageIndex > 10 && s.budgetSpend.total > 50000
    },
  },
]

/**
 * Evaluate which directives should be active.
 * Returns new MicroDirective instances for triggered directives.
 */
export function evaluateDirectives(
  session: EffortRouterSessionState,
  disabledDirectives: string[] = [],
): MicroDirective[] {
  const active: MicroDirective[] = []

  // Decay existing directives
  const surviving = session.activeDirectives
    .map((d) => ({ ...d, remainingTtl: d.remainingTtl - 1 }))
    .filter((d) => d.remainingTtl > 0)

  // Check for existing active directives (by name)
  const activeNames = new Set(surviving.map((d) => d.name))

  // Evaluate new triggers
  for (const def of BUILTIN_DIRECTIVES) {
    if (disabledDirectives.includes(def.name)) continue
    if (activeNames.has(def.name)) continue

    try {
      if (def.trigger(session)) {
        active.push({
          name: def.name,
          description: def.description,
          ttl: def.ttl,
          priority: def.priority,
          remainingTtl: def.ttl,
        })
      }
    } catch {
      // Directive triggers should never throw
    }
  }

  return [...surviving, ...active]
}

/**
 * Get all built-in directive definitions (for reference/logging).
 */
export function getBuiltinDirectiveDefinitions(): ReadonlyArray<DirectiveDefinition> {
  return BUILTIN_DIRECTIVES
}
