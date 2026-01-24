import * as fs from "fs"
import * as path from "path"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import {
  getSessionStorageDir,
  SessionMetadata,
} from "./list"

const SESSION_STORAGE_DIR = path.join(process.env.HOME || "", ".opencode", "sessions")

function getSessionFilePath(sessionID: string): string {
  return path.join(getSessionStorageDir(), `${sessionID}.json`)
}

function parseSessionFile(sessionID: string): SessionMetadata | null {
  const filePath = getSessionFilePath(sessionID)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const data = JSON.parse(content)

    const metadata: SessionMetadata = {
      sessionID,
      created: data.created || data.createdAt || new Date(0).toISOString(),
      lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
      messageCount: data.messageCount || (data.messages?.length || 0),
      agent: data.agent,
      duration: data.duration,
      fileCount: data.fileCount,
      editCount: data.editCount,
      toolUsage: data.toolUsage || {},
    }

    return metadata
  } catch (error) {
    console.error(`[session-info] Error reading session ${sessionID}:`, error)
    return null
  }
}

function calculateSessionStats(metadata: SessionMetadata) {
  const stats = {
    totalMessages: metadata.messageCount,
    totalToolsUsed: Object.values(metadata.toolUsage || {}).reduce((sum, count) => sum + count, 0),
    mostUsedTool: "",
    mostUsedToolCount: 0,
    averageMessagesPerMinute: 0,
  }

  if (metadata.duration) {
    stats.averageMessagesPerMinute = metadata.messageCount / (metadata.duration / 60000)
  }

  for (const [tool, count] of Object.entries(metadata.toolUsage || {})) {
    if (count > stats.mostUsedToolCount) {
      stats.mostUsedTool = tool
      stats.mostUsedToolCount = count
    }
  }

  return stats
}

export const session_info = tool({
  description: "Get detailed metadata and statistics about a specific session.",
  args: {
    sessionID: z.string().describe("Session ID to query"),
  },
  async execute(args) {
    try {
      const { sessionID } = args
      const metadata = parseSessionFile(sessionID)

      if (!metadata) {
        return JSON.stringify({
          success: false,
          error: `Session ${sessionID} not found`,
          sessionID,
        })
      }

      const stats = calculateSessionStats(metadata)

      return JSON.stringify({
        success: true,
        sessionID: metadata.sessionID,
        created: metadata.created,
        lastActive: metadata.lastActive,
        messageCount: metadata.messageCount,
        agent: metadata.agent,
        duration: metadata.duration,
        fileCount: metadata.fileCount,
        editCount: metadata.editCount,
        toolUsage: metadata.toolUsage,
        stats: {
          totalMessages: stats.totalMessages,
          totalToolsUsed: stats.totalToolsUsed,
          mostUsedTool: stats.mostUsedTool,
          mostUsedToolCount: stats.mostUsedToolCount,
          averageMessagesPerMinute: stats.averageMessagesPerMinute.toFixed(2),
        },
      })
    } catch (error) {
      console.error("[session-info] Error:", error)
      return JSON.stringify({
        success: false,
        error: String(error),
        sessionID: args.sessionID,
      })
    }
  },
})
