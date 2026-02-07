/**
 * MCP Agent Tools - Existing MCP Providers
 *
 * Agent-accessible tools for existing MCP providers (websearch, context7, grep-app).
 * Tools are lazy-loaded and do NOT auto-inject context.
 */

import { websearchTool, webfetchTool } from './websearch'
import { context7SearchTool, context7GetTool } from './context7'
import { grepSearchTool, grepGetFileTool } from './grep-app'

export {
  websearchTool,
  webfetchTool,
  context7SearchTool,
  context7GetTool,
  grepSearchTool,
  grepGetFileTool,
}

/**
 * Export all existing MCP agent tools as a group
 */
export const existingMcpAgentTools = {
  websearchTool,
  webfetchTool,
  context7SearchTool,
  context7GetTool,
  grepSearchTool,
  grepGetFileTool,
}
