import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import type { RecoveryErrorType, ErrorContext, SessionRecoveryState } from "./detector"
import { isRecoverableError } from "./detector"

export interface SessionRecoveryConfig {
  enabled?: boolean
  autoRecover?: boolean
}

interface SessionErrorState {
  sessionID: string
  errorType: RecoveryErrorType | null
  errorCount: number
  lastErrorTime: number | null
  recoveryAttempts: number
  messagesBeforeError: number
}

const sessionErrorStates = new Map<string, SessionErrorState>()

export function createSessionRecovery(
  _input: PluginInput,
  options?: { config?: SessionRecoveryConfig }
): Hooks {
  const config = options?.config ?? { enabled: true, autoRecover: false }

  if (!config.enabled) {
    return {
      "chat.message": async () => {},
    }
  }

  return {
    "chat.message": async (input: any) => {
      const { sessionID } = input
      if (!sessionID) return

      const state = getOrCreateSessionState(sessionID)
      state.errorType = null
    },

    "event": async (input: any) => {
      const { sessionID, type, error } = input

      if (type !== "session.error") return
      if (!sessionID) return

      const { detectErrorType } = await import("./detector")
      const errorType = detectErrorType(error)
      const state = getOrCreateSessionState(sessionID)

      state.errorType = errorType
      state.lastErrorTime = Date.now()
      state.errorCount++

      console.log(`[session-recovery] Detected error type: ${errorType}`)
      console.log(`[session-recovery] Error count for session ${sessionID}: ${state.errorCount}`)

      if (config.autoRecover && isRecoverableError(errorType)) {
        const { attemptRecovery } = await import("./strategies")
        const context: ErrorContext = {
          sessionID,
          error,
          timestamp: Date.now(),
        }

        try {
          await attemptRecovery(errorType, context, { maxRetries: 3 })
          console.log(`[session-recovery] Auto-recovery attempted for ${errorType}`)
        } catch (recoveryError) {
          console.error("[session-recovery] Auto-recovery failed:", recoveryError)
        }
      }
    },
  }
}

function getOrCreateSessionState(sessionID: string): SessionErrorState {
  let state = sessionErrorStates.get(sessionID)
  if (!state) {
    state = {
      sessionID,
      errorType: null,
      errorCount: 0,
      lastErrorTime: null,
      recoveryAttempts: 0,
      messagesBeforeError: 0,
    }
    sessionErrorStates.set(sessionID, state)
  }
  return state
}

export function getSessionErrorState(sessionID: string): SessionErrorState | undefined {
  return sessionErrorStates.get(sessionID)
}

export function clearSessionErrorState(sessionID: string): void {
  sessionErrorStates.delete(sessionID)
}

export function getAllSessionErrorStates(): Map<string, SessionErrorState> {
  return new Map(sessionErrorStates)
}
