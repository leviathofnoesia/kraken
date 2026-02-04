/**
 * Websearch MCP Server
 *
 * Provides AI-powered web search capabilities via Exa AI.
 * Includes tools for web search and web content fetching.
 */

import { tool } from '@opencode-ai/plugin';
import type {
  MCPServerDefinition,
  MCPTool,
  WebsearchConfig,
  WebsearchResult,
} from './types';
import { RateLimiter, MCPTimeoutError } from './types';
import { createLogger } from '../../utils/logger';

const z = tool.schema;

// Exa API configuration
const EXA_API_BASE_URL = 'https://api.exa.ai';
const DEFAULT_NUM_RESULTS = 8;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const shouldLog = (): boolean =>
  process.env.ANTIGRAVITY_DEBUG === "1" ||
  process.env.DEBUG === "1" ||
  process.env.KRAKEN_LOG === "1";
const logger = createLogger("mcp-websearch");

// Rate limiter for Exa API (60 requests per minute)
const exaRateLimiter = new RateLimiter(60, 60000);

// Current configuration (set during initialization)
let currentConfig: WebsearchConfig = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT,
  numResults: DEFAULT_NUM_RESULTS,
  livecrawl: 'fallback',
  searchType: 'auto',
  contextMaxCharacters: 10000,
};

/**
 * Initialize the Websearch MCP server
 */
export async function initializeWebsearchMCP(config: Record<string, unknown> = {}): Promise<void> {
  currentConfig = {
    ...currentConfig,
    ...config,
  };

  // Validate API key
  if (!currentConfig.apiKey && !process.env.EXA_API_KEY) {
    if (shouldLog()) {
      logger.warn(
        "No API key provided. Set EXA_API_KEY environment variable or provide apiKey in config."
      );
    }
  }
}

/**
 * Perform web search using Exa AI API
 */
async function performWebSearch(
  query: string,
  options: {
    numResults?: number;
    livecrawl?: 'fallback' | 'preferred';
    searchType?: 'auto' | 'fast' | 'deep';
    contextMaxCharacters?: number;
  } = {}
): Promise<WebsearchResult[]> {
  const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error('EXA_API_KEY is required for web search. Please set the environment variable.');
  }

  const startTime = Date.now();
  const timeout = options.contextMaxCharacters ?? currentConfig.contextMaxCharacters ?? 10000;

  try {
    // Wait for rate limiter
    await exaRateLimiter.waitIfNeeded();

    // Prepare request body
    const requestBody = {
      query,
      numResults: options.numResults ?? currentConfig.numResults ?? DEFAULT_NUM_RESULTS,
      livecrawl: options.livecrawl ?? currentConfig.livecrawl ?? 'fallback',
      type: options.searchType ?? currentConfig.searchType ?? 'auto',
      contents: {
        text: true,
      },
      queryCost: 2, // Exa API parameter
    };

    // Make API request
    const response = await fetch(`${EXA_API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(currentConfig.timeout ?? DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();

    // Transform results
    const results: WebsearchResult[] = (data.results || []).map((result: any) => ({
      title: result.title || 'No title',
      url: result.url,
      content: result.text || '',
      score: result.score,
      publishedDate: result.publishedDate,
    }));

    // Truncate content if too long
    return results.map((result) => ({
      ...result,
      content: truncateContent(result.content, timeout),
    }));

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new MCPTimeoutError(
          `Websearch timed out after ${currentConfig.timeout}ms`,
          currentConfig.timeout
        );
      }
      throw error;
    }
    throw error;
  }
}

/**
 * Fetch and parse web content
 */
async function fetchWebContent(
  url: string,
  options: {
    format?: 'markdown' | 'text' | 'html';
    timeout?: number;
  } = {}
): Promise<{ url: string; content: string; title?: string }> {
  const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error('EXA_API_KEY is required for web fetch. Please set the environment variable.');
  }

  try {
    // Wait for rate limiter
    await exaRateLimiter.waitIfNeeded();

    // Prepare request body
    const requestBody = {
      url,
      text: options.format !== 'html',
    };

    // Make API request
    const response = await fetch(`${EXA_API_BASE_URL}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(options.timeout ?? currentConfig.timeout ?? DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();

    return {
      url,
      content: data.text || data.contents || '',
      title: data.title,
    };

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new MCPTimeoutError(
          `Web fetch timed out after ${options.timeout ?? currentConfig.timeout}ms`,
          options.timeout ?? currentConfig.timeout
        );
      }
      throw error;
    }
    throw error;
  }
}

