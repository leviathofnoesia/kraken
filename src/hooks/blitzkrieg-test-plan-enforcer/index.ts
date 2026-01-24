/**
 * Blitzkrieg Test Plan Enforcer Hook
 *
 * Enforces that test plans exist and meet requirements before implementation.
 * This hook validates that:
 * - Test plans exist for features being implemented
 * - Minimum test cases are defined
 * - Test plans are approved (if required)
 * - Coverage thresholds are specified (if required)
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { OpenCodeXConfig } from '../../config/schema'
import { validateTestPlan, canBeginImplementation, type TestPlanRequirements } from '../../features/blitzkrieg/blitzkrieg-test-plan'

/**
 * Test plan storage (in-memory for now)
 * In production, this could be backed by a database or file system
 */
interface TestPlanStore {
  [featurePath: string]: {
    exists: boolean
    testCases: number
    coverageTarget?: number
    approved: boolean
  }
}

const testPlanStore: TestPlanStore = {}

/**
 * Register a test plan for a feature
 */
export function registerTestPlan(
  featurePath: string,
  testCaseCount: number,
  coverageTarget?: number,
  approved: boolean = false
): void {
  testPlanStore[featurePath] = {
    exists: true,
    testCases: testCaseCount,
    coverageTarget,
    approved,
  }
}

/**
 * Check if a file path corresponds to an implementation file
 */
function isImplementationFile(filePath: string): boolean {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__/,
    /\/test\//,
    /\/tests\//,
    /node_modules/,
    /\.md$/,
    /\.json$/,
  ]
  return !testPatterns.some((pattern) => pattern.test(filePath))
}

/**
 * Extract feature path from file path
 */
function getFeaturePath(filePath: string): string {
  // Remove file extension and normalize path
  const normalized = filePath.replace(/\.(ts|tsx|js|jsx)$/, '')
  // Remove test/suffixes if present
  return normalized.replace(/\.test$|\.spec$/, '')
}

/**
 * Get test plan state from store
 */
function getTestPlanState(featurePath: string) {
  const plan = testPlanStore[featurePath]
  return plan
    ? {
        exists: true,
        testCases: Array(plan.testCases).fill({} as any),
        coverageTarget: plan.coverageTarget,
        approved: plan.approved,
      }
    : {
        exists: false,
        testCases: [],
        approved: false,
      }
}

/**
 * Get configuration from the plugin input
 * Configuration is accessed via the config schema
 */
function getBlitzkriegConfig(input: PluginInput): OpenCodeXConfig['blitzkrieg'] | undefined {
  // Configuration is validated by the schema system
  // We access it through the plugin's config system
  const config = (input as any).config as OpenCodeXConfig | undefined
  return config?.blitzkrieg
}

/**
 * Create the test plan enforcer hook
 */
export function createBlitzkriegTestPlanEnforcerHook(input: PluginInput): Hooks {
  return {
    /**
     * Execute before tool operations
     * Validates test plan compliance for edit/write operations on implementation files
     */
    'tool.execute.before': async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig(input)

      // Skip if Blitzkrieg is disabled
      if (!blitzkriegConfig?.enabled) {
        return
      }

      const toolName = toolInput.tool

      // Only check edit and write operations
      if (toolName !== 'edit' && toolName !== 'write') {
        return
      }

      // Get file path from tool output arguments
      const args = toolOutput as any
      const filePath = args?.filePath as string

      // Skip if not an implementation file
      if (!filePath || !isImplementationFile(filePath)) {
        return
      }

      const testPlanConfig = blitzkriegConfig.testPlan

      // Skip if test plan before implementation is not required
      if (!testPlanConfig?.requiredBeforeImplementation) {
        return
      }

      const featurePath = getFeaturePath(filePath)
      const testPlanState = getTestPlanState(featurePath)

      const requirements: TestPlanRequirements = {
        minTestCases: testPlanConfig.minTestCases,
        requireCoverageThreshold: testPlanConfig.requireCoverageThreshold,
        coverageThresholdPercent: testPlanConfig.coverageThresholdPercent,
        requiredBeforeImplementation: testPlanConfig.requiredBeforeImplementation,
      }

      // Check if implementation can begin
      if (!canBeginImplementation(testPlanState, requirements)) {
        const validation = validateTestPlan(testPlanState, requirements)

        const violations = validation.violations.map((v: any) => v.details).join('; ')

        // Block the operation by throwing an error with a detailed message
        throw new Error(
          `Blitzkrieg Test Plan Violation: ${violations}. Please create a test plan for this feature before implementing. Use registerTestPlan('${featurePath}', testCaseCount, coverageTarget, approved) to register a test plan.`
        )
      }
    },
  }
}

/**
 * Create base hook using standard hook pattern
 */
export function createHook(input: PluginInput): Hooks {
  return createBlitzkriegTestPlanEnforcerHook(input)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'blitzkrieg-test-plan-enforcer' as const,
  priority: 100, // High priority to enforce before operations
  description:
    'Enforces test plan compliance before implementation. Validates that test plans exist, meet minimum test case requirements, and have required coverage targets specified.',
  version: '1.0.0',
}
