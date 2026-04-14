import { promises as fs } from "fs"
import { join, dirname } from "path"
import * as os from "os"
import type { Part } from "@opencode-ai/sdk"

const TRANSCRIPT_VERSION = "1.0"
const TRANSCRIPT_ENCODING = "utf-8"

export interface TranscriptEntry {
  role: "user" | "assistant"
  content: string
  timestamp?: number
  toolName?: string
  toolInput?: any
  toolOutput?: any
}

export interface TranscriptFile {
  version: string
  sessionId: string
  entries: TranscriptEntry[]
}

export interface BuildTranscriptOptions {
  currentToolName?: string
  currentToolInput?: any
  includeTools?: boolean
}

export function getTranscriptPath(sessionId: string, customPath?: string): string {
  if (customPath) {
    return join(customPath, `${sessionId}.jsonl`)
  }

  const basePath = join(os.homedir(), ".claude", "transcripts")
  return join(basePath, `${sessionId}.jsonl`)
}

export async function appendTranscriptEntry(
  sessionId: string,
  entry: TranscriptEntry,
  customPath?: string
): Promise<void> {
  const transcriptPath = getTranscriptPath(sessionId, customPath)

  try {
    await fs.mkdir(dirname(transcriptPath), { recursive: true })

    const entryWithTimestamp = {
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    }

    const jsonlLine = JSON.stringify(entryWithTimestamp) + "\n"
    await fs.appendFile(transcriptPath, jsonlLine, TRANSCRIPT_ENCODING)
  } catch (error) {
    console.error(`[transcript-manager] Error appending transcript entry:`, error)
  }
}

export async function recordToolUse(
  sessionId: string,
  toolName: string,
  toolInput: any,
  toolOutput: any,
  customPath?: string
): Promise<void> {
  const entry: TranscriptEntry = {
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    toolName,
    toolInput,
    toolOutput,
  }

  await appendTranscriptEntry(sessionId, entry, customPath)
}

export async function recordUserMessage(
  sessionId: string,
  content: string,
  customPath?: string
): Promise<void> {
  const entry: TranscriptEntry = {
    role: "user",
    content,
    timestamp: Date.now(),
  }

  await appendTranscriptEntry(sessionId, entry, customPath)
}

export async function recordAssistantMessage(
  sessionId: string,
  content: string,
  customPath?: string
): Promise<void> {
  const entry: TranscriptEntry = {
    role: "assistant",
    content,
    timestamp: Date.now(),
  }

  await appendTranscriptEntry(sessionId, entry, customPath)
}

export async function buildTranscriptFromSession(
  client: any,
  sessionId: string,
  options?: BuildTranscriptOptions
): Promise<string | null> {
  try {
    const messages = await client.listMessages({ sessionId, limit: 1000 })
    const parts: Part[] = messages.flatMap((msg: any) => msg.parts || [])

    let transcript = ""

    for (const part of parts) {
      if ((part as any).type === "text") {
        const role = (part as any).role === "user" ? "user" : "assistant"
        transcript += `${role.toUpperCase()}: ${(part as any).text}\n\n`
      }
    }

    if (options?.currentToolName) {
      transcript += `TOOL: ${options.currentToolName}\n`
      if (options.currentToolInput !== undefined) {
        transcript += `INPUT: ${JSON.stringify(options.currentToolInput)}\n`
      }
      transcript += "\n"
    }

    return transcript || null
  } catch (error) {
    console.error(`[transcript-manager] Error building transcript from session:`, error)
    return null
  }
}

export async function deleteTempTranscript(path: string): Promise<boolean> {
  try {
    await fs.unlink(path)
    console.log(`[transcript-manager] Deleted temp transcript: ${path}`)
    return true
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return true
    }

    console.error(`[transcript-manager] Error deleting temp transcript:`, error)
    return false
  }
}

export async function readTranscript(
  sessionId: string,
  customPath?: string
): Promise<TranscriptEntry[]> {
  const transcriptPath = getTranscriptPath(sessionId, customPath)

  try {
    const content = await fs.readFile(transcriptPath, TRANSCRIPT_ENCODING)
    const lines = content.trim().split("\n")

    const entries: TranscriptEntry[] = []

    for (const line of lines) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line) as TranscriptEntry
          entries.push(entry)
        } catch (parseError) {
          console.warn(`[transcript-manager] Failed to parse transcript line:`, parseError)
        }
      }
    }

    return entries
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return []
    }

    console.error(`[transcript-manager] Error reading transcript:`, error)
    return []
  }
}

export async function clearTranscript(
  sessionId: string,
  customPath?: string
): Promise<boolean> {
  const transcriptPath = getTranscriptPath(sessionId, customPath)

  try {
    await fs.unlink(transcriptPath)
    console.log(`[transcript-manager] Cleared transcript for session ${sessionId}`)
    return true
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return true
    }

    console.error(`[transcript-manager] Error clearing transcript:`, error)
    return false
  }
}

export function validateTranscriptEntry(entry: TranscriptEntry): boolean {
  if (!entry.role || (entry.role !== "user" && entry.role !== "assistant")) {
    console.warn(`[transcript-manager] Invalid transcript entry: invalid role "${entry.role}"`)
    return false
  }

  if (entry.role === "assistant" && !entry.content && !entry.toolName) {
    console.warn(`[transcript-manager] Invalid assistant entry: must have content or toolName`)
    return false
  }

  if (entry.role === "user" && !entry.content) {
    console.warn(`[transcript-manager] Invalid user entry: must have content`)
    return false
  }

  return true
}
