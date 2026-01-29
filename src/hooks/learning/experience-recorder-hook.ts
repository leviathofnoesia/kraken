/**
 * Experience Recorder Hook
 *
 * Automatically records experiences after tool execution.
 * Captures tool usage, outcomes, and rewards for learning.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"
import type { Experience } from "../../features/learning/types-unified"

/**
 * Extract reward from tool execution
 *
 * Infers reward based on tool output.
 * - Success: positive reward
 * - Error: negative reward
 * - Neutral: zero reward
 */
function extractReward(toolOutput: any): number {
  // Check for errors
  if (toolOutput.error || toolOutput.errorMessage) {
    return -0.5 // Negative reward for errors
  }

  // Check for success indicators
  if (
    toolOutput.success === true ||
    toolOutput.status === "success" ||
    toolOutput.result?.success === true
  ) {
    return 0.5 // Positive reward for success
  }

  // Default to neutral
  return 0
}

/**
 * Extract confidence from tool execution
 *
 * Infers confidence based on output structure.
 */
function extractConfidence(toolOutput: any): number {
  // If there's an explicit confidence score, use it
  if (typeof toolOutput.confidence === "number") {
    return Math.max(0, Math.min(1, toolOutput.confidence))
  }

  // Infer from output quality
  if (toolOutput.success === true && toolOutput.result) {
    return 0.8
  }

  if (toolOutput.error) {
    return 0.3
  }

  return 0.5 // Default medium confidence
}

/**
 * Create the experience recorder hook
 */
export function createExperienceRecorderHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore } = learningContext

  return {
    /**
     * Record experience after tool execution
     */
    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      try {
        const { tool, toolArgs } = hookInput
        const output = hookOutput.output || {}

        // Skip certain tools that shouldn't be recorded
        const skipTools = [
          "session_list",
          "session_read",
          "session_search",
          "session_info",
          "learning-experience", // Don't record learning tool usage
          "learning-knowledge",
          "learning-pattern",
          "learning-fsm",
          "learning-stats",
          "model-switcher"
        ]

        if (skipTools.includes(tool)) {
          return
        }

        // Extract state and context (as strings)
        const state = JSON.stringify({
          tool,
          toolArgs: typeof toolArgs === "string" ? { args: toolArgs } : toolArgs,
          timestamp: Date.now()
        })

        const context = JSON.stringify({
          sessionId: hookInput.sessionID,
          output: JSON.stringify(output).slice(0, 500), // Limit context size
          errorMessage: output.error || output.errorMessage || undefined
        })

        // Extract keywords from context
        const keywords: string[] = []
        if (typeof toolArgs === "string") {
          keywords.push(...toolArgs.split(/\s+/).filter((w: string) => w.length > 3))
        } else if (typeof toolArgs === "object") {
          Object.values(toolArgs).forEach((v: any) => {
            if (typeof v === "string" && v.length > 3 && v.length < 50) {
              keywords.push(v)
            }
          })
        }

        // Extract reward and confidence
        const reward = extractReward(output)
        const confidence = extractConfidence(output)

        // Create experience
        const experience: Experience = {
          id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          state,
          action: tool,
          reward,
          confidence,
          context,
          keywords: keywords.slice(0, 10), // Limit to 10 keywords
          metadata: {
            toolName: tool,
            hasError: !!output.error
          }
        }

        // Record the experience
        await experienceStore.addExperience({
          action: tool,
          reward,
          confidence,
          context,
          keywords: keywords.slice(0, 10)
        })

        console.log(
          `[ExperienceRecorder] Recorded experience: ${tool} (reward: ${reward}, confidence: ${confidence})`
        )
      } catch (error) {
        // Don't fail the hook if recording fails
        console.error("[ExperienceRecorder] Error recording experience:", error)
      }
    }
  }
}
