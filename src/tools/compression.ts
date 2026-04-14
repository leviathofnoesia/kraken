import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import {
  LLMTLDRCompressor,
  estimateTokenCount,
  estimateBleuDrop,
} from '../compression/ocx-compress'
import { getJournal } from '../compression/prompt-journal'
import { getRouter } from '../router'

const compressor = new LLMTLDRCompressor()

export interface CompressionResult {
  success: boolean
  compressed?: string
  metadata?: {
    originalTokens: number
    decompressedTokens: number
    tokenChangePercent: number
    compressionRatio?: number
    bleuDrop?: number
  }
  error?: string
}

export const opencodeXCompress = tool({
  description:
    'Compress prompts using LLM-TLDR algorithm (5x compression, <2% quality loss). ' +
    'Uses dictionary-based compression with CRC64 caching for repeated prompts. ' +
    'Optimized for cost reduction on API calls while maintaining output quality.',
  args: {
    text: z.string().describe('Text to compress'),
    level: z
      .enum(['cache_hit', 'partial', 'full'])
      .default('partial')
      .describe(
        'Compression level: cache_hit (return cached if available), partial (light compression), full (maximum compression)',
      ),
  },
  async execute(args): Promise<string> {
    const { text, level } = args as { text: string; level: string }

    if (!text || text.trim().length === 0) {
      return JSON.stringify({
        success: false,
        error: 'Empty text provided',
      })
    }

    if (level === 'cache_hit') {
      const journal = getJournal()
      const cached = journal.checkRepeat(text)
      if (cached) {
        return JSON.stringify({
          success: true,
          compressed: text,
          cached: true,
          cacheInfo: cached,
        })
      }
    }

    try {
      const decompressed = compressor.roundTrip(text)

      const originalTokens = estimateTokenCount(text)
      const decompressedTokens = estimateTokenCount(decompressed)
      const compressedBuf = compressor.compress(text)
      const ratio = originalTokens > 0 ? originalTokens / (compressedBuf.length / 4) : 0
      const bleuDrop = estimateBleuDrop(text, decompressed)

      const tokenChangePercent =
        originalTokens > 0 ? ((decompressedTokens - originalTokens) / originalTokens) * 100 : 0

      const result: CompressionResult = {
        success: true,
        compressed: decompressed,
        metadata: {
          originalTokens: Math.round(originalTokens),
          decompressedTokens: Math.round(decompressedTokens),
          tokenChangePercent: Math.round(tokenChangePercent * 100) / 100,
          compressionRatio: Math.round(ratio * 100) / 100,
          bleuDrop: Math.round(bleuDrop * 100) / 100,
        },
      }

      const journal = getJournal()
      journal.recordPrompt(text, { level, ratio, bleuDrop })

      return JSON.stringify(result, null, 2)
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
})

export { estimateTokenCount }
