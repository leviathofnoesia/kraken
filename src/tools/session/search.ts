import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { getSessionStorageDir, SessionMetadata } from "./list"

const SESSION_STORAGE_DIR = path.join(os.homedir(), ".opencode", "sessions")

export interface SearchResult {
  sessionID: string
  filePath: string
  metadata: SessionMetadata
  score: number
  matches: MatchLocation[]
}

export interface MatchLocation {
  type: "user_message" | "assistant_message"
  index: number
  content: string
  context: string
}

function indexSession(sessionFilePath: string): Map<string, MatchLocation[]> | null {
  try {
    const content = fs.readFileSync(sessionFilePath, "utf-8")
    const data = JSON.parse(content)

    const index = new Map<string, MatchLocation[]>()

    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach((msg: any, idx: number) => {
        const role = msg.role || "unknown"
        const content = msg.content || ""

        if (content && typeof content === "string" && content.length > 0) {
          index.set(content, {
            type: role === "user" ? "user_message" : "assistant_message",
            index: idx,
            content,
            context: content,
          })
        }
      })
    }

    return index
  } catch (error) {
    console.error(`[session-search] Error indexing session ${sessionFilePath}:`, error)
    return null
  }
}

function calculateRelevanceScore(query: string, match: MatchLocation): number {
  const queryLower = query.toLowerCase()
  const contentLower = match.content.toLowerCase()

  let score = 0

  const exactMatch = contentLower === queryLower
  if (exactMatch) {
    score += 100
  }

  const containsMatch = contentLower.includes(queryLower)
  if (containsMatch && !exactMatch) {
    score += 50
  }

  const words = queryLower.split(/\s+/)
  let wordMatchCount = 0

  for (const word of words) {
    if (word.length > 2 && contentLower.includes(word)) {
      wordMatchCount++
    }
  }

  score += wordMatchCount * 10

  if (match.type === "user_message") {
    score += 20
  }

  return Math.min(score, 100)
}

function getAllSessionFiles(): { sessionID: string; filePath: string; metadata: SessionMetadata }[] {
  const sessionsDir = getSessionStorageDir()
  if (!fs.existsSync(sessionsDir)) {
    return []
  }

  const entries: { sessionID: string; filePath: string; metadata: SessionMetadata }[] = []

  try {
    const files = fs.readdirSync(sessionsDir)

    for (const file of files) {
      if (!file.endsWith(".json")) continue

      const sessionID = file.slice(0, -5)
      const filePath = path.join(sessionsDir, file)

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

        entries.push({
          sessionID,
          filePath,
          metadata,
        })
      } catch (error) {
        console.error(`[session-search] Error reading session ${sessionID}:`, error)
      }
    }
  } catch (error) {
    console.error("[session-search] Error reading sessions directory:", error)
  }

  return entries
}

export const session_search = tool({
  description: "Full-text search across all OpenCode sessions with ranked results.",
  args: {
    q: z.string().describe("Search query text"),
    limit: z.number().int().min(1).max(100).default(10).describe("Maximum number of results to return"),
    offset: z.number().int().min(0).default(0).describe("Offset for pagination"),
    sessionID: z.string().optional().describe("Search within a specific session only"),
  },
  async execute(args) {
    try {
      const { q, limit, offset, sessionID } = args

      if (!q || q.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: "Query cannot be empty",
          results: [],
        })
      }

      let sessionFiles: { sessionID: string; filePath: string; metadata: SessionMetadata }[] = []

      if (sessionID) {
        const sessionDir = getSessionStorageDir()
        const filePath = path.join(sessionDir, `${sessionID}.json`)
        sessionFiles = [
          {
            sessionID,
            filePath,
            metadata: {
              sessionID,
              created: "",
              lastActive: "",
              messageCount: 0,
            },
          },
        ]
      } else {
        sessionFiles = getAllSessionFiles()
      }

      const allResults: SearchResult[] = []

      for (const sessionFile of sessionFiles) {
        const index = indexSession(sessionFile.filePath)

        if (!index) continue

        const matches: MatchLocation[] = []

        for (const [content, location] of index.entries()) {
          const score = calculateRelevanceScore(q, location)
          if (score > 10) {
            matches.push(location)
          }
        }

        if (matches.length > 0) {
          const avgScore = matches.reduce((sum, m) => sum + calculateRelevanceScore(q, m), 0) / matches.length

          allResults.push({
            sessionID: sessionFile.sessionID,
            filePath: sessionFile.filePath,
            metadata: sessionFile.metadata,
            score: Math.round(avgScore),
            matches: matches.slice(0, 5),
          })
        }
      }

      allResults.sort((a, b) => b.score - a.score)

      const paginatedResults = allResults.slice(offset, offset + limit)

      return JSON.stringify({
        success: true,
        query: q,
        total: allResults.length,
        offset,
        limit,
        results: paginatedResults.map((result) => ({
          sessionID: result.sessionID,
          score: result.score,
          matchCount: result.matches.length,
          lastActive: result.metadata.lastActive,
          messageCount: result.metadata.messageCount,
          agent: result.metadata.agent,
          matches: result.matches.map((m) => ({
            type: m.type,
            index: m.index,
            content: m.content.slice(0, 200) + (m.content.length > 200 ? "..." : ""),
          })),
        })),
      })
    } catch (error) {
      console.error("[session-search] Error:", error)
      return JSON.stringify({
        success: false,
        error: String(error),
        results: [],
      })
    }
  },
})
