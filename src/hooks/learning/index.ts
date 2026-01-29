/**
 * Learning System Hooks
 *
 * Hooks for integrating the unified AI memory system with OpenCode.
 * These hooks automatically record experiences, inject relevant context,
 * and trigger synthesis at appropriate times.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext, LearningHooksConfig } from "../../types/learning-context"

// Import individual hooks
import { createExperienceRecorderHook } from "./experience-recorder-hook"
import { createContextInjectorHook } from "./context-injector-hook"
import { createSynthesisTriggerHook } from "./synthesis-trigger-hook"

/**
 * Create all learning hooks
 *
 * Returns a Hooks object containing all enabled learning hooks.
 */
export function createLearningHooks(
  input: PluginInput,
  learningContext: LearningSystemContext,
  config: LearningHooksConfig
): Hooks {
  const hooks: Hooks = {}

  // Experience Recorder Hook
  if (config.experienceRecorder.enabled) {
    const hook = createExperienceRecorderHook(input, learningContext)
    Object.assign(hooks, hook)
    console.log("[LearningHooks] Experience recorder hook enabled")
  }

  // Context Injector Hook
  if (config.contextInjector.enabled) {
    const hook = createContextInjectorHook(input, learningContext)
    Object.assign(hooks, hook)
    console.log("[LearningHooks] Context injector hook enabled")
  }

  // Synthesis Trigger Hook
  if (config.synthesisTrigger.enabled) {
    const hook = createSynthesisTriggerHook(input, learningContext)
    Object.assign(hooks, hook)
    console.log("[LearningHooks] Synthesis trigger hook enabled")
  }

  return hooks
}
