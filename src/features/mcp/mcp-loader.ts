/**
 * MCP (Model Context Protocol) Loader
 *
 * Manages lazy initialization of remote MCP servers.
 * Only initializes MCP when first tool call is made.
 * Does NOT auto-inject context into agent responses.
 */

import type { RemoteMcpConfig } from './types'

/**
 * MCP Connection metadata for remote MCPs.
 */
interface MCPConnection {
  config: RemoteMcpConfig
  tools: string[]
  initialized: boolean
}

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: Record<string, unknown>
}

interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

interface JsonRpcResponse {
  jsonrpc?: '2.0'
  id?: number
  result?: unknown
  error?: JsonRpcError
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
  private requestCounter = 1

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

    return this.callRemoteMcpTool(mcpConfig, toolName, args)
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

  private async callRemoteMcpTool(
    config: RemoteMcpConfig,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const requestBody: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.requestCounter++,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: this.buildRequestHeaders(config),
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    })

    const responseText = await response.text()
    if (!response.ok) {
      throw new Error(`MCP request failed (${response.status}): ${responseText || response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json') || responseText.trim().startsWith('{')) {
      let parsed: JsonRpcResponse
      try {
        parsed = JSON.parse(responseText) as JsonRpcResponse
      } catch {
        throw new Error(`MCP returned invalid JSON: ${responseText}`)
      }

      if (parsed.error) {
        throw new Error(`MCP error ${parsed.error.code}: ${parsed.error.message}`)
      }

      if (parsed.result !== undefined) {
        return parsed.result
      }

      return parsed
    }

    return { result: responseText }
  }

  private buildRequestHeaders(config: RemoteMcpConfig): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(config.headers || {}),
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
