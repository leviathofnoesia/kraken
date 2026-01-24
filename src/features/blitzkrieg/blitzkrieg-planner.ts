/**
 * Planner constraint types and structures
 *
 * Defines the structures for enforcing planning discipline and
 * step complexity limits within the Blitzkrieg system.
 */

import type { PlanningConstraintViolation } from './types'

/**
 * Represents a single planning step
 */
export interface PlanningStep {
  id: string
  description: string
  type: 'implementation' | 'test' | 'verification' | 'planning'
  complexity: number
  dependencies: string[]
  estimatedTime?: number
}

/**
 * Result of checking planning constraints
 */
export interface ConstraintCheck {
  hasTestStep: boolean
  hasVerificationStep: boolean
  complexityValid: boolean
  violations: PlanningConstraintViolation[]
}

/**
 * Report on planning compliance
 */
export interface PlanningComplianceReport {
  compliant: boolean
  steps: PlanningStep[]
  violations: PlanningConstraintViolation[]
  suggestions: string[]
  complexityScore: number
}

/**
 * Configuration for planner constraint enforcement
 */
export interface PlannerConstraintConfig {
  requireTestStep: boolean
  requireVerificationStep: boolean
  maxImplementationStepComplexity: number
  enforceComplexitySeverity: 'block' | 'warn' | 'info'
  enforceStructureSeverity: 'block' | 'warn' | 'info'
}

/**
 * Statistics about planning steps
 */
export interface PlanningStepStatistics {
  totalSteps: number
  implementationSteps: number
  testSteps: number
  verificationSteps: number
  planningSteps: number
  averageComplexity: number
  maxComplexity: number
}

/**
 * Default planner constraint configuration
 */
export const DEFAULT_PLANNER_CONSTRAINT_CONFIG: PlannerConstraintConfig = {
  requireTestStep: true,
  requireVerificationStep: true,
  maxImplementationStepComplexity: 3,
  enforceComplexitySeverity: 'block',
  enforceStructureSeverity: 'block',
}

/**
 * Create a new planning step
 */
export function createPlanningStep(
  id: string,
  description: string,
  type: PlanningStep['type'],
  complexity: number = 1,
  dependencies: string[] = []
): PlanningStep {
  return {
    id,
    description,
    type,
    complexity: Math.max(1, Math.min(10, complexity)),
    dependencies,
  }
}

/**
 * Infer step type from description
 */
export function inferStepType(description: string): PlanningStep['type'] {
  const lowerDesc = description.toLowerCase()

  // Check verification first (more specific)
  const verificationKeywords = [
    'verify implementation',
    'validate results',
    'review code',
    'approve',
    'confirm',
    'verify',
    'validate',
    'check',
    'review',
  ]
  const planningKeywords = ['plan architecture', 'design solution', 'plan', 'design', 'architect', 'outline']

  // Test keywords (less specific, checked last)
  const testKeywords = ['test', 'spec', 'assert', 'mock', 'stub']

  // Check verification first
  if (verificationKeywords.some((kw) => lowerDesc.includes(kw))) {
    return 'verification'
  }
  if (planningKeywords.some((kw) => lowerDesc.includes(kw))) {
    return 'planning'
  }
  if (testKeywords.some((kw) => lowerDesc.includes(kw))) {
    return 'test'
  }

  return 'implementation'
}

/**
 * Estimate step complexity from description
 */
export function estimateComplexity(description: string): number {
  const lowerDesc = description.toLowerCase()
  let complexity = 1

  // Complexity indicators matching test expectations
  const complexityKeywords: Record<string, number> = {
    simple: 1,
    basic: 1,
    add: 2,
    create: 2,
    implement: 2,
    modify: 2,
    update: 2,
    refactor: 3,
    restructure: 3,
    reorganize: 3,
    integrate: 4,
    complex: 4,
    difficult: 5,
    'multi-file': 4,
    'cross-module': 5,
    very: 3,
    extremely: 4,
  }

  for (const [keyword, value] of Object.entries(complexityKeywords)) {
    if (lowerDesc.includes(keyword)) {
      complexity = Math.max(complexity, value)
    }
  }

  // Adjust based on length and structure
  const wordCount = description.split(/\s+/).length
  if (wordCount > 10) complexity += 1
  if (wordCount > 20) complexity += 1
  if (wordCount > 30) complexity += 1

  // Cap at 10
  return Math.min(10, complexity)
}

