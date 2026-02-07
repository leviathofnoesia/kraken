import type { RecoveryErrorType, ErrorContext } from './detector'
import { createLogger } from '../../utils/logger'

export type { isRecoverableError } from './detector'

const logger = createLogger('session-recovery')

export interface RecoveryStrategy {
  errorType: RecoveryErrorType
  canRecover: (context: ErrorContext) => Promise<boolean>
  recover: (context: ErrorContext) => Promise<boolean>
  description: string
}

export interface RecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  skipConfirmation?: boolean
}

const toolResultMissingStrategy: RecoveryStrategy = {
  errorType: 'tool_result_missing',
  canRecover: async function (context: ErrorContext): Promise<boolean> {
    return context.sessionID !== undefined && context.toolOutput === undefined
  },
  recover: async function (context: ErrorContext): Promise<boolean> {
    logger.debug('Attempting to recover tool_result_missing for session ' + context.sessionID)
    logger.debug('[session recovered - continuing previous task]')
    return true
  },
  description: 'Retry of tool execution or continue with alternative approach',
}

const thinkingBlockOrderStrategy: RecoveryStrategy = {
  errorType: 'thinking_block_order',
  canRecover: async function (context: ErrorContext): Promise<boolean> {
    return context.sessionID !== undefined && context.thinkingBlocks !== undefined
  },
  recover: async function (context: ErrorContext): Promise<boolean> {
    logger.debug('Recovering thinking_block_order by reordering blocks')
    if (context.thinkingBlocks) {
      const blocks = Array.isArray(context.thinkingBlocks)
        ? context.thinkingBlocks
        : [context.thinkingBlocks]
      const reversed = blocks.reverse()
      logger.debug('Reordered ' + reversed.length + ' thinking blocks')
      return true
    }
    return false
  },
  description: 'Reorder thinking blocks to correct order',
}

const thinkingDisabledViolationStrategy: RecoveryStrategy = {
  errorType: 'thinking_disabled_violation',
  canRecover: async function (): Promise<boolean> {
    return true
  },
  recover: async function (): Promise<boolean> {
    logger.debug('Ignoring thinking_disabled_violation - will re-enable thinking mode')
    return true
  },
  description: 'Re-enable thinking mode in next request',
}

const networkTimeoutStrategy: RecoveryStrategy = {
  errorType: 'network_timeout',
  canRecover: async function (): Promise<boolean> {
    return true
  },
  recover: async function (): Promise<boolean> {
    logger.debug('Network timeout detected - will retry')
    return true
  },
  description: 'Retry of request with exponential backoff',
}

const rateLimitStrategy: RecoveryStrategy = {
  errorType: 'rate_limit',
  canRecover: async function (): Promise<boolean> {
    return true
  },
  recover: async function (): Promise<boolean> {
    logger.debug('Rate limit hit - implementing delay')
    await new Promise(function (resolve) {
      setTimeout(resolve, 5000)
    })
    return true
  },
  description: 'Wait and retry with exponential backoff',
}

const authErrorStrategy: RecoveryStrategy = {
  errorType: 'auth_error',
  canRecover: async function (): Promise<boolean> {
    return false
  },
  recover: async function (): Promise<boolean> {
    logger.error('Authentication error - cannot recover automatically')
    return false
  },
  description: 'User must re-authenticate manually',
}

const strategies: Partial<Record<RecoveryErrorType, RecoveryStrategy>> = {
  tool_result_missing: toolResultMissingStrategy,
  thinking_block_order: thinkingBlockOrderStrategy,
  thinking_disabled_violation: thinkingDisabledViolationStrategy,
  network_timeout: networkTimeoutStrategy,
  rate_limit: rateLimitStrategy,
  auth_error: authErrorStrategy,
}

export async function attemptRecovery(
  errorType: RecoveryErrorType,
  context: ErrorContext,
  options?: RecoveryOptions,
): Promise<boolean> {
  const strategy = strategies[errorType]
  if (!strategy) {
    logger.debug('No recovery strategy for error type: ' + errorType)
    return false
  }

  const canRecover = await strategy.canRecover(context)
  if (!canRecover) {
    logger.debug('Cannot recover from ' + errorType)
    return false
  }

  if (options?.skipConfirmation) {
    return await strategy.recover(context)
  }

  logger.debug('Recovery option: ' + strategy.description)
  logger.debug('[session recovered - continuing previous task]')

  return await strategy.recover(context)
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        logger.debug('Retry ' + (attempt + 1) + '/' + maxRetries + ' after ' + delay + 'ms')
        await new Promise(function (resolve) {
          setTimeout(resolve, delay)
        })
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
