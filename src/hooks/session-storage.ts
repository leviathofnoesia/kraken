import type { Hooks, Part } from "@opencode-ai/sdk"

export interface SessionStorageHookOptions {
  enabled?: boolean
  todoPath?: string
  transcriptPath?: string
}

export function createSessionStorageHook(
  input: any,
  options?: SessionStorageHookOptions
): any {
  const config = (input as any).config || {}
  const storageConfig = config.claudeCodeCompatibility?.dataStorage || {}

  if (storageConfig.enabled === false) {
    return {}
  }

  return {
    "tool.execute.after": async (input: any, output: any) => {
      // Hook into tool completion for todo and transcript tracking
      if (!output.output) return

      const { tool, sessionID } = input

      if (sessionID) {
        console.log(`[session-storage] Tool ${tool} completed for session ${sessionID}`)

        // Record tool usage in transcript
        const { appendTranscriptEntry } = require("../storage")
        const { recordToolUse } = require("../storage")

        if (output.output && output.output.toolOutput) {
          await recordToolUse(
            sessionID,
            tool,
            output.output.toolInput,
            output.output.toolOutput
          )
        }
      }
    },

    "chat.message": async (input: any, output: any) => {
      // Hook into user messages for transcript tracking
      if (!output.parts) return

      const { sessionID } = input
      const { recordUserMessage } = require("../storage")

      for (const part of output.parts) {
        if (part.type === "text") {
          await recordUserMessage(sessionID, part.text)
        }
      }
    },

    "session.idle": async (input: any, output: any) => {
      // Hook into session idle for saving todos
      if (!input.sessionID) return

      const { sessionID } = input
      const { loadOpenCodeTodos } = require("../storage")

      try {
        const todos = await loadOpenCodeTodos(sessionID)
        console.log(`[session-storage] Saved ${todos.length} todos for session ${sessionID}`)
      } catch (error) {
        console.error("[session-storage] Error saving todos:", error)
      }
    },
  }
}
