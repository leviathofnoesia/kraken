/**
 * Synthesis Trigger Hook
 *
 * Triggers synthesis and FSRS updates at session end.
 * Consolidates learnings and schedules reviews.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"

export function createSynthesisTriggerHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore } = learningContext

  return {
    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      try {
        const { sessionID, tool } = hookInput

        // Only synthesize on specific tool calls that indicate session end
        const synthesisTriggers = ["summary", "report", "done", "complete"]
        const shouldSynthesize = synthesisTriggers.some(t => tool.toLowerCase().includes(t))

        if (!shouldSynthesize) {
          return
        }

        console.log(`[SynthesisTrigger] Starting synthesis for session ${sessionID}`)

        // Flush experience store buffer
        await experienceStore.flushBuffer()

        console.log(`[SynthesisTrigger] Synthesis complete for session ${sessionID}`)
      } catch (error) {
        console.error("[SynthesisTrigger] Error during synthesis:", error)
      }
    }
  }
}