/**
 * Truncate content to maximum character limit
 */
function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }
  return content.slice(0, maxChars) + '\n\n[Content truncated...]';
}

/**
 * Create the websearch tool
 */
const websearchToolImpl = tool({
  description: 'Search the web for information using AI-powered search via Exa AI. Returns relevant web pages with their content.',
  args: {
    query: z.string().describe('Search query for the web'),
    numResults: z.number().min(1).max(20).optional().default(DEFAULT_NUM_RESULTS).describe('Number of results to return (1-20)'),
    livecrawl: z.enum(['fallback', 'preferred']).optional().default('fallback').describe('Live crawl mode'),
    searchType: z.enum(['auto', 'fast', 'deep']).optional().default('auto').describe('Search type'),
    contextMaxCharacters: z.number().min(1000).max(50000).optional().default(10000).describe('Maximum characters per result'),
  },
  async execute(args) {
    const startTime = Date.now();

    try {
      const results = await performWebSearch(
        args.query,
        {
          numResults: args.numResults,
          livecrawl: args.livecrawl,
          searchType: args.searchType,
          contextMaxCharacters: args.contextMaxCharacters,
        }
      );

      const searchTime = Date.now() - startTime;

      // Format results as JSON string
      return JSON.stringify({
        query: args.query,
        results,
        totalResults: results.length,
        searchTime,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Websearch timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Create the webfetch tool
 */
const webfetchToolImpl = tool({
  description: 'Fetch and parse web content from a specific URL using Exa AI. Returns the content in the specified format.',
  args: {
    url: z.string().url().describe('URL to fetch content from'),
    format: z.enum(['markdown', 'text', 'html']).optional().default('markdown').describe('Output format'),
    timeout: z.number().min(1000).max(60000).optional().describe('Timeout in milliseconds'),
  },
  async execute(args) {
    const startTime = Date.now();

    try {
      const result = await fetchWebContent(
        args.url,
        {
          format: args.format,
          timeout: args.timeout,
        }
      );

      const fetchTime = Date.now() - startTime;

      // Format result as JSON string
      return JSON.stringify({
        ...result,
        fetchTime,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Webfetch timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Export websearch tool with MCP metadata
 */
export const websearchTool: MCPTool = {
  ...websearchToolImpl,
  serverName: 'websearch',
  category: 'search',
  rateLimit: 60, // 60 requests per minute
};

/**
 * Export webfetch tool with MCP metadata
 */
export const webfetchTool: MCPTool = {
  ...webfetchToolImpl,
  serverName: 'websearch',
  category: 'search',
  rateLimit: 60, // 60 requests per minute
};

/**
 * Websearch MCP Server Definition
 */
export const websearchMCP: MCPServerDefinition = {
  name: 'websearch',
  description: 'AI-powered web search via Exa AI with live crawling capabilities',
  version: '1.0.0',
  tools: [websearchTool, webfetchTool],
  configSchema: {
    apiKey: 'string (optional)',
    timeout: 'number (ms, default: 30000)',
    numResults: 'number (1-20, default: 8)',
    livecrawl: "'fallback' | 'preferred' (default: 'fallback')",
    searchType: "'auto' | 'fast' | 'deep' (default: 'auto')",
    contextMaxCharacters: 'number (1000-50000, default: 10000)',
    enabled: 'boolean (default: true)',
  },
  initialize: async (config: Record<string, unknown>) => {
    await initializeWebsearchMCP(config);
  },
  shutdown: async () => {
    // Cleanup if needed
    exaRateLimiter.reset();
  },
  healthCheck: async () => {
    const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
    return currentConfig.enabled !== false && !!apiKey;
  },
};
