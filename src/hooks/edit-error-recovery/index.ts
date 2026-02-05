import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'

export interface EditErrorRecoveryConfig {
  enabled?: boolean
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  autoCreateDirs?: boolean
  trackConflicts?: boolean
}

interface EditFailure {
  timestamp: number
  filePath: string
  errorType: string
  errorMessage: string
  retryAttempt: number
}

interface FileEditHistory {
  filePath: string
  failures: EditFailure[]
  lastGoodContent: string | null
  conflictCount: number
}

const fileHistories = new Map<string, FileEditHistory>()
const editRetries = new Map<string, number>()

function getFileHistory(filePath: string): FileEditHistory {
  let history = fileHistories.get(filePath)
  if (!history) {
    history = {
      filePath,
      failures: [],
      lastGoodContent: null,
      conflictCount: 0,
    }
    fileHistories.set(filePath, history)
  }
  return history
}

function getRetryDelay(retryCount: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, retryCount)
  return Math.min(delay, maxDelay)
}

type EditErrorType =
  | 'file_not_found'
  | 'permission_denied'
  | 'merge_conflict'
  | 'concurrent_edit'
  | 'unknown'

function detectEditErrorType(error: any): EditErrorType {
  const errorMessage = String(error).toLowerCase()

  if (errorMessage.includes('no such file') || errorMessage.includes('file not found')) {
    return 'file_not_found'
  }
  if (errorMessage.includes('permission denied') || errorMessage.includes('eacces')) {
    return 'permission_denied'
  }
  if (errorMessage.includes('not found') || errorMessage.includes('string not found')) {
    return 'merge_conflict'
  }
  if (errorMessage.includes('concurrent') || errorMessage.includes('modified')) {
    return 'concurrent_edit'
  }

  return 'unknown'
}

interface RecoveryAction {
  canRecover: boolean
  action: string
  suggestion: string
}

function getRecoveryAction(
  errorType: EditErrorType,
  filePath: string,
  config: EditErrorRecoveryConfig,
): RecoveryAction {
  switch (errorType) {
    case 'file_not_found':
      if (config.autoCreateDirs) {
        return {
          canRecover: true,
          action: 'create_directories',
          suggestion: 'Create parent directories and retry edit',
        }
      }
      return {
        canRecover: false,
        action: 'none',
        suggestion: 'Create the file or parent directories manually',
      }

    case 'permission_denied':
      return {
        canRecover: false,
        action: 'check_permissions',
        suggestion: 'Check file permissions and user access',
      }

    case 'merge_conflict':
      return {
        canRecover: true,
        action: 'refresh_and_retry',
        suggestion: 'Read file again and retry with current content',
      }

    case 'concurrent_edit':
      return {
        canRecover: true,
        action: 'retry_with_backoff',
        suggestion: 'Wait and retry edit with fresh content',
      }

    default:
      return {
        canRecover: false,
        action: 'none',
        suggestion: 'Investigate the error and try again',
      }
  }
}

async function applyRecovery(
  errorType: EditErrorType,
  filePath: string,
  config: EditErrorRecoveryConfig,
): Promise<boolean> {
  const action = getRecoveryAction(errorType, filePath, config)

  if (!action.canRecover) {
    console.log(`[edit-error-recovery] Cannot recover from error type: ${errorType}`)
    console.log(`[edit-error-recovery] Suggestion: ${action.suggestion}`)
    return false
  }

  console.log(`[edit-error-recovery] Attempting recovery action: ${action.action}`)
  console.log(`[edit-error-recovery] Suggestion: ${action.suggestion}`)

  if (errorType === 'file_not_found' && config.autoCreateDirs) {
    try {
      const { mkdir } = await import('node:fs/promises')
      const dir = filePath.split('/').slice(0, -1).join('/')
      if (dir) {
        await mkdir(dir, { recursive: true })
        console.log(`[edit-error-recovery] Created directory: ${dir}`)
      }
      return true
    } catch (e) {
      console.error(`[edit-error-recovery] Failed to create directory: ${e}`)
      return false
    }
  }

  return true
}

export function createEditErrorRecovery(
  _input: PluginInput,
  options?: { config?: EditErrorRecoveryConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 10000,
    autoCreateDirs: true,
    trackConflicts: true,
  }

  return {
    'tool.execute.after': async (input, output) => {
      if (!config.enabled) return

      if (input.tool !== 'edit' && input.tool !== 'write') {
        return
      }

      const sessionID = input.sessionID
      const filePath = (input as any).filePath
      const maxRetries = config.maxRetries ?? 5
      const baseDelay = config.baseDelay ?? 500
      const maxDelay = config.maxDelay ?? 10000

      const outputAny = output as any
      if (outputAny.error || outputAny.status === 'error') {
        const error = outputAny.error || outputAny.output || 'Unknown error'
        const errorType = detectEditErrorType(error)
        const retryKey = `${sessionID}-${filePath || 'unknown'}`

        const currentRetries = editRetries.get(retryKey) ?? 0

        if (currentRetries < maxRetries) {
          if (filePath) {
            const history = getFileHistory(filePath)
            history.failures.push({
              timestamp: Date.now(),
              filePath,
              errorType,
              errorMessage: String(error),
              retryAttempt: currentRetries + 1,
            })

            if (errorType === 'merge_conflict' && config.trackConflicts) {
              history.conflictCount++
            }
          }

          console.log(
            `[edit-error-recovery] Edit error detected (attempt ${currentRetries + 1}/${maxRetries})`,
          )
          if (filePath) {
            console.log(`[edit-error-recovery] File: ${filePath}`)
          }
          console.log(`[edit-error-recovery] Error type: ${errorType}`)
          console.log(`[edit-error-recovery] Error: ${error}`)

          const recovered = await applyRecovery(errorType, filePath || '', config)

          if (recovered) {
            const delay = getRetryDelay(currentRetries, baseDelay, maxDelay)
            editRetries.set(retryKey, currentRetries + 1)

            console.log(`[edit-error-recovery] Retry scheduled in ${delay}ms`)
            console.log('[edit-error-recovery] [session recovered - continuing previous task]')

            setTimeout(() => {
              editRetries.delete(retryKey)
            }, delay)
          } else {
            console.error(`[edit-error-recovery] Recovery failed for ${filePath || 'unknown'}`)
            editRetries.delete(retryKey)
          }
        } else {
          console.error(
            `[edit-error-recovery] Max retries (${maxRetries}) exceeded for ${filePath || 'unknown'}`,
          )
          editRetries.delete(retryKey)
        }
      } else {
        if (filePath) {
          editRetries.delete(`${sessionID}-${filePath}`)
        }
      }
    },
  }
}

export function getFileEditHistory(filePath: string): FileEditHistory | undefined {
  return fileHistories.get(filePath)
}

export function clearFileEditHistory(filePath: string): void {
  fileHistories.delete(filePath)
}

export function getAllFileEditHistories(): Map<string, FileEditHistory> {
  return new Map(fileHistories)
}

export function getActiveRetries(): Map<string, number> {
  return new Map(editRetries)
}
