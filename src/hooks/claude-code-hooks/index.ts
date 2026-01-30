import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

export interface ClaudeCodeHooksConfig {
  enabled?: boolean
  mcp?: boolean
  commands?: boolean
  skills?: boolean
  agents?: boolean
}

export function createClaudeCodeHooks(
  _input: PluginInput,
  options?: { config?: ClaudeCodeHooksConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    mcp: true,
    commands: true,
    skills: true,
    agents: true,
  }

  return {
    config: async (cfg: any) => {
      try {
        // Apply runtime configuration updates
        if (cfg) {
          Object.assign(config, cfg)
        }
      } catch (error) {
        console.error("[claude-code-hooks] Error applying config:", error)
      }
    },
    "tool.execute.before": async (input, output) => {
      if (!config.enabled) return
      console.log("[claude-code-hooks] Processing tool execution")
    },
    "tool.execute.after": async (input, output) => {
      if (!config.enabled) return
      console.log("[claude-code-hooks] Tool execution completed")
    },
  }
}
