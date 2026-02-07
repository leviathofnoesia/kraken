/**
 * Blitzkrieg Planner Constraints Hook
 *
 * Enforces planning discipline and step complexity limits.
 * Validates that:
 * - Each implementation task has a corresponding test step
 * - Verification steps exist after implementation
 * - Task complexity doesn't exceed threshold
 */

import type { Hooks } from '@opencode-ai/plugin'
import { getBlitzkriegConfig as getConfig } from '../../config/manager'
import {
  checkPlanningConstraints,
  generatePlanningComplianceReport,
  createPlanningStep,
  inferStepType,
  estimateComplexity,
  type PlanningStep,
  type PlanningComplianceReport,
} from '../../features/blitzkrieg/blitzkrieg-planner'

/**
 * Planning storage per session
 */
interface PlanningStore {
  [sessionId: string]: {
    steps: PlanningStep[]
  }
}

const planningStore: PlanningStore = {}

/**
 * Register planning steps for a session
 */
export function registerPlanningSteps(sessionId: string, stepDescriptions: string[]): void {
  const steps: PlanningStep[] = stepDescriptions.map((desc, index) =>
    createPlanningStep(`step-${index}`, desc, inferStepType(desc), estimateComplexity(desc)),
  )

  if (!planningStore[sessionId]) {
    planningStore[sessionId] = {
      steps: [],
    }
  }

  planningStore[sessionId].steps = steps
}

/**
 * Clear planning for a session
 */
export function clearPlanning(sessionId: string): void {
  delete planningStore[sessionId]
}

/**
 * Check if this is a planning operation
 */
function isPlanningOperation(toolName: string, args: any): boolean {
  // Check for todo list creation or modification
  if (toolName === 'todowrite') {
    return true
  }

  // Check for task operations
  if (toolName === 'task') {
    return true
  }

  // Check for slash commands related to planning
  if (args?.prompt?.includes('plan')) {
    return true
  }

  return false
}

/**
 * Extract planning steps from todo list
 * This is a simplified implementation that extracts step descriptions from todowrite arguments
 */
function extractPlanningSteps(args: any): string[] {
  const todos = args?.todos as Array<{ content: string }> | undefined

  if (!todos || !Array.isArray(todos)) {
    return []
  }

  return todos.map((t) => t.content || '')
}

/**
 * Create the planner constraints hook
 */
export function createBlitzkriegPlannerConstraintsHook(): Hooks {
  return {
    /**
     * Execute before tool operations
     * Validates planning constraints for todo list operations
     */
    'tool.execute.before': async (toolInput, toolOutput) => {
      const blitzkriegConfig = getConfig()

      // Skip if Blitzkrieg is disabled
      if (!blitzkriegConfig?.enabled) {
        return
      }

      const toolName = toolInput.tool
      const sessionId = toolInput.sessionID

      // Only check planning operations
      if (!isPlanningOperation(toolName, toolOutput)) {
        return
      }

      const plannerConfig = blitzkriegConfig.plannerConstraints

      // Skip if planning constraints are not required
      if (!plannerConfig.requireTestStep && !plannerConfig.requireVerificationStep) {
        return
      }

      const args = toolOutput as any
      const stepDescriptions = extractPlanningSteps(args)

      // If no steps provided, skip validation
      if (stepDescriptions.length === 0) {
        return
      }

      // Create planning steps
      const steps: PlanningStep[] = stepDescriptions.map((desc, index) =>
        createPlanningStep(
          `${sessionId}-step-${index}`,
          desc,
          inferStepType(desc),
          estimateComplexity(desc),
        ),
      )

      // Store the steps for reference
      planningStore[sessionId] = { steps }

      // Check constraints
      const check = checkPlanningConstraints(steps, {
        requireTestStep: plannerConfig.requireTestStep,
        requireVerificationStep: plannerConfig.requireVerificationStep,
        maxImplementationStepComplexity: plannerConfig.maxImplementationStepComplexity,
        enforceComplexitySeverity: 'block',
        enforceStructureSeverity: 'block',
      })

      // If there are violations with error severity, block the operation
      const blockingViolations = check.violations.filter((v) => v.severity === 'error')

      if (blockingViolations.length > 0) {
        // Generate a full compliance report
        const report = generatePlanningComplianceReport(steps, {
          requireTestStep: plannerConfig.requireTestStep,
          requireVerificationStep: plannerConfig.requireVerificationStep,
          maxImplementationStepComplexity: plannerConfig.maxImplementationStepComplexity,
          enforceComplexitySeverity: 'block',
          enforceStructureSeverity: 'block',
        })

        // Build error message with violations and suggestions
        const violationsMsg = blockingViolations
          .map((v) => `- [${v.severity}] ${v.type}: ${v.message}`)
          .join('\n')
        const suggestionsMsg = report.suggestions.map((s) => `- ${s}`).join('\n')

        throw new Error(
          `Blitzkrieg Planner Constraint Violation:\n\n${violationsMsg}\n\nSuggestions:\n${suggestionsMsg}`,
        )
      }

      // If there are warnings but no blocking violations, log them
      const warningViolations = check.violations.filter((v) => v.severity === 'warning')
      if (warningViolations.length > 0) {
        // Return warnings as injection payload
        const warningsMsg = warningViolations
          .map((v) => `- [${v.severity}] ${v.type}: ${v.message}`)
          .join('\n')
        return { messages: [{ role: 'system', content: warningsMsg }] } as any
      }
    },

    /**
     * Execute after tool operations
     * Clear planning after task completion
     */
    'tool.execute.after': async (toolInput, toolOutput) => {
      const toolName = toolInput.tool

      // Clear planning after task completion
      if (toolName === 'todowrite') {
        const args = toolOutput as any
        const todos = args?.todos as Array<{ status: string }> | undefined

        // Check if all todos are completed or cancelled
        const allCompleted = todos?.every(
          (t) => t.status === 'completed' || t.status === 'cancelled',
        )

        if (allCompleted && todos && todos.length > 0) {
          // Clear planning for this session
          const sessionId = toolInput.sessionID
          clearPlanning(sessionId)
        }
      }
    },
  }
}

/**
 * Create base hook using standard hook pattern
 */
export function createHook(): Hooks {
  return createBlitzkriegPlannerConstraintsHook()
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'blitzkrieg-planner' as const,
  priority: 85, // High priority for planning enforcement
  description:
    "Enforces planning discipline and step complexity limits. Validates that each implementation task has a corresponding test step, verification steps exist after implementation, and task complexity doesn't exceed threshold.",
  version: '1.0.0',
}
