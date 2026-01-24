/**
 * Blitzkrieg Verification Feature
 *
 * Collects and verifies evidence from build/test outputs,
 * checks compliance against BlitzkriegConfig, and reports violations.
 * Integrates with test-plan feature for comprehensive verification.
 */

import type {
  BlitzkriegConfig,
  EvidenceConfig,
  TestEvidence,
  ViolationSeverity,
} from './types'
import type { TestPlanState, TestPlanSummary } from './blitzkrieg-test-plan'
import {
  generateTestPlanSummary,
  validateTestPlan,
  DEFAULT_TEST_PLAN_VALIDATION_OPTIONS,
} from './blitzkrieg-test-plan'

/**
 * Evidence collected from build and test outputs
 */
export interface CollectedEvidence {
  buildEvidence: BuildEvidence
  testEvidence: TestEvidence
  coverageEvidence: CoverageEvidence
  timestamp: string
}

/**
 * Build output evidence
 */
export interface BuildEvidence {
  success: boolean
  exitCode: number
  output: string
  errors: BuildError[]
  warnings: number
}

/**
 * Build error details
 */
export interface BuildError {
  file?: string
  line?: number
  column?: number
  message: string
  code: string
  severity: 'error' | 'warning' | 'info'
}

/**
 * Coverage evidence from test runs
 */
export interface CoverageEvidence {
  statementCoverage: number
  branchCoverage: number
  functionCoverage: number
  lineCoverage: number
  coverageOutput: string
  meetsThreshold: boolean
}

/**
 * Result of evidence verification
 */
export interface VerificationResult {
  compliant: boolean
  evidence: CollectedEvidence
  violations: EvidenceViolation[]
  warnings: EvidenceWarning[]
  summary: VerificationSummary
}

/**
 * Evidence violation details
 */
export interface EvidenceViolation {
  type: EvidenceViolationType
  message: string
  severity: ViolationSeverity
  details?: Record<string, unknown>
}

/**
 * Evidence violation types
 */
export type EvidenceViolationType =
  | 'build-failed'
  | 'no-test-execution'
  | 'no-assertions'
  | 'insufficient-coverage'
  | 'no-edge-cases'
  | 'missing-evidence'

/**
 * Evidence warning details
 */
export interface EvidenceWarning {
  type: EvidenceWarningType
  message: string
  suggestion?: string
}

/**
 * Evidence warning types
 */
export type EvidenceWarningType =
  | 'low-coverage'
  | 'partial-test-execution'
  | 'missing-coverage-data'
  | 'build-warnings'

/**
 * Summary of verification results
 */
export interface VerificationSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  totalAssertions: number
  passedAssertions: number
  edgeCasesCovered: number
  overallScore: number
}

/**
 * Verification options
 */
export interface VerificationOptions {
  strictMode: boolean
  ignoreWarnings: boolean
  coverageThreshold: number
  minAssertions: number
  minEdgeCases: number
}

/**
 * Default verification options
 */
export const DEFAULT_VERIFICATION_OPTIONS: VerificationOptions = {
  strictMode: false,
  ignoreWarnings: false,
  coverageThreshold: 80,
  minAssertions: 1,
  minEdgeCases: 1,
}

/**
 * Build output parser
 */
export class BuildOutputParser {
  /**
   * Parse build output for evidence
   */
  parse(output: string, exitCode: number): BuildEvidence {
    const errors = this.parseErrors(output)
    const warnings = this.countWarnings(output)

    return {
      success: exitCode === 0,
      exitCode,
      output,
      errors,
      warnings,
    }
  }

  /**
   * Parse errors from build output
   */
  private parseErrors(output: string): BuildError[] {
    const errors: BuildError[] = []

    const tsPattern = /(.+?):(\d+):(\d+)\s*[-–]\s*(error|warning)\s*(TS\d+|ESLint)\s*:\s*(.+)/g
    let match: RegExpExecArray | null
    while ((match = tsPattern.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[6],
        code: match[5],
        severity: match[4] === 'error' ? 'error' : 'warning',
      })
    }

