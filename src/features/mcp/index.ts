/**
 * MCP (Model Context Protocol) Integration Index
 *
 * Exports all built-in MCP remote configurations and provides utility functions.
 */

import type { RemoteMcpConfig, WebsearchConfig } from './types'

// Import all built-in MCP configurations
import { createWebsearchConfig, websearch } from './websearch'
import { context7 } from './context7'
import { grep_app } from './grep-app'

/**
 * Built-in MCP Server Names
 */
export const builtinMcpNames: readonly ['websearch', 'context7', 'grep_app'] = [
  'websearch',
  'context7',
  'grep_app',
] as const

export type BuiltinMcpName = (typeof builtinMcpNames)[number]

/**
 * Built-in MCP Remote Configurations
 */
export const builtinMcpConfigs: Record<BuiltinMcpName, RemoteMcpConfig> = {
  websearch,
  context7,
  grep_app,
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
  config?: { websearch?: WebsearchConfig },
): Record<string, RemoteMcpConfig> {
  const mcps: Record<string, RemoteMcpConfig> = {}

  if (!disabledMcps.includes('websearch')) {
    mcps.websearch = createWebsearchConfig(config?.websearch)
  }

  if (!disabledMcps.includes('context7')) {
    mcps.context7 = context7
  }

  if (!disabledMcps.includes('grep_app')) {
    mcps.grep_app = grep_app
  }

  return mcps
}

/**
 * Re-export types
 */
export type { RemoteMcpConfig, WebsearchConfig } from './types'
