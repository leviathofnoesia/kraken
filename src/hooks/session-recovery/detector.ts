const errorPatterns: Record<string, RegExp[]> = {
  tool_result_missing: [/Tool.*returned.*empty/i, /No.*tool.*output/i, /Tool.*result.*missing/i],
  thinking_block_order: [
    /Thinking.*block.*order/i,
    /thinking.*blocks.*must.*come.*before/i,
    /Invalid.*thinking.*order/i,
  ],
  thinking_disabled_violation: [
    /Thinking.*disabled.*but.*block.*found/i,
    /thinking.*block.*without.*mode/i,
    /thinking.*tag.*without.*enabled.*mode/i,
  ],
  network_timeout: [/network.*timeout/i, /connection.*timed.*out/i, /ETIMEDOUT/i],
  rate_limit: [/rate.*limit/i, /too.*many.*requests/i, /429.*Too.*Many.*Requests/i],
  auth_error: [/authentication.*failed/i, /invalid.*api.*key/i, /unauthorized/i],
  no_error: [/no error detected/i],
}

export type RecoveryErrorType =
  | 'tool_result_missing'
  | 'thinking_block_order'
  | 'thinking_disabled_violation'
  | 'no_error'
  | 'network_timeout'
  | 'rate_limit'
  | 'auth_error'

export interface SessionRecoveryState {
  errorType: RecoveryErrorType | null
  errorCount: number
  lastErrorTime: number | null
  recoveryAttempts: number
  messagesBeforeError: number
}

export interface ErrorContext {
  sessionID: string
  error: Error | null
  toolOutput?: any
  thinkingBlocks?: any
  timestamp: number
}

export function detectErrorType(
  error: Error | string | null,
  _context?: ErrorContext,
): RecoveryErrorType {
  if (!error) {
    return 'no_error'
  }

  const errorString = error instanceof Error ? error.message : String(error)
  const lowerError = errorString.toLowerCase()

  for (const [type, patterns] of Object.entries(errorPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerError)) {
        return type as RecoveryErrorType
      }
    }
  }

  return 'no_error'
}

export function detectErrorFromOutput(output: any): RecoveryErrorType | null {
  if (!output || typeof output !== 'string') {
    return null
  }

  const outputString = output.toLowerCase()

  for (const [type, patterns] of Object.entries(errorPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(outputString)) {
        return type as RecoveryErrorType
      }
    }
  }

  return null
}

export function detectThinkingBlockOrderError(thinkingBlocks: any[]): RecoveryErrorType | null {
  if (!thinkingBlocks || thinkingBlocks.length < 2) {
    return null
  }

  const blockTags = thinkingBlocks
    .map((block: any) => {
      if (typeof block === 'string') {
        return block.trim()
      }
      return ''
    })
    .filter((tag: string) => tag.length > 0)

  const invalidPatterns: RegExp[] = [
    /thinking.*after.*reply/i,
    /thinking.*after.*response/i,
    /<!--thinking-->.*<!--\/thinking-->.*<!--thinking-->/i,
  ]

  for (const pattern of invalidPatterns) {
    const fullContent = blockTags.join('\n')
    if (pattern.test(fullContent)) {
      return 'thinking_block_order'
    }
  }

  return null
}

export function isRecoverableError(errorType: RecoveryErrorType): boolean {
  return ['tool_result_missing', 'thinking_block_order', 'network_timeout'].includes(errorType)
}

export function isTransientError(errorType: RecoveryErrorType): boolean {
  return ['network_timeout', 'rate_limit'].includes(errorType)
}

export function isPermanentError(errorType: RecoveryErrorType): boolean {
  return ['auth_error'].includes(errorType)
}

export function getRecoveryMessage(errorType: RecoveryErrorType): string {
  const messages: Record<RecoveryErrorType, string> = {
    tool_result_missing: 'Tool result appears to be missing or empty',
    thinking_block_order: 'Thinking blocks are in incorrect order',
    thinking_disabled_violation: 'Thinking block found but thinking mode is disabled',
    network_timeout: 'Network connection timed out',
    rate_limit: 'Rate limit exceeded',
    auth_error: 'Authentication failed',
    no_error: 'No error detected',
  }

  return messages[errorType]
}
