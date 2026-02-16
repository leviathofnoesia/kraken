/**
 * Smart Context Injection Hook
 *
 * Provides relevance-based context injection instead of full file injection.
 * Uses TF-IDF scoring to select the most relevant chunks from AGENTS.md,
 * README.md, and other documentation files.
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { SHOULD_LOG, createLogger } from '../../utils/logger'

const logger = createLogger('smart-context-injection')

export interface SmartContextInjectionConfig {
  enabled?: boolean
  maxTokens?: number // Maximum tokens for injected context
  chunkSize?: number // Size of text chunks for scoring
  minRelevanceScore?: number // Minimum score to include a chunk
  filePatterns?: string[] // Files to consider for context
}

const DEFAULT_CONFIG = {
  enabled: true,
  maxTokens: 2000,
  chunkSize: 500,
  minRelevanceScore: 0.1,
  filePatterns: ['AGENTS.md', 'README.md', 'CONTRIBUTING.md'],
}

// Cache for file contents and chunks
interface CachedFile {
  content: string
  chunks: string[]
  lastModified: number
}

const fileCache = new Map<string, CachedFile>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Simple tokenizer
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

/**
 * Calculate term frequency
 */
function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  const total = tokens.length

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }

  // Normalize by total
  for (const [key, value] of tf) {
    tf.set(key, value / total)
  }

  return tf
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(chunks: string[]): Map<string, number> {
  const idf = new Map<string, number>()
  const N = chunks.length

  // Get all unique tokens
  const allTokens = new Set<string>()
  const docFrequency = new Map<string, number>()

  for (const chunk of chunks) {
    const tokens = tokenize(chunk)
    const uniqueTokens = new Set(tokens)

    for (const token of uniqueTokens) {
      allTokens.add(token)
      docFrequency.set(token, (docFrequency.get(token) || 0) + 1)
    }
  }

  // Calculate IDF
  for (const token of allTokens) {
    const df = docFrequency.get(token) || 1
    idf.set(token, Math.log(N / df))
  }

  return idf
}

/**
 * Calculate TF-IDF score for a chunk
 */
function calculateTFIDF(
  chunk: string,
  query: string,
  idf: Map<string, number>,
): number {
  const chunkTokens = tokenize(chunk)
  const queryTokens = tokenize(query)

  const chunkTF = calculateTF(chunkTokens)

  let score = 0
  for (const queryToken of queryTokens) {
    const tf = chunkTF.get(queryToken) || 0
    const idfValue = idf.get(queryToken) || 0
    score += tf * idfValue
  }

  return score
}

/**
 * Split text into chunks
 */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  const lines = text.split('\n')
  let currentChunk: string[] = []
  let currentSize = 0

  for (const line of lines) {
    currentChunk.push(line)
    currentSize += line.length

    if (currentSize >= chunkSize) {
      chunks.push(currentChunk.join('\n'))
      currentChunk = []
      currentSize = 0
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'))
  }

  return chunks
}

/**
 * Load and cache a file
 */
async function loadFile(filePath: string): Promise<CachedFile | null> {
  // Check cache first
  const cached = fileCache.get(filePath)
  if (cached && Date.now() - cached.lastModified < CACHE_TTL) {
    return cached
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const chunks = chunkText(content, DEFAULT_CONFIG.chunkSize)

    const cachedFile: CachedFile = {
      content,
      chunks,
      lastModified: Date.now(),
    }

    // Update cache
    fileCache.set(filePath, cachedFile)

    // Limit cache size
    if (fileCache.size > 20) {
      const oldestKey = fileCache.keys().next().value
      if (oldestKey) {
        fileCache.delete(oldestKey)
      }
    }

    return cachedFile
  } catch {
    return null
  }
}

/**
 * Get relevant context chunks
 */
