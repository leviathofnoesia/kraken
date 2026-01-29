import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import {
  recordUserMessage as recordKrakenUserMessage,
  recordToolUse as recordKrakenToolUse,
  appendTranscriptEntry as appendKrakenTranscriptEntry,
  recordAssistantMessage as recordKrakenAssistantMessage,
} from "../../storage"

export interface SessionStorageHookConfig {
  enabled?: boolean
  recordTodos?: boolean
  recordTranscripts?: boolean
}

export function createSessionStorageHook(
  _input: PluginInput,
  options?: { config?: SessionStorageHookConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    recordTodos: true,
    recordTranscripts: true,
  }

  if (!config.enabled) {
    return {}
  }

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
      .map(p => p.text)
      .join("\n")
      .trim()
  }

  function extractTodoFromParts(parts: Part[]): { content: string } | null {
    const text = getTextFromParts(parts)

    const todoPatterns = [
      /<todo>[\s\S]*?<\/todo>/gi,
      /<task>[\s\S]*?<\/task>/gi,
      /\[TODO\]([\s\S]*?)\]/gi,
      /\[ \]\s*([^\]]*)\]/gi,
    ]

    for (const pattern of todoPatterns) {
      const match = text.match(pattern)
      if (match) {
        const todoContent = match[1] || match[0].replace(/<\/?[^\>]*>/g, "")
          .replace(/\[\/?[^]]*\]/g, "")
          .trim()

        return { content: todoContent }
      }
    }

    return null
  }

  return {
    // Record tool usage for transcripts
    "tool.execute.after": async (input: any, output: any) => {
      if (!config.enabled) return

      const { tool, sessionID } = input

      if (!sessionID) return

      if (config.recordTranscripts) {
        recordKrakenToolUse(sessionID, tool, {}, output.output || "")
      }

      console.log(`[storage-hooks] Tool ${tool} completed for session ${sessionID}`)
    },
  }
}

export const metadata = {
  name: "session-storage-hook",
  priority: 33,
  description: "Records todos and transcripts to Kraken storage",
} as const
