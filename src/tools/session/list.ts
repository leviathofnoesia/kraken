import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

const SESSION_STORAGE_DIR = path.join(os.homedir(), '.opencode', 'sessions')

export interface SessionMetadata {
  sessionID: string
  created: string
  lastActive: string
  messageCount: number
  agent?: string
  duration?: number
  fileCount?: number
  editCount?: number
  toolUsage: Record<string, number>
}

export interface SessionEntry {
  sessionID: string
  path: string
  metadata: SessionMetadata
}

export function getSessionStorageDir(): string {
  if (!fs.existsSync(SESSION_STORAGE_DIR)) {
    fs.mkdirSync(SESSION_STORAGE_DIR, { recursive: true })
  }
  return SESSION_STORAGE_DIR
}

function getSessionFilePath(sessionID: string): string {
  return path.join(getSessionStorageDir(), `${sessionID}.json`)
}

function getAllSessionFiles(): SessionEntry[] {
  const sessionsDir = getSessionStorageDir()
  if (!fs.existsSync(sessionsDir)) {
    return []
  }

  const entries: SessionEntry[] = []

  try {
    const files = fs.readdirSync(sessionsDir)

    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const sessionID = file.slice(0, -5)
      const filePath = path.join(sessionsDir, file)

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)

        const metadata: SessionMetadata = {
          sessionID,
          created: data.created || data.createdAt || new Date(0).toISOString(),
          lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
          messageCount: data.messageCount || data.messages?.length || 0,
          agent: data.agent,
          duration: data.duration,
          fileCount: data.fileCount,
          editCount: data.editCount,
          toolUsage: data.toolUsage || {},
        }

        entries.push({
          sessionID,
          path: filePath,
          metadata,
        })
      } catch (error) {
        console.error(`[session-list] Error reading session ${sessionID}:`, error)
      }
    }
  } catch (error) {
    console.error('[session-list] Error reading sessions directory:', error)
  }

  return entries
}

function filterSessionsByDate(
  sessions: SessionEntry[],
  startDate?: string,
  endDate?: string,
): SessionEntry[] {
  if (!startDate && !endDate) {
    return sessions
  }

  const start = startDate ? new Date(startDate).getTime() : 0
  const end = endDate ? new Date(endDate).getTime() : Infinity

  return sessions.filter((entry) => {
    const lastActive = new Date(entry.metadata.lastActive).getTime()
    return lastActive >= start && lastActive <= end
  })
}

function sortSessionsByDate(
  sessions: SessionEntry[],
  order: 'asc' | 'desc' = 'desc',
): SessionEntry[] {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.metadata.lastActive).getTime()
    const dateB = new Date(b.metadata.lastActive).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}

export const session_list = tool({
  description: 'List all OpenCode sessions with filtering and pagination options.',
  args: {
    limit: z.number().int().min(1).max(1000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    includeMetadata: z.boolean().default(false),
  },
  async execute(args) {
    try {
      const { limit, startDate, endDate, order, includeMetadata } = args

      let sessions = getAllSessionFiles()

      if (startDate || endDate) {
        sessions = filterSessionsByDate(sessions, startDate, endDate)
      }

      sessions = sortSessionsByDate(sessions, order)

      if (limit) {
        sessions = sessions.slice(0, limit)
      }

      const results = sessions.map((entry) => {
        if (includeMetadata) {
          return {
            sessionID: entry.metadata.sessionID,
            created: entry.metadata.created,
            lastActive: entry.metadata.lastActive,
            messageCount: entry.metadata.messageCount,
            agent: entry.metadata.agent,
            duration: entry.metadata.duration,
            fileCount: entry.metadata.fileCount,
            editCount: entry.metadata.editCount,
            toolUsage: entry.metadata.toolUsage,
          }
        } else {
          return {
            sessionID: entry.metadata.sessionID,
            created: entry.metadata.created,
            lastActive: entry.metadata.lastActive,
            messageCount: entry.metadata.messageCount,
            agent: entry.metadata.agent,
          }
        }
      })

      return JSON.stringify({
        success: true,
        count: results.length,
        sessions: results,
      })
    } catch (error) {
      console.error('[session-list] Error:', error)
      return JSON.stringify({
        success: false,
        error: String(error),
        sessions: [],
      })
    }
  },
})
