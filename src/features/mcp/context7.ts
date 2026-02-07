/**
 * Context7 MCP - Remote Configuration
 *
 * Provides remote configuration for Context7 documentation search server.
 * Free tier works without API key. Optional API key for enhanced quota.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import type { RemoteMcpConfig } from './types'
import { mcpLoader } from './mcp-loader'

/**
 * Create Context7 remote configuration
 * Reads process.env.CONTEXT7_API_KEY at call time for testing flexibility
 */
export function createContext7Config(): RemoteMcpConfig {
  return {
    type: 'remote',
    url: 'https://mcp.context7.com/mcp',
    enabled: true,
    headers: process.env.CONTEXT7_API_KEY
      ? { Authorization: `Bearer ${process.env.CONTEXT7_API_KEY}` }
      : undefined,
    oauth: false,
  }
}

/**
 * Default Context7 remote configuration
 * Reads process.env.CONTEXT7_API_KEY at module load time
 */
export const context7 = createContext7Config()

/**
 * Context7 Search Agent Tool
 *
 * Search official documentation. Does NOT auto-inject results.
 */
export const context7SearchTool = tool({
  description:
    'Search official documentation using Context7. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    query: z.string().min(1).describe('Search query for documentation'),
    numResults: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results to return (default: 5)'),
    maxTokens: z.number().optional().describe('Maximum tokens for response (default: 5000)'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('search', args, context7)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ success: false, error: error.message }, null, 2)
    }
  },
})

/**
 * Context7 Get Agent Tool
 *
 * Fetch specific documentation page. Does NOT auto-inject results.
 */
export const context7GetTool = tool({
  description:
    'Fetch specific documentation page using Context7. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    library: z.string().describe('Library name (e.g., react, express)'),
    path: z.string().optional().describe('Documentation path (e.g., hooks/useState)'),
    version: z.string().optional().describe('Library version (default: latest)'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('get', args, context7)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ success: false, error: error.message }, null, 2)
    }
  },
})