    const pyPattern = /File "(.+?)", line (\d+), in .+?(.+)/g
    while ((match = pyPattern.exec(output)) !== null) {
      if (!errors.some((e) => e.file === match![1] && e.line === parseInt(match![2], 10))) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          message: match[3].trim(),
          code: 'PythonError',
          severity: 'error',
        })
      }
    }

    const genericPattern = /(error|Error|ERROR)[:\s]+(.+)/g
    while ((match = genericPattern.exec(output)) !== null) {
      const existingError = match[2].substring(0, 50)
      if (!errors.some((e) => e.message.includes(existingError))) {
        errors.push({
          message: match[2].trim(),
          code: 'GenericError',
          severity: 'error',
        })
      }
    }

    return errors
  }

  /**
   * Count warnings in build output
   */
  private countWarnings(output: string): number {
    const warningPatterns = [
      /(warning|Warning|WARNING)[:\s]+/g,
      /warn[:\s]+/gi,
    ]
    let count = 0
    for (const pattern of warningPatterns) {
      const matches = output.match(pattern)
      if (matches) {
        count += matches.length
      }
    }
    return count
  }
}

/**
 * Test output parser
 */
export class TestOutputParser {
  /**
   * Parse test output for evidence
   */
  parse(output: string): TestEvidence {
    const assertions = this.countAssertions(output)
    const edgeCases = this.identifyEdgeCases(output)
    const testPath = this.extractTestPath(output)

    return {
      testPath,
      assertions,
      edgeCasesCovered: edgeCases.length,
      executionLog: output,
    }
  }

