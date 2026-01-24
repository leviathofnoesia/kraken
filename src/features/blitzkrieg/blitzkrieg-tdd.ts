/**
 * TDD workflow enforcement types and structures
 *
 * Defines the structures for enforcing test-driven development practices,
 * including test-first discipline and code-test correspondence.
 */

import type { TddViolation, TddDecision } from './types'

/**
 * Represents the state of TDD workflow compliance
 */
export interface TddWorkflowState {
  testWrittenFirst: boolean
  codeHasTest: boolean
  isRefactor: boolean
  violations: TddViolation[]
  testFilePaths: string[]
  implementationFilePaths: string[]
}

/**
 * Configuration for TDD enforcement
 */
export interface TddEnforcementConfig {
  enforceWriteTestFirst: boolean
  forbidCodeWithoutTest: boolean
  allowRefactorWithoutTest: boolean
  enforceTestFirstSeverity: 'block' | 'warn' | 'info'
  forbidCodeWithoutTestSeverity: 'block' | 'warn' | 'info'
}

/**
 * Result of TDD compliance evaluation
 */
export interface TddComplianceResult {
  decision: TddDecision
  reason: string
  violations: TddViolation[]
  suggestions: string[]
}

/**
 * File operation context for TDD evaluation
 */
export interface FileOperationContext {
  filePath: string
  operation: 'read' | 'write' | 'edit'
  content: string
  timestamp: string
}

/**
 * TDD workflow session tracking
 */
export interface TddSession {
  sessionId: string
  startTime: string
  filesWritten: FileOperationContext[]
  testsWritten: FileOperationContext[]
  currentCompliance: TddWorkflowState
}

/**
 * Default TDD enforcement configuration
 */
export const DEFAULT_TDD_ENFORCEMENT_CONFIG: TddEnforcementConfig = {
  enforceWriteTestFirst: true,
  forbidCodeWithoutTest: true,
  allowRefactorWithoutTest: true,
  enforceTestFirstSeverity: 'block',
  forbidCodeWithoutTestSeverity: 'block',
}

/**
 * Create an empty TDD workflow state
 */
export function createEmptyTddWorkflowState(): TddWorkflowState {
  return {
    testWrittenFirst: false,
    codeHasTest: false,
    isRefactor: false,
    violations: [],
    testFilePaths: [],
    implementationFilePaths: [],
  }
}

/**
 * Create a new TDD session
 */
export function createTddSession(): TddSession {
  return {
    sessionId: generateSessionId(),
    startTime: new Date().toISOString(),
    filesWritten: [],
    testsWritten: [],
    currentCompliance: createEmptyTddWorkflowState(),
  }
}

/**
 * Check if a file is a test file
 */
export function isTestFile(filePath: string): boolean {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /\/__tests__\/.*\.[jt]sx?$/,
    /\/test\/[^\/]*\.[jt]sx?$/,
    /\/tests\/[^\/]*\.[jt]sx?$/,
  ]
  return testPatterns.some((pattern) => pattern.test(filePath))
}

/**
 * Check if a file is an implementation file
 */
export function isImplementationFile(filePath: string): boolean {
  // Exclude test files and common non-implementation directories
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /\/__tests__\//,
    /\/test\/[^\/]*\.[jt]sx?$/,
    /\/tests\/[^\/]*\.[jt]sx?$/,
    /node_modules/,
    /\/dist\//,
    /\/build\//,
  ]
  return !testPatterns.some((pattern) => pattern.test(filePath))
}

/**
 * Check if a code operation appears to be a refactor
 */
export function isRefactorOperation(
  content: string,
  previousContent?: string
): boolean {
  if (!previousContent) return false

  // Look for refactor keywords in the content
  const refactorKeywords = [
    /refactor/i,
    /extract/i,
    /restructure/i,
    /reorganize/i,
    /rename/i,
    /move.*function/i,
  ]

  // Check if there are refactor-related comments or patterns
  const hasRefactorKeywords = refactorKeywords.some((pattern) =>
    pattern.test(content)
  )

  // Check if operation preserves similar structure (within 80-150% of original)
  // Relaxed from 80-120% to allow for comment additions
  const isStructuralChange = content.length > previousContent.length * 0.8 &&
    content.length < previousContent.length * 1.5

  return hasRefactorKeywords && isStructuralChange
}

/**
 * Evaluate TDD compliance for a file operation
 */
