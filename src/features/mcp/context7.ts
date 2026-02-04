/**
 * Context7 MCP Server
 *
 * Provides official documentation lookup for libraries, SDKs, and APIs.
 * Includes tools for searching and fetching documentation with caching.
 */

import { tool } from '@opencode-ai/plugin';
import type {
  MCPServerDefinition,
  MCPTool,
  Context7Config,
  DocumentationResult,
} from './types';
import { RateLimiter, MCPTimeoutError } from './types';

const z = tool.schema;

// Context7 API configuration
const CONTEXT7_API_BASE_URL = 'https://api.context7.io/v1'; // Placeholder - adjust to actual API
const DEFAULT_NUM_RESULTS = 5;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_CACHE_TTL = 300; // 5 minutes
const DEFAULT_MAX_TOKENS = 5000;

// Rate limiter for Context7 API (30 requests per minute)
const context7RateLimiter = new RateLimiter(30, 60000);

// Current configuration (set during initialization)
let currentConfig: Context7Config = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT,
  numResults: DEFAULT_NUM_RESULTS,
  cacheTTL: DEFAULT_CACHE_TTL,
  maxTokens: DEFAULT_MAX_TOKENS,
};

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}
const documentationCache = new Map<string, CacheEntry>();

/**
 * Get from cache or fetch new data
 */
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cachedEntry = documentationCache.get(cacheKey);

  if (cachedEntry) {
    const age = Date.now() - cachedEntry.timestamp;
    if (age < cachedEntry.ttl * 1000) {
      // Cache hit - return cached data
      return cachedEntry.data as T;
    }
    // Cache expired - remove it
    documentationCache.delete(cacheKey);
  }

  // Cache miss - fetch new data
  const data = await fetchFn();

  // Store in cache
  documentationCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: currentConfig.cacheTTL ?? DEFAULT_CACHE_TTL,
  });

  return data;
}

/**
 * Clear cache
 */
export function clearContext7Cache(): void {
  documentationCache.clear();
}

/**
 * Initialize the Context7 MCP server
 */
export async function initializeContext7MCP(config: Record<string, unknown> = {}): Promise<void> {
  currentConfig = {
    ...currentConfig,
    ...config,
  };

  // Validate API key
  if (!currentConfig.apiKey && !process.env.CONTEXT7_API_KEY) {
    console.warn('Context7 MCP: No API key provided. Set CONTEXT7_API_KEY environment variable or provide apiKey in config.');
  }
}

/**
 * Search official documentation
 */
