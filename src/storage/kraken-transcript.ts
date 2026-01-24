import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const KRAKEN_DIR = path.join(os.homedir(), ".kraken")
const TRANSCRIPT_DIR = path.join(KRAKEN_DIR, "transcripts")

export interface KrakenTranscriptEntry {
  role: "user" | "assistant"
  content: string
  timestamp?: number
}

export interface ToolUseEntry extends KrakenTranscriptEntry {
  toolName: string
  toolInput: any
  toolOutput: any
}

export function ensureDirectories(): void {
  if (!fs.existsSync(KRAKEN_DIR)) {
    fs.mkdirSync(KRAKEN_DIR, { recursive: true })
  }
  if (!fs.existsSync(TRANSCRIPT_DIR)) {
    fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true })
  }
}

export function getTranscriptPath(sessionId: string): string {
  ensureDirectories()
  return path.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`)
}

export function appendTranscriptEntry(
  sessionId: string,
  entry: KrakenTranscriptEntry
): void {
  try {
    ensureDirectories()
    const filePath = getTranscriptPath(sessionId)
    const line = JSON.stringify({ ...entry, timestamp: entry.timestamp || Date.now() })
    fs.appendFileSync(filePath, line + "\n")
  } catch (error) {
    console.error(`[kraken-transcript] Error appending transcript entry for session ${sessionId}:`, error)
  }
}

export function recordToolUse(
  sessionId: string,
  toolName: string,
  toolInput: any,
  toolOutput: any
): void {
  try {
    ensureDirectories()
    const filePath = getTranscriptPath(sessionId)
    const entry: ToolUseEntry = {
      role: "assistant",
      content: `Tool use: ${toolName}`,
      toolName,
      toolInput,
      toolOutput,
      timestamp: Date.now(),
    }
    const line = JSON.stringify(entry)
    fs.appendFileSync(filePath, line + "\n")
  } catch (error) {
    console.error(`[kraken-transcript] Error recording tool use for session ${sessionId}:`, error)
  }
}

export function recordUserMessage(sessionId: string, content: string): void {
  appendTranscriptEntry(sessionId, {
    role: "user",
    content,
    timestamp: Date.now(),
  })
}

export function recordAssistantMessage(sessionId: string, content: string): void {
  appendTranscriptEntry(sessionId, {
    role: "assistant",
    content,
    timestamp: Date.now(),
  })
}

export function loadTranscript(sessionId: string): KrakenTranscriptEntry[] {
  try {
    ensureDirectories()
    const filePath = getTranscriptPath(sessionId)
    if (!fs.existsSync(filePath)) {
      return []
    }

    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.trim().split("\n")

    return lines
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter((entry): entry is KrakenTranscriptEntry => entry !== null)
  } catch (error) {
    console.error(`[kraken-transcript] Error loading transcript for session ${sessionId}:`, error)
    return []
  }
}

export function deleteTranscript(sessionId: string): void {
  try {
    const filePath = getTranscriptPath(sessionId)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`[kraken-transcript] Deleted transcript for session ${sessionId}`)
    }
  } catch (error) {
    console.error(`[kraken-transcript] Error deleting transcript for session ${sessionId}:`, error)
  }
}

export function deleteTempTranscript(path: string): void {
  try {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
      console.log(`[kraken-transcript] Deleted temp transcript: ${path}`)
    }
  } catch (error) {
    console.error(`[kraken-transcript] Error deleting temp transcript: ${path}`, error)
  }
}

export function cleanupOldTranscripts(maxAgeDays: number = 7): void {
  try {
    ensureDirectories()
    const now = Date.now()
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000

    const files = fs.readdirSync(TRANSCRIPT_DIR)
    for (const file of files) {
      const filePath = path.join(TRANSCRIPT_DIR, file)
      const stats = fs.statSync(filePath)

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath)
        console.log(`[kraken-transcript] Cleaned up old transcript: ${file}`)
      }
    }
  } catch (error) {
    console.error("[kraken-transcript] Error cleaning up old transcripts:", error)
  }
}
