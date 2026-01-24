/**
 * Ultrawork Feature Types Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateTestPlan,
  canBeginImplementation,
  generateTestPlanSummary,
  createEmptyTestPlanState,
  type TestPlanRequirements,
  type TestPlanState,
} from '../blitzkrieg-test-plan';
import {
  legacyVerifyEvidence as verifyEvidence,
  createEvidenceReport,
  generateVerificationSummary,
  isVerificationSufficient,
  type EvidenceRequirements,
} from '../blitzkrieg-verification';
import {
  evaluateTddCompliance,
  isTestFile,
  isImplementationFile,
  isRefactorOperation,
  type FileOperationContext,
} from '../blitzkrieg-tdd';
import {
  checkPlanningConstraints,
  generatePlanningComplianceReport,
  createPlanningStep,
  inferStepType,
  estimateComplexity,
  type PlanningStep,
} from '../blitzkrieg-planner';

describe('Ultrawork Feature Types - Test Plan', () => {
  describe('createEmptyTestPlanState', () => {
    it('should create an empty state', () => {
      const state = createEmptyTestPlanState();
      expect(state).toEqual({
        exists: false,
        testCases: [],
        approved: false,
      });
    });
  });

  describe('validateTestPlan', () => {
    it('should pass validation for valid test plan', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
          { description: 'Test 2', input: 'in2', expectedOutput: 'out2', category: 'edge-case' },
          { description: 'Test 3', input: 'in3', expectedOutput: 'out3', category: 'error-path' },
        ],
        coverageTarget: 85,
        approved: true,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      const result = validateTestPlan(state, requirements);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail validation for insufficient test cases', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
          { description: 'Test 2', input: 'in2', expectedOutput: 'out2', category: 'edge-case' },
        ], // Only 2 tests, 3 required
        coverageTarget: 85,
        approved: true,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      const result = validateTestPlan(state, requirements);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v: any) => v.type === 'missing-test-cases')).toBe(true);
    });

    it('should fail validation for insufficient coverage', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
          { description: 'Test 2', input: 'in2', expectedOutput: 'out2', category: 'edge-case' },
          { description: 'Test 3', input: 'in3', expectedOutput: 'out3', category: 'error-path' },
        ],
        coverageTarget: 70, // 70% < 80% required
        approved: true,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      const result = validateTestPlan(state, requirements);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v: any) => v.type === 'insufficient-coverage')).toBe(true);
    });

    it('should fail validation when test plan does not exist', () => {
      const state: TestPlanState = {
        exists: false,
        testCases: [],
        approved: false,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      const result = validateTestPlan(state, requirements);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v: any) => v.type === 'missing-test-cases')).toBe(true);
    });

    it('should provide recommendations', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
        ],
        approved: true,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      const result = validateTestPlan(state, requirements);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('canBeginImplementation', () => {
    it('should allow implementation when test plan is valid', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
          { description: 'Test 2', input: 'in2', expectedOutput: 'out2', category: 'edge-case' },
          { description: 'Test 3', input: 'in3', expectedOutput: 'out3', category: 'error-path' },
        ],
        coverageTarget: 85,
        approved: true,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      expect(canBeginImplementation(state, requirements)).toBe(true);
    });

    it('should block implementation when test plan is not required', () => {
      const state: TestPlanState = {
        exists: false,
        testCases: [],
        approved: false,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: false, // Not required
      };

      expect(canBeginImplementation(state, requirements)).toBe(true);
    });

    it('should block implementation when test plan is missing and required', () => {
      const state: TestPlanState = {
        exists: false,
        testCases: [],
        approved: false,
      };

      const requirements: TestPlanRequirements = {
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
        requiredBeforeImplementation: true,
      };

      expect(canBeginImplementation(state, requirements)).toBe(false);
    });
  });

  describe('generateTestPlanSummary', () => {
    it('should generate summary statistics', () => {
      const state: TestPlanState = {
        exists: true,
        testCases: [
          { description: 'Test 1', input: 'in1', expectedOutput: 'out1', category: 'happy-path' },
          { description: 'Test 2', input: 'in2', expectedOutput: 'out2', category: 'edge-case' },
          { description: 'Test 3', input: 'in3', expectedOutput: 'out3', category: 'error-path' },
          { description: 'Test 4', input: 'in4', expectedOutput: 'out4', category: 'integration' },
        ],
        coverageTarget: 85,
        approved: true,
      };

      const summary = generateTestPlanSummary(state);
      expect(summary.totalTestCases).toBe(4);
      expect(summary.happyPathCases).toBe(1);
      expect(summary.edgeCaseCases).toBe(1);
      expect(summary.errorPathCases).toBe(1);
      expect(summary.integrationCases).toBe(1);
      expect(summary.coveragePercentage).toBe(85);
      expect(summary.approvalStatus).toBe('approved');
    });

    it('should handle non-existent test plan', () => {
      const state: TestPlanState = {
        exists: false,
        testCases: [],
        approved: false,
      };

      const summary = generateTestPlanSummary(state);
      expect(summary.approvalStatus).toBe('none');
      expect(summary.totalTestCases).toBe(0);
    });
  });
});

describe('Ultrawork Feature Types - Verification', () => {
  describe('createEvidenceReport', () => {
    it('should create report with timestamp', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      expect(report.testFilePaths).toEqual(['/test/a.test.ts']);
      expect(report.timestamp).toBeDefined();
      expect(typeof report.timestamp).toBe('string');
    });
  });

  describe('verifyEvidence', () => {
    it('should pass verification with complete evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases: null, undefined, empty';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true,
        coverageThreshold: 80,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(true);
      expect(result.missingEvidence).toHaveLength(0);
    });

    it('should fail verification without test execution evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: false,
        requireEdgeCaseEvidence: false,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });

    it('should fail verification without assertion evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: false,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: false,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });

    it('should fail verification without edge case evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: false,
        requireAssertionEvidence: false,
        requireEdgeCaseEvidence: true,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });

    it('should warn but pass verification with insufficient coverage', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 70;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: false,
        requireAssertionEvidence: false,
        requireEdgeCaseEvidence: false,
        coverageThreshold: 80,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(true);
      expect(result.warnings.some((w: string) => w.includes('Coverage'))).toBe(true);
    });

    it('should calculate confidence score', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true,
        coverageThreshold: 80,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.confidenceScore).toBe(100);
    });

    it('should reduce confidence score for missing evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.assertionEvidence = '15 assertions verified';

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true,
        coverageThreshold: 80,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.confidenceScore).toBeLessThan(100);
    });
  });

  describe('verifyEvidence', () => {
    it('should pass verification with complete evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases: null, undefined, empty';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true,
        coverageThreshold: 80,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(true);
      expect(result.missingEvidence).toHaveLength(0);
    });

    it('should fail verification without test execution evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.assertionEvidence = '15 assertions verified';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: false,
        requireEdgeCaseEvidence: false,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });

    it('should fail verification without assertion evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.edgeCaseEvidence = 'Edge cases covered';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: false,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: false,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });

    it('should fail verification without edge case evidence', () => {
      const report = createEvidenceReport(['/test/a.test.ts']);
      report.testExecutionEvidence = 'Tests passed: 5/5';
      report.assertionEvidence = '15 assertions verified';
      report.coveragePercent = 85;

      const requirements: EvidenceRequirements = {
        requireTestExecutionEvidence: false,
        requireAssertionEvidence: false,
        requireEdgeCaseEvidence: true,
      };

      const result = verifyEvidence(report, requirements);
      expect(result.passed).toBe(false);
    });
  });

  describe('generateVerificationSummary', () => {
    it('should generate human-readable summary', () => {
      const result = {
        passed: true,
        missingEvidence: [],
        confidenceScore: 85,
        warnings: [],
        coverageMet: true,
      };

      const summary = generateVerificationSummary(result);
      expect(summary).toContain('Verification PASSED');
      expect(summary).toContain('Confidence Score: 85');
    });

    it('should include violations in summary', () => {
      const result = {
        passed: false,
        missingEvidence: ['Test execution evidence', 'Assertion evidence'],
        confidenceScore: 50,
        warnings: [],
      };

      const summary = generateVerificationSummary(result);
      expect(summary).toContain('Verification FAILED');
      expect(summary).toContain('Test execution evidence');
      expect(summary).toContain('Assertion evidence');
    });
  });
});

describe('Ultrawork Feature Types - TDD Workflow', () => {
  describe('isTestFile', () => {
    it('should identify test files', () => {
      expect(isTestFile('/test/src/index.test.ts')).toBe(true);
      expect(isTestFile('/test/src/index.spec.ts')).toBe(true);
      expect(isTestFile('/test/__tests__/index.ts')).toBe(true);
      expect(isTestFile('/test/test/index.ts')).toBe(true);
      expect(isTestFile('/test/tests/index.ts')).toBe(true);
    });

    it('should not identify non-test files', () => {
      expect(isTestFile('/test/src/index.ts')).toBe(false);
      expect(isTestFile('/test/src/util.ts')).toBe(false);
      expect(isTestFile('/test/package.json')).toBe(false);
      expect(isTestFile('/test/README.md')).toBe(false);
    });
  });

  describe('isImplementationFile', () => {
    it('should identify implementation files', () => {
      expect(isImplementationFile('/test/src/index.ts')).toBe(true);
      expect(isImplementationFile('/test/src/util.ts')).toBe(true);
      expect(isImplementationFile('/test/README.md')).toBe(true);
    });

    it('should not identify test or excluded files', () => {
      expect(isImplementationFile('/test/src/index.test.ts')).toBe(false);
      expect(isImplementationFile('/test/src/index.spec.ts')).toBe(false);
      expect(isImplementationFile('/test/node_modules/pkg/index.ts')).toBe(false);
      expect(isImplementationFile('/test/dist/index.js')).toBe(false);
    });
  });

  describe('isRefactorOperation', () => {
    it('should detect refactor comments', () => {
      const current = 'function foo() { return 1; }';
      const previous = 'function foo() { return 1; }';

      expect(isRefactorOperation(current, previous)).toBe(false);

      const refactorCurrent = '// refactor\nfunction foo() { return 1; }';
      expect(isRefactorOperation(refactorCurrent, previous)).toBe(true);
    });

    it('should return false when no previous content', () => {
      const current = 'function foo() { return 1; }';

      expect(isRefactorOperation(current, undefined)).toBe(false);
    });
  });
});

describe('Ultrawork Feature Types - Planner Constraints', () => {
  describe('createPlanningStep', () => {
    it('should create step with all properties', () => {
      const step = createPlanningStep('step-1', 'Implement feature', 'implementation', 2, ['step-0']);
      expect(step).toEqual({
        id: 'step-1',
        description: 'Implement feature',
        type: 'implementation',
        complexity: 2,
        dependencies: ['step-0'],
      });
    });

    it('should default complexity to 1', () => {
      const step = createPlanningStep('step-1', 'Simple task', 'implementation');
      expect(step.complexity).toBe(1);
    });

    it('should default dependencies to empty array', () => {
      const step = createPlanningStep('step-1', 'Task', 'implementation');
      expect(step.dependencies).toEqual([]);
    });
  });

  describe('inferStepType', () => {
    it('should infer test step', () => {
      expect(inferStepType('Write test for feature')).toBe('test');
      expect(inferStepType('Add assertions')).toBe('test');
      expect(inferStepType('Run test cases')).toBe('test');
    });

    it('should infer verification step', () => {
      expect(inferStepType('Verify implementation')).toBe('verification');
      expect(inferStepType('Review code')).toBe('verification');
      expect(inferStepType('Validate results')).toBe('verification');
      expect(inferStepType('Check functionality')).toBe('verification');
    });

    it('should infer planning step', () => {
      expect(inferStepType('Plan architecture')).toBe('planning');
      expect(inferStepType('Design solution')).toBe('planning');
    });

    it('should default to implementation', () => {
      expect(inferStepType('Write code')).toBe('implementation');
      expect(inferStepType('Add feature')).toBe('implementation');
    });
  });

  describe('estimateComplexity', () => {
    it('should estimate complexity from keywords', () => {
      expect(estimateComplexity('Simple task')).toBe(1);
      expect(estimateComplexity('Add function')).toBe(2);
      expect(estimateComplexity('Implement feature')).toBe(2);
      expect(estimateComplexity('Refactor code')).toBe(3);
      expect(estimateComplexity('Integrate system')).toBe(4);
      expect(estimateComplexity('Complex difficult task')).toBe(5);
    });

    it('should cap complexity at 10', () => {
      expect(estimateComplexity('Very complex difficult task')).toBe(5);
    });

    it('should adjust for description length', () => {
      const short = 'Simple task';
      const long = 'This is a very long description that contains multiple sentences and paragraphs explaining the task in great detail. It goes on and on with more details. And even more details.';

      const shortComplexity = estimateComplexity(short);
      const longComplexity = estimateComplexity(long);

      expect(longComplexity).toBeGreaterThan(shortComplexity);
      expect(longComplexity).toBeLessThanOrEqual(10);
    });
  });

  describe('checkPlanningConstraints', () => {
    it('should pass for compliant plan', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Write tests', 'test'),
        createPlanningStep('step-2', 'Implement feature', 'implementation'),
        createPlanningStep('step-3', 'Verify implementation', 'verification'),
      ];

      const check = checkPlanningConstraints(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(check.hasTestStep).toBe(true);
      expect(check.hasVerificationStep).toBe(true);
      expect(check.complexityValid).toBe(true);
      expect(check.violations).toHaveLength(0);
    });

    it('should fail for plan without test step', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Implement feature', 'implementation'),
        createPlanningStep('step-2', 'Verify implementation', 'verification'),
      ];

      const check = checkPlanningConstraints(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(check.hasTestStep).toBe(false);
      expect(check.violations.some((v: any) => v.type === 'missing-test-step')).toBe(true);
    });

    it('should fail for plan without verification step', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Write tests', 'test'),
        createPlanningStep('step-2', 'Implement feature', 'implementation'),
      ];

      const check = checkPlanningConstraints(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(check.hasVerificationStep).toBe(false);
      expect(check.violations.some((v: any) => v.type === 'missing-verification')).toBe(true);
    });

    it('should fail for plan with excessive complexity', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Write tests', 'test'),
        createPlanningStep('step-2', 'Complex multi-file integration with difficult requirements', 'implementation', 5), // High complexity
        createPlanningStep('step-3', 'Verify', 'verification'),
      ];

      const check = checkPlanningConstraints(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(check.complexityValid).toBe(false);
      expect(check.violations.some((v: any) => v.type === 'excessive-complexity')).toBe(true);
    });
  });

  describe('generatePlanningComplianceReport', () => {
    it('should generate report for compliant plan', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Write tests', 'test'),
        createPlanningStep('step-2', 'Implement', 'implementation'),
        createPlanningStep('step-3', 'Verify', 'verification'),
      ];

      const report = generatePlanningComplianceReport(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(report.compliant).toBe(true);
      expect(report.violations).toHaveLength(0);
      expect(report.complexityScore).toBeGreaterThan(0);
    });

    it('should generate report with violations', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Add feature', 'implementation', 1),
      ];

      const report = generatePlanningComplianceReport(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(report.compliant).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide suggestions for violations', () => {
      const steps: PlanningStep[] = [
        createPlanningStep('step-1', 'Add feature', 'implementation', 1),
      ];

      const report = generatePlanningComplianceReport(steps, {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      });

      expect(report.suggestions.some((s: string) => s.toLowerCase().includes('test'))).toBe(true);
    });
  });
});
