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
   * Logical name for this MCP (used for tool routing)
   */
  name?: string

  /**
   * URL of remote MCP server
   */
  url: string

  /**
   * Whether server is enabled
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
 * MCP Tool for agent use
 *
 * Wraps remote MCP server access as a tool agents can call.
 * Tools are lazy-loaded and do NOT auto-inject context.
 */
export interface MCPTool {
  /**
   * Tool identifier (e.g., 'mcp_deepwiki_search')
   */
  name: string

  /**
   * Human-readable description
   */
  description: string

  /**
   * Remote MCP server configuration
   */
  mcpConfig: RemoteMcpConfig

  /**
   * Tool name to call on remote server
   */
  toolName: string
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
  enabled?: boolean
  apiKey?: string
  timeout?: number
  numResults?: number
  livecrawl?: 'fallback' | 'preferred'
  searchType?: 'auto' | 'fast' | 'deep'
  contextMaxCharacters?: number
}
