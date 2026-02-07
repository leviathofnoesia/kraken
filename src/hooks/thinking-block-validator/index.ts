import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import { SHOULD_LOG } from '../../utils/logger'

export interface ThinkingBlockValidatorConfig {
  enabled?: boolean
  autoRecover?: boolean
  strictMode?: boolean
  enforcePosition?: boolean
  requireContent?: boolean
}

interface ValidationError {
  type: string
  line: number
  message: string
  suggestion: string
  recovered: boolean
}

interface SessionValidationHistory {
  sessionID: string
  errorCount: number
  lastErrorTime: number | null
  history: Array<{ timestamp: number; errors: ValidationError[] }>
}

const sessionHistories = new Map<string, SessionValidationHistory>()

function getSessionHistory(sessionID: string): SessionValidationHistory {
  let history = sessionHistories.get(sessionID)
  if (!history) {
    history = {
      sessionID,
      errorCount: 0,
      lastErrorTime: null,
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
}

interface ValidationResult {
  hasErrors: boolean
  errors: ValidationError[]
  recovered: boolean
}

function findTagPosition(text: string, tag: string): number[] {
  const positions: number[] = []
  let pos = text.indexOf(tag)
  while (pos !== -1) {
    positions.push(pos)
    pos = text.indexOf(tag, pos + tag.length)
  }
  return positions
}

function validateThinkingBlocks(
  text: string,
  config: ThinkingBlockValidatorConfig,
): ValidationResult {
  const errors: ValidationError[] = []
  const lines = text.split('\n')
  let recovered = false

  const openTags = findTagPosition(text, '<thinking>')
  const closeTags = findTagPosition(text, '</thinking>')

  if (openTags.length !== closeTags.length) {
    errors.push({
      type: 'mismatched_tags',
      line: 0,
      message: `Mismatched thinking block tags: ${openTags.length} opening, ${closeTags.length} closing`,
      suggestion: 'Ensure every <thinking> has a matching </thinking>',
      recovered: false,
    })
  }

  if (openTags.length === 0 && text.includes('</thinking>')) {
    const canRecover = config.autoRecover ?? false
    errors.push({
      type: 'missing_open_tag',
      line: 0,
      message: 'Found closing </thinking> tag without opening <thinking>',
      suggestion: 'Add <thinking> tag before the closing tag',
      recovered: canRecover,
    })
    recovered = canRecover
  }

  if (closeTags.length === 0 && text.includes('<thinking>')) {
    const canRecover = config.autoRecover ?? false
    errors.push({
      type: 'missing_close_tag',
      line: 0,
      message: 'Found opening <thinking> tag without closing </thinking>',
      suggestion: 'Add </thinking> tag to close the thinking block',
      recovered: canRecover,
    })
    recovered = canRecover
  }

  for (let i = 0; i < openTags.length; i++) {
    const openPos = openTags[i]
    const closePos = closeTags[i]

    if (closePos !== undefined && closePos < openPos) {
      const lineNum = text.substring(0, closePos).split('\n').length
      const canRecover = config.autoRecover ?? false
      errors.push({
        type: 'inverted_tags',
        line: lineNum,
        message: 'Closing tag appears before opening tag',
        suggestion: 'Remove duplicate opening tag or reorder tags correctly',
        recovered: canRecover,
      })
      recovered = canRecover
    }

    if (i < openTags.length - 1 && closePos !== undefined) {
      const nextOpenPos = openTags[i + 1]
      if (nextOpenPos < closePos) {
        const lineNum = text.substring(0, nextOpenPos).split('\n').length
        const canRecover = config.autoRecover ?? false
        errors.push({
          type: 'nested_thinking',
          line: lineNum,
          message: 'Nested thinking blocks detected (opening tag before closing previous block)',
          suggestion: 'Close the previous thinking block before opening a new one',
          recovered: canRecover,
        })
        recovered = canRecover
      }
    }
  }

  if (config.enforcePosition) {
    const lastThinkingClose = closeTags.length > 0 ? Math.max(...closeTags) : -1
    const hasContentAfter =
      lastThinkingClose >= 0 ? text.substring(lastThinkingClose).trim().length > 0 : false

    if (hasContentAfter) {
      const lineNum = text.substring(0, lastThinkingClose).split('\n').length
      const canRecover = config.autoRecover ?? false
      errors.push({
        type: 'content_after_thinking',
        line: lineNum,
        message: 'Content found after last thinking block',
        suggestion: 'Move thinking blocks to beginning of message',
        recovered: canRecover,
      })
      recovered = canRecover
    }
  }

  if (config.requireContent) {
    for (let i = 0; i < openTags.length; i++) {
      const openPos = openTags[i]
      const closePos = closeTags[i]

      if (closePos !== undefined) {
        const content = text.substring(openPos + 10, closePos).trim()
        if (content.length === 0) {
          const lineNum = text.substring(0, openPos).split('\n').length
          const canRecover = config.autoRecover ?? false
          errors.push({
            type: 'empty_thinking',
            line: lineNum,
            message: 'Empty thinking block (no content between tags)',
            suggestion: 'Add meaningful thinking content or remove the empty block',
            recovered: canRecover,
          })
          recovered = canRecover
        }
      }
    }
  }

  return {
    hasErrors: errors.length > 0,
    errors,
    recovered,
  }
}

function applyRecovery(text: string, errors: ValidationError[]): string {
  let recovered = text

  for (const error of errors) {
    if (!error.recovered) continue

    switch (error.type) {
      case 'missing_close_tag':
        recovered = recovered.replace(/<thinking>$/, '<thinking>\n</thinking>')
        break

      case 'missing_open_tag':
        recovered = recovered.replace(/^<\/thinking>/, '<thinking>\n</thinking>')
        break

      case 'inverted_tags':
        const openCount = (recovered.match(/<thinking>/g) || []).length
        const closeCount = (recovered.match(/<\/thinking>/g) || []).length
        if (openCount > closeCount) {
          recovered += '\n</thinking>'
        }
        break

      case 'nested_thinking':
        const lastOpen = recovered.lastIndexOf('<thinking>')
        const lastClose = recovered.lastIndexOf('</thinking>')
        if (lastClose < lastOpen) {
          recovered += '\n</thinking>'
        }
        break

      case 'empty_thinking':
        recovered = recovered.replace(/<thinking>\s*<\/thinking>/gi, '')
        break

      case 'content_after_thinking':
        const lastClosePos = recovered.lastIndexOf('</thinking>')
        if (lastClosePos >= 0) {
          const afterThinking = recovered.substring(lastClosePos + 13).trim()
          if (afterThinking.length > 0) {
            recovered = recovered.substring(0, lastClosePos + 13)
          }
        }
        break

      default:
        break
    }
  }

  return recovered
}

export function createThinkingBlockValidator(
  _input: PluginInput,
  options?: { config?: ThinkingBlockValidatorConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    autoRecover: true,
    strictMode: false,
    enforcePosition: true,
    requireContent: true,
  }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return

      const { sessionID } = input
      const text = getTextFromParts(output.parts)

      if (!text.includes('<thinking>') && !text.includes('</thinking>')) {
        return
      }

      const validation = validateThinkingBlocks(text, config)

      if (validation.hasErrors) {
        const history = getSessionHistory(sessionID)
        history.errorCount++
        history.lastErrorTime = Date.now()
        history.history.push({
          timestamp: Date.now(),
          errors: validation.errors,
        })

        if (SHOULD_LOG) {
          console.log(
            `[thinking-block-validator] Detected ${validation.errors.length} thinking block validation error(s) ` +
              `in session ${sessionID}`,
          )

          for (const error of validation.errors) {
            console.log(
              `[thinking-block-validator] [${error.type}] Line ${error.line}: ${error.message}`,
            )
            console.log(`[thinking-block-validator] Suggestion: ${error.suggestion}`)

            if (error.recovered) {
              console.log(`[thinking-block-validator] ✓ Auto-recovery applied`)
            }
          }
        }

        if (config.autoRecover && validation.recovered) {
          const recoveredText = applyRecovery(text, validation.errors)
          if (SHOULD_LOG) {
            console.log('[thinking-block-validator] [session recovered - continuing previous task]')
            console.log(
              `[thinking-block-validator] Recovered text length: ${recoveredText.length} ` +
                `(original: ${text.length})`,
            )
          }
        }

        if (config.strictMode && !validation.recovered) {
          if (SHOULD_LOG) console.error(
            '[thinking-block-validator] CRITICAL: Validation failed in strict mode. ' +
              'Please fix the thinking block structure before continuing.',
          )
        }
      }
    },
  }
}

export function getSessionValidationHistory(
  sessionID: string,
): SessionValidationHistory | undefined {
  return sessionHistories.get(sessionID)
}

export function clearSessionValidationHistory(sessionID: string): void {
  sessionHistories.delete(sessionID)
}

export function getAllSessionValidationHistories(): Map<string, SessionValidationHistory> {
  return new Map(sessionHistories)
}
