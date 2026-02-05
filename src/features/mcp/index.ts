/**
 * MCP (Model Context Protocol) Integration Index
 *
 * Exports all built-in MCP servers and provides utility functions for MCP management.
 */

import type { MCPServerDefinition } from './types'
import { createLogger } from '../../utils/logger'

// Import all built-in MCP servers
import { websearchMCP } from './websearch'
import { context7MCP } from './context7'
import { grepAppMCP } from './grep-app'

const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === '1' ||
  process.env.DEBUG === '1' ||
  process.env.KRAKEN_LOG === '1'
const logger = createLogger('mcp-index')

/**
 * Built-in MCP Servers
 *
 * These are MCP servers that are built into Kraken Code and available by default.
 */
export const builtinMCPs: MCPServerDefinition[] = [websearchMCP, context7MCP, grepAppMCP]

/**
 * MCP Server Names
 *
 * Returns a list of all built-in MCP server names.
 */
export function getBuiltinMcpNames(): string[] {
  return builtinMCPs.map((mcp) => mcp.name)
}

/**
 * Get MCP Server Information
 *
 * Returns detailed information about a specific built-in MCP server.
 *
 * @param name - The name of the MCP server
 * @returns MCP server information or undefined if not found
 */
export function getBuiltinMcpInfo(name: string): MCPServerDefinition | undefined {
  return builtinMCPs.find((mcp) => mcp.name === name)
}

/**
 * Get MCP Server Tools
 *
 * Returns all tools provided by a specific built-in MCP server.
 *
 * @param name - The name of the MCP server
 * @returns Array of tools or empty array if server not found
 */
export function getBuiltinMcpTools(name: string) {
  const mcp = getBuiltinMcpInfo(name)
  return mcp?.tools ?? []
}

/**
 * Get All MCP Server Tools
 *
 * Returns all tools from all built-in MCP servers.
 *
 * @returns Array of all tools from all built-in MCP servers
 */
export function getAllBuiltinMcpTools() {
  return builtinMCPs.flatMap((mcp) => mcp.tools)
}

/**
 * Get Enabled MCP Servers
 *
 * Returns all built-in MCP servers that are currently enabled.
 *
 * @returns Array of enabled MCP servers
 */
export function getEnabledMcpServers(): MCPServerDefinition[] {
  return builtinMCPs.filter((mcp) => {
    // Check if MCP is enabled in its config
    const enabled = mcp.configSchema?.enabled
    return enabled !== false // Default to true if not specified
  })
}

/**
 * Initialize All MCP Servers
 *
 * Initializes all built-in MCP servers with their configurations.
 *
 * @param configs - Configuration object with server-specific configs
 */
export async function initializeAllMcpServers(
  configs: Record<string, Record<string, unknown>> = {},
): Promise<void> {
  for (const mcp of builtinMCPs) {
    const config = configs[mcp.name] || {}
    if (mcp.initialize) {
      try {
        await mcp.initialize(config)
      } catch (error) {
        if (SHOULD_LOG) {
          logger.warn(`Failed to initialize MCP server '${mcp.name}':`, error)
        }
        throw error
      }
    }
  }
}

/**
 * Shutdown All MCP Servers
 *
 * Shuts down all built-in MCP servers and performs cleanup.
 */
export async function shutdownAllMcpServers(): Promise<void> {
  for (const mcp of builtinMCPs) {
    if (mcp.shutdown) {
      try {
        await mcp.shutdown()
      } catch (error) {
        if (SHOULD_LOG) {
          logger.warn(`Failed to shutdown MCP server '${mcp.name}':`, error)
        }
      }
    }
  }
}

/**
 * Check MCP Server Health
 *
 * Performs health checks on all built-in MCP servers.
 *
 * @returns Object with server names and health status
 */
export async function checkAllMcpHealth(): Promise<Record<string, boolean>> {
  const healthStatus: Record<string, boolean> = {}

  for (const mcp of builtinMCPs) {
    try {
      if (mcp.healthCheck) {
        healthStatus[mcp.name] = await mcp.healthCheck()
      } else {
        healthStatus[mcp.name] = true // Assume healthy if no health check
      }
    } catch (error) {
      if (SHOULD_LOG) {
        logger.warn(`Health check failed for MCP server '${mcp.name}':`, error)
      }
      healthStatus[mcp.name] = false
    }
  }

  return healthStatus
}

/**
 * Re-export types for external use
 */
export type {
  MCPServerDefinition,
  MCPTool,
  BaseMCPConfig,
  WebsearchConfig,
  Context7Config,
  GrepAppConfig,
  WebsearchResult,
  DocumentationResult,
  GrepResult,
  MCPError,
  MCPRateLimitError,
  MCPAuthenticationError,
  MCPTimeoutError,
} from './types'

// Re-export utility classes
export { RateLimiter } from './types'

// Re-export specific MCP server implementations
export { websearchMCP, websearchTool, webfetchTool } from './websearch'
export {
  context7MCP,
  context7SearchToolMCP,
  context7GetToolMCP,
  clearContext7Cache,
} from './context7'
export { grepAppMCP, grepSearchToolMCP, grepGetFileToolMCP } from './grep-app'
