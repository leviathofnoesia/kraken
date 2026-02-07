/**
 * Websearch MCP Remote Configuration
 *
 * Provides remote configuration for Exa AI websearch server.
 * Free tier works without API key. Optional API key for enhanced quota.
 */

import type { RemoteMcpConfig, WebsearchConfig } from './types'

/**
 * Create websearch remote configuration
 *
 * Returns configuration pointing to Exa AI or Tavily remote MCP server.
 *
 * @param config - Optional websearch configuration
 * @returns Remote MCP configuration
 */
export function createWebsearchConfig(config?: WebsearchConfig): RemoteMcpConfig {
  const provider = config?.provider || 'exa'

  if (provider === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      throw new Error('TAVILY_API_KEY environment variable is required for Tavily provider')
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
 * Default websearch configuration (exa provider, optional API key)
 */
export const websearch = createWebsearchConfig()
