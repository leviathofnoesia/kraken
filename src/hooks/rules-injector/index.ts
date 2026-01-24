import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

export interface RulesInjectorConfig {
  enabled?: boolean
  rulesFile?: string
}

export function createRulesInjector(
  _input: PluginInput,
  options?: { config?: RulesInjectorConfig }
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    "chat.message": async (input, output) => {
      if (!config.enabled) return
      console.log("[rules-injector] Processing message for rules injection")
    },

    "experimental.chat.system.transform": async (input, output) => {
      if (!config.enabled) return
      console.log("[rules-injector] Injecting project rules into system message")
    },
  }
}
