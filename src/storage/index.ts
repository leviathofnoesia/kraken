import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const STORAGE_DIR = path.join(os.homedir(), ".opencode", "kraken-code")
const SESSIONS_DIR = path.join(STORAGE_DIR, "sessions")

export interface RalphLoopState {
  sessionID: string
  promise: string
  task: string
  maxIterations: number
  currentIteration: number
  status: "active" | "maxed_out" | "cancelled" | "completed"
  transcript: string[]
  startTime: number
}

export interface RalphSession extends RalphLoopState {}

export function getStateFilePath(sessionID: string): string {
  return path.join(SESSIONS_DIR, `${sessionID}.json`)
}

export function ensureDirectories(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  }
}

export function readState(sessionID: string): RalphLoopState | null {
  try {
    ensureDirectories()
    const filePath = getStateFilePath(sessionID)
    if (!fs.existsSync(filePath)) {
      return null
    }
    const data = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(data) as RalphLoopState
  } catch (error) {
    console.error(`[storage] Error reading state for session ${sessionID}:`, error)
    return null
  }
}

export function writeState(sessionID: string, state: RalphLoopState): void {
  try {
    ensureDirectories()
    const filePath = getStateFilePath(sessionID)
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2))
  } catch (error) {
    console.error(`[storage] Error writing state for session ${sessionID}:`, error)
  }
}

export function clearState(sessionID: string): void {
  try {
    const filePath = getStateFilePath(sessionID)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`[storage] Error clearing state for session ${sessionID}:`, error)
  }
}

export function incrementIteration(sessionID: string): RalphLoopState | null {
  const state = readState(sessionID)
  if (!state) {
    return null
  }
  state.currentIteration++
  writeState(sessionID, state)
  return state
}

export * from "./types"

// Kraken storage (session-based, in .kraken/)
export {
  loadKrakenTodos,
  saveKrakenTodos,
  deleteKrakenTodos,
  cleanupOldTodos,
} from "./kraken-todo"

export {
  loadTranscript as loadKrakenTranscript,
  appendTranscriptEntry as appendKrakenTranscriptEntry,
  recordToolUse as recordKrakenToolUse,
  recordUserMessage as recordKrakenUserMessage,
  recordAssistantMessage as recordKrakenAssistantMessage,
  deleteTranscript as deleteKrakenTranscript,
  deleteTempTranscript as deleteKrakenTempTranscript,
} from "./kraken-transcript"

export {
  getKrakenDir,
  getKrakenTodoDir,
  getKrakenTranscriptDir,
  getKrakenTodoPath,
  getKrakenTranscriptPath,
  getTempTranscriptPath,
} from "./kraken-paths"

// OpenCode/Claude Code storage (settings-based, in .opencode/)
export * from "./todo-manager"
export * from "./transcript-manager"
export * from "./paths"
