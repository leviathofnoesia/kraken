/**
 * Think Mode Hook
 *
 * Detects "think" keywords in user input and activates enhanced reasoning mode.
 * Switches variant to 'max' and enables thinking for supported providers.
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import { SHOULD_LOG } from '../../utils/logger'

/**
 * Supported providers that support thinking mode
 * Currently only Anthropic (and Bedrock when using Anthropic models) have
 * extended thinking support. Google and OpenAI may add support in the future.
 */
const THINKING_SUPPORTED_PROVIDERS = ['anthropic', 'bedrock']

/**
 * Think keywords to detect (case-insensitive)
 * Includes multilingual support
 */
const THINK_KEYWORDS = [
  // English
  'think',
  'let me think',
  'i need to think',
  'take time to think',
  'think about this',
  'think carefully',

  // Spanish
  'piensa',
  'déjame pensar',
  'necesito pensar',
  'piénsalo',
  'piensa cuidadosamente',

  // French
  'réfléchis',
  'laissez-moi réfléchir',
  'je dois réfléchir',
  'réfléchissez-y',
  'réfléchir attentivement',

  // German
  'denk nach',
  'lass mich nachdenken',
  'ich muss nachdenken',
  'denk darüber nach',
  'denke sorgfältig',

  // Portuguese
  'pense',
  'deixe-me pensar',
  'preciso pensar',
  'pense sobre isso',
  'pense cuidadosamente',

  // Italian
  'pensa',
  'fammi pensare',
  'devo pensare',
  'pensa a questo',
  'pensa attentamente',

  // Russian
  'подумай',
  'дай мне подумать',
  'мне нужно подумать',
  'подумай об этом',
  'подумай внимательно',

  // Japanese
  '考えて',
  '考えさせて',
  '考える必要がある',
  'これについて考えて',
  '注意深く考えて',

  // Chinese (Simplified)
  '思考',
  '让我想想',
  '我需要思考',
  '思考这个',
  '仔细思考',

  // Chinese (Traditional)
  '思考',
  '讓我思考',
  '我需要思考',
  '思考這個',
  '仔細思考',

  // Korean
  '생각해',
  '생각하게 해줘',
  '생각해야 해',
  '이것에 대해 생각해',
  '신중하게 생각해',
]

/**
 * Check if thinking is supported for the given provider
 * @param provider - The provider name
 * @returns True if thinking is supported
 */
function isThinkingSupported(provider: string): boolean {
  // Simple provider name matching
  return THINKING_SUPPORTED_PROVIDERS.some((supported) =>
    provider.toLowerCase().includes(supported.toLowerCase()),
  )
}

/**
 * Session state for tracking think mode activation
 */
interface ThinkModeSession {
  enabled: boolean
  activatedAt: number
}

/**
 * Map of sessionID to think mode state
 */
const thinkModeSessions = new Map<string, ThinkModeSession>()

/**
 * Get the think mode state for a session
 * @param sessionID - The session ID
 * @returns The session state or undefined
 */
function getSessionState(sessionID: string): ThinkModeSession | undefined {
  return thinkModeSessions.get(sessionID)
}

/**
 * Set the think mode state for a session
 * @param sessionID - The session ID
 * @param enabled - Whether think mode is enabled
 */
function setSessionState(sessionID: string, enabled: boolean): void {
  thinkModeSessions.set(sessionID, {
    enabled,
    activatedAt: Date.now(),
  })
}

/**
 * Clear the think mode state for a session
 * @param sessionID - The session ID
 */
function clearSessionState(sessionID: string): void {
  thinkModeSessions.delete(sessionID)
}

/**
 * Detect if think mode should be activated based on input
 * @param content - The user's message content
 * @returns True if think mode should be activated
 */
export function shouldActivateThinkMode(content: string): boolean {
  const lowercaseContent = content.toLowerCase()

  // Check if any think keyword is present
  for (const keyword of THINK_KEYWORDS) {
    if (lowercaseContent.includes(keyword)) {
      return true
    }
  }

  return false
}

/**
 * Create the think mode hook
 * @param input - The plugin input context
 * @returns A Hooks object with think mode functionality
 */
export function createThinkModeHook(input: PluginInput): Hooks {
  return {
    // Hook executed for chat messages - detect think keywords
    'chat.message': async (messageInput: any, messageOutput: any) => {
      const { sessionID } = messageInput
      const parts = messageOutput?.parts || []
      const content = parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n')
        .trim()

      // Check if content exists and is a string
      if (typeof content === 'string' && content.length > 0) {
        // Detect if think mode should be activated
        const shouldActivate = shouldActivateThinkMode(content)

        if (shouldActivate) {
          if (SHOULD_LOG) console.log(`[think-mode] Activated for session ${sessionID}`)
          setSessionState(sessionID, true)
        }
      }

      // Allow execution to continue
      return
    },

    // Hook executed to modify chat parameters - apply think mode settings
    'chat.params': async (paramsInput: any, paramsOutput: any) => {
      const { sessionID, provider } = paramsInput

      // Check if think mode is enabled for this session
      const sessionState = getSessionState(sessionID)

      if (sessionState?.enabled) {
        // Only set variant if not already set
        if (!paramsOutput.variant) {
          paramsOutput.variant = 'max'
        }

        // Enable thinking if provider supports it
        const providerID = provider?.info?.id || provider?.options?.providerID || ''
        if (isThinkingSupported(providerID)) {
          if (!paramsOutput.options) {
            paramsOutput.options = {}
          }

          // DON'T override if agent already has thinking configured
          if (!paramsOutput.options.thinking) {
            if (SHOULD_LOG)
              console.log(`[think-mode] Applying think mode settings for provider ${providerID}`)

            // Anthropic and Bedrock (with Anthropic models) support extended thinking
            if (providerID.includes('anthropic') || providerID.includes('bedrock')) {
              paramsOutput.options.thinking = {
                budget_tokens: 32000,
                type: 'enabled',
              }
            }
          }
        }
      }

      // Allow execution to continue
      return
    },
  }
}

/**
 * Create the base hook using the standard hook pattern
 * @param input - The plugin input context
 * @returns A Hooks object
 */
export function createHook(input: PluginInput): Hooks {
  return createThinkModeHook(input)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'think-mode',
  priority: 50,
  description: 'Detects think keywords and activates enhanced reasoning mode',
}

/**
 * Get all think keywords (useful for testing and documentation)
 * @returns Array of think keywords
 */
export function getThinkKeywords(): string[] {
  return [...THINK_KEYWORDS]
}

/**
 * Check if a provider supports thinking mode
 * @param provider - The provider name
 * @returns True if the provider supports thinking
 */
export function isProviderThinkingSupported(provider: string): boolean {
  return isThinkingSupported(provider)
}

/**
 * Get all thinking-supported providers
 * @returns Array of provider names
 */
export function getThinkingSupportedProviders(): readonly string[] {
  return THINKING_SUPPORTED_PROVIDERS
}

/**
 * Get the think mode state for a session (for testing/debugging)
 * @param sessionID - The session ID
 * @returns The session state or undefined
 */
export function getSessionThinkModeState(sessionID: string): ThinkModeSession | undefined {
  return getSessionState(sessionID)
}

/**
 * Reset all think mode sessions (for testing)
 */
export function resetAllThinkModeSessions(): void {
  thinkModeSessions.clear()
}

/**
 * Clear think mode state for a session
 * @param sessionID - The session ID
 */
export function clearThinkModeSession(sessionID: string): void {
  clearSessionState(sessionID)
}
