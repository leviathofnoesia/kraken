/**
 * Budget Calculator
 * Allocates per-message token budgets based on state profile and remaining context.
 */

import type { StateProfile, Budget, BudgetSpend } from '../types'

/**
 * Allocate a per-message budget given the current state and context pressure.
 */
export function allocateBudget(
  profile: StateProfile,
  contextEstimate: number,
  contextLimit: number,
): Budget {
  if (contextLimit <= 0) {
    return { thinking: 0, tools: 0, agents: 0, context: 0, total: 0 }
  }

  const remainingRatio = 1 - contextEstimate / contextLimit
  let totalBudget = profile.tokenBudgetCeiling * remainingRatio

  // Aggressive scaling when context is tight
  if (remainingRatio < 0.3) {
    totalBudget *= Math.max(remainingRatio, 0.1)
  }

  const alloc = profile.budgetAllocation

  const thinking = Math.floor(totalBudget * alloc.thinking)
  const tools = Math.floor(totalBudget * alloc.tools)
  const agents = Math.floor(totalBudget * alloc.agents)
  const context = Math.floor(totalBudget * alloc.context)

  return {
    thinking,
    tools,
    agents,
    context,
    total: thinking + tools + agents + context,
  }
}

/**
 * Track cumulative budget spend.
 */
export function trackSpend(
  spend: BudgetSpend,
  category: 'thinking' | 'tools' | 'agents',
  amount: number,
): BudgetSpend {
  return {
    ...spend,
    [category]: spend[category] + amount,
    total: spend.total + amount,
  }
}

/**
 * Calculate budget pressure (0 to 1+).
 * 0.8 is the "budget pressure" threshold that triggers micro-directives.
 */
export function calculateBudgetPressure(spend: BudgetSpend, contextLimit: number): number {
  const budgetCeiling = contextLimit * 0.8
  if (budgetCeiling <= 0) return 0
  return spend.total / budgetCeiling
}

/**
 * Check if budget pressure has crossed the threshold.
 */
export function isBudgetPressureHigh(
  spend: BudgetSpend,
  contextLimit: number,
  threshold = 0.8,
): boolean {
  return calculateBudgetPressure(spend, contextLimit) >= threshold
}
