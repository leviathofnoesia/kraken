/**
 * Grep-App MCP - Remote Configuration + Agent Tool
 *
 * Provides both remote configuration for plugin registration AND agent-accessible tool in one file.
 * Free tier works without API key.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import type { RemoteMcpConfig } from './types'
import { mcpLoader } from './mcp-loader'

/**
 * Grep-App remote configuration
 */
export const grep_app: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://mcp.grep.app',
  enabled: true,
  headers: undefined,
  oauth: false,
}

/**
 * Grep-App Search Agent Tool
 *
 * Search code across public GitHub repositories. Does NOT auto-inject results.
 */
export const grepSearchTool = tool({
  description:
    'Search code across public GitHub repositories using grep.app. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    query: z.string().min(1).describe('Search query for code'),
    language: z
      .string()
      .optional()
      .describe('Filter by programming language (e.g., python, typescript, rust)'),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of results to return (default: 10)'),
    page: z.number().optional().default(1).describe('Page number for pagination (default: 1)'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('search', args, grep_app)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      return JSON.stringify({ error: 'failed to search grep.app', details: String(err) }, null, 2)
    }
  },
})

/**
 * Grep-App Get File Agent Tool
 *
 * Fetch specific file from GitHub repository. Does NOT auto-inject results.
 */
export const grepGetFileTool = tool({
  description:
    'Fetch file content from a GitHub repository using grep.app. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    owner: z.string().describe('Repository owner (e.g., facebook)'),
    repo: z.string().describe('Repository name (e.g., react)'),
    path: z.string().describe('File path (e.g., src/index.ts)'),
    ref: z.string().optional().describe('Git branch or commit ref (default: main)'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('get_file', args, grep_app)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      return JSON.stringify(
        { error: 'failed to get file from grep.app', details: String(err) },
        null,
        2,
      )
    }
  },
})
