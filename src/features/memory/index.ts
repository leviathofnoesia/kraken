import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { KrakenMemory } from '@kraken-code/memory'
import type { NodeType } from '@kraken-code/memory'
import { createLogger } from '../../utils/logger'

const logger = createLogger('memory')

let memInstance: KrakenMemory | null = null

export async function getMemory(): Promise<KrakenMemory> {
  if (!memInstance) {
    memInstance = new KrakenMemory()
    await memInstance.init()
  }
  return memInstance
}

export async function closeMemory(): Promise<void> {
  if (memInstance) {
    memInstance.close()
    memInstance = null
  }
}

export const memoryAddNode = tool({
  description:
    'Add a knowledge node to the memory graph. Use this to store facts, concepts, patterns, decisions, ' +
    'procedures, errors, references, and experiences for later retrieval.',
  args: {
    id: z.string().min(1).describe('Unique identifier for the node'),
    title: z.string().min(1).describe('Short descriptive title'),
    content: z.string().default('').describe('Full content/details'),
    type: z
      .enum([
        'concept',
        'fact',
        'procedure',
        'pattern',
        'decision',
        'error',
        'reference',
        'experience',
      ])
      .default('concept')
      .describe('Node type'),
    tags: z.array(z.string()).default([]).describe('Tags for categorization'),
    sources: z.array(z.string()).default([]).describe('Source URLs or references'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const node = mem.addNode({
        id: args.id,
        title: args.title,
        content: args.content ?? '',
        type: (args.type ?? 'concept') as NodeType,
        tags: args.tags ?? [],
        sources: args.sources ?? [],
        metadata: {},
      })
      return JSON.stringify({ success: true, node })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('memoryAddNode failed:', msg)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryGetNode = tool({
  description: 'Retrieve a knowledge node by its ID.',
  args: {
    id: z.string().min(1).describe('Node ID to retrieve'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const node = mem.getNode(args.id)
      if (!node) return JSON.stringify({ error: 'Node not found' })
      return JSON.stringify(node)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memorySearchNodes = tool({
  description:
    'Search knowledge nodes by text query. Searches across titles, content, and tags. ' +
    'Returns ranked results with relevance scores.',
  args: {
    text: z.string().min(1).describe('Search text'),
    types: z.array(z.string()).optional().describe('Filter by node types'),
    limit: z.number().default(20).describe('Maximum results to return'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const results = mem.searchNodes({
        text: args.text,
        types: args.types as NodeType[] | undefined,
        limit: args.limit ?? 20,
      })
      return JSON.stringify(results)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryLinkNodes = tool({
  description:
    'Create a directed relationship between two knowledge nodes. Use to build a connected knowledge graph.',
  args: {
    sourceId: z.string().min(1).describe('Source node ID'),
    targetId: z.string().min(1).describe('Target node ID'),
    relation: z
      .string()
      .min(1)
      .describe('Relationship type (e.g., "related_to", "depends_on", "derived_from")'),
    strength: z.number().min(0).max(1).default(1.0).describe('Edge strength (0-1)'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const edge = mem.linkNodes(args.sourceId, args.targetId, args.relation, args.strength ?? 1.0)
      if (!edge)
        return JSON.stringify({ error: 'Failed to create edge — check both node IDs exist' })
      return JSON.stringify({ success: true, edge })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryGetConnected = tool({
  description: 'Get all nodes connected to a given node via graph edges.',
  args: {
    nodeId: z.string().min(1).describe('Node ID to find connections for'),
    direction: z
      .enum(['outgoing', 'incoming', 'both'])
      .default('both')
      .describe('Edge direction to follow'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const connections = mem.graph.getConnectedNodes(args.nodeId, args.direction ?? 'both')
      return JSON.stringify(connections)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryDeleteNode = tool({
  description: 'Delete a knowledge node and all its edges from the graph.',
  args: {
    id: z.string().min(1).describe('Node ID to delete'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const deleted = mem.graph.deleteNode(args.id)
      if (!deleted) return JSON.stringify({ error: 'Node not found' })
      return JSON.stringify({ success: true, deleted: args.id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryStats = tool({
  description:
    'Get knowledge graph statistics: node count, edge count, types, average connections, orphans.',
  args: {
    _unused: z.boolean().optional().describe('No arguments needed'),
  },
  async execute(_args) {
    try {
      const mem = await getMemory()
      const stats = mem.graph.getStats()
      return JSON.stringify(stats)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryCompress = tool({
  description:
    'Compress text using AAAK dictionary compression. Returns compressed text with a decompression dictionary.',
  args: {
    text: z.string().min(1).describe('Text to compress'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const result = mem.compressText(args.text)
      return JSON.stringify(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})

export const memoryDecompress = tool({
  description: 'Decompress AAAK-compressed text back to its original form.',
  args: {
    compressed: z.string().min(1).describe('Compressed text'),
    dictionary: z
      .record(z.string(), z.string())
      .describe('Decompression dictionary (code -> original token)'),
  },
  async execute(args) {
    try {
      const mem = await getMemory()
      const text = mem.decompressText(args.compressed, args.dictionary)
      return JSON.stringify({ text })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  },
})
