import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'

export interface ContextConfig {
  enabled?: boolean
  maxTokens?: number
  priorityFiles?: string[]
}

export function createContextInjector(
  _input: PluginInput,
  options?: { config?: ContextConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
      .map((p) => p.text)
      .join('\n')
      .trim()
  }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return

      const promptText = getTextFromParts(output.parts)

      if (!promptText) return

      console.log('[context-injector] Processing message for context injection')
    },

    'experimental.chat.messages.transform': async (input, output) => {
      if (!config.enabled) return
      console.log('[context-injector] Transforming chat messages')
    },

    'experimental.chat.system.transform': async (input, output) => {
      if (!config.enabled) return
      console.log('[context-injector] Transforming system message')
    },
  }
}
