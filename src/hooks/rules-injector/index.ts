import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import { SHOULD_LOG } from '../../utils/logger'

export interface RulesInjectorConfig {
  enabled?: boolean
  rulesFile?: string
}

export function createRulesInjector(
  _input: PluginInput,
  options?: { config?: RulesInjectorConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return
      if (SHOULD_LOG) console.log('[rules-injector] Processing message for rules injection')
    },

    'experimental.chat.system.transform': async (input, output) => {
      if (!config.enabled) return
      if (SHOULD_LOG) console.log('[rules-injector] Injecting project rules into system message')
    },
  }
}
