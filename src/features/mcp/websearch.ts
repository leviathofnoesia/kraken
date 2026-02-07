/**
 * Websearch MCP - Remote Configuration + Agent Tool
 *
 * Provides both remote configuration for plugin registration AND agent-accessible tool in one file.
 * Free tier works without API key. Optional API key for enhanced quota.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import type { RemoteMcpConfig } from './types'
import { mcpLoader } from './mcp-loader'

/**
 * Websearch Provider Configuration
 *
 * Returns configuration pointing to Exa AI or Tavily remote MCP server.
 * If Tavily provider is selected but TAVILY_API_KEY is missing, returns a disabled config.
 */
export function createWebsearchConfig(config?: { provider?: 'exa' | 'tavily' }): RemoteMcpConfig {
  const provider = config?.provider || 'exa'

  if (provider === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      // Return disabled config instead of throwing
      return {
        type: 'remote' as const,
        url: 'https://mcp.tavily.com/mcp/',
        enabled: false,
        name: 'websearch',
        oauth: false as const,
      }
    }

    return {
      type: 'remote' as const,
      url: 'https://mcp.tavily.com/mcp/',
      enabled: true,
      headers: {
        Authorization: `Bearer ${tavilyKey}`,
      },
      oauth: false as const,
    }
  }

  // Default to Exa
  return {
    type: 'remote' as const,
    url: 'https://mcp.exa.ai/mcp?tools=web_search_exa',
    enabled: true,
    headers: process.env.EXA_API_KEY ? { 'x-api-key': process.env.EXA_API_KEY } : undefined,
    oauth: false as const,
  }
}

/**
 * Store the active websearch config for use by tools
 */
let _activeWebsearchConfig: RemoteMcpConfig | null = null

/**
 * Set the active websearch configuration (called during plugin initialization)
 */
export function setActiveWebsearchConfig(config: RemoteMcpConfig): void {
  _activeWebsearchConfig = config
}

/**
 * Get the active websearch configuration
 */
export function getActiveWebsearchConfig(): RemoteMcpConfig | null {
  return _activeWebsearchConfig
}

/**
 * Websearch Agent Tool
 *
 * Search the web using Exa AI or Tavily. Does NOT auto-inject results.
 */
export const websearchTool = tool({
  description:
    'Search the web using Exa AI (default) or Tavily. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    query: z.string().min(1).describe('Search query for web search'),
    numResults: z
      .number()
      .optional()
      .default(10)
      .describe('Number of results to return (default: 10)'),
  },
  async execute(args) {
    try {
      const config = _activeWebsearchConfig || createWebsearchConfig()
      const result = await mcpLoader.callTool('search', args, config)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ error: 'Websearch failed', details: error.message }, null, 2)
    }
  },
})

/**
 * Webfetch Agent Tool
 *
 * Fetch content from a specific URL. Does NOT auto-inject results.
 */
export const webfetchTool = tool({
  description:
    'Fetch and parse web content from a specific URL. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    url: z.string().url().describe('URL to fetch content from'),
    format: z
      .enum(['markdown', 'text', 'html'])
      .optional()
      .default('markdown')
      .describe('Output format (default: markdown)'),
    timeout: z.number().optional().describe('Request timeout in milliseconds (default: 60000)'),
  },
  async execute(args) {
    try {
      const config = _activeWebsearchConfig || createWebsearchConfig()
      const result = await mcpLoader.callTool('fetch', args, config)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ error: 'Webfetch failed', details: error.message }, null, 2)
    }
  },
})
