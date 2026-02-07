import type { Hooks } from '@opencode-ai/plugin'
import { getModesConfig } from '../config/manager'
import { createSessionStorageHook } from './session-storage'
import { detectMode } from './think-mode/mode-detector'
import { activateMode, deactivateMode } from './think-mode/mode-switcher'
import { SHOULD_LOG } from '../utils/logger'

export interface ModeHooksOptions {
  enabled?: boolean
  autoActivate?: boolean
}

export function createModeHooks(input: any, options?: ModeHooksOptions): Hooks {
  const modesConfig = getModesConfig() || {}

  if (options?.enabled === false) {
    return {}
  }

  return {
    'chat.message': async (input: any, output: any) => {
      // Detect mode keywords in user messages
      if (!output.parts) return

      const { sessionID } = input

      for (const part of output.parts) {
        if (part.type === 'text') {
          const content = part.text

          if (content && sessionID) {
            const detected = detectMode(content)

            if (detected && options?.autoActivate !== false) {
              if (SHOULD_LOG) {
                console.log(
                  `[mode-hooks] Detected mode "${detected.mode}" with ${detected.keywords.length} keywords for session ${sessionID}`,
                )
              }

              // Activate mode
              activateMode(sessionID, detected.mode)

              // Inject mode activation context
              if (SHOULD_LOG) {
                if (detected.mode === 'blitzkrieg') {
                  console.log(`[mode-hooks] Activating Blitzkrieg mode`)
                } else if (detected.mode === 'search') {
                  console.log(`[mode-hooks] Activating Search mode`)
                } else if (detected.mode === 'analyze') {
                  console.log(`[mode-hooks] Activating Analyze mode`)
                } else if (detected.mode === 'ultrathink') {
                  console.log(`[mode-hooks] Activating Ultrathink mode`)
                }
              }
            }
          }
        }
      }
    },
  }
}
