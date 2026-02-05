import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'

export interface ClaudeCodeHooksConfig {
  enabled?: boolean
  mcp?: boolean
  commands?: boolean
  skills?: boolean
  agents?: boolean
  hooks?: boolean
  toggles?: {
    mcp?: boolean
    commands?: boolean
    skills?: boolean
    agents?: boolean
    hooks?: boolean
  }
}

export function createClaudeCodeHooks(
  _input: PluginInput,
  options?: { config?: ClaudeCodeHooksConfig },
): Hooks {
  const config: ClaudeCodeHooksConfig = {
    enabled: options?.config?.enabled ?? true,
    mcp: options?.config?.mcp ?? true,
    commands: options?.config?.commands ?? true,
    skills: options?.config?.skills ?? true,
    agents: options?.config?.agents ?? true,
    hooks: options?.config?.hooks ?? true,
    toggles: options?.config?.toggles ?? {},
  }

  return {
    config: async (cfg: any) => {
      try {
        // Apply runtime configuration updates
        if (cfg) {
          Object.assign(config, cfg?.claudeCodeCompatibility ?? cfg)
          if (cfg?.claudeCodeCompatibility?.toggles) {
            config.toggles = {
              ...config.toggles,
              ...cfg.claudeCodeCompatibility.toggles,
            }
          }
        }
      } catch (error) {
        console.error('[claude-code-hooks] Error applying config:', error)
      }
    },
    'tool.execute.before': async (input, output) => {
      if (!config.enabled || config.hooks === false || config.toggles?.hooks === false) return
      console.log('[claude-code-hooks] Processing tool execution')
    },
    'tool.execute.after': async (input, output) => {
      if (!config.enabled || config.hooks === false || config.toggles?.hooks === false) return
      console.log('[claude-code-hooks] Tool execution completed')
    },
  }
}
