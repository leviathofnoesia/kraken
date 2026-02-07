/**
 * Grep App MCP Remote Configuration
 *
 * Provides remote configuration for Grep.app GitHub code search.
 * No API key required (uses OAuth via OpenCode).
 */

import type { RemoteMcpConfig } from './types'

/**
 * Grep.app remote configuration
 */
export const grep_app: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://mcp.grep.app',
  enabled: true,
  oauth: false,
}