  /**
   * Count assertions in test output
   */
  private countAssertions(output: string): number {
    const assertionPatterns = [
      /\b(assert|expect|should|it\.only|test\.only)\s*\(/gi,
      /passes|failures/gi,
    ]

    let count = 0
    for (const pattern of assertionPatterns) {
      const matches = output.match(pattern)
      if (matches) {
        count += matches.length
      }
    }

    const summaryMatch = output.match(/(\d+)\s+(?:passes|fail|tests?)/i)
    if (summaryMatch) {
      const num = parseInt(summaryMatch[1], 10)
      if (num > count) {
        count = num
      }
    }

    return count
  }

  /**
   * Identify edge cases covered in tests
   */
  private identifyEdgeCases(output: string): string[] {
    const edgeCaseIndicators = [
      /null/i,
      /undefined/i,
      /empty/gi,
      /zero/gi,
      /negative/i,
      /overflow/i,
      /underflow/i,
      /async|await/gi,
      /error|exception/gi,
      /timeout/i,
      /boundary/i,
      /edge/gi,
    ]

    const covered: string[] = []
    for (const pattern of edgeCaseIndicators) {
      if (pattern.test(output)) {
        const name = pattern.source
          .replace(/^\^?|\\b|\\/gi, '')
          .substring(0, 30)
        if (!covered.includes(name)) {
          covered.push(name)
        }
      }
    }

    return covered
  }

  /**
   * Extract test file path from output
   */
  private extractTestPath(output: string): string {
    const pathPatterns = [
      /Running\s+(.+?test.+\.(?:ts|js|py))/i,
      /Test\s+Files.*[\n\r]+.*(.+\.(?:test|spec)\.[jt]sx?)/i,
    ]

    for (const pattern of pathPatterns) {
      const match = output.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return ''
  }
}

/**
 * Coverage output parser
 */
export class CoverageOutputParser {
  /**
   * Parse coverage output
   */
  parse(output: string, threshold: number): CoverageEvidence {
    const coverage = this.parseCoveragePercentages(output)

    return {
      statementCoverage: coverage.statement,
      branchCoverage: coverage.branch,
      functionCoverage: coverage.function,
      lineCoverage: coverage.line,
      coverageOutput: output,
      meetsThreshold: this.checkThreshold(coverage, threshold),
    }
  }

  /**
   * Parse coverage percentages from output
   */
  private parseCoveragePercentages(output: string): {
    statement: number
    branch: number
    function: number
    line: number
  } {
    const result = {
      statement: 0,
      branch: 0,
      function: 0,
      line: 0,
    }

    const patterns: Array<[RegExp, keyof typeof result]> = [
      [/Statements?\s*[:\s]+(\d+(?:\.\d+)?)%/i, 'statement'],
      [/Branches?\s*[:\s]+(\d+(?:\.\d+)?)%/i, 'branch'],
      [/Functions?\s*[:\s]+(\d+(?:\.\d+)?)%/i, 'function'],
      [/Lines?\s*[:\s]+(\d+(?:\.\d+)?)%/i, 'line'],
      [/coverage:\s+(\d+(?:\.\d+)?)%/i, 'statement'],
    ]

    for (const [pattern, key] of patterns) {
      const match = output.match(pattern)
      if (match) {
        result[key] = parseFloat(match[1])
      }
    }

    return result
  }

  /**
   * Check if coverage meets threshold
   */
  private checkThreshold(
    coverage: { statement: number; branch: number; function: number; line: number },
    threshold: number
  ): boolean {
    const coverages = [coverage.statement, coverage.branch, coverage.function, coverage.line]
    const validCoverages = coverages.filter((c) => c > 0)

    if (validCoverages.length === 0) {
      return false
    }

    const averageCoverage = validCoverages.reduce((sum, c) => sum + c, 0) / validCoverages.length
    return averageCoverage >= threshold
  }
}

/**
 * Main verification engine
 */
export class BlitzkriegVerification {
  private buildParser = new BuildOutputParser()
  private testParser = new TestOutputParser()
  private coverageParser = new CoverageOutputParser()

  /**
   * Verify evidence against Blitzkrieg configuration
   */
  verify(
    buildOutput: string,
    buildExitCode: number,
    testOutput: string,
    coverageOutput: string,
    config: EvidenceConfig,
    options: VerificationOptions = DEFAULT_VERIFICATION_OPTIONS
  ): VerificationResult {
    const evidence = this.collectEvidence(
      buildOutput,
      buildExitCode,
      testOutput,
      coverageOutput,
      options.coverageThreshold
    )

    const violations: EvidenceViolation[] = []
    const warnings: EvidenceWarning[] = []

    this.checkBuildEvidence(evidence.buildEvidence, violations, warnings)
    this.checkTestEvidence(evidence.testEvidence, config, violations, warnings, options)
    this.checkCoverageEvidence(evidence.coverageEvidence, config, violations, warnings, options)

    const summary = this.generateSummary(evidence, violations, warnings)

    const hasBlockingViolation = violations.some((v) => v.severity === 'error')
    const compliant = !hasBlockingViolation && !summary.failedTests

    return {
      compliant,
      evidence,
      violations,
      warnings,
      summary,
    }
  }

  /**
   * Collect evidence from build and test outputs
   */
  collectEvidence(
    buildOutput: string,
    buildExitCode: number,
    testOutput: string,
    coverageOutput: string,
    coverageThreshold: number
  ): CollectedEvidence {
    const buildEvidence = this.buildParser.parse(buildOutput, buildExitCode)
    const testEvidence = this.testParser.parse(testOutput)
    const coverageEvidence = this.coverageParser.parse(coverageOutput, coverageThreshold)

    return {
      buildEvidence,
      testEvidence,
      coverageEvidence,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Check build evidence for violations
   */
  private checkBuildEvidence(
    evidence: BuildEvidence,
    violations: EvidenceViolation[],
    warnings: EvidenceWarning[]
  ): void {
    if (!evidence.success) {
      violations.push({
        type: 'build-failed',
        message: `Build failed with exit code ${evidence.exitCode}`,
        severity: 'error',
        details: {
          exitCode: evidence.exitCode,
          errorCount: evidence.errors.length,
        },
      })
    } else if (evidence.warnings > 0) {
      warnings.push({
        type: 'build-warnings',
        message: `Build completed with ${evidence.warnings} warning(s)`,
        suggestion: 'Review warnings and fix if necessary',
      })
    }
  }

  /**
   * Check test evidence for violations
   */
  private checkTestEvidence(
    evidence: TestEvidence,
    config: EvidenceConfig,
    violations: EvidenceViolation[],
    warnings: EvidenceWarning[],
    options: VerificationOptions
  ): void {
    if (config.requireTestExecutionEvidence && evidence.executionLog === undefined) {
      violations.push({
        type: 'no-test-execution',
        message: 'No test execution evidence found',
        severity: 'error',
      })
    }

    if (config.requireAssertionEvidence && evidence.assertions < options.minAssertions) {
      violations.push({
        type: 'no-assertions',
        message: `Insufficient assertions: found ${evidence.assertions}, minimum required is ${options.minAssertions}`,
        severity: 'error',
        details: { actual: evidence.assertions, required: options.minAssertions },
      })
    }

    if (config.requireEdgeCaseEvidence && evidence.edgeCasesCovered < options.minEdgeCases) {
      violations.push({
        type: 'no-edge-cases',
        message: `No edge cases covered: minimum required is ${options.minEdgeCases}`,
        severity: 'error',
        details: { actual: evidence.edgeCasesCovered, required: options.minEdgeCases },
      })
    }
  }

  /**
   * Check coverage evidence for violations
   */
  private checkCoverageEvidence(
    evidence: CoverageEvidence,
    config: EvidenceConfig,
    violations: EvidenceViolation[],
    warnings: EvidenceWarning[],
    options: VerificationOptions
  ): void {
    if (!evidence.coverageOutput) {
      warnings.push({
        type: 'missing-coverage-data',
        message: 'No coverage data found',
        suggestion: 'Run tests with coverage to get coverage metrics',
      })
      return
    }

    if (config.requireEdgeCaseEvidence && evidence.statementCoverage < options.coverageThreshold) {
      if (options.strictMode) {
        violations.push({
          type: 'insufficient-coverage',
          message: `Coverage ${evidence.statementCoverage.toFixed(1)}% below threshold ${options.coverageThreshold}%`,
          severity: 'error',
          details: {
            statement: evidence.statementCoverage,
            branch: evidence.branchCoverage,
            function: evidence.functionCoverage,
            line: evidence.lineCoverage,
            threshold: options.coverageThreshold,
          },
        })
      } else {
        warnings.push({
          type: 'low-coverage',
          message: `Coverage ${evidence.statementCoverage.toFixed(1)}% is below optimal threshold ${options.coverageThreshold}%`,
          suggestion: 'Consider adding more tests to improve coverage',
        })
      }
    }
  }

  /**
   * Generate verification summary
   */
  private generateSummary(
    evidence: CollectedEvidence,
    violations: EvidenceViolation[],
    warnings: EvidenceWarning[]
  ): VerificationSummary {
    const testOutput = evidence.testEvidence.executionLog || ''

    const passedMatch = testOutput.match(/(\d+)\s+(?:passes?|passed|success)/i)
    const failedMatch = testOutput.match(/(\d+)\s+(?:failures?|failed)/i)
    const skippedMatch = testOutput.match(/(\d+)\s+(?:skipped|pending)/i)

    const totalTests =
      (passedMatch ? parseInt(passedMatch[1], 10) : 0) +
      (failedMatch ? parseInt(failedMatch[1], 10) : 0) +
      (skippedMatch ? parseInt(skippedMatch[1], 10) : 0)

    const passedTests = passedMatch ? parseInt(passedMatch[1], 10) : 0
    const failedTests = failedMatch ? parseInt(failedMatch[1], 10) : 0
    const skippedTests = skippedMatch ? parseInt(skippedMatch[1], 10) : 0

    let overallScore = 100
    if (failedTests > 0) {
      overallScore -= (failedTests / totalTests) * 100
    }
    if (evidence.coverageEvidence.statementCoverage > 0) {
      overallScore = (overallScore + evidence.coverageEvidence.statementCoverage) / 2
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalAssertions: evidence.testEvidence.assertions,
      passedAssertions: evidence.testEvidence.assertions,
      edgeCasesCovered: evidence.testEvidence.edgeCasesCovered,
      overallScore: Math.round(overallScore * 100) / 100,
    }
  }

  /**
   * Verify with test plan integration
   */
  verifyWithTestPlan(
    buildOutput: string,
    buildExitCode: number,
    testOutput: string,
    coverageOutput: string,
    testPlanState: TestPlanState,
    config: BlitzkriegConfig,
    options: VerificationOptions = DEFAULT_VERIFICATION_OPTIONS
  ): VerificationResult {
    const result = this.verify(
      buildOutput,
      buildExitCode,
      testOutput,
      coverageOutput,
      config.evidence,
      options
    )

    const testPlanSummary = generateTestPlanSummary(testPlanState)
    const testPlanResult = validateTestPlan(
      testPlanState,
      {
        minTestCases: config.testPlan.minTestCases,
        requireCoverageThreshold: config.testPlan.requireCoverageThreshold,
        coverageThresholdPercent: config.testPlan.coverageThresholdPercent,
        requiredBeforeImplementation: config.testPlan.requiredBeforeImplementation,
      },
      DEFAULT_TEST_PLAN_VALIDATION_OPTIONS
    )

    if (!testPlanResult.valid && options.strictMode) {
      for (const violation of testPlanResult.violations) {
        result.violations.push({
          type: 'missing-evidence' as EvidenceViolationType,
          message: `Test Plan: ${violation.details}`,
          severity: violation.severity,
        })
      }
    }

    result.summary = {
      ...result.summary,
      totalTests: testPlanSummary.totalTestCases + result.summary.totalTests,
    }

    const hasBlockingViolation = result.violations.some((v) => v.severity === 'error')
    result.compliant = !hasBlockingViolation && result.summary.failedTests === 0

    return result
  }
}

/**
 * Create Blitzkrieg Verification instance
 */
export function createBlitzkriegVerification(): BlitzkriegVerification {
  return new BlitzkriegVerification()
}

/**
 * Verify evidence and return result
 */
export function verifyEvidence(
  buildOutput: string,
  buildExitCode: number,
  testOutput: string,
  coverageOutput: string,
  config: EvidenceConfig,
  options?: VerificationOptions
): VerificationResult {
  const verification = createBlitzkriegVerification()
  return verification.verify(
    buildOutput,
    buildExitCode,
    testOutput,
    coverageOutput,
    config,
    options
  )
}

/**
 * Verify with full Blitzkrieg configuration
 */
export function verifyWithBlitzkriegConfig(
  buildOutput: string,
  buildExitCode: number,
  testOutput: string,
  coverageOutput: string,
  testPlanState: TestPlanState,
  blitzkriegConfig: BlitzkriegConfig,
  options?: VerificationOptions
): VerificationResult {
  const verification = createBlitzkriegVerification()
  return verification.verifyWithTestPlan(
    buildOutput,
    buildExitCode,
    testOutput,
    coverageOutput,
    testPlanState,
    blitzkriegConfig,
    options
  )
}

/**
 * Parse build output to evidence
 */
export function parseBuildEvidence(
  output: string,
  exitCode: number
): BuildEvidence {
  const parser = new BuildOutputParser()
  return parser.parse(output, exitCode)
}

/**
 * Parse test output to evidence
 */
export function parseTestEvidence(output: string): TestEvidence {
  const parser = new TestOutputParser()
  return parser.parse(output)
}

/**
 * Parse coverage output to evidence
 */
export function parseCoverageEvidence(
  output: string,
  threshold: number = 80
): CoverageEvidence {
  const parser = new CoverageOutputParser()
  return parser.parse(output, threshold)
}

// Backward compatibility exports for legacy test support
export interface EvidenceRequirements {
  requireTestExecutionEvidence: boolean
  requireAssertionEvidence: boolean
  requireEdgeCaseEvidence: boolean
  coverageThreshold?: number
}

export interface VerificationState {
  testsExecuted: boolean
  assertionsVerified: boolean
  edgeCasesCovered: boolean
  testFilePaths: string[]
}

export interface EvidenceReport {
  testExecutionEvidence?: string
  assertionEvidence?: string
  edgeCaseEvidence?: string
  coveragePercent?: number
  timestamp: string
  testFilePaths: string[]
}

export interface EvidenceDeficiency {
  type: 'execution' | 'assertions' | 'edge-cases' | 'coverage'
  severity: 'error' | 'warning'
  details: string
  suggestion: string
}

export const DEFAULT_EVIDENCE_REQUIREMENTS: EvidenceRequirements = {
  requireTestExecutionEvidence: true,
  requireAssertionEvidence: true,
  requireEdgeCaseEvidence: true,
  coverageThreshold: 80,
}

export function createEmptyVerificationState(): VerificationState {
  return {
    testsExecuted: false,
    assertionsVerified: false,
    edgeCasesCovered: false,
    testFilePaths: [],
  }
}

export function createEvidenceReport(testFilePaths: string[] = []): EvidenceReport {
  return {
    testFilePaths,
    timestamp: new Date().toISOString(),
  }
}

export function legacyVerifyEvidence(
  report: EvidenceReport,
  requirements: EvidenceRequirements
): { passed: boolean; missingEvidence: string[]; confidenceScore: number; warnings: string[]; coverageMet?: boolean } {
  const missingEvidence: string[] = []
  const warnings: string[] = []
  let confidenceScore = 100

  if (requirements.requireTestExecutionEvidence && !report.testExecutionEvidence) {
    missingEvidence.push('Test execution evidence is required')
    confidenceScore -= 30
  } else if (requirements.requireTestExecutionEvidence && report.testExecutionEvidence) {
    if (!/test.*pass|passing|assertion|✓|✔|pass/i.test(report.testExecutionEvidence)) {
      warnings.push('Test execution evidence may not contain actual test results')
      confidenceScore -= 10
    }
  }

  if (requirements.requireAssertionEvidence && !report.assertionEvidence) {
    missingEvidence.push('Assertion evidence is required')
    confidenceScore -= 25
  } else if (requirements.requireAssertionEvidence && report.assertionEvidence) {
    const match = report.assertionEvidence.match(/(\d+)\s*(?:assertion|test)/i)
    if (match && parseInt(match[1], 10) === 0) {
      warnings.push('No assertions found in assertion evidence')
      confidenceScore -= 15
    }
  }

  if (requirements.requireEdgeCaseEvidence && !report.edgeCaseEvidence) {
    missingEvidence.push('Edge case evidence is required')
    confidenceScore -= 20
  }

  const coverageMet = !requirements.coverageThreshold ||
    (report.coveragePercent !== undefined && report.coveragePercent >= requirements.coverageThreshold)

  if (!coverageMet && report.coveragePercent !== undefined) {
    warnings.push(`Coverage (${report.coveragePercent}%) is below threshold (${requirements.coverageThreshold}%)`)
    confidenceScore -= 15
  }

  confidenceScore = Math.max(0, Math.min(100, confidenceScore))

  return {
    passed: missingEvidence.length === 0,
    missingEvidence,
    confidenceScore,
    warnings,
    coverageMet,
  }
}

export function extractDeficiencies(
  result: { missingEvidence: string[]; warnings: string[] }
): EvidenceDeficiency[] {
  const deficiencies: EvidenceDeficiency[] = []

  for (const missing of result.missingEvidence) {
    let type: EvidenceDeficiency['type']
    let suggestion: string

    if (missing.includes('execution')) {
      type = 'execution'
      suggestion = 'Run tests and provide execution log showing test results'
    } else if (missing.includes('Assertion')) {
      type = 'assertions'
      suggestion = 'Provide assertion evidence with count of assertions verified'
    } else if (missing.includes('Edge case')) {
      type = 'edge-cases'
      suggestion = 'Demonstrate coverage of edge cases with test evidence'
    } else {
      type = 'coverage'
      suggestion = 'Provide coverage metrics meeting the threshold'
    }

    deficiencies.push({
      type,
      severity: 'error',
      details: missing,
      suggestion,
    })
  }

  for (const warning of result.warnings) {
    let type: EvidenceDeficiency['type']

    if (warning.includes('Coverage')) {
      type = 'coverage'
    } else if (warning.includes('assertion')) {
      type = 'assertions'
    } else if (warning.includes('edge case')) {
      type = 'edge-cases'
    } else {
      type = 'execution'
    }

    deficiencies.push({
      type,
      severity: 'warning',
      details: warning,
      suggestion: 'Review and enhance evidence quality',
    })
  }

  return deficiencies
}

export function isVerificationSufficient(
  result: { passed: boolean; confidenceScore: number },
  minConfidenceScore: number = 70
): boolean {
  return result.passed && result.confidenceScore >= minConfidenceScore
}

export function generateVerificationSummary(
  result: { passed: boolean; missingEvidence: string[]; warnings: string[]; coverageMet?: boolean; confidenceScore?: number }
): string {
  const lines: string[] = []

  lines.push(`Verification ${result.passed ? 'PASSED' : 'FAILED'}`)
  if (result.confidenceScore !== undefined) {
    lines.push(`Confidence Score: ${result.confidenceScore}%`)
  }

  if (result.missingEvidence.length > 0) {
    lines.push('\nMissing Evidence:')
    for (const missing of result.missingEvidence) {
      lines.push(`  - ${missing}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:')
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`)
    }
  }

  if (result.coverageMet !== undefined) {
    lines.push(`\nCoverage Threshold Met: ${result.coverageMet}`)
  }

  return lines.join('\n')
}


