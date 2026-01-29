/**
 * Experience Recorder Hook
 *
 * Automatically records experiences after tool execution.
 * Captures tool usage, outcomes, and rewards for learning.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"

export function createExperienceRecorderHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore } = learningContext

  return {
    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      try {
        const { tool, toolArgs } = hookInput
        const output = hookOutput.output || {}

        const skipTools = [
          "session_list",
          "session_read",
          "session_search",
          "session_info",
          "learning-experience",
          "learning-knowledge",
          "learning-pattern",
          "learning-fsm",
          "learning-stats",
          "model-switcher"
        ]

        if (skipTools.includes(tool)) {
          return
        }

        const state = JSON.stringify({
          tool,
          toolArgs: typeof toolArgs === "string" ? { args: toolArgs } : toolArgs,
          timestamp: Date.now()
        })

        const context = JSON.stringify({
          sessionId: hookInput.sessionID,
          output: JSON.stringify(output).slice(0, 500),
          errorMessage: output.error || output.errorMessage || undefined
        })

        const reward = output.error || output.errorMessage ? -0.5 : (output.success === true || output.result?.success === true ? 0.5 : 0)
        const confidence = output.confidence ?? 0.5

        const keywords = typeof toolArgs === "string"
          ? toolArgs.split(/\s+/).filter((w: string) => w.length > 3 && w.length < 30).slice(0, 10)
          : []

        await experienceStore.addExperience({
          state,
          action: tool,
          outcome: reward > 0 ? "success" : reward < 0 ? "failure" : "partial",
          reward,
          confidence,
          context: {
            sessionId: hookInput.sessionID,
            tool
          },
          metadata: {
            keywords,
            toolName: tool,
            hasError: !!output.error
          }
        })

        console.log(
          `[ExperienceRecorder] Recorded experience: ${tool} (reward: ${reward}, confidence: ${confidence})`
        )
      } catch (error) {
        console.error("[ExperienceRecorder] Error recording experience:", error)
      }
    }
  }
}
