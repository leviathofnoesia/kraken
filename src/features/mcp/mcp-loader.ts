/**
 * MCP (Model Context Protocol) Loader
 *
 * Manages lazy initialization of remote MCP servers.
 * Only initializes MCP when first tool call is made.
 * Does NOT auto-inject context into agent responses.
 */

import type { RemoteMcpConfig } from './types'

/**
 * MCP Connection (simulated for remote MCPs)
 *
 * For now, this is a placeholder that simulates MCP connection.
 * Future enhancement would use stdio to connect to actual MCP servers.
 */
interface MCPConnection {
  config: RemoteMcpConfig
  tools: string[]
  initialized: boolean
}

/**
 * MCP Loader (Lazy Loading)
 *
 * Manages lazy initialization of remote MCP servers.
 * Only initializes MCP when first tool call is made.
 */
export class MCPLoader {
  private initialized = new Map<string, boolean>()
  private connections = new Map<string, MCPConnection>()

  /**
   * Initialize MCP connection lazily
   *
   * Only initializes on first tool call.
   * Returns MCP connection object with available tools.
   */
  async initMCP(name: string, config: RemoteMcpConfig): Promise<MCPConnection> {
    if (this.initialized.has(name)) {
      const existing = this.connections.get(name)
      if (existing) {
        return existing
      }
    }

    // Initialize remote MCP connection
    const connection: MCPConnection = {
      config,
      tools: this.getAvailableToolsForMCP(name),
      initialized: true,
    }

    this.initialized.set(name, true)
    this.connections.set(name, connection)
    return connection
  }

  /**
   * Call tool on MCP server
   *
   * Does NOT auto-inject context. Tool result is returned directly.
   *
   * @param toolName - Tool name to call (e.g., 'search', 'get')
   * @param args - Tool arguments
   * @param mcpConfig - Remote MCP configuration
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    mcpConfig: RemoteMcpConfig,
  ): Promise<unknown> {
    // Validate config
    if (mcpConfig.enabled === false) {
      throw new Error(`MCP ${mcpConfig.name || this.deriveNameFromUrl(mcpConfig.url)} is disabled`)
    }

    if (!mcpConfig.url) {
      throw new Error('MCP config requires a URL')
    }

    // Use mcpConfig.name for tool routing, or derive from URL if not provided
    const mcpName = mcpConfig.name || this.deriveNameFromUrl(mcpConfig.url)

    // Lazy initialization
    await this.initMCP(mcpName, mcpConfig)

    // For now, return a simulated response
    // Future: Use stdio connection to actual MCP server
    return {
      result: `Tool '${toolName}' called with args: ${JSON.stringify(args)}`,
      server: mcpConfig.url,
    }
  }

  /**
   * Derive MCP name from URL
   */
  private deriveNameFromUrl(url: string): string {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname

      // Map known URLs to friendly names
      if (hostname.includes('context7.com')) return 'context7'
      if (hostname.includes('exa.ai')) return 'websearch'
      if (hostname.includes('tavily.com')) return 'websearch'
      if (hostname.includes('grep.app')) return 'grep_app'
      if (hostname.includes('deepwiki.com')) return 'deepwiki'
      if (hostname.includes('semgrep.ai')) return 'semgrep'

      // Fallback: use hostname as name
      return hostname.replace('.com', '').replace('mcp.', '')
    } catch {
      return 'unknown'
    }
  }

  /**
   * Get available tools for MCP
   *
   * Returns list of tool names available on the MCP server.
   */
  private getAvailableToolsForMCP(name: string): string[] {
    switch (name) {
      case 'websearch':
        return ['search', 'fetch']
      case 'context7':
        return ['search', 'get']
      case 'grep_app':
        return ['search', 'get_file']
      case 'deepwiki':
        return ['search']
      case 'semgrep':
        return ['search']
      case 'sequential_thinking':
        return ['think']
      case 'bridgemind':
        return ['create', 'explore']
      default:
        return []
    }
  }

  /**
   * Shutdown all MCP connections
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises: Promise<void>[] = []

    for (const [name, connection] of this.connections.entries()) {
      if (connection.initialized) {
        // Clean up connection
        shutdownPromises.push(
          new Promise<void>((resolve) => {
            resolve()
          }),
        )
      }
    }

    await Promise.all(shutdownPromises)
    this.initialized.clear()
    this.connections.clear()
  }
}

/**
 * Singleton instance for global use
 */
export const mcpLoader = new MCPLoader()