async function getRelevantContext(
  query: string,
  maxTokens: number,
): Promise<string> {
  const config = DEFAULT_CONFIG

  // Find all relevant files
  const relevantFiles: { file: CachedFile; path: string }[] = []

  for (const pattern of config.filePatterns) {
    // Try to find the file in common locations
    const possiblePaths = [
      path.resolve(process.cwd(), pattern),
      path.resolve(process.cwd(), 'docs', pattern),
      path.resolve(process.cwd(), '.claude', pattern),
    ]

    for (const filePath of possiblePaths) {
      const file = await loadFile(filePath)
      if (file) {
        relevantFiles.push({ file, path: filePath })
        break
      }
    }
  }

  if (relevantFiles.length === 0) {
    return ''
  }

  // Collect all chunks
  const allChunks: { chunk: string; source: string }[] = []
  for (const { file: cachedFile, path: filePath } of relevantFiles) {
    for (const chunk of cachedFile.chunks) {
      allChunks.push({ chunk, source: path.basename(filePath) })
    }
  }

  if (allChunks.length === 0) {
    return ''
  }

  // Calculate IDF across all chunks
  const allChunkTexts = allChunks.map((c) => c.chunk)
  const idf = calculateIDF(allChunkTexts)

  // Score each chunk
  const scoredChunks = allChunks.map(({ chunk, source }) => ({
    chunk,
    source,
    score: calculateTFIDF(chunk, query, idf),
  }))

  // Filter by minimum score and sort by score descending
  const relevantChunks = scoredChunks
    .filter((c) => c.score >= config.minRelevanceScore)
    .sort((a, b) => b.score - a.score)

  // Select chunks until we reach maxTokens
  const selectedChunks: string[] = []
  let totalTokens = 0

  for (const { chunk, source } of relevantChunks) {
    const chunkTokens = Math.ceil(chunk.split(/\s+/).length * 1.3)

    if (totalTokens + chunkTokens > maxTokens) {
      continue
    }

    selectedChunks.push(`[${source}]\n${chunk}`)
    totalTokens += chunkTokens
  }

  return selectedChunks.join('\n\n---\n\n')
}

/**
 * Process user message to inject smart context
 */
async function processUserMessage(
  input: any,
  config: typeof DEFAULT_CONFIG,
): Promise<any> {
  if (!config.enabled) {
    return input
  }

  try {
    // Get the user message
    const messages = input.messages || []
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage || lastMessage.role !== 'user') {
      return input
    }

    // Extract text content
    let promptText = ''
    if (typeof lastMessage.content === 'string') {
      promptText = lastMessage.content
    } else if (Array.isArray(lastMessage.content)) {
      promptText = lastMessage.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n')
    }

    if (!promptText || promptText.length < 50) {
      return input
    }

    // Get relevant context
    const relevantContext = await getRelevantContext(promptText, config.maxTokens)

    if (!relevantContext) {
      return input
    }

    // Prepend context to the message
    const contextHeader = '<!-- Relevant Context -->\n'
    const contextText = contextHeader + relevantContext

    if (typeof lastMessage.content === 'string') {
      lastMessage.content = contextText + '\n\n' + lastMessage.content
    } else if (Array.isArray(lastMessage.content)) {
      // Insert as first text part
      lastMessage.content = [
        { type: 'text', text: contextText },
        ...lastMessage.content,
      ]
    }

    // Add metadata
    if (!input.metadata) {
      input.metadata = {}
    }
    input.metadata.smartContextInjected = true
    input.metadata.contextTokens = Math.ceil(relevantContext.split(/\s+/).length * 1.3)

    if (SHOULD_LOG) {
      logger.debug(`Smart context injected: ${input.metadata.contextTokens} tokens`)
    }
  } catch (error) {
    logger.error('Error in smart context injection:', error)
  }

  return input
}

/**
 * Create smart context injection hook
 */
export function createSmartContextInjectionHook(
  _input: PluginInput,
  options?: { config?: SmartContextInjectionConfig },
): Hooks {
  const config = { ...DEFAULT_CONFIG, ...options?.config }

  return {
    'chat.params': async (input: any, output: any) => {
      if (!config.enabled) return

      // Inject smart context
      await processUserMessage(input, config)

      return
    },
  }
}

/**
 * Create base hook using standard pattern
 */
export function createHook(
  input: PluginInput,
  options?: { config?: SmartContextInjectionConfig },
): Hooks {
  return createSmartContextInjectionHook(input, options)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'smart-context-injection',
  priority: 30, // Run early
  description: 'Injects relevant context based on TF-IDF scoring',
}

/**
 * Clear file cache
 */
export function clearFileCache(): void {
  fileCache.clear()
}
