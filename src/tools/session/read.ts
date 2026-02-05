import * as fs from 'fs'
import * as path from 'path'
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { getSessionStorageDir, SessionMetadata } from './list'

function getSessionFilePath(sessionID: string): string {
  return path.join(getSessionStorageDir(), `${sessionID}.json`)
}

export interface SessionReadResult {
  sessionID: string
  metadata: SessionMetadata
  messages: any[]
  partial: boolean
}

export const session_read = tool({
  description: 'Read messages from a specific session with pagination and filtering options.',
  args: {
    sessionID: z.string().describe('Session ID to read from'),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).default(0).describe('Offset for pagination'),
    includeMetadata: z.boolean().default(false).describe('Include full session metadata'),
  },
  async execute(args) {
    try {
      const { sessionID, limit, offset, includeMetadata } = args
      const filePath = getSessionFilePath(sessionID)

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({
          success: false,
          error: `Session ${sessionID} not found`,
          sessionID,
        })
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      const messages = data.messages || []

      let paginatedMessages = messages

      if (offset > 0 || limit) {
        paginatedMessages = messages.slice(offset, limit ? offset + limit : undefined)
      }

      const result: SessionReadResult = {
        sessionID,
        messages: paginatedMessages,
        partial: messages.length > paginatedMessages.length,
        metadata: {
          sessionID,
          created: data.created || data.createdAt || new Date(0).toISOString(),
          lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
          messageCount: messages.length,
          agent: data.agent,
          duration: data.duration,
          fileCount: data.fileCount,
          editCount: data.editCount,
          toolUsage: data.toolUsage || {},
        },
      }

      const response: any = {
        success: true,
        sessionID,
        totalMessages: messages.length,
        returnedMessages: paginatedMessages.length,
        offset,
        limit: limit || messages.length,
        partial: result.partial,
        messages: paginatedMessages,
      }

      if (includeMetadata) {
        response.metadata = result.metadata
      }

      return JSON.stringify(response)
    } catch (error) {
      console.error('[session-read] Error:', error)
      return JSON.stringify({
        success: false,
        error: String(error),
        sessionID: args.sessionID,
      })
    }
  },
})
