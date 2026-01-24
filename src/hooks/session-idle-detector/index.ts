import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { sendNotification, type SoundEvent } from "../../notifications/manager"

export interface SessionIdleDetectorConfig {
  enabled?: boolean
  idleTimeout?: number
  soundEnabled?: boolean
  skipIfIncompleteTodos?: boolean
}

interface SessionState {
  lastActivity: number
  idleNotified: boolean
}

const SESSION_STATES = new Map<string, SessionState>()

const DEFAULT_CONFIG = {
  enabled: true,
  idleTimeout: 60000,
  soundEnabled: true,
  skipIfIncompleteTodos: false,
}

export function createSessionIdleDetectorHook(
  input: PluginInput,
  options?: { config?: SessionIdleDetectorConfig },
): Hooks {
  const config = { ...DEFAULT_CONFIG, ...options?.config }
  
  if (!config.enabled) {
    return {}
  }
  
  return {
    "chat.before": async (chatInput: any) => {
      const { sessionID } = chatInput
      if (!sessionID) return
      
      updateSessionActivity(sessionID)
    },
    
    "chat.message": async (chatInput: any, chatOutput: any) => {
      const { sessionID } = chatInput
      if (!sessionID) return
      
      updateSessionActivity(sessionID)
      
      const state = SESSION_STATES.get(sessionID)
      if (!state) return
      
      const now = Date.now()
      const idleTime = now - state.lastActivity
      
      if (idleTime >= config.idleTimeout) {
        if (!state.idleNotified) {
          const hasIncompleteTodos = checkForIncompleteTodos(chatOutput)
          
          if (config.skipIfIncompleteTodos && hasIncompleteTodos) {
            console.log(`[session-idle-detector] Session ${sessionID} idle with incomplete todos - skipping notification`)
          } else {
            state.idleNotified = true
            
            sendNotification(
              "Session Idle",
              `Session ${sessionID} has been inactive for ${Math.floor(idleTime / 60000)} minutes`,
              config.soundEnabled ? { type: "agent_idle" } : undefined,
            )
          }
        }
      }
    },
    
    "chat.after": async (chatInput: any) => {
      const { sessionID } = chatInput
      if (!sessionID) return
      
      const state = SESSION_STATES.get(sessionID)
      if (state) {
        state.idleNotified = false
      }
    },
  }
}

function updateSessionActivity(sessionID: string): void {
  const now = Date.now()
  let state = SESSION_STATES.get(sessionID)
  
  if (!state) {
    state = {
      lastActivity: now,
      idleNotified: false,
    }
    SESSION_STATES.set(sessionID, state)
  } else {
    state.lastActivity = now
    state.idleNotified = false
  }
}

function checkForIncompleteTodos(chatOutput: any): boolean {
  if (!chatOutput?.parts) return false
  
  for (const part of chatOutput.parts) {
    if (part.type === "text") {
      const text = part.text.toLowerCase()
      if (text.includes("todo") || text.includes("task") || text.includes("pending")) {
        return true
      }
    }
  }
  
  return false
}

export function clearSessionState(sessionID: string): void {
  SESSION_STATES.delete(sessionID)
}

export function getAllSessionStates(): Map<string, SessionState> {
  return new Map(SESSION_STATES)
}

export const metadata = {
  name: "session-idle-detector",
  priority: 35,
  description: "Monitors session activity and notifies when session becomes idle",
} as const
