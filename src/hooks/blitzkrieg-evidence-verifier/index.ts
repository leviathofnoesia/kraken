/**
 * Blitzkrieg Evidence Verifier Hook
 *
 * Verifies that test evidence exists before marking tasks complete.
 * Validates that:
 * - Test execution evidence exists
 * - Assertion count requirements are met
 * - Edge cases are covered
 * - Coverage threshold is met
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { OpenCodeXConfig } from '../../config/schema'
import { getBlitzkriegConfig as getConfig } from '../../config/manager'
import {
  verifyEvidence,
  createEvidenceReport,
  generateVerificationSummary,
  isVerificationSufficient,
  legacyVerifyEvidence,
  extractDeficiencies,
  type EvidenceRequirements,
  type EvidenceReport as BlitzkriegEvidenceReport,
} from '../../features/blitzkrieg/blitzkrieg-verification'

/**
 * Evidence storage per task/session
 */
interface EvidenceStore {
  [taskId: string]: {
    testFilePaths: string[]
    evidence?: BlitzkriegEvidenceReport
  }
}

const evidenceStore: EvidenceStore = {}

/**
 * Register test files for a task
 */
export function registerTestFiles(taskId: string, testFilePaths: string[]): void {
  if (!evidenceStore[taskId]) {
    evidenceStore[taskId] = {
      testFilePaths: [],
    }
  }
  evidenceStore[taskId].testFilePaths = testFilePaths
}

/**
 * Register evidence for a task
 */
export function registerEvidence(
  taskId: string,
  evidence: Partial<BlitzkriegEvidenceReport>,
): void {
  if (!evidenceStore[taskId]) {
    evidenceStore[taskId] = {
      testFilePaths: [],
    }
  }
  const existing = evidenceStore[taskId].evidence || createEvidenceReport()
  evidenceStore[taskId].evidence = {
    ...existing,
    ...evidence,
    testFilePaths: [...existing.testFilePaths, ...(evidence.testFilePaths || [])],
  }
}

/**
 * Get task ID from context
 * This is a simplified implementation - in production would extract from task context
 */
function getTaskId(toolInput: any): string {
  return toolInput.sessionID || 'default'
}

/**
 * Check if this is a task completion operation
 */
function isTaskCompletion(toolName: string): boolean {
  const completionKeywords = ['todowrite', 'task', 'complete', 'done']
  return completionKeywords.some((keyword) => toolName.toLowerCase().includes(keyword))
}

/**
 * Create the evidence verifier hook
 */
export function createBlitzkriegEvidenceVerifierHook(): Hooks {
  return {
    /**
     * Execute before tool operations
     * Verifies evidence exists before task completion
     */
    'tool.execute.before': async (toolInput, toolOutput) => {
      const blitzkriegConfig = getConfig()

      // Skip if Blitzkrieg is disabled
      if (!blitzkriegConfig?.enabled) {
        return
      }

      const toolName = toolInput.tool

      // Only check task completion operations
      if (!isTaskCompletion(toolName)) {
        return
      }

      const evidenceConfig = blitzkriegConfig.evidence

      // Skip if evidence verification is not required
      if (
        !evidenceConfig.requireTestExecutionEvidence &&
        !evidenceConfig.requireAssertionEvidence &&
        !evidenceConfig.requireEdgeCaseEvidence
      ) {
        return
      }

      const taskId = getTaskId(toolInput)
      const taskEvidence = evidenceStore[taskId]

      // If no evidence stored, check if this is allowed
      if (!taskEvidence) {
        throw new Error(
          `Blitzkrieg Evidence Verification: No evidence registered for task "${taskId}". Please register test files and evidence before marking task complete.`,
        )
      }

      // Verify evidence using the blitzkrieg verification engine
      const evidence = taskEvidence.evidence || createEvidenceReport()

      // If we have test execution evidence, run full verification
      if (evidence.testExecutionEvidence) {
        const requirements: EvidenceRequirements = {
          requireTestExecutionEvidence: evidenceConfig.requireTestExecutionEvidence,
          requireAssertionEvidence: evidenceConfig.requireAssertionEvidence,
          requireEdgeCaseEvidence: evidenceConfig.requireEdgeCaseEvidence,
          coverageThreshold: evidenceConfig.coverageThreshold,
        }

        const result = legacyVerifyEvidence(evidence, requirements)
        const summary = generateVerificationSummary(result)

        if (!isVerificationSufficient(result)) {
          const deficiencies = extractDeficiencies(result)
          const deficiencyReport = deficiencies
            .map((d) => `  [${d.severity}] ${d.type}: ${d.details} — ${d.suggestion}`)
            .join('\n')

          throw new Error(
            `Blitzkrieg Evidence Verification FAILED for task "${taskId}":\n${summary}\n\nDeficiencies:\n${deficiencyReport}`,
          )
        }

        console.log(
          `[blitzkrieg-evidence-verifier] Evidence verification PASSED for task ${taskId} (confidence: ${result.confidenceScore}%)`,
        )
      } else {
        // No test execution evidence — check if any test files were registered
        if (taskEvidence.testFilePaths.length > 0) {
          console.warn(
            `[blitzkrieg-evidence-verifier] Test files registered for task ${taskId} but no execution evidence captured. ` +
              `Run tests before marking task complete.`,
          )
        } else {
          throw new Error(
            `Blitzkrieg Evidence Verification: No evidence registered for task "${taskId}". ` +
              `Register test files and run tests before marking task complete.`,
          )
        }
      }
    },

    /**
     * Execute after tool operations
     * Could be used to automatically capture evidence from test runs
     */
    'tool.execute.after': async (toolInput, toolOutput) => {
      const blitzkriegConfig = getConfig()

      // Skip if Blitzkrieg is disabled
      if (!blitzkriegConfig?.enabled) {
        return
      }

      const toolName = toolInput.tool

      // Check if this is a test execution tool (e.g., bash running tests)
      if (toolName === 'bash') {
        const args = toolOutput as any
        const command = args?.command as string

        // If this looks like a test command, try to capture evidence
        if (command && isTestCommand(command)) {
          const taskId = getTaskId(toolInput)
          const output = (toolOutput as any).output as string

          if (output) {
            // Auto-register test execution evidence
            registerEvidence(taskId, {
              testExecutionEvidence: output,
            })
          }
        }
      }
    },
  }
}

/**
 * Check if a command is a test command
 */
function isTestCommand(command: string): boolean {
  const testPatterns = [
    /npm\s+test/i,
    /yarn\s+test/i,
    /pnpm\s+test/i,
    /pytest/i,
    /jest/i,
    /mocha/i,
    /vitest/i,
    /karma/i,
    /cypress/i,
    /playwright/i,
    /test\s+--?/,
  ]
  return testPatterns.some((pattern) => pattern.test(command))
}

/**
 * Create base hook using standard hook pattern
 */
export function createHook(): Hooks {
  return createBlitzkriegEvidenceVerifierHook()
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'blitzkrieg-evidence-verifier' as const,
  priority: 90, // High priority for evidence verification
  description:
    'Verifies test evidence exists before task completion. Validates that test execution evidence, assertion evidence, edge case evidence, and coverage thresholds are met as configured.',
  version: '1.0.0',
}
