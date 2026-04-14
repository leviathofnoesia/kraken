/**
 * Additional Remote MCP Configurations
 *
 * Remote MCP server configurations for additional providers.
 * All MCPs provide free tiers that work without API keys.
 * Optional API keys can be set via environment variables for enhanced quota.
 */

import type { RemoteMcpConfig } from './types'

/**
 * Deepwiki MCP Configuration
 *
 * Wikipedia-like search via DeepWiki API.
 */
export const deepwiki: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://mcp.deepwiki.com/mcp',
  enabled: true,
  headers: process.env.DEEPWIKI_API_KEY ? { 'x-api-key': process.env.DEEPWIKI_API_KEY } : undefined,
  oauth: false,
}

/**
 * Semgrep MCP Configuration
 *
 * Semantic code search using AI-powered grep.
 */
export const semgrep: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://mcp.semgrep.ai/sse',
  enabled: true,
  headers: process.env.SEMGREP_API_KEY ? { 'x-api-key': process.env.SEMGREP_API_KEY } : undefined,
  oauth: false,
}

/**
 * Sequential Thinking MCP Configuration
 *
 * Chain-of-thought reasoning tool.
 * DISABLED: Unverified endpoint - requires verification of remote-mcp-servers.org domain
 */
export const sequential_thinking: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://remote-mcp-servers.org/sequential-thinking/mcp',
  enabled: false,
  headers: undefined,
  oauth: false,
}

/**
 * Bridgemind MCP Configuration
 *
 * Mind mapping and brainstorming tool.
 * DISABLED: Unverified endpoint - requires verification of remote-mcp-servers.org domain
 */
export const bridgemind: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://remote-mcp-servers.org/bridgemind/mcp',
  enabled: false,
  headers: undefined,
  oauth: false,
}

/**
 * All Additional MCP Configurations
 */
export const additionalMcpConfigs: Record<string, RemoteMcpConfig> = {
  deepwiki,
  semgrep,
  sequential_thinking,
  bridgemind,
}

export const additionalMcpNames = [
  'deepwiki',
  'semgrep',
  'sequential_thinking',
  'bridgemind',
] as const
export type AdditionalMcpName = (typeof additionalMcpNames)[number]
