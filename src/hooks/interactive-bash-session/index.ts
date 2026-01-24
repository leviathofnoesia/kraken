import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'

export interface InteractiveBashSessionConfig {
  enabled?: boolean
  trackHistory?: boolean
  historySize?: number
  preserveEnv?: boolean
  autoCleanup?: boolean
  sessionTimeout?: number
}

interface BashSession {
  sessionID: string
  workingDirectory: string
  environment: Record<string, string>
  commandHistory: string[]
  childProcesses: Set<number>
  lastActiveTime: number
}

interface SessionState {
  sessions: Map<string, BashSession>
  sessionTimeout: number
}

const sessionStates = new Map<string, SessionState>()

function getSessionState(sessionID: string): SessionState {
  let state = sessionStates.get(sessionID)
  if (!state) {
    state = {
      sessions: new Map(),
      sessionTimeout: 3600000,
    }
    sessionStates.set(sessionID, state)
  }
  return state
}

function getBashSession(sessionID: string): BashSession | undefined {
  const state = getSessionState(sessionID)
  return state.sessions.get(sessionID)
}

function createBashSession(sessionID: string, initialDir?: string): BashSession {
  const session: BashSession = {
    sessionID,
    workingDirectory: initialDir || process.cwd(),
    environment: {},
    commandHistory: [],
    childProcesses: new Set(),
    lastActiveTime: Date.now(),
  }

  const state = getSessionState(sessionID)
  state.sessions.set(sessionID, session)

  return session
}

function updateSessionActivity(sessionID: string): void {
  const session = getBashSession(sessionID)
  if (session) {
    session.lastActiveTime = Date.now()
  }
}

function recordCommand(sessionID: string, command: string): void {
  const session = getBashSession(sessionID)
  if (session) {
    session.commandHistory.push(command)

    if (session.commandHistory.length > 100) {
      session.commandHistory = session.commandHistory.slice(-100) as string[]
    }
  }
}

function getChildPIDs(): number[] {
  try {
    const pids = new Set<number>()
    const { execSync } = require('node:child_process')
      const result = execSync('pgrep -P "^(bash|sh)" -o pid=', ' -d,')
      .toString()
      .trim()

    if (result) {
      result.split('\n').forEach((line: unknown) => {
        if (typeof line === 'string') {
          const parts = line.split(',')
          if (parts.length >= 2) {
            const pid = parseInt(parts[1].trim(), 10)
            if (!isNaN(pid)) {
              pids.add(pid)
            }
          }
        }
      })
    }

    return Array.from(pids)
  } catch (e) {
    return []
  }
}

function killSessionProcesses(session: BashSession): void {
  session.childProcesses.forEach((pid) => {
    try {
      process.kill(pid)
    } catch (e) {
    }
  })

  session.childProcesses.clear()
}

export function createInteractiveBashSession(
  _input: PluginInput,
  options?: { config?: InteractiveBashSessionConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    trackHistory: true,
    historySize: 50,
    preserveEnv: true,
    autoCleanup: true,
    sessionTimeout: 3600000,
  }

  return {
    'tool.execute.before': async (input, _output) => {
      if (!config.enabled) return
      if (input.tool !== 'bash') return

      const { sessionID } = input as { tool: string; sessionID: string }
      if (!sessionID) return

      const session = getBashSession(sessionID)
      if (!session) {
        console.log(`[interactive-bash-session] Creating new bash session for ${sessionID}`)
        createBashSession(sessionID)
      } else {
        updateSessionActivity(sessionID)
      }
    },

    'tool.execute.after': async (input, output) => {
      if (!config.enabled) return
      if (input.tool !== 'bash') return

      const sessionID = (input as { sessionID?: string }).sessionID || ''
      const args = (input as { args?: unknown }).args
      const command = Array.isArray(args) ? args.join(' ') : String(args)

      recordCommand(sessionID, command)

      const outputAny = output as any
      if (outputAny.pid !== undefined) {
        const session = getBashSession(sessionID)
        if (session) {
          session.childProcesses.add(outputAny.pid)
        }
      }

      if (config.trackHistory) {
        const session = getBashSession(sessionID)
        if (session) {
          console.log(`[interactive-bash-session] Command history size: ${session.commandHistory.length}`)
        }
      }
    },

    'event': async (input) => {
      if (!config.enabled) return

      const sessionID = (input as { sessionID?: string }).sessionID
      if (!sessionID) return

      const eventAny = input as any
      if (eventAny?.type === 'session.end' && config.autoCleanup) {
        const session = getBashSession(sessionID)
        if (session) {
          console.log(`[interactive-bash-session] Cleaning up bash session for ${sessionID}`)
          killSessionProcesses(session)

          const state = getSessionState(sessionID)
          state.sessions.delete(sessionID)

          console.log(`[interactive-bash-session] Session cleanup completed. ` +
            `Commands executed: ${session.commandHistory.length}, ` +
            `Working dir: ${session.workingDirectory}`)
        }
      }

      if (eventAny?.type === 'session.timeout') {
        const session = getBashSession(sessionID)
        if (session && config.autoCleanup) {
          console.log(`[interactive-bash-session] Session timeout for ${sessionID}`)
          killSessionProcesses(session)

          const state = getSessionState(sessionID)
          state.sessions.delete(sessionID)
        }
      }
    },
  }
}

export function getBashSessionInfo(sessionID: string): BashSession | undefined {
  return getBashSession(sessionID)
}

export function getSessionHistory(sessionID: string): string[] {
  const session = getBashSession(sessionID)
  return session ? session.commandHistory : []
}

export function getSessionEnvironment(sessionID: string): Record<string, string> | undefined {
  const session = getBashSession(sessionID)
  return session ? session.environment : undefined
}

export function getSessionWorkingDirectory(sessionID: string): string | undefined {
  const session = getBashSession(sessionID)
  return session ? session.workingDirectory : undefined
}

export function clearBashSession(sessionID: string): void {
  const state = getSessionState(sessionID)
  const session = state.sessions.get(sessionID)
  if (session) {
    killSessionProcesses(session)
    state.sessions.delete(sessionID)
  }
}

export function getAllBashSessions(): Map<string, BashSession> {
  const allSessions = new Map<string, BashSession>()
  for (const [sessionID, state] of sessionStates) {
    for (const [id, session] of state.sessions) {
      allSessions.set(id, session)
    }
  }
  return allSessions
}
