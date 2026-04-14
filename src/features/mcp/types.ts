/**
 * MCP (Model Context Protocol) Types and Interfaces
 *
 * This file defines shared types and interfaces for all built-in MCP servers.
 */

import type { ToolDefinition } from '@opencode-ai/plugin';

/**
 * Base MCP Server Configuration
 */
export interface BaseMCPConfig {
  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable/disable this MCP server
   */
  enabled?: boolean;
}

/**
 * MCP Tool Definition
 * Extends the standard Tool interface with MCP-specific metadata
 */
export interface MCPTool extends ToolDefinition {
  /**
   * MCP server name
   */
  serverName: string;

  /**
   * Tool category for organization
   */
  category: 'search' | 'documentation' | 'code' | 'utility';

  /**
   * Rate limit (max requests per minute)
   */
  rateLimit?: number;
}

/**
 * MCP Server Definition
 * Defines a complete MCP server with its tools and configuration
 */
export interface MCPServerDefinition {
  /**
   * Server identifier (e.g., 'websearch', 'context7', 'grep_app')
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Server version
   */
  version: string;

  /**
   * Tools provided by this server
   */
  tools: MCPTool[];

  /**
   * Server configuration schema
   */
  configSchema?: Record<string, unknown>;

  /**
   * Initialize the server
   */
  initialize?: (config: Record<string, unknown>) => Promise<void>;

  /**
   * Cleanup/shutdown the server
   */
  shutdown?: () => Promise<void>;

  /**
   * Health check
   */
  healthCheck?: () => Promise<boolean>;
}

/**
 * Websearch MCP Configuration
 */
export interface WebsearchConfig extends BaseMCPConfig {
  /**
   * Default number of search results
   */
  numResults?: number;

  /**
   * Live crawl mode: 'fallback' or 'preferred'
   */
  livecrawl?: 'fallback' | 'preferred';

  /**
   * Search type: 'auto', 'fast', or 'deep'
   */
  searchType?: 'auto' | 'fast' | 'deep';

  /**
   * Maximum context characters
   */
  contextMaxCharacters?: number;
}

/**
 * Websearch Result
 */
export interface WebsearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

/**
 * Context7 MCP Configuration
 */
export interface Context7Config extends BaseMCPConfig {
  /**
   * Cache TTL in seconds
   */
  cacheTTL?: number;

  /**
   * Maximum tokens for results
   */
  maxTokens?: number;

  /**
   * Number of results to return
   */
  numResults?: number;
}

/**
 * Documentation Search Result
 */
export interface DocumentationResult {
  library: string;
  version: string;
  content: string;
  url: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

/**
 * Grep App MCP Configuration
 */
export interface GrepAppConfig extends BaseMCPConfig {
  /**
   * GitHub personal access token
   */
  githubToken?: string;

  /**
   * Maximum number of results
   */
  maxResults?: number;

  /**
   * Rate limit delay between requests (ms)
   */
  rateLimitDelay?: number;

  /**
   * Default file extensions to search
   */
  defaultExtensions?: string[];

  /**
   * Default languages to search
   */
  defaultLanguages?: string[];
}

/**
 * GitHub Search Result
 */
export interface GrepResult {
  repository: string;
  path: string;
  language: string;
  matches: string[];
  url: string;
  score?: number;
  metadata?: {
    stars?: number;
    forks?: number;
    updatedAt?: string;
  };
}

/**
 * MCP Error Types
 */
export class MCPError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPRateLimitError extends MCPError {
  constructor(message: string, public readonly retryAfter?: number) {
    super('RATE_LIMIT', message, { retryAfter });
    this.name = 'MCPRateLimitError';
  }
}

export class MCPAuthenticationError extends MCPError {
  constructor(message: string) {
    super('AUTHENTICATION', message);
    this.name = 'MCPAuthenticationError';
  }
}

export class MCPTimeoutError extends MCPError {
  constructor(message: string, public readonly timeout?: number) {
    super('TIMEOUT', message, { timeout });
    this.name = 'MCPTimeoutError';
  }
}

/**
 * Rate limiter utility for MCP tools
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(private readonly maxRequests: number, private readonly windowMs: number) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    // Remove requests outside the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }

  reset(): void {
    this.requests = [];
  }
}