/**
 * Map block/warn/info severity to error/warning severity
 */
function mapSeverity(severity: 'block' | 'warn' | 'info'): 'error' | 'warning' {
  switch (severity) {
    case 'block':
      return 'error'
    case 'warn':
      return 'warning'
    default:
      return 'warning'
  }
}

/**
 * Check planning constraints
 */
export function checkPlanningConstraints(
  steps: PlanningStep[],
  config: PlannerConstraintConfig = DEFAULT_PLANNER_CONSTRAINT_CONFIG
): ConstraintCheck {
  const violations: PlanningConstraintViolation[] = []

  const hasTestStep = steps.some((s) => s.type === 'test')
  const hasVerificationStep = steps.some((s) => s.type === 'verification')

  // Check for test step requirement
  const implementationSteps = steps.filter((s) => s.type === 'implementation')
  if (config.requireTestStep && implementationSteps.length > 0 && !hasTestStep) {
    violations.push({
      type: 'missing-test-step',
      taskId: 'plan',
      severity: mapSeverity(config.enforceStructureSeverity),
      message: 'Plan contains implementation steps but no test step',
    })
  }

  // Check for verification step requirement
  if (
    config.requireVerificationStep &&
    implementationSteps.length > 0 &&
    !hasVerificationStep
  ) {
    violations.push({
      type: 'missing-verification',
      taskId: 'plan',
      severity: mapSeverity(config.enforceStructureSeverity),
      message: 'Plan contains implementation steps but no verification step',
    })
  }

  // Check implementation step complexity
  let complexityValid = true
  for (const step of implementationSteps) {
    if (step.complexity > config.maxImplementationStepComplexity) {
      violations.push({
        type: 'excessive-complexity',
        taskId: step.id,
        severity: mapSeverity(config.enforceComplexitySeverity),
        message: `Step "${step.description}" has complexity ${step.complexity}, exceeding maximum of ${config.maxImplementationStepComplexity}`,
      })
      complexityValid = false
    }
  }

  return {
    hasTestStep,
    hasVerificationStep,
    complexityValid,
    violations,
  }
}

/**
 * Generate planning compliance report
 */
export function generatePlanningComplianceReport(
  steps: PlanningStep[],
  config: PlannerConstraintConfig = DEFAULT_PLANNER_CONSTRAINT_CONFIG
): PlanningComplianceReport {
  const check = checkPlanningConstraints(steps, config)
  const suggestions: string[] = []

  // Generate suggestions based on violations
  if (!check.hasTestStep && config.requireTestStep) {
    suggestions.push(
      'Add test steps to verify the implementation works correctly'
    )
  }

  if (!check.hasVerificationStep && config.requireVerificationStep) {
    suggestions.push('Add a verification step to ensure quality before completion')
  }

  for (const violation of check.violations) {
    if (violation.type === 'excessive-complexity') {
      suggestions.push(
        `Break down complex step "${violation.taskId}" into smaller, more manageable tasks`
      )
    }
  }

  // Calculate complexity score
  const stats = calculatePlanningStepStatistics(steps)
  const complexityScore = calculateComplexityScore(stats)

  return {
    compliant: check.violations.filter((v) => v.severity === 'error').length === 0,
    steps,
    violations: check.violations,
    suggestions,
    complexityScore,
  }
}

/**
 * Calculate statistics about planning steps
 */
