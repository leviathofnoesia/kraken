/**
 * Prompt Compression Hook
 *
 * Automatically compresses prompts that exceed a configurable token threshold.
 * Uses the existing Python compression infrastructure via CLI.
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { SHOULD_LOG, createLogger } from '../../utils/logger'

const execFileAsync = promisify(execFile)
const logger = createLogger('prompt-compression')

export interface PromptCompressionConfig {
  enabled?: boolean
  threshold?: number // Token count above which compression is applied
  level?: 'cache_hit' | 'partial' | 'full'
  excludePatterns?: string[] // Patterns to exclude from compression
}

const DEFAULT_CONFIG: Required<PromptCompressionConfig> = {
  enabled: true,
  threshold: 2000,
  level: 'partial',
  excludePatterns: [
    '```', // Code blocks
    '^^^', // Thinking blocks
  ],
}

// Cache for compression results
const compressionCache = new Map<string, { compressed: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough approximation: words * 1.3 + special characters adjustment
  const words = text.split(/\s+/).length
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length
  return Math.ceil(words * 1.3 + specialChars * 0.5)
}

/**
 * Check if text should be excluded from compression
 */
function shouldExclude(text: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (text.includes(pattern)) {
      return true
    }
  }
  return false
}

/**
 * Get cache key for text
 */
function getCacheKey(text: string): string {
  // Simple hash for cache key
  let hash = 0
  for (let i = 0; i < Math.min(text.length, 500); i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

/**
 * Get cached compression result
 */
function getCachedResult(key: string): string | null {
  const cached = compressionCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.compressed
  }
  compressionCache.delete(key)
  return null
}

/**
 * Cache compression result
 */
function cacheResult(key: string, compressed: string): void {
  // Evict old entries if cache is full
  if (compressionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = compressionCache.keys().next().value
    if (oldestKey) {
      compressionCache.delete(oldestKey)
    }
  }
  compressionCache.set(key, { compressed, timestamp: Date.now() })
}

/**
 * Resolve Python binary path
 */
async function resolvePythonBinary(): Promise<string | null> {
  const commands = process.platform === 'win32'
    ? [['where', 'python3'], ['where', 'python']]
    : [['which', 'python3'], ['which', 'python']]

  for (const [locator, name] of commands) {
    try {
      const { stdout } = await execFileAsync(locator, [name], { timeout: 5000 })
      if (stdout.trim()) {
        return stdout.trim().split('\n')[0]?.trim() ?? null
      }
    } catch {
      // Continue to next option
    }
  }
  return null
}

/**
 * Run compression using Python CLI
 */
async function runCompression(prompt: string, level: string): Promise<{ success: boolean; compressed?: string; error?: string }> {
  const compressionDir = path.resolve(__dirname, '..', '..', 'compression')

  try {
    const pythonBinary = await resolvePythonBinary()
    if (!pythonBinary) {
      return { success: false, error: 'Python not found' }
    }

    const { stdout, stderr } = await execFileAsync(
      pythonBinary,
      [path.join(compressionDir, 'cli.py'), 'compress', prompt],
      {
        cwd: compressionDir,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      },
    )

    if (stderr && !stdout) {
      throw new Error(stderr)
    }

    const result = JSON.parse(stdout)

    if (result.error) {
      throw new Error(result.error)
    }

    return {
      success: true,
      compressed: result.decompressed_text || prompt,
    }
  } catch (error) {
    logger.error('Compression failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Compress a prompt if it exceeds the threshold
 */
async function compressPromptIfNeeded(
  prompt: string,
  config: Required<PromptCompressionConfig>,
): Promise<{ original: string; compressed: string; wasCompressed: boolean }> {
  const tokenCount = estimateTokens(prompt)

  // Don't compress if under threshold
  if (tokenCount < config.threshold) {
    return { original: prompt, compressed: prompt, wasCompressed: false }
  }

  // Check for exclusion patterns
  if (shouldExclude(prompt, config.excludePatterns)) {
    return { original: prompt, compressed: prompt, wasCompressed: false }
  }

  // Check cache first
  const cacheKey = getCacheKey(prompt)
  const cached = getCachedResult(cacheKey)
  if (cached) {
    return { original: prompt, compressed: cached, wasCompressed: true }
  }

  // Run compression
  const result = await runCompression(prompt, config.level)

  if (result.success && result.compressed) {
    cacheResult(cacheKey, result.compressed)

    if (SHOULD_LOG) {
      const originalTokens = estimateTokens(prompt)
      const compressedTokens = estimateTokens(result.compressed)
      const ratio = ((originalTokens - compressedTokens) / originalTokens * 100).toFixed(1)
      logger.debug(`Compressed prompt: ${originalTokens} → ${compressedTokens} tokens (${ratio}% saved)`)
    }

    return { original: prompt, compressed: result.compressed, wasCompressed: true }
  }

  // Fallback to original if compression fails
  return { original: prompt, compressed: prompt, wasCompressed: false }
}

/**
 * Process chat params to compress prompts
 */
async function processChatParams(
  input: any,
  config: Required<PromptCompressionConfig>,
): Promise<any> {
  if (!config.enabled) {
    return input
  }

  try {
    // Get the last user message as the prompt to compress
    const messages = input.messages || []
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage || lastMessage.role !== 'user') {
      return input
    }

    // Extract text content from message
    let promptText = ''
    if (typeof lastMessage.content === 'string') {
      promptText = lastMessage.content
    } else if (Array.isArray(lastMessage.content)) {
      promptText = lastMessage.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n')
    }

    if (!promptText || promptText.length < 100) {
      return input
    }

    const tokenCount = estimateTokens(promptText)

    // Skip if under threshold
    if (tokenCount < config.threshold) {
      return input
    }

    // Compress the prompt
    const { compressed, wasCompressed } = await compressPromptIfNeeded(promptText, config)

    if (wasCompressed && compressed !== promptText) {
      // Update the message content
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = compressed
      } else if (Array.isArray(lastMessage.content)) {
        lastMessage.content = lastMessage.content.map((c: any) => {
          if (c.type === 'text') {
            return { ...c, text: compressed }
          }
          return c
        })
      }

      // Add metadata about compression
      if (!input.metadata) {
        input.metadata = {}
      }
      input.metadata.promptCompressed = true
      input.metadata.originalTokens = tokenCount
      input.metadata.compressedTokens = estimateTokens(compressed)

      if (SHOULD_LOG) {
        logger.debug(`Prompt compressed: ${tokenCount} → ${estimateTokens(compressed)} tokens`)
      }
    }
  } catch (error) {
    logger.error('Error in prompt compression:', error)
  }

  return input
}

/**
 * Create prompt compression hook
 */
export function createPromptCompressionHook(
  _input: PluginInput,
  options?: { config?: PromptCompressionConfig },
): Hooks {
  const config = { ...DEFAULT_CONFIG, ...options?.config }

  return {
    'chat.params': async (input: any, output: any) => {
      if (!config.enabled) return

      // Process and potentially compress the prompt
      await processChatParams(input, config)

      // Continue with the modified input
      return
    },
  }
}

/**
 * Create base hook using standard pattern
 */
export function createHook(input: PluginInput, options?: { config?: PromptCompressionConfig }): Hooks {
  return createPromptCompressionHook(input, options)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'prompt-compression',
  priority: 50, // Run after other hooks
  description: 'Automatically compresses large prompts to save tokens',
}

/**
 * Clear compression cache
 */
export function clearCompressionCache(): void {
  compressionCache.clear()
}

/**
 * Get compression cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number; ttl: number } {
  return {
    size: compressionCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL,
  }
}
