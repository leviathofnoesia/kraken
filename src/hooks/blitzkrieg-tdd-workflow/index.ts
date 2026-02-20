/**
 * Blitzkrieg TDD Workflow Enforcer Hook
 *
 * Enforces test-driven development practices by ensuring:
 * - Tests are written before implementation code (test-first)
 * - Implementation code has corresponding tests
 * - Refactor operations can optionally be allowed without new tests
 */

import type { Hooks } from '@opencode-ai/plugin'
import { readFile } from 'node:fs/promises'
import { getBlitzkriegConfig as getConfig } from '../../config/manager'
import {
  evaluateTddCompliance,
  isTestFile,
  isImplementationFile,
  isRefactorOperation,
  type TddEnforcementConfig,
  type FileOperationContext,
} from '../../features/blitzkrieg/blitzkrieg-tdd'

/**
 * TDD session tracking per request
 */
interface TddSession {
  sessionId: string
  testsWritten: string[]
  implementationFilesWritten: string[]
}

const activeSessions = new Map<string, TddSession>()

/**
 * Get or create TDD session for a request
 */
function getOrCreateSession(sessionId: string): TddSession {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      sessionId,
      testsWritten: [],
      implementationFilesWritten: [],
    })
  }
  return activeSessions.get(sessionId)!
}

/**
 * Clear TDD session for a request
 */
function clearSession(sessionId: string): void {
  activeSessions.delete(sessionId)
}

/**
 * Get previous file content (for refactor detection)
 */
async function getPreviousFileContent(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }
    return undefined
  }
}

/**
 * Create TDD workflow enforcer hook
 */
export function createBlitzkriegTddWorkflowHook(): Hooks {
  return {
    /**
     * Execute before tool operations
     * Validates TDD compliance for edit/write operations on implementation files
     */
    'tool.execute.before': async (toolInput, toolOutput) => {
      const blitzkriegConfig = getConfig()

      // Skip if Blitzkrieg is disabled
      if (!blitzkriegConfig?.enabled) {
        return
      }

      const toolName = toolInput.tool
      const sessionId = toolInput.sessionID

      // Only check edit and write operations
      if (toolName !== 'edit' && toolName !== 'write') {
        return
      }

      const args = toolOutput as any
      const filePath = args?.filePath as string

      // Skip if no file path
      if (!filePath) {
        return
      }

      const session = getOrCreateSession(sessionId)

      // Check if this is a test file
      if (isTestFile(filePath)) {
        session.testsWritten.push(filePath)
        return
      }

      // Check if this is an implementation file
      if (!isImplementationFile(filePath)) {
        // Not a test or implementation file (could be config, docs, etc.)
        return
      }

      const tddConfig = blitzkriegConfig.tddWorkflow

      // Build TDD enforcement config
      const enforcementConfig: TddEnforcementConfig = {
        enforceWriteTestFirst: tddConfig.enforceWriteTestFirst,
        forbidCodeWithoutTest: tddConfig.forbidCodeWithoutTest,
        allowRefactorWithoutTest: tddConfig.allowRefactorWithoutTest,
        enforceTestFirstSeverity: 'block',
        forbidCodeWithoutTestSeverity: 'block',
      }

      // Get previous content to check if this is a refactor
      const previousContent = await getPreviousFileContent(filePath)

      // Create operation context
      const operation: FileOperationContext = {
        filePath,
        operation: toolName as 'read' | 'write' | 'edit',
        content: (args?.content as string) || '',
        timestamp: new Date().toISOString(),
      }

      // Evaluate TDD compliance
      const result = evaluateTddCompliance(
        operation,
        {
          sessionId,
          startTime: new Date().toISOString(),
          filesWritten: session.implementationFilesWritten.map((fp) => ({
            filePath: fp,
            operation: 'write',
            content: '',
            timestamp: new Date().toISOString(),
          })),
          testsWritten: session.testsWritten.map((tp) => ({
            filePath: tp,
            operation: 'write',
            content: '',
            timestamp: new Date().toISOString(),
          })),
          currentCompliance: {
            testWrittenFirst: session.testsWritten.length > 0,
            codeHasTest: false,
            isRefactor: isRefactorOperation(operation.content, previousContent),
            violations: [],
            testFilePaths: session.testsWritten,
            implementationFilePaths: session.implementationFilesWritten,
          },
        },
        enforcementConfig,
        previousContent,
      )

      // Track the implementation file
      session.implementationFilesWritten.push(filePath)

      // Check if operation is allowed
      if (result.decision === 'block') {
        // Block with detailed error message
        const violations = result.violations.map((v: any) => `${v.type}: ${v.file}`).join('; ')
        throw new Error(
          `Blitzkrieg TDD Violation: ${violations}. ${result.reason}\n\nSuggestions:\n${result.suggestions.map((s: string) => `  - ${s}`).join('\n')}`,
        )
      }

      // If warning, log it but allow operation
      if (result.decision === 'warn' && result.violations.length > 0) {
        // In production, could log warning to console or send notification
        // WARNING: This shows in TUI - consider using notification system instead
      }
    },

    /**
     * Execute after tool operations
     * Clean up session if needed
     */
    'tool.execute.after': async (toolInput) => {
      const sessionId = toolInput.sessionID
      // Optionally clear session after certain operations
      // For now, we keep the session alive to track state across multiple operations
    },
  }
}

/**
 * Create base hook using standard hook pattern
 */
export function createHook(): Hooks {
  return createBlitzkriegTddWorkflowHook()
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'blitzkrieg-tdd' as const,
  priority: 95, // High priority, but slightly lower than test plan enforcer
  description:
    'Enforces test-driven development practices. Validates that tests are written before implementation (test-first), implementation code has corresponding tests, and optionally allows refactor operations without new tests.',
  version: '1.0.0',
}
