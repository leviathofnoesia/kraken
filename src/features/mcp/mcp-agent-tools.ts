/**
 * MCP Agent Tools - Additional MCP Providers
 *
 * Agent-accessible tools for additional MCP providers (deepwiki, semgrep, sequential_thinking, bridgemind).
 * Tools are lazy-loaded and do NOT auto-inject context.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { deepwiki, semgrep, sequential_thinking, bridgemind } from './additional-mcps'
import { mcpLoader } from './mcp-loader'

/**
 * Deepwiki Search Agent Tool
 *
 * Search Wikipedia-like knowledge base using DeepWiki. Does NOT auto-inject results.
 */
export const mcpDeepwikiSearch = tool({
  description:
    'Search Wikipedia-like knowledge base using DeepWiki. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    query: z.string().min(1).describe('Search query for knowledge base'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('search', args, deepwiki)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ error: 'DeepWiki search failed', details: error.message }, null, 2)
    }
  },
})

/**
 * Semgrep Search Agent Tool
 *
 * Semantic code search using AI-powered grep. Does NOT auto-inject results.
 */
export const mcpSemgrepSearch = tool({
  description:
    'Semantic code search using AI-powered grep via Semgrep. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    query: z.string().min(1).describe('Search query for semantic code search'),
    language: z.string().optional().describe('Filter by programming language'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('search', args, semgrep)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ error: 'Semgrep search failed', details: error.message }, null, 2)
    }
  },
})

/**
 * Sequential Thinking Agent Tool
 *
 * Chain-of-thought reasoning tool. Does NOT auto-inject results.
 */
export const mcpSequentialThinking = tool({
  description:
    'Chain-of-thought reasoning tool that helps break down complex problems step by step. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    problem: z.string().min(1).describe('Problem or question to reason about step by step'),
    steps: z
      .number()
      .optional()
      .default(5)
      .describe('Number of reasoning steps to take (default: 5)'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool('think', args, sequential_thinking)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify(
        { error: 'Sequential thinking failed', details: error.message },
        null,
        2,
      )
    }
  },
})

/**
 * Bridgemind Agent Tool
 *
 * Mind mapping and brainstorming tool. Does NOT auto-inject results.
 */
export const mcpBridgemind = tool({
  description:
    'Mind mapping and brainstorming tool to visualize connections between ideas. Does NOT auto-inject results into conversation context - you must explicitly read and use results.',
  args: {
    action: z
      .enum(['create', 'explore'])
      .describe('Action to perform: create new mind map or explore existing'),
    topic: z.string().optional().describe('Topic or idea for mind map creation'),
    mapId: z.string().optional().describe('ID of existing mind map to explore'),
  },
  async execute(args) {
    try {
      const result = await mcpLoader.callTool(args.action, args, bridgemind)
      return JSON.stringify(result, null, 2)
    } catch (err) {
      const error = err as Error
      return JSON.stringify({ error: 'Bridgemind failed', details: error.message }, null, 2)
    }
  },
})

/**
 * Export all new MCP agent tools
 */
export const mcpAgentTools = {
  mcpDeepwikiSearch,
  mcpSemgrepSearch,
  mcpSequentialThinking,
  mcpBridgemind,
}
