import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import { SHOULD_LOG } from '../../utils/logger'

export interface EmptyMessageSanitizerConfig {
  enabled?: boolean
  requireJustification?: boolean
  trackPatterns?: boolean
  autoRecover?: boolean
}

interface SessionMessageHistory {
  sessionID: string
  emptyCount: number
  lastEmptyTime: number | null
  history: Array<{ timestamp: number; reason: string }>
}

const sessionHistories = new Map<string, SessionMessageHistory>()

function getSessionHistory(sessionID: string): SessionMessageHistory {
  let history = sessionHistories.get(sessionID)
  if (!history) {
    history = {
      sessionID,
      emptyCount: 0,
      lastEmptyTime: null,
      history: [],
    }
    sessionHistories.set(sessionID, history)
  }
  return history
}

function getTextFromParts(parts: Part[]): string {
  return parts
    .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
    .trim()
}

function hasNonTextParts(parts: Part[]): boolean {
  return parts.some((p) => p.type !== 'text')
}

function hasToolCalls(parts: Part[]): boolean {
  return parts.some((p) => p.type === 'tool')
}

interface MessageCheckResult {
  isEmpty: boolean
  reason: string
  hasContent: boolean
  hasTools: boolean
}

function checkMessage(parts: Part[]): MessageCheckResult {
  const text = getTextFromParts(parts)
  const hasTools = hasToolCalls(parts)
  const hasNonText = hasNonTextParts(parts)

  if (text.length === 0 && !hasTools && !hasNonText) {
    return {
      isEmpty: true,
      reason: 'No text content, no tool calls, and no other parts',
      hasContent: false,
      hasTools: false,
    }
  }

  if (text.length === 0 && !hasTools) {
    return {
      isEmpty: true,
      reason: 'No text content and no tool calls',
      hasContent: false,
      hasTools: false,
    }
  }

  if (text.trim() === '') {
    return {
      isEmpty: true,
      reason: 'Text content is whitespace-only',
      hasContent: false,
      hasTools: hasTools,
    }
  }

  return {
    isEmpty: false,
    reason: '',
    hasContent: true,
    hasTools: hasTools,
  }
}

function getSuggestionBasedOnContext(check: MessageCheckHistory): string {
  if (check.previousToolUse) {
    return 'Did you mean to respond with tool output or provide next instructions?'
  }
  if (check.isStartOfSession) {
    return 'Please provide your request or task description.'
  }
  return 'Did you mean to include a tool call, response, or clarification?'
}

interface MessageCheckHistory {
  isStartOfSession: boolean
  previousToolUse: boolean
  messageCount: number
}

function getMessageHistory(sessionID: string): MessageCheckHistory {
  const history = sessionHistories.get(sessionID)
  if (!history) {
    return {
      isStartOfSession: true,
      previousToolUse: false,
      messageCount: 0,
    }
  }
  const lastEntry = history.history[history.history.length - 1]
  return {
    isStartOfSession: false,
    previousToolUse: lastEntry?.reason.includes('tool') || false,
    messageCount: history.history.length,
  }
}

export function createEmptyMessageSanitizer(
  _input: PluginInput,
  options?: { config?: EmptyMessageSanitizerConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    requireJustification: false,
    trackPatterns: true,
    autoRecover: true,
  }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return

      const { sessionID } = input
      const check = checkMessage(output.parts)

      if (check.isEmpty) {
        const history = getSessionHistory(sessionID)
        history.emptyCount++
        history.lastEmptyTime = Date.now()
        history.history.push({
          timestamp: Date.now(),
          reason: check.reason,
        })

        if (SHOULD_LOG) {
          console.log(`[empty-message-sanitizer] Detected empty message in session ${sessionID}`)
          console.log(`[empty-message-sanitizer] Reason: ${check.reason}`)

          if (config.trackPatterns && history.emptyCount > 1) {
            console.log(
              `[empty-message-sanitizer] Empty message count: ${history.emptyCount} ` +
                `in session ${sessionID}`,
            )
          }

          if (config.autoRecover) {
            console.log('[empty-message-sanitizer] [session recovered - continuing previous task]')
          }

          if (config.requireJustification && config.autoRecover) {
            console.log(
              '[empty-message-sanitizer] Please provide a justification for ' +
                'sending an empty message, or include actual content.',
            )
          }
        }
      }
    },
  }
}

export function getSessionEmptyHistory(sessionID: string): SessionMessageHistory | undefined {
  return sessionHistories.get(sessionID)
}

export function clearSessionEmptyHistory(sessionID: string): void {
  sessionHistories.delete(sessionID)
}

export function getAllSessionEmptyHistories(): Map<string, SessionMessageHistory> {
  return new Map(sessionHistories)
}
