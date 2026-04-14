/**
 * Default State Profiles
 * Defines the behavioral configuration for each effort state.
 */

import type { StateProfile, EffortState } from '../types'

export const DEFAULT_STATE_PROFILES: Record<EffortState, StateProfile> = {
  TRIVIAL: {
    state: 'TRIVIAL',
    reasoningEffort: 'low',
    textVerbosity: 'low',
    thinkingBudget: 0,
    allowedAgentTiers: ['FREE'],
    maxConcurrentAgents: 0,
    toolOutputLimit: 5000,
    contextReservation: 0.1,
    compactionTrigger: 0.85,
    tokenBudgetCeiling: 2000,
    budgetAllocation: { thinking: 0.0, tools: 0.7, agents: 0.0, context: 0.3 },
  },
  STANDARD: {
    state: 'STANDARD',
    reasoningEffort: 'medium',
    textVerbosity: 'medium',
    thinkingBudget: 8000,
    allowedAgentTiers: ['FREE', 'CHEAP'],
    maxConcurrentAgents: 1,
    toolOutputLimit: 15000,
    contextReservation: 0.15,
    compactionTrigger: 0.8,
    tokenBudgetCeiling: 8000,
    budgetAllocation: { thinking: 0.3, tools: 0.35, agents: 0.25, context: 0.1 },
  },
  ELEVATED: {
    state: 'ELEVATED',
    reasoningEffort: 'medium',
    textVerbosity: 'high',
    thinkingBudget: 16000,
    allowedAgentTiers: ['FREE', 'CHEAP', 'EXPENSIVE'],
    maxConcurrentAgents: 2,
    toolOutputLimit: 30000,
    contextReservation: 0.2,
    compactionTrigger: 0.75,
    tokenBudgetCeiling: 20000,
    budgetAllocation: { thinking: 0.35, tools: 0.25, agents: 0.3, context: 0.1 },
  },
  INTENSIVE: {
    state: 'INTENSIVE',
    reasoningEffort: 'high',
    textVerbosity: 'high',
    thinkingBudget: 24000,
    allowedAgentTiers: ['FREE', 'CHEAP', 'EXPENSIVE'],
    maxConcurrentAgents: 3,
    toolOutputLimit: 50000,
    contextReservation: 0.25,
    compactionTrigger: 0.7,
    tokenBudgetCeiling: 40000,
    budgetAllocation: { thinking: 0.4, tools: 0.2, agents: 0.3, context: 0.1 },
  },
  DEEP_WORK: {
    state: 'DEEP_WORK',
    reasoningEffort: 'high',
    textVerbosity: 'high',
    thinkingBudget: 32000,
    allowedAgentTiers: ['FREE', 'CHEAP', 'EXPENSIVE'],
    maxConcurrentAgents: 4,
    toolOutputLimit: 80000,
    contextReservation: 0.3,
    compactionTrigger: 0.65,
    tokenBudgetCeiling: 80000,
    budgetAllocation: { thinking: 0.4, tools: 0.15, agents: 0.35, context: 0.1 },
  },
}

/**
 * Get a state profile, with optional overrides.
 */
export function getStateProfile(
  state: EffortState,
  overrides?: Partial<Record<EffortState, Partial<StateProfile>>>,
): StateProfile {
  const base = DEFAULT_STATE_PROFILES[state]
  const override = overrides?.[state]
  if (!override) return base
  return { ...base, ...override, state } as StateProfile
}
