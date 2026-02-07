/**
 * MCP (Model Context Protocol) Types and Interfaces
 *
 * This file defines shared types and interfaces for all built-in MCP servers.
 */

/**
 * Remote MCP Server Configuration
 *
 * Points to a remote MCP server that handles API calls internally.
 * Remote servers provide free tiers that work without authentication.
 */
export interface RemoteMcpConfig {
  /**
   * Configuration type
   */
  type: 'remote'

  /**
   * URL of the remote MCP server
   */
  url: string

  /**
   * Whether the server is enabled
   */
  enabled?: boolean

  /**
   * Optional HTTP headers (e.g., for API key authentication)
   */
  headers?: Record<string, string>

  /**
   * Disable OAuth auto-detection
   */
  oauth?: false
}

/**
 * Websearch Provider Configuration
 */
export interface WebsearchConfig {
  /**
   * Websearch provider to use
   * - "exa": Exa AI (default, works without API key)
   * - "tavily": Tavily (requires TAVILY_API_KEY)
   */
  provider?: 'exa' | 'tavily'
}
