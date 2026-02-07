/**
 * Context7 MCP Remote Configuration
 *
 * Provides remote configuration for Context7 documentation search server.
 * Free tier works without API key. Optional API key for enhanced quota.
 */

import type { RemoteMcpConfig } from './types'

/**
 * Context7 remote configuration
 */
export const context7: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://mcp.context7.com/mcp',
  enabled: true,
  headers: process.env.CONTEXT7_API_KEY
    ? { Authorization: `Bearer ${process.env.CONTEXT7_API_KEY}` }
    : undefined,
  oauth: false,
}