export function evaluateTddCompliance(
  operation: FileOperationContext,
  session: TddSession,
  config: TddEnforcementConfig = DEFAULT_TDD_ENFORCEMENT_CONFIG,
  previousContent?: string
): TddComplianceResult {
  const violations: TddViolation[] = []
  const suggestions: string[] = []

  const isTest = isTestFile(operation.filePath)
  const isImpl = isImplementationFile(operation.filePath)

  if (isTest) {
    // Test file operation - update session state
    session.testsWritten.push(operation)
    session.currentCompliance.testWrittenFirst = true
    session.currentCompliance.testFilePaths.push(operation.filePath)

    return {
      decision: 'allow',
      reason: 'Test file operations are always allowed',
      violations: [],
      suggestions: [],
    }
  }

  if (!isImpl) {
    // Not an implementation file (could be config, docs, etc.)
    return {
      decision: 'allow',
      reason: 'Non-implementation file operations are not subject to TDD enforcement',
      violations: [],
      suggestions: [],
    }
  }

  // Implementation file operation
  session.filesWritten.push(operation)
  session.currentCompliance.implementationFilePaths.push(operation.filePath)

  // Check if this is a refactor operation
  const isRefactor = isRefactorOperation(operation.content, previousContent)
  session.currentCompliance.isRefactor = isRefactor

  if (isRefactor && config.allowRefactorWithoutTest) {
    return {
      decision: 'allow',
      reason: 'Refactor operations are allowed without new tests when configured',
      violations: [],
      suggestions: [],
    }
  }

  // Check test-first enforcement
  if (config.enforceWriteTestFirst && !session.currentCompliance.testWrittenFirst) {
    violations.push({
      type: 'test-not-first',
      file: operation.filePath,
      severity: config.enforceTestFirstSeverity as 'error' | 'warning',
    })
    suggestions.push('Write tests before implementing the feature (TDD test-first principle)')
  }

  // Check code-without-test enforcement
  if (config.forbidCodeWithoutTest && session.testsWritten.length === 0) {
    violations.push({
      type: 'code-without-test',
      file: operation.filePath,
      severity: config.forbidCodeWithoutTestSeverity as 'error' | 'warning',
    })
    suggestions.push('Write corresponding test files before implementation code')
  }

  // Determine decision based on violations and severity
  const hasBlockingViolation = violations.some((v) => v.severity === 'error')

  if (hasBlockingViolation) {
    return {
      decision: 'block',
      reason: 'TDD violation detected. See violation details for more information.',
      violations,
      suggestions,
    }
  } else if (violations.length > 0) {
    return {
      decision: 'warn',
      reason: 'TDD best practice not followed. Consider the following suggestions.',
      violations,
      suggestions,
    }
  }

  return {
    decision: 'allow',
    reason: 'Operation is TDD-compliant',
    violations: [],
    suggestions: [],
  }
}

/**
 * Generate a TDD compliance report for a session
 */
export function generateTddReport(session: TddSession): string {
  const lines: string[] = []

  lines.push('TDD Workflow Report')
  lines.push('====================')
  lines.push(`Session ID: ${session.sessionId}`)
  lines.push(`Start Time: ${session.startTime}`)

  const state = session.currentCompliance
  lines.push('\nCompliance State:')
  lines.push(`  Test Written First: ${state.testWrittenFirst}`)
  lines.push(`  Code Has Test: ${state.codeHasTest}`)
  lines.push(`  Is Refactor: ${state.isRefactor}`)
  lines.push(`  Violations: ${state.violations.length}`)

  if (state.violations.length > 0) {
    lines.push('\nViolations:')
    for (const violation of state.violations) {
      lines.push(`  - [${violation.severity.toUpperCase()}] ${violation.type} at ${violation.file}`)
    }
  }

  lines.push('\nFiles:')
  lines.push(`  Test Files: ${session.testsWritten.length}`)
  lines.push(`  Implementation Files: ${session.filesWritten.length}`)

  return lines.join('\n')
}

/**
 * Reset TDD session state for a new task
 */
export function resetTddSession(session: TddSession): TddSession {
  return {
    ...session,
    filesWritten: [],
    testsWritten: [],
    currentCompliance: createEmptyTddWorkflowState(),
  }
}

/**
 * Check if a TDD decision allows an operation
 */
export function isDecisionAllowed(decision: TddDecision): boolean {
  return decision === 'allow' || decision === 'approve'
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `tdd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
