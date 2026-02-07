/**
 * MCP (Model Context Protocol) Integration Index
 *
 * Exports all built-in MCP remote configurations and provides utility functions.
 * Includes agent-accessible MCP tools for ALL MCPs (new + existing).
 */

import type { RemoteMcpConfig } from './types'

// Import all built-in MCP remote configurations
import { createWebsearchConfig, setActiveWebsearchConfig } from './websearch'
import { context7 } from './context7'
import { grep_app } from './grep-app'

// Import additional MCPs
import { additionalMcpConfigs, additionalMcpNames } from './additional-mcps'

// Import MCP agent tools (both new and existing)
import { mcpAgentTools } from './mcp-agent-tools'
import { existingMcpAgentTools } from './existing-mcp-agent-tools'

// Import MCP loader
import { mcpLoader } from './mcp-loader'

// Cache websearch config to avoid repeated calls
let _cachedWebsearchConfig: RemoteMcpConfig | null = null

const websearchConfig: RemoteMcpConfig = {
  get type() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.type
  },
  get name() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.name
  },
  get url() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.url
  },
  get enabled() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.enabled
  },
  get headers() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.headers
  },
  get oauth() {
    if (!_cachedWebsearchConfig) {
      _cachedWebsearchConfig = createWebsearchConfig()
    }
    return _cachedWebsearchConfig.oauth
  },
}

export const websearch = websearchConfig

/**
 * Built-in MCP Server Names
 */
export const builtinMcpNames: readonly string[] = [
  ...['websearch', 'context7', 'grep_app'],
  ...additionalMcpNames,
] as const

export type BuiltinMcpName = (typeof builtinMcpNames)[number]

/**
 * Built-in MCP Remote Configurations
 */
export const builtinMcpConfigs: Record<BuiltinMcpName, RemoteMcpConfig> = {
  websearch,
  context7,
  grep_app,
  ...additionalMcpConfigs,
}

/**
 * Get Built-in MCP Names
 *
 * Returns list of all built-in MCP server names.
 */
export function getBuiltinMcpNames(): readonly string[] {
  return builtinMcpNames
}

/**
 * Get Built-in MCP Configuration
 *
 * Returns remote configuration for a specific built-in MCP.
 *
 * @param name - The name of MCP server
 * @returns MCP server configuration or undefined if not found
 */
export function getBuiltinMcpConfig(name: BuiltinMcpName): RemoteMcpConfig | undefined {
  return builtinMcpConfigs[name]
}

/**
 * Create Built-in MCPs for Plugin
 *
 * Returns a map of remote MCP configurations for plugin integration.
 *
 * @param disabledMcps - List of MCP names to exclude
 * @param config - Optional configuration for websearch provider
 */
export function createBuiltinMcpConfigs(
  disabledMcps: string[] = [],
  config?: { websearch?: { provider?: 'exa' | 'tavily' } },
): Record<string, RemoteMcpConfig> {
  const mcps: Record<string, RemoteMcpConfig> = {}

  // Original MCPs
  if (!disabledMcps.includes('websearch')) {
    const websearchConfig = createWebsearchConfig(config?.websearch)
    mcps.websearch = websearchConfig
    // Set active config for tools to use
    setActiveWebsearchConfig(websearchConfig)
  }

  if (!disabledMcps.includes('context7')) {
    mcps.context7 = context7
  }

  if (!disabledMcps.includes('grep_app')) {
    mcps.grep_app = grep_app
  }

  // Additional MCPs
  for (const name of additionalMcpNames) {
    if (!disabledMcps.includes(name)) {
      mcps[name] = additionalMcpConfigs[name]
    }
  }

  return mcps
}

/**
 * Get MCP Agent Tools
 *
 * Returns all MCP tools available for agents to use.
 * These tools are lazy-loaded and do NOT auto-inject context.
 */
export function getMcpAgentTools(): Record<string, any> {
  return {
    ...existingMcpAgentTools,
    ...mcpAgentTools,
  }
}

/**
 * Re-export types and utilities
 */
export type { RemoteMcpConfig } from './types'
export { additionalMcpConfigs, additionalMcpNames } from './additional-mcps'
export { mcpLoader } from './mcp-loader'
export { mcpAgentTools } from './mcp-agent-tools'
export { existingMcpAgentTools } from './existing-mcp-agent-tools'
export { setActiveWebsearchConfig, getActiveWebsearchConfig } from './websearch'
