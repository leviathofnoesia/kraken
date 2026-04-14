import type { Hooks } from '@opencode-ai/plugin'
import { getModesConfig } from '../config/manager'
import { detectMode } from './think-mode/mode-detector'
import { activateMode, deactivateMode, getActiveMode } from './think-mode/mode-switcher'
import { DEFAULT_MODES, type ModeConfig } from './think-mode/modes'

export interface ModeHooksOptions {
  enabled?: boolean
  autoActivate?: boolean
}

const MODE_PARAM_OVERRIDES: Record<
  string,
  {
    temperature?: number
    topP?: number
    topK?: number
  }
> = {
  blitzkrieg: {
    temperature: 0.3,
    topP: 0.9,
  },
  search: {
    temperature: 0.1,
    topP: 0.95,
  },
  analyze: {
    temperature: 0.2,
    topP: 0.9,
  },
  ultrathink: {
    temperature: 0.5,
    topP: 0.95,
    topK: 64,
  },
}

const MODE_SYSTEM_HINTS: Record<string, string> = {
  blitzkrieg:
    '\n<kraken-mode name="blitzkrieg">\nMode: ULTRAWORK. Maximize throughput. Prioritize speed and parallel execution. Use subagents aggressively.\n</kraken-mode>',
  search:
    '\n<kraken-mode name="search">\nMode: SEARCH. Focus on thorough codebase exploration. Maximize result coverage. Use glob, grep, and read extensively.\n</kraken-mode>',
  analyze:
    '\n<kraken-mode name="analyze">\nMode: ANALYZE. Deep investigation with expert consultation. Use multiple analysis passes. Consult specialist agents.\n</kraken-mode>',
  ultrathink:
    '\n<kraken-mode name="ultrathink">\nMode: ULTRATHINK. Extended reasoning with high thinking budget. Take time for careful analysis. Use extended thinking chains.\n</kraken-mode>',
}

export function createModeHooks(_input: any, options?: ModeHooksOptions): Hooks {
  const modesConfig = getModesConfig() || {}

  if (options?.enabled === false) {
    return {}
  }

  return {
    'chat.message': async (input: any, output: any) => {
      if (!output.parts) return

      const { sessionID } = input

      for (const part of output.parts) {
        if ((part as any).type === 'text') {
          const content = (part as any).text

          if (content && sessionID) {
            const detected = detectMode(content)

            if (detected && options?.autoActivate !== false) {
              console.log(
                `[mode-hooks] Detected mode "${detected.mode}" with ${detected.keywords.length} keywords for session ${sessionID}`,
              )

              activateMode(sessionID, detected.mode)
            }
          }
        }
      }
    },

    'chat.params': async (input: any, output: any) => {
      const { sessionID } = input
      if (!sessionID) return

      const activeMode = getActiveMode(sessionID)
      if (!activeMode) return

      const modeConfig = activeMode.config
      const paramOverrides = MODE_PARAM_OVERRIDES[activeMode.name]

      if (paramOverrides) {
        if (paramOverrides.temperature !== undefined) {
          output.temperature = paramOverrides.temperature
        }
        if (paramOverrides.topP !== undefined) {
          output.topP = paramOverrides.topP
        }
        if (paramOverrides.topK !== undefined) {
          output.topK = paramOverrides.topK
        }
      }

      if (modeConfig.thinkingBudget) {
        output.options = {
          ...output.options,
          thinking: { type: 'enabled', budgetTokens: modeConfig.thinkingBudget },
        }
      }

      console.log(
        `[mode-hooks] Applied "${activeMode.name}" params: temp=${output.temperature}, topP=${output.topP}`,
      )
    },

    'experimental.chat.system.transform': async (_input: any, output: any) => {
      const { sessionID } = _input as any
      if (!sessionID) return

      const activeMode = getActiveMode(sessionID as string)
      if (!activeMode) return

      const hint = MODE_SYSTEM_HINTS[activeMode.name]
      if (hint) {
        output.system.push(hint)
      }
    },
  }
}
