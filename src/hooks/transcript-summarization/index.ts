/**
 * Transcript Summarization Hook
 *
 * Periodically summarizes session transcripts to prevent context window growth.
 * Uses extractive summarization (no external API needed).
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import { SHOULD_LOG, createLogger } from '../../utils/logger'

const logger = createLogger('transcript-summarization')

export interface TranscriptSummarizationConfig {
  enabled?: boolean
  messageThreshold?: number // Number of messages before summarization
  summaryRatio?: number // Target summary size as ratio of original
  preserveRecent?: number // Number of recent messages to always preserve
}

const DEFAULT_CONFIG = {
  enabled: true,
  messageThreshold: 30,
  summaryRatio: 0.3,
  preserveRecent: 5,
}

// Session state for tracking messages
interface SessionState {
  messages: any[]
  summaryCount: number
}

const sessionStates = new Map<string, SessionState>()

/**
 * Estimate token count
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3)
}

/**
 * Extract key sentences using simple scoring
 */
function extractKeySentences(text: string, targetRatio: number): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  if (sentences.length <= 3) {
    return text
  }

  // Score each sentence by length and position
  const scoredSentences = sentences.map((sentence, index) => {
    const length = sentence.split(/\s+/).length
    const positionBonus = index < 3 ? 1.5 : index >= sentences.length - 3 ? 1.2 : 1.0
    return {
      sentence: sentence.trim(),
      score: length * positionBonus,
    }
  })

  // Sort by score descending
  scoredSentences.sort((a, b) => b.score - a.score)

  // Select top sentences up to target ratio
  const totalSentences = sentences.length
  const targetCount = Math.max(3, Math.ceil(totalSentences * targetRatio))

  const selected = scoredSentences.slice(0, targetCount)

  // Restore original order
  selected.sort((a, b) => {
    const aIndex = sentences.indexOf(a.sentence)
    const bIndex = sentences.indexOf(b.sentence)
    return aIndex - bIndex
  })

  return selected.map((s) => s.sentence).join('. ') + '.'
}

/**
 * Extract key points from tool usage
 */
function extractToolSummary(messages: any[]): string {
  const toolUsages: string[] = []

  for (const message of messages) {
    if (message.role === 'tool') {
      const toolName = message.name || message.tool_call?.name || 'unknown'
      const result = message.result || message.output || ''

      // Truncate result for summary
      const truncatedResult =
        result.length > 100 ? result.substring(0, 100) + '...' : result

      toolUsages.push(`- ${toolName}: ${truncatedResult}`)
    }
  }

  return toolUsages.length > 0
    ? `\n\n### Tools Used\n${toolUsages.join('\n')}`
    : ''
}

/**
 * Generate extractive summary of messages
 */
function generateSummary(messages: any[], preserveRecent: number): string {
  // Separate messages to preserve and to summarize
  const toSummarize = messages.slice(0, messages.length - preserveRecent)
  const recent = messages.slice(-preserveRecent)

  // Extract text content from messages
  const textContent: string[] = []

  for (const msg of toSummarize) {
    if (typeof msg.content === 'string') {
      textContent.push(msg.content)
    } else if (Array.isArray(msg.content)) {
      const textParts = msg.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
      textContent.push(textParts.join(' '))
    }
  }

  const combinedText = textContent.join(' ')
  const summary = extractKeySentences(combinedText, DEFAULT_CONFIG.summaryRatio)
  const toolSummary = extractToolSummary(toSummarize)

  return `## Previous Conversation Summary\n\n${summary}${toolSummary}\n\n---\n\n`
}

/**
 * Get or create session state
 */
function getOrCreateSessionState(sessionID: string): SessionState {
  let state = sessionStates.get(sessionID)
  if (!state) {
    state = {
      messages: [],
      summaryCount: 0,
    }
    sessionStates.set(sessionID, state)
  }
  return state
}

/**
 * Process messages to potentially summarize
 */
async function processMessages(
  input: any,
  config: typeof DEFAULT_CONFIG,
): Promise<any> {
  if (!config.enabled) {
    return input
  }

  try {
    const sessionID = input.sessionID || 'default'
    const state = getOrCreateSessionState(sessionID)

    // Add current messages to state
    const messages = input.messages || []

    // Track message count
    const newMessageCount = messages.length - state.messages.length
    state.messages = [...messages]

    // Check if we need to summarize
    if (messages.length >= config.messageThreshold) {
      // Generate summary
      const summary = generateSummary(messages, config.preserveRecent)

      // Keep recent messages + add summary at the beginning
      const recentMessages = messages.slice(-config.preserveRecent)

      // Create new message list with summary
      const summaryMessage = {
        role: 'system',
        content: summary,
        _isSummary: true,
      }

      input.messages = [summaryMessage, ...recentMessages]

      // Update state
      state.summaryCount++

      // Add metadata
      if (!input.metadata) {
        input.metadata = {}
      }
      input.metadata.transcriptSummarized = true
      input.metadata.summaryCount = state.summaryCount
      input.metadata.originalMessageCount = messages.length
      input.metadata.newMessageCount = input.messages.length

      if (SHOULD_LOG) {
        logger.debug(
          `Transcript summarized: ${messages.length} → ${input.messages.length} messages`,
        )
      }
    }
  } catch (error) {
    logger.error('Error in transcript summarization:', error)
  }

  return input
}

/**
 * Create transcript summarization hook
 */
export function createTranscriptSummarizationHook(
  _input: PluginInput,
  options?: { config?: TranscriptSummarizationConfig },
): Hooks {
  const config = { ...DEFAULT_CONFIG, ...options?.config }

  return {
    'chat.params': async (input: any, output: any) => {
      if (!config.enabled) return

      // Process and potentially summarize
      await processMessages(input, config)

      return
    },
  }
}

/**
 * Create base hook using standard pattern
 */
export function createHook(
  input: PluginInput,
  options?: { config?: TranscriptSummarizationConfig },
): Hooks {
  return createTranscriptSummarizationHook(input, options)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'transcript-summarization',
  priority: 20, // Run early
  description: 'Summarizes session transcripts to prevent context window growth',
}

/**
 * Clear session states
 */
export function clearSessionStates(): void {
  sessionStates.clear()
}

/**
 * Get session state (for testing)
 */
export function getSessionState(sessionID: string): SessionState | undefined {
  return sessionStates.get(sessionID)
}
