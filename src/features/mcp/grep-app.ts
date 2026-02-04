/**
 * Grep App MCP Server
 *
 * Enables search across public GitHub repositories.
 * Includes tools for searching code and fetching file contents.
 */

import { tool } from '@opencode-ai/plugin';
import type {
  MCPServerDefinition,
  MCPTool,
  GrepAppConfig,
  GrepResult,
} from './types';
import { RateLimiter, MCPTimeoutError } from './types';
import { createLogger } from '../../utils/logger';

const z = tool.schema;

// GitHub API configuration
const GITHUB_API_BASE_URL = 'https://api.github.com';
const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RATE_LIMIT_DELAY = 1000; // 1 second between requests (GitHub rate limit)
const shouldLog = (): boolean =>
  process.env.ANTIGRAVITY_DEBUG === "1" ||
  process.env.DEBUG === "1" ||
  process.env.KRAKEN_LOG === "1";
const logger = createLogger("mcp-grep-app");

// Rate limiter for GitHub API
const githubRateLimiter = new RateLimiter(60, 60000); // 60 requests per minute (authenticated)

// Current configuration (set during initialization)
let currentConfig: GrepAppConfig = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT,
  maxResults: DEFAULT_MAX_RESULTS,
  rateLimitDelay: DEFAULT_RATE_LIMIT_DELAY,
  defaultExtensions: ['ts', 'js', 'tsx', 'jsx', 'py', 'java', 'go', 'rs'],
  defaultLanguages: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust'],
};

/**
 * Initialize the Grep App MCP server
 */
export async function initializeGrepAppMCP(config: Record<string, unknown> = {}): Promise<void> {
  currentConfig = {
    ...currentConfig,
    ...config,
  };

  // Validate API key
  if (!currentConfig.githubToken && !process.env.GITHUB_TOKEN) {
    if (shouldLog()) {
      logger.warn(
        "No GitHub token provided. Rate limits will be unauthenticated (60 requests/hour). " +
          "Set GITHUB_TOKEN environment variable or provide githubToken in config."
      );
    }
  }
}

/**
 * Perform GitHub code search
 */
async function searchGitHubCode(
  query: string,
  options: {
    language?: string;
    extension?: string;
    maxResults?: number;
    page?: number;
  } = {}
): Promise<GrepResult[]> {
  const githubToken = currentConfig.githubToken || process.env.GITHUB_TOKEN;

  try {
    // Wait for rate limiter
    await githubRateLimiter.waitIfNeeded();

    // Build search query
    let searchQuery = query;

    if (options.language) {
      searchQuery += ` language:${options.language}`;
    }
    if (options.extension) {
      searchQuery += ` extension:${options.extension}`;
    }

    // Prepare request headers
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'KrakenCode-GrepApp',
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    // Make API request
    const url = new URL(`${GITHUB_API_BASE_URL}/search/code`);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('per_page', String(options.maxResults ?? currentConfig.maxResults ?? DEFAULT_MAX_RESULTS));
    url.searchParams.append('page', String(options.page ?? 1));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(currentConfig.timeout ?? DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        throw new Error(`GitHub rate limit exceeded. Reset at ${rateLimitReset || 'unknown'}. Consider using GITHUB_TOKEN for higher limits.`);
      }
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();

    // Transform results
    const results: GrepResult[] = (data.items || []).map((item: any) => ({
      repository: item.repository?.full_name || 'unknown',
      path: item.path,
      language: item.language || item.repository?.language || 'unknown',
      matches: [], // Will be populated with file content
      url: item.html_url,
      score: item.score,
      metadata: {
        stars: item.repository?.stargazers_count,
        forks: item.repository?.forks_count,
        updatedAt: item.repository?.updated_at,
      },
    }));

    return results;

  } catch (error: unknown) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`GitHub code search failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get file content from GitHub
 */
async function getGitHubFile(
  owner: string,
  repo: string,
  path: string,
  options: {
    ref?: string;
  } = {}
): Promise<{ content: string; url: string; language: string }> {
  const githubToken = currentConfig.githubToken || process.env.GITHUB_TOKEN;

  try {
    // Wait for rate limiter
    await githubRateLimiter.waitIfNeeded();

    // Prepare request headers
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'KrakenCode-GrepApp',
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    // Make API request
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${path}${options.ref ? `?ref=${options.ref}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(currentConfig.timeout ?? DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${owner}/${repo}/${path}`);
      }
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        throw new Error(`GitHub rate limit exceeded. Reset at ${rateLimitReset || 'unknown'}. Consider using GITHUB_TOKEN for higher limits.`);
      }
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }

    const content = await response.text();
    const language = inferLanguageFromPath(path);
    const fileUrl = `https://github.com/${owner}/${repo}/blob/${options.ref || 'main'}/${path}`;

    return {
      content,
      url: fileUrl,
      language,
    };

  } catch (error: unknown) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get GitHub file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Infer language from file path
 */
function inferLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    py: 'Python',
    java: 'Java',
    go: 'Go',
    rs: 'Rust',
    c: 'C',
    cpp: 'C++',
    h: 'C',
    hpp: 'C++',
    rb: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kt: 'Kotlin',
    scala: 'Scala',
    cs: 'C#',
    sh: 'Shell',
    bash: 'Shell',
    zsh: 'Shell',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    md: 'Markdown',
  };

  return languageMap[ext || ''] || 'unknown';
}

