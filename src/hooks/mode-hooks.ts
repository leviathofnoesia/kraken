import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { createSessionStorageHook } from "./session-storage"
import { detectMode } from "./think-mode/mode-detector"
import { activateMode, deactivateMode } from "./think-mode/mode-switcher"

export interface ModeHooksOptions {
  enabled?: boolean
  autoActivate?: boolean
}

export function createModeHooks(
  input: PluginInput,
  options?: ModeHooksOptions
): Hooks {
  const config = (input as any).config || {}
  const modesConfig = config.modes || {}

  if (modesConfig.enabled === false) {
    return {}
  }

  return {
    "chat.message": async (input: any, output: any) => {
      // Detect mode keywords in user messages
      if (!output.parts) return

      const { sessionID } = input

      for (const part of output.parts) {
        if ((part as any).type === "text") {
          const content = (part as any).text

          if (content && sessionID) {
            const detected = detectMode(content)

            if (detected && options?.autoActivate !== false) {
              console.log(
                `[mode-hooks] Detected mode "${detected.mode}" with ${detected.keywords.length} keywords for session ${sessionID}`
              )

              // Activate mode
              activateMode(sessionID, detected.mode)

              // Inject mode activation context
              if (detected.mode === "blitzkrieg") {
                const modeConfig = modesConfig.blitzkrieg
                console.log(`[mode-hooks] Activating Blitzkrieg mode with ${modeConfig?.parallelAgents || 4} parallel agents`)
              } else if (detected.mode === "search") {
                console.log(`[mode-hooks] Activating Search mode`)
              } else if (detected.mode === "analyze") {
                console.log(`[mode-hooks] Activating Analyze mode`)
              } else if (detected.mode === "ultrathink") {
                console.log(`[mode-hooks] Activating Ultrathink mode`)
              }
            }
          }
        }
      }
    },
  }
}
