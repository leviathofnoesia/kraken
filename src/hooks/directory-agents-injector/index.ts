import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { SHOULD_LOG } from '../../utils/logger'

export interface DirectoryAgentsInjectorConfig {
  enabled?: boolean
  agentFile?: string
}

export function createDirectoryAgentsInjector(
  _input: PluginInput,
  options?: { config?: DirectoryAgentsInjectorConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return
      const agentFile = config.agentFile ?? '.opencode-agents'
      if (existsSync(agentFile)) {
        try {
          const content = readFileSync(agentFile, 'utf-8')
          if (SHOULD_LOG) console.log('[directory-agents-injector] Found local agent definitions')
        } catch {
          if (SHOULD_LOG) console.log('[directory-agents-injector] Could not read agent file')
        }
      }
    },
  }
}
