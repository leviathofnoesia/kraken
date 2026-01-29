/**
 * Experience Recorder Hook
 *
 * Records tool executions as experiences with rewards for reinforcement learning.
 * Triggers on `tool.execute.after` to capture outcomes.
 */

import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { ExperienceStore } from "../../features/learning/experience-store"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { StateMachineEngine } from "../../features/learning/state-machine"
import type { LearningSystemContext } from "../../types/learning-context"

export interface ExperienceRecorderHookOptions {
  enabled?: boolean
  recordOnSuccess?: boolean
  recordOnFailure?: boolean
  autoPatternDetection?: boolean
}

/**
 * Create experience recorder hook
 */
export function createExperienceRecorderHook(
  input: PluginInput,
  context: LearningSystemContext,
  options?: ExperienceRecorderHookOptions
): Hooks {
  const config = (input as any).config || {}
  const learningConfig = config.learning || {}

  if (learningConfig.enabled === false || options?.enabled === false) {
    return {}
  }

  const {
    experienceStore,
    patternDetector,
    stateMachine
  } = context

  const hook = {
    "tool.execute.after": async (toolInput: any, toolOutput: any) => {
      try {
        const { tool, result, error } = toolInput

        // Skip if no tool was called
        if (!tool) return

        // Determine outcome and reward
        let outcome: "success" | "failure" | "partial"
        let reward: number

        if (error) {
          // Tool execution failed
          outcome = "failure"
          reward = -0.8 // Significant penalty for tool failure

          console.log(`[ExperienceRecorder] Tool failed: ${tool.name} - ${error.message}`)
        } else if (result?.error) {
          // Tool returned an error (partial success)
          outcome = "partial"
          reward = -0.3 // Mild penalty for partial failure

          console.log(`[ExperienceRecorder] Tool partial: ${tool.name} - ${result.error}`)
        } else {
          // Tool succeeded
          outcome = "success"
          reward = 0.5 // Base reward for success

          // Adjust reward based on result complexity/value
          if (result?.tokensSaved) {
            reward += 0.2 // Bonus for saving tokens
          }
          if (result?.performanceImproved) {
            reward += 0.3 // Bonus for performance improvements
          }
          if (result?.bugFixed) {
            reward += 0.4 // Bonus for fixing bugs
          }

          // Cap reward at +1
          reward = Math.min(1, reward)

          console.log(`[ExperienceRecorder] Tool success: ${tool.name} (reward: ${reward.toFixed(2)})`)
        }

        // Determine current state from context
        const state = determineCurrentState(toolInput, {currentState, outcome})

        // Create and record experience
        const experience = await experienceStore.addExperience({
          state,
          action: tool.name,
          outcome,
          reward,
          confidence: 0.8, // Default confidence for hook-recorded experiences
          context: {
            sessionId: toolInput.sessionID,
            tool: tool.name,
            prompt: toolInput.message?.substring(0, 200)
          },
          metadata: {
            hookSource: "experience-recorder-hook",
            error: error?.message,
            resultSummary: summarizeResult(result)
          }
        })

        console.log(`[ExperienceRecorder] Recorded experience: ${experience.id}`)

        // Trigger pattern detection if enabled
        if (options?.autoPatternDetection !== false) {
          // Load recent experiences for pattern analysis
          const recentExperiences = await experienceStore.loadExperiences()

          // Analyze for patterns
          const detectionResult = await patternDetector.analyzeExperiences(
            recentExperiences.slice(-50) // Analyze last 50 experiences
          )

          if (detectionResult.patterns.length > 0) {
            console.log(
              `[ExperienceRecorder] Detected ${detectionResult.patterns.length} patterns ` +
              `(confidence: ${(detectionResult.confidence * 100).toFixed(0)}%)`
            )
          }

          // Check if state machine should transition
          const newState = detectStateTransition(state, outcome, toolInput)
          if (newState) {
            console.log(`[ExperienceRecorder] Potential state transition: ${state} → ${newState}`)
            // Note: Actual state machine transition should be handled by state machine hook
          }
        }

      } catch (error: any) {
        console.error(`[ExperienceRecorder] Error recording experience:`, error)
        // Don't throw - hooks shouldn't break the system
      }
    },
  }

  return hook
}

/**
 * Detect if a state machine transition should occur
 */
function detectStateTransition(
  currentState: string,
  outcome: "success" | "failure" | "partial",
  hookInput: any
): string | null {
  const message = hookInput.message?.toLowerCase() || ""

  // Common state transitions
  const transitions: Record<string, { success?: string; failure?: string }> = {
    "analyzing": { success: "implementing" },
    "implementing": { success: "testing", failure: "debugging" },
    "testing": { success: "documenting", failure: "debugging" },
    "debugging": { success: "testing", failure: "analyzing" },
    "refactoring": { success: "testing" }
  }

  const stateTransitions = transitions[currentState]
  if (!stateTransitions) {
    return null
  }

  if (outcome === "success" && stateTransitions.success) {
    return stateTransitions.success
  } else if (outcome === "failure" && stateTransitions.failure) {
    return stateTransitions.failure
  }

  return null
}

/**
 * Summarize a tool result for metadata
 */
function summarizeResult(result: any): string {
  if (!result) {
    return "no result"
  }

  const parts: string[] = []

  if (result.error) {
    parts.push(`error: ${result.error}`)
  }
  if (result.tokensSaved) {
    parts.push(`saved ${result.tokensSaved} tokens`)
  }
  if (result.performanceImproved) {
    parts.push("performance improved")
  }
  if (result.bugFixed) {
    parts.push("bug fixed")
  }

  return parts.join(", ") || "success"
}