/**
 * Parse repository from URL
 */
function parseRepositoryFromUrl(url: string): { owner: string; repo: string; path: string } | null {
  try {
    const githubUrl = new URL(url);
    const parts = githubUrl.pathname.split('/').filter(Boolean);

    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace('.git', '');
      const path = parts.slice(2).join('/');

      return { owner, repo, path };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Grep search tool
 */
const grepSearchTool = tool({
  description: 'search code across public GitHub repositories. Returns matching files with repository information.',
  args: {
    query: z.string().describe('Search query (supports GitHub code search syntax)'),
    language: z.string().optional().describe('Filter by programming language (e.g., "TypeScript", "Python")'),
    extension: z.string().optional().describe('Filter by file extension (e.g., "ts", "js", "py")'),
    maxResults: z.number().min(1).max(30).optional().default(DEFAULT_MAX_RESULTS).describe('Number of results to return'),
    page: z.number().min(1).optional().default(1).describe('Page number for pagination'),
  },
  async execute(args) {
    try {
      const results = await searchGitHubCode(args.query, {
        language: args.language,
        extension: args.extension,
        maxResults: args.maxResults,
        page: args.page,
      });

      return JSON.stringify({
        query: args.query,
        language: args.language,
        extension: args.extension,
        results,
        totalResults: results.length,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`GitHub search timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Grep get file tool
 */
const grepGetFileTool = tool({
  description: 'Fetch file content from a GitHub repository. Can fetch individual files from search results.',
  args: {
    owner: z.string().describe('Repository owner (e.g., "facebook", "microsoft")'),
    repo: z.string().describe('Repository name (e.g., "react", "typescript")'),
    path: z.string().describe('File path (e.g., "src/index.ts", "README.md")'),
    ref: z.string().optional().describe('Git reference (branch, tag, or commit, defaults to "main")'),
  },
  async execute(args) {
    try {
      const result = await getGitHubFile(args.owner, args.repo, args.path, {
        ref: args.ref,
      });

      return JSON.stringify({
        owner: args.owner,
        repo: args.repo,
        path: args.path,
        ref: args.ref,
        content: result.content,
        url: result.url,
        language: result.language,
      }, null, 2);
    } catch (error: unknown) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`GitHub file fetch timeout: ${error.message}`);
      }
      throw error;
    }
  },
});

/**
 * Export search tool with MCP metadata
 */
export const grepSearchToolMCP: MCPTool = {
  ...grepSearchTool,
  serverName: 'grep_app',
  category: 'code',
  rateLimit: 60, // 60 requests per minute (authenticated)
};

/**
 * Export get file tool with MCP metadata
 */
export const grepGetFileToolMCP: MCPTool = {
  ...grepGetFileTool,
  serverName: 'grep_app',
  category: 'code',
  rateLimit: 60, // 60 requests per minute (authenticated)
};

/**
 * Grep App MCP Server Definition
 */
export const grepAppMCP: MCPServerDefinition = {
  name: 'grep_app',
  description: 'Search across public GitHub repositories with support for file content fetching',
  version: '1.0.0',
  tools: [grepSearchToolMCP, grepGetFileToolMCP],
  configSchema: {
    githubToken: 'string (optional, GitHub personal access token)',
    timeout: 'number (ms, default: 30000)',
    maxResults: 'number (1-30, default: 10)',
    rateLimitDelay: 'number (ms, default: 1000)',
    defaultExtensions: 'array of strings (default: ["ts", "js", "tsx", "jsx", "py", "java", "go", "rs"])',
    defaultLanguages: 'array of strings (default: ["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust"])',
    enabled: 'boolean (default: true)',
  },
  initialize: async (config: Record<string, unknown>) => {
    await initializeGrepAppMCP(config);
  },
  shutdown: async () => {
    // Cleanup if needed
    githubRateLimiter.reset();
  },
  healthCheck: async () => {
    // Always functional (works without token but with lower rate limits)
    return currentConfig.enabled !== false;
  },
};
