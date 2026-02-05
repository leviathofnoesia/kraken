/**
 * Core Blitzkrieg type definitions
 *
 * Defines the foundational types for the Blitzkrieg verification system,
 * which enforces TDD workflows, test plan compliance, evidence verification,
 * and planner constraints.
 */

/**
 * Main Blitzkrieg configuration interface
 */
export interface BlitzkriegConfig {
  enabled: boolean
  testPlan: TestPlanConfig
  tddWorkflow: TddWorkflowConfig
  evidence: EvidenceConfig
  plannerConstraints: PlannerConstraintsConfig
}

/**
 * Configuration for test plan requirements
 */
export interface TestPlanConfig {
  requiredBeforeImplementation: boolean
  minTestCases: number
  requireCoverageThreshold: boolean
  coverageThresholdPercent: number
}

/**
 * Configuration for TDD workflow enforcement
 */
export interface TddWorkflowConfig {
  enforceWriteTestFirst: boolean
  forbidCodeWithoutTest: boolean
  allowRefactorWithoutTest: boolean
}

/**
 * Configuration for evidence requirements
 */
export interface EvidenceConfig {
  requireTestExecutionEvidence: boolean
  requireAssertionEvidence: boolean
  requireEdgeCaseEvidence: boolean
}

/**
 * Configuration for planner constraints
 */
export interface PlannerConstraintsConfig {
  requireTestStep: boolean
  requireVerificationStep: boolean
  maxImplementationStepComplexity: number
}

/**
 * Test plan requirement structure
 */
export interface TestPlanRequirement {
  minTestCases: number
  coverageThreshold?: number
  requiredBeforeImplementation: boolean
}

/**
 * Represents a single test case in a test plan
 */
export interface TestCase {
  description: string
  input: unknown
  expectedOutput: unknown
  category: 'happy-path' | 'edge-case' | 'error-path' | 'integration'
}

/**
 * Test evidence collected during verification
 */
export interface TestEvidence {
  testPath: string
  assertions: number
  edgeCasesCovered: number
  executionLog?: string
}

/**
 * Represents a constraint violation in planning
 */
export interface PlanningConstraintViolation {
  type: 'missing-test-step' | 'missing-verification' | 'excessive-complexity'
  taskId: string
  severity: 'error' | 'warning'
  message: string
}

/**
 * TDD workflow violation structure
 */
export interface TddViolation {
  type: 'code-without-test' | 'test-not-first'
  file: string
  line?: number
  severity: 'error' | 'warning'
}

/**
 * Possible TDD enforcement decisions
 */
export type TddDecision = 'allow' | 'block' | 'warn' | 'approve'

/**
 * Severity level for violations
 */
export type ViolationSeverity = 'error' | 'warning' | 'info'

/**
 * Category of test case
 */
export type TestCaseCategory = 'happy-path' | 'edge-case' | 'error-path' | 'integration'

/**
 * Type of constraint violation
 */
export type ConstraintViolationType =
  | 'missing-test-step'
  | 'missing-verification'
  | 'excessive-complexity'

/**
 * Type of TDD violation
 */
export type TddViolationType = 'code-without-test' | 'test-not-first'
