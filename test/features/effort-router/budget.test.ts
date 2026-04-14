import { describe, it, expect } from 'bun:test'
import {
  allocateBudget,
  trackSpend,
  calculateBudgetPressure,
  isBudgetPressureHigh,
} from '../../../src/features/effort-router/budget'
import { getStateProfile } from '../../../src/features/effort-router/classifier/state-profiles'
import type { EffortState, BudgetSpend } from '../../../src/features/effort-router/types'
import { emptyBudgetSpend } from '../../../src/features/effort-router/types'

describe('allocateBudget', () => {
  it('should allocate budget based on state profile', () => {
    const profile = getStateProfile('ELEVATED')
    const budget = allocateBudget(profile, 20000, 100000)

    expect(budget.total).toBeGreaterThan(0)
    expect(budget.thinking).toBeGreaterThan(0)
    expect(budget.tools).toBeGreaterThan(0)
    expect(budget.agents).toBeGreaterThan(0)
  })

  it('should reduce budget when context is tight', () => {
    const profile = getStateProfile('ELEVATED')
    const budgetNormal = allocateBudget(profile, 20000, 100000)
    const budgetTight = allocateBudget(profile, 95000, 100000)

    expect(budgetTight.total).toBeLessThan(budgetNormal.total)
  })

  it('should return zero budget when limit is zero', () => {
    const profile = getStateProfile('ELEVATED')
    const budget = allocateBudget(profile, 500, 0)

    expect(budget.total).toBe(0)
    expect(budget.thinking).toBe(0)
  })

  it('should give TRIVIAL state no thinking budget', () => {
    const profile = getStateProfile('TRIVIAL')
    const budget = allocateBudget(profile, 1000, 100000)

    expect(budget.thinking).toBe(0)
    expect(budget.tools).toBeGreaterThan(0)
  })

  it('should give DEEP_WORK state the most total budget', () => {
    const trivial = allocateBudget(getStateProfile('TRIVIAL'), 10000, 100000)
    const deepWork = allocateBudget(getStateProfile('DEEP_WORK'), 10000, 100000)

    expect(deepWork.total).toBeGreaterThan(trivial.total)
  })
})

describe('trackSpend', () => {
  it('should accumulate spend in categories', () => {
    let spend: BudgetSpend = emptyBudgetSpend()

    spend = trackSpend(spend, 'tools', 1000)
    expect(spend.tools).toBe(1000)
    expect(spend.total).toBe(1000)

    spend = trackSpend(spend, 'agents', 2000)
    expect(spend.agents).toBe(2000)
    expect(spend.total).toBe(3000)
  })
})

describe('calculateBudgetPressure', () => {
  it('should return 0 when no spend', () => {
    const pressure = calculateBudgetPressure(emptyBudgetSpend(), 100000)
    expect(pressure).toBe(0)
  })

  it('should calculate pressure correctly', () => {
    const spend = { thinking: 10000, tools: 30000, agents: 20000, total: 60000 }
    const pressure = calculateBudgetPressure(spend, 100000)
    // 60000 / (100000 * 0.8) = 0.75
    expect(pressure).toBeCloseTo(0.75, 2)
  })
})

describe('isBudgetPressureHigh', () => {
  it('should return false for low spend', () => {
    expect(isBudgetPressureHigh(emptyBudgetSpend(), 100000)).toBe(false)
  })

  it('should return true when over threshold', () => {
    const spend = { thinking: 30000, tools: 30000, agents: 20000, total: 80000 }
    expect(isBudgetPressureHigh(spend, 100000)).toBe(true)
  })
})

describe('getStateProfile', () => {
  it('should return valid profiles for all states', () => {
    const states: EffortState[] = ['TRIVIAL', 'STANDARD', 'ELEVATED', 'INTENSIVE', 'DEEP_WORK']

    for (const state of states) {
      const profile = getStateProfile(state)
      expect(profile.state).toBe(state)
      expect(profile.thinkingBudget).toBeGreaterThanOrEqual(0)
      expect(profile.tokenBudgetCeiling).toBeGreaterThan(0)
      expect(
        profile.budgetAllocation.thinking +
          profile.budgetAllocation.tools +
          profile.budgetAllocation.agents +
          profile.budgetAllocation.context,
      ).toBeCloseTo(1.0, 5)
    }
  })
})
