/**
 * Test plan types and validation structures
 *
 * Defines the structures for test plan management, validation,
 * and requirement enforcement within the Blitzkrieg system.
 */

import type { TestCase } from './types'

/**
 * Represents the state of a test plan for a feature
 */
export interface TestPlanState {
  exists: boolean
  testCases: TestCase[]
  coverageTarget?: number
  approved: boolean
}

/**
 * Result of validating a test plan against requirements
 */
export interface TestPlanValidationResult {
  valid: boolean
  violations: TestPlanViolation[]
  recommendations: string[]
}

/**
 * Represents a specific test plan validation violation
 */
export interface TestPlanViolation {
  type: 'missing-test-cases' | 'insufficient-coverage' | 'missing-approval'
  details: string
  severity: 'error' | 'warning'
  testPath?: string
}

/**
 * Requirements for a test plan to be valid
 */
export interface TestPlanRequirements {
  minTestCases: number
  requireCoverageThreshold: boolean
  coverageThresholdPercent: number
  requiredBeforeImplementation: boolean
}

/**
 * Summary statistics for a test plan
 */
export interface TestPlanSummary {
  totalTestCases: number
  happyPathCases: number
  edgeCaseCases: number
  errorPathCases: number
  integrationCases: number
  coveragePercentage?: number
  approvalStatus: 'approved' | 'pending' | 'rejected' | 'none'
}

/**
 * Test plan validation options
 */
export interface TestPlanValidationOptions {
  enforceMinimumTestCases: boolean
  enforceCoverageThreshold: boolean
  requireApproval: boolean
  allowPartialImplementation: boolean
}

/**
 * Default validation options
 */
export const DEFAULT_TEST_PLAN_VALIDATION_OPTIONS: TestPlanValidationOptions = {
  enforceMinimumTestCases: true,
  enforceCoverageThreshold: true,
  requireApproval: false,
  allowPartialImplementation: false,
}

/**
 * Create a new empty test plan state
 */
export function createEmptyTestPlanState(): TestPlanState {
  return {
    exists: false,
    testCases: [],
    approved: false,
  }
}

/**
 * Validate a test plan against given requirements
 */
export function validateTestPlan(
  state: TestPlanState,
  requirements: TestPlanRequirements,
  options: TestPlanValidationOptions = DEFAULT_TEST_PLAN_VALIDATION_OPTIONS
): TestPlanValidationResult {
  const violations: TestPlanViolation[] = []
  const recommendations: string[] = []

  // Check if test plan exists
  if (!state.exists) {
    if (requirements.requiredBeforeImplementation) {
      violations.push({
        type: 'missing-test-cases',
        details: 'No test plan exists for this feature',
        severity: 'error',
      })
    }
    return { valid: false, violations, recommendations }
  }

  // Check minimum test cases
  if (options.enforceMinimumTestCases) {
    const testCaseCount = state.testCases.length
    if (testCaseCount < requirements.minTestCases) {
      violations.push({
        type: 'missing-test-cases',
        details: `Test plan has ${testCaseCount} test cases, minimum required is ${requirements.minTestCases}`,
        severity: 'error',
      })
      recommendations.push(`Add ${requirements.minTestCases - testCaseCount} more test cases`)
    }
  }

  // Check coverage threshold
  if (
    options.enforceCoverageThreshold &&
    requirements.requireCoverageThreshold &&
    requirements.coverageThresholdPercent > 0
  ) {
    if (state.coverageTarget === undefined) {
      violations.push({
        type: 'insufficient-coverage',
        details: 'Coverage target is not specified in test plan',
        severity: 'warning',
      })
      recommendations.push(`Specify coverage target (min ${requirements.coverageThresholdPercent}%)`)
    } else if (state.coverageTarget < requirements.coverageThresholdPercent) {
      violations.push({
        type: 'insufficient-coverage',
        details: `Coverage target ${state.coverageTarget}% is below required ${requirements.coverageThresholdPercent}%`,
        severity: 'error',
      })
      recommendations.push(
        `Increase coverage target to at least ${requirements.coverageThresholdPercent}%`
      )
    }
  }

  // Check approval status
  if (options.requireApproval && !state.approved) {
    violations.push({
      type: 'missing-approval',
      details: 'Test plan has not been approved',
      severity: 'error',
    })
    recommendations.push('Request approval for the test plan')
  }

  // Add recommendations based on test case distribution
  const testCaseCategories = new Set(state.testCases.map((tc) => tc.category))
  if (!testCaseCategories.has('edge-case') && options.enforceMinimumTestCases) {
    recommendations.push('Consider adding edge case tests for more comprehensive coverage')
  }
  if (!testCaseCategories.has('error-path') && options.enforceMinimumTestCases) {
    recommendations.push('Consider adding error path tests for error handling coverage')
  }

  return {
    valid: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
    recommendations,
  }
}

/**
 * Generate a summary of test plan statistics
 */
export function generateTestPlanSummary(state: TestPlanState): TestPlanSummary {
  const summary: TestPlanSummary = {
    totalTestCases: state.testCases.length,
    happyPathCases: 0,
    edgeCaseCases: 0,
    errorPathCases: 0,
    integrationCases: 0,
    coveragePercentage: state.coverageTarget,
    approvalStatus: state.approved ? 'approved' : 'pending',
  }

  if (!state.exists) {
    summary.approvalStatus = 'none'
    return summary
  }

  for (const testCase of state.testCases) {
    switch (testCase.category) {
      case 'happy-path':
        summary.happyPathCases++
        break
      case 'edge-case':
        summary.edgeCaseCases++
        break
      case 'error-path':
        summary.errorPathCases++
        break
      case 'integration':
        summary.integrationCases++
        break
    }
  }

  return summary
}

/**
 * Check if a test plan meets basic requirements for implementation to begin
 */
export function canBeginImplementation(
  state: TestPlanState,
  requirements: TestPlanRequirements
): boolean {
  if (!state.exists) {
    return !requirements.requiredBeforeImplementation
  }

  const result = validateTestPlan(state, requirements, {
    enforceMinimumTestCases: true,
    enforceCoverageThreshold: requirements.requireCoverageThreshold,
    requireApproval: false, // Allow implementation before approval
    allowPartialImplementation: false,
  })

  return result.valid
}
