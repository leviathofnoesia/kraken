/**
 * Context Window Monitor Hook
 *
 * Monitors token usage and warns when approaching context window limits.
 * Issues warnings at configurable threshold (default 70%).
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import { SHOULD_LOG } from '../../utils/logger'

/**
 * Default warning threshold as percentage (70%)
 */
export const DEFAULT_WARNING_THRESHOLD = 0.7

/**
 * Model token limits (in tokens)
 * These are approximate limits for common models
 */
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // Claude models
  'claude-3-5-sonnet': 200000,
  'claude-3-5-haiku': 200000,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,

  // GPT models
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16385,

  // Google models
  'gemini-2.5-pro': 1000000,
  'gemini-2.5-flash': 1000000,
  'gemini-2.0-flash': 1000000,
  'gemini-1.5-pro': 2800000,
  'gemini-1.5-flash': 1000000,

  // Default fallback
  default: 100000,
}

/**
 * Session state for tracking context window usage
 */
interface ContextMonitorSession {
  messageCount: number
  lastWarningAt: number
  totalEstimatedTokens: number
}

/**
 * Map of sessionID to context monitor state
 */
const contextMonitorSessions = new Map<string, ContextMonitorSession>()

/**
 * Get context monitor state for a session
 * @param sessionID - The session ID
 * @returns The session state or undefined
 */
function getSessionState(sessionID: string): ContextMonitorSession | undefined {
  return contextMonitorSessions.get(sessionID)
}

/**
 * Initialize or update context monitor state for a session
 * @param sessionID - The session ID
 * @returns The session state
 */
function getOrCreateSessionState(sessionID: string): ContextMonitorSession {
  let state = contextMonitorSessions.get(sessionID)
  if (!state) {
    state = {
      messageCount: 0,
      lastWarningAt: 0,
      totalEstimatedTokens: 0,
    }
    contextMonitorSessions.set(sessionID, state)
  }
  return state
}

/**
 * Get the token limit for a given model
 * @param model - The model name
 * @returns The token limit in tokens
 */
function getModelTokenLimit(model: string): number {
  // Normalize model name (lowercase, remove version suffixes)
  const normalized = model.toLowerCase()

  // Try to find an exact match
  if (MODEL_TOKEN_LIMITS[normalized]) {
    return MODEL_TOKEN_LIMITS[normalized]
  }

  // Try to find a partial match
  for (const [key, limit] of Object.entries(MODEL_TOKEN_LIMITS)) {
    if (normalized.includes(key.toLowerCase())) {
      return limit
    }
  }

  // Use default limit
  return MODEL_TOKEN_LIMITS['default']
}

/**
 * Estimate tokens from text content (approximate: 4 chars = 1 token)
 * @param text - The text content
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token for English text
  // This is a heuristic; actual tokenization varies by model
  return Math.ceil(text.length / 4)
}

/**
 * Check if context window usage should trigger a warning
 * @param currentTokens - Current token usage
 * @param model - The model name
 * @param threshold - Warning threshold (default: 0.7 for 70%)
 * @returns True if warning should be issued
 */
export function shouldIssueContextWarning(
  currentTokens: number,
  model: string,
  threshold: number = DEFAULT_WARNING_THRESHOLD,
): boolean {
  if (currentTokens <= 0) {
    return false
  }

  const tokenLimit = getModelTokenLimit(model)
  const usagePercentage = currentTokens / tokenLimit

  return usagePercentage >= threshold
}

/**
 * Check context window and issue warning if needed
 * @param sessionID - The session ID
 * @param model - The model name
 * @param estimatedTokens - Estimated tokens for current message
 * @param threshold - Custom warning threshold (optional)
 */
export function checkContextWindow(
  sessionID: string,
  model: string,
  estimatedTokens: number,
  threshold?: number,
): void {
  const state = getOrCreateSessionState(sessionID)
  state.messageCount++
  state.totalEstimatedTokens += estimatedTokens

  // Check if we should warn (warn every 10 messages or if at threshold)
  const shouldWarn =
    state.messageCount % 10 === 0 ||
    shouldIssueContextWarning(state.totalEstimatedTokens, model, threshold)

  if (shouldWarn) {
    // Debounce warnings - only warn once per minute for same session
    const now = Date.now()
    if (now - state.lastWarningAt >= 60000) {
      const tokenLimit = getModelTokenLimit(model)
      const usagePercentage = calculateUsagePercentage(state.totalEstimatedTokens, model)

      if (SHOULD_LOG) {
        if (usagePercentage >= (threshold ?? DEFAULT_WARNING_THRESHOLD) * 100) {
          console.warn(
            `⚠️  Context Window Warning: You are at ${usagePercentage}% of ${tokenLimit} token limit (~${state.totalEstimatedTokens}/${tokenLimit} tokens). Consider clearing context.`,
          )
        } else {
          console.log(
            `ℹ️  Context Window: At ${usagePercentage}% of ${tokenLimit} token limit (~${state.totalEstimatedTokens}/${tokenLimit} tokens, ${state.messageCount} messages).`,
          )
        }
      }

      state.lastWarningAt = now
    }
  }
}

/**
 * Calculate usage percentage
 * @param currentTokens - Current token usage
 * @param model - The model name
 * @returns Usage percentage (0-100)
 */
export function calculateUsagePercentage(currentTokens: number, model: string): number {
  const tokenLimit = getModelTokenLimit(model)
  if (tokenLimit <= 0) {
    return 0
  }
  return Math.round((currentTokens / tokenLimit) * 100)
}

/**
 * Get token limit for a specific model
 * @param model - The model name
 * @returns Token limit in tokens, or default limit if unknown
 */
export function getTokenLimitForModel(model: string): number {
  return getModelTokenLimit(model)
}

/**
 * Get all available model token limits
 * @returns Record of model names to token limits
 */
export function getModelTokenLimits(): Readonly<Record<string, number>> {
  return { ...MODEL_TOKEN_LIMITS }
}

/**
 * Create context window monitor hook
 * @param input - The plugin input context
 * @returns A Hooks object with context window monitoring
 */
export function createContextWindowMonitorHook(input: PluginInput): Hooks {
  return {
    // Hook executed before chat messages
    'chat.message': async (messageInput: any, messageOutput: any) => {
      const { sessionID, model } = messageInput
      const modelID = model?.modelID || 'default'

      // Estimate tokens from message content
      const parts = messageOutput?.parts || []
      const textContent = parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n')

      if (textContent) {
        const estimatedTokens = estimateTokens(textContent)
        checkContextWindow(sessionID, modelID, estimatedTokens)
      }

      // Allow execution to continue
      return
    },
  }
}

/**
 * Create base hook using standard hook pattern
 * @param input - The plugin input context
 * @returns A Hooks object
 */
export function createHook(input: PluginInput): Hooks {
  return createContextWindowMonitorHook(input)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'context-window-monitor',
  priority: 40,
  description: 'Monitors token usage and warns at context window threshold',
}

/**
 * Get context monitor state for a session (for testing/debugging)
 * @param sessionID - The session ID
 * @returns The session state or undefined
 */
export function getSessionContextState(sessionID: string): ContextMonitorSession | undefined {
  return getSessionState(sessionID)
}

/**
 * Reset all context monitor sessions (for testing)
 */
export function resetAllContextSessions(): void {
  contextMonitorSessions.clear()
}

/**
 * Clear context monitor state for a session
 * @param sessionID - The session ID
 */
export function clearContextSession(sessionID: string): void {
  contextMonitorSessions.delete(sessionID)
}