export function calculatePlanningStepStatistics(
  steps: PlanningStep[]
): PlanningStepStatistics {
  const stats: PlanningStepStatistics = {
    totalSteps: steps.length,
    implementationSteps: 0,
    testSteps: 0,
    verificationSteps: 0,
    planningSteps: 0,
    averageComplexity: 0,
    maxComplexity: 0,
  }

  if (steps.length === 0) {
    return stats
  }

  for (const step of steps) {
    switch (step.type) {
      case 'implementation':
        stats.implementationSteps++
        break
      case 'test':
        stats.testSteps++
        break
      case 'verification':
        stats.verificationSteps++
        break
      case 'planning':
        stats.planningSteps++
        break
    }

    stats.maxComplexity = Math.max(stats.maxComplexity, step.complexity)
  }

  const totalComplexity = steps.reduce((sum, s) => sum + s.complexity, 0)
  stats.averageComplexity = totalComplexity / steps.length

  return stats
}

/**
 * Calculate a complexity score for planning quality
 */
export function calculateComplexityScore(stats: PlanningStepStatistics): number {
  let score = 100

  // Penalize for high average complexity
  if (stats.averageComplexity > 5) {
    score -= (stats.averageComplexity - 5) * 10
  }

  // Penalize for very high max complexity
  if (stats.maxComplexity > 7) {
    score -= (stats.maxComplexity - 7) * 5
  }

  // Reward for having balanced step types
  const hasTests = stats.testSteps > 0
  const hasVerification = stats.verificationSteps > 0
  const hasPlanning = stats.planningSteps > 0

  if (hasTests) score += 5
  if (hasVerification) score += 5
  if (hasPlanning) score += 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Validate step dependencies
 */
export function validateStepDependencies(steps: PlanningStep[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const stepIds = new Set(steps.map((s) => s.id))

  for (const step of steps) {
    for (const depId of step.dependencies) {
      if (!stepIds.has(depId)) {
        errors.push(
          `Step "${step.id}" depends on non-existent step "${depId}"`
        )
      }
    }
  }

  // Check for circular dependencies
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function hasCycle(stepId: string): boolean {
    if (visited.has(stepId)) return false
    if (visiting.has(stepId)) return true

    visiting.add(stepId)
    const step = steps.find((s) => s.id === stepId)
    if (step) {
      for (const depId of step.dependencies) {
        if (hasCycle(depId)) {
          return true
        }
      }
    }
    visiting.delete(stepId)
    visited.add(stepId)
    return false
  }

  for (const step of steps) {
    if (hasCycle(step.id)) {
      errors.push(`Circular dependency detected involving step "${step.id}"`)
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a human-readable planning report
 */
export function generatePlanningReport(report: PlanningComplianceReport): string {
  const lines: string[] = []

  lines.push('Planning Compliance Report')
  lines.push('=========================')
  lines.push(`Compliant: ${report.compliant ? 'YES' : 'NO'}`)
  lines.push(`Complexity Score: ${report.complexityScore.toFixed(1)}/100`)

  const stats = calculatePlanningStepStatistics(report.steps)
  lines.push('\nStep Statistics:')
  lines.push(`  Total Steps: ${stats.totalSteps}`)
  lines.push(`  Implementation: ${stats.implementationSteps}`)
  lines.push(`  Test: ${stats.testSteps}`)
  lines.push(`  Verification: ${stats.verificationSteps}`)
  lines.push(`  Planning: ${stats.planningSteps}`)
  lines.push(`  Average Complexity: ${stats.averageComplexity.toFixed(1)}`)
  lines.push(`  Max Complexity: ${stats.maxComplexity}`)

  if (report.violations.length > 0) {
    lines.push('\nViolations:')
    for (const violation of report.violations) {
      lines.push(
        `  - [${violation.severity.toUpperCase()}] ${violation.type}: ${violation.message}`
      )
    }
  }

  if (report.suggestions.length > 0) {
    lines.push('\nSuggestions:')
    for (const suggestion of report.suggestions) {
      lines.push(`  - ${suggestion}`)
    }
  }

  return lines.join('\n')
}
