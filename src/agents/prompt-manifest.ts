/**
 * Prompt Manifest Lookup Module
 * Provides access to compressed prompt storage.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const MANIFEST_PATH = path.join(__dirname, '../compression/data/prompt_manifest.json')
const CACHE = new Map<string, string>()

/**
 * Get prompt by hash key from manifest
 * This loads compressed prompts on demand
 */
export function getPromptByHash(hashKey: string): string {
  // Check cache first
  if (CACHE.has(hashKey)) {
    return CACHE.get(hashKey)!
  }

  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    const promptData = manifest.prompts[hashKey]
    if (!promptData) {
      throw new Error(`Prompt not found for hash: ${hashKey}`)
    }

    const prompt = promptData.content

    // Cache the result
    CACHE.set(hashKey, prompt)

    return prompt
  } catch (error) {
    throw new Error(`Failed to load prompt manifest: ${error}`)
  }
}

/**
 * Get prompt metadata by hash key
 */
export function getPromptMetadata(hashKey: string): {
  name?: string
  estimatedTokens?: number
  sourceFile?: string
} {
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    const promptData = manifest.prompts[hashKey]
    if (!promptData) {
      return {}
    }

    return {
      name: promptData.name,
      estimatedTokens: promptData.estimated_tokens,
      sourceFile: promptData.source_file,
    }
  } catch (error) {
    throw new Error(`Failed to load prompt metadata: ${error}`)
  }
}

/**
 * Preload frequently used prompts into cache
 */
export function preloadCache(keys: string[]): void {
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    for (const key of keys) {
      if (manifest.prompts[key]) {
        CACHE.set(key, manifest.prompts[key].content)
      }
    }
  } catch (error) {
    console.error(`Failed to preload cache: ${error}`)
  }
}

// Preload common prompts on module load
preloadCache([
  '247d', // ORACLE
  '03f3', // METIS
  'b2fc', // MOMUS
  'a899', // KRAKEN
  '5432', // PROMETHEUS
  'f9a5', // PLAN
  '3cbb', // KRAKEN_JUNIOR
  '32ad', // CONTINUATION
  'e01b', // SUMMARIZE_CONTEXT
  '33dd', // KRAKEN_CONTINUATION
  '319d', // ANTIGRAVITY
  '0cc1', // MAELSTROM
  'f97d', // BUILD_SYSTEM
])
