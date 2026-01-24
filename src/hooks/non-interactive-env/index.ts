import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

export interface NonInteractiveEnvConfig {
  enabled?: boolean
}

export function createNonInteractiveEnv(
  _input: PluginInput,
  options?: { config?: NonInteractiveEnvConfig }
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    event: async (input) => {
      if (!config.enabled) return
      const isCI = process.env.CI !== undefined
      if (isCI) {
        console.log("[non-interactive-env] Detected CI environment, enabling non-interactive mode")
      }
    },
  }
}