async function searchDocumentation(
  query: string,
  options: {
    library?: string;
    version?: string;
    numResults?: number;
    maxTokens?: number;
  } = {}
): Promise<DocumentationResult[]> {
  const apiKey = currentConfig.apiKey || process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    throw new Error('CONTEXT7_API_KEY is required for documentation search. Please set the environment variable.');
  }

  try {
    // Wait for rate limiter
    await context7RateLimiter.waitIfNeeded();

    // Prepare request body
    const requestBody = {
      query,
      library: options.library,
      version: options.version,
      numResults: options.numResults ?? currentConfig.numResults ?? DEFAULT_NUM_RESULTS,
      maxTokens: options.maxTokens ?? currentConfig.maxTokens ?? DEFAULT_MAX_TOKENS,
    };

    // Make API request
    const response = await fetch(`${CONTEXT7_API_BASE_URL}/search`, {
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
      throw new Error(`Context7 API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();

    // Transform results
    const results: DocumentationResult[] = (data.results || []).map((result: any) => ({
      library: result.library || options.library || 'unknown',
      version: result.version || options.version || 'latest',
      content: result.content || result.text || '',
      url: result.url || '#',
      relevance: result.score || result.relevance || 0,
      metadata: result.metadata || {},
    }));

    return results;

  } catch (error: unknown) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Documentation search failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get specific documentation page
 */
async function getDocumentation(
  library: string,
  path: string,
  options: {
    version?: string;
    maxTokens?: number;
  } = {}
): Promise<DocumentationResult> {
  const apiKey = currentConfig.apiKey || process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    throw new Error('CONTEXT7_API_KEY is required for documentation lookup. Please set the environment variable.');
  }

  const cacheKey = `doc:${library}:${path}:${options.version || 'latest'}`;

  try {
    return await getCachedOrFetch(cacheKey, async () => {
      // Wait for rate limiter
      await context7RateLimiter.waitIfNeeded();

      // Make API request
      const response = await fetch(`${CONTEXT7_API_BASE_URL}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          library,
          path,
          version: options.version,
          maxTokens: options.maxTokens ?? currentConfig.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
        signal: AbortSignal.timeout(currentConfig.timeout ?? DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Context7 API error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();

      return {
        library,
        version: data.version || options.version || 'latest',
        content: data.content || data.text || '',
        url: data.url || '#',
        relevance: 1.0,
        metadata: data.metadata || {},
      };
    });

  } catch (error: unknown) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get documentation: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Context7 search tool
 */
const context7SearchTool = tool({
  description: 'search official documentation for libraries, SDKs, and APIs. Returns relevant documentation pages with content.',
  args: {
    query: z.string().describe('Search query for documentation'),
    library: z.string().optional().describe('Library name (e.g., "react", "nodejs", "python")'),
    version: z.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    numResults: z.number().min(1).max(10).optional().default(DEFAULT_NUM_RESULTS).describe('Number of results to return'),
    maxTokens: z.number().min(1000).max(20000).optional().describe('Maximum tokens per result'),
  },
  async execute(args) {
    try {
      const results = await searchDocumentation(args.query, {
        library: args.library,
        version: args.version,
        numResults: args.numResults,
        maxTokens: args.maxTokens,
      });

      return JSON.stringify({
        query: args.query,
        library: args.library,
        version: args.version,
        results,
        totalResults: results.length,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Documentation search timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Context7 get tool
 */
const context7GetTool = tool({
  description: 'Get specific documentation page by library and path. Fetches the exact documentation content.',
  args: {
    library: z.string().describe('Library name (e.g., "react", "nodejs", "python")'),
    path: z.string().describe('Documentation path (e.g., "/hooks/useEffect", "/api/fs")'),
    version: z.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    maxTokens: z.number().min(1000).max(20000).optional().describe('Maximum tokens to return'),
  },
  async execute(args) {
    try {
      const result = await getDocumentation(args.library, args.path, {
        version: args.version,
        maxTokens: args.maxTokens,
      });

      return JSON.stringify({
        library: args.library,
        path: args.path,
        version: args.version,
        result,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Documentation lookup timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Export search tool with MCP metadata
 */
export const context7SearchToolMCP: MCPTool = {
  ...context7SearchTool,
  serverName: 'context7',
  category: 'documentation',
  rateLimit: 30, // 30 requests per minute
};

/**
 * Export get tool with MCP metadata
 */
export const context7GetToolMCP: MCPTool = {
  ...context7GetTool,
  serverName: 'context7',
  category: 'documentation',
  rateLimit: 30, // 30 requests per minute
};

/**
 * Context7 MCP Server Definition
 */
export const context7MCP: MCPServerDefinition = {
  name: 'context7',
  description: 'Official documentation lookup for libraries, SDKs, and APIs with intelligent caching',
  version: '1.0.0',
  tools: [context7SearchToolMCP, context7GetToolMCP],
  configSchema: {
    apiKey: 'string (optional)',
    timeout: 'number (ms, default: 30000)',
    numResults: 'number (1-10, default: 5)',
    cacheTTL: 'number (seconds, default: 300)',
    maxTokens: 'number (1000-20000, default: 5000)',
    enabled: 'boolean (default: true)',
  },
  initialize: async (config: Record<string, unknown>) => {
    await initializeContext7MCP(config);
  },
  shutdown: async () => {
    // Clear cache
    clearContext7Cache();
    context7RateLimiter.reset();
  },
  healthCheck: async () => {
    const apiKey = currentConfig.apiKey || process.env.CONTEXT7_API_KEY;
    return currentConfig.enabled !== false && !!apiKey;
  },
};
