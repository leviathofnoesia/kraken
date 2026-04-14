import { z } from 'zod'
import { KrakenMemory } from '../kraken-memory'
import type { NodeType } from '../graph/types'

export interface KrakenMemoryMCPServer {
  name: string
  version: string
  tools: MCPMemoryTool[]
  init(dbPath?: string): Promise<void>
  close(): void
  handleToolCall(name: string, args: Record<string, unknown>): Promise<string>
}

export interface MCPMemoryTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export class KrakenMemoryMCP implements KrakenMemoryMCPServer {
  name = 'kraken-memory'
  version = '0.1.0'
  private mem!: KrakenMemory
  private dbPath?: string

  get tools(): MCPMemoryTool[] {
    return TOOL_DEFINITIONS
  }

  async init(dbPath?: string): Promise<void> {
    this.dbPath = dbPath
    this.mem = new KrakenMemory()
    await this.mem.init(dbPath ? { dbPath } : undefined)
  }

  close(): void {
    this.mem?.close()
  }

  async save(): Promise<void> {
    if (this.dbPath) {
      await this.mem.save(this.dbPath)
    }
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
    try {
      switch (toolName) {
        case 'memory_add_node':
          return await this.handleAddNode(args)
        case 'memory_get_node':
          return this.handleGetNode(args)
        case 'memory_update_node':
          return await this.handleUpdateNode(args)
        case 'memory_delete_node':
          return this.handleDeleteNode(args)
        case 'memory_search_nodes':
          return this.handleSearchNodes(args)
        case 'memory_link_nodes':
          return await this.handleLinkNodes(args)
        case 'memory_get_connected':
          return this.handleGetConnected(args)
        case 'memory_graph_stats':
          return this.handleGraphStats()
        case 'memory_list_nodes':
          return this.handleListNodes(args)
        case 'memory_create_wing':
          return await this.handleCreateWing(args)
        case 'memory_create_room':
          return await this.handleCreateRoom(args)
        case 'memory_create_hall':
          return await this.handleCreateHall(args)
        case 'memory_place_node':
          return await this.handlePlaceNode(args)
        case 'memory_locate_node':
          return this.handleLocateNode(args)
        case 'memory_index_vector':
          return this.handleIndexVector(args)
        case 'memory_search_vectors':
          return this.handleSearchVectors(args)
        case 'memory_compress':
          return this.handleCompress(args)
        case 'memory_decompress':
          return this.handleDecompress(args)
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: msg })
    }
  }

  private async handleAddNode(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      content: z.string().default(''),
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
        .default('concept'),
      tags: z.array(z.string()).default([]),
      sources: z.array(z.string()).default([]),
      metadata: z.record(z.unknown()).default({}),
    })
    const params = schema.parse(args)
    const node = this.mem.addNode({
      id: params.id,
      title: params.title,
      content: params.content ?? '',
      type: (params.type ?? 'concept') as NodeType,
      tags: params.tags ?? [],
      sources: params.sources ?? [],
      metadata: (params.metadata ?? {}) as Record<string, unknown>,
    })
    await this.save()
    return JSON.stringify(node)
  }

  private handleGetNode(args: Record<string, unknown>): string {
    const { id } = z.object({ id: z.string().min(1) }).parse(args)
    const node = this.mem.getNode(id)
    return JSON.stringify(node ?? { error: 'Node not found' })
  }

  private async handleUpdateNode(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      id: z.string().min(1),
      title: z.string().optional(),
      content: z.string().optional(),
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
        .optional(),
      tags: z.array(z.string()).optional(),
      sources: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    const params = schema.parse(args)
    const { id, ...updates } = params
    const node = this.mem.graph.updateNode(id, {
      ...updates,
      type: updates.type as NodeType | undefined,
    })
    if (!node) return JSON.stringify({ error: 'Node not found' })
    await this.save()
    return JSON.stringify(node)
  }

  private async handleDeleteNode(args: Record<string, unknown>): Promise<string> {
    const { id } = z.object({ id: z.string().min(1) }).parse(args)
    const deleted = this.mem.graph.deleteNode(id)
    if (!deleted) return JSON.stringify({ error: 'Node not found' })
    await this.save()
    return JSON.stringify({ deleted: true, id })
  }

  private handleSearchNodes(args: Record<string, unknown>): string {
    const schema = z.object({
      text: z.string().default(''),
      types: z.array(z.string()).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    })
    const params = schema.parse(args)
    const results = this.mem.searchNodes({
      text: params.text || '*',
      types: params.types as NodeType[] | undefined,
      limit: params.limit,
      offset: params.offset,
    })
    return JSON.stringify(results)
  }

  private async handleLinkNodes(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      sourceId: z.string().min(1),
      targetId: z.string().min(1),
      relation: z.string().min(1),
      strength: z.number().min(0).max(1).default(1.0),
    })
    const params = schema.parse(args)
    const edge = this.mem.linkNodes(
      params.sourceId,
      params.targetId,
      params.relation,
      params.strength,
    )
    if (!edge) return JSON.stringify({ error: 'Failed to create edge — check both node IDs' })
    await this.save()
    return JSON.stringify(edge)
  }

  private handleGetConnected(args: Record<string, unknown>): string {
    const schema = z.object({
      nodeId: z.string().min(1),
      direction: z.enum(['outgoing', 'incoming', 'both']).default('both'),
    })
    const params = schema.parse(args)
    const connections = this.mem.graph.getConnectedNodes(params.nodeId, params.direction)
    return JSON.stringify(connections)
  }

  private handleGraphStats(): string {
    const stats = this.mem.graph.getStats()
    return JSON.stringify(stats)
  }

  private handleListNodes(args: Record<string, unknown>): string {
    const schema = z.object({
      limit: z.number().default(100),
      offset: z.number().default(0),
    })
    const params = schema.parse(args)
    const nodes = this.mem.graph.getAllNodes(params.limit, params.offset)
    return JSON.stringify(nodes)
  }

  private async handleCreateWing(args: Record<string, unknown>): Promise<string> {
    const { name, description } = z
      .object({
        name: z.string().min(1),
        description: z.string().default(''),
      })
      .parse(args)
    const loc = this.mem.storeWing(name, description)
    await this.save()
    return JSON.stringify(loc)
  }

  private async handleCreateRoom(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      name: z.string().min(1),
      wingId: z.string().min(1),
      description: z.string().default(''),
    })
    const params = schema.parse(args)
    const loc = this.mem.storeRoom(params.name, params.wingId, params.description)
    await this.save()
    return JSON.stringify(loc)
  }

  private async handleCreateHall(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      name: z.string().min(1),
      roomId: z.string().min(1),
      description: z.string().default(''),
    })
    const params = schema.parse(args)
    const loc = this.mem.storeHall(params.name, params.roomId, params.description)
    await this.save()
    return JSON.stringify(loc)
  }

  private async handlePlaceNode(args: Record<string, unknown>): Promise<string> {
    const schema = z.object({
      locationId: z.string().min(1),
      nodeId: z.string().min(1),
    })
    const params = schema.parse(args)
    const placed = this.mem.placeNode(params.locationId, params.nodeId)
    if (!placed) return JSON.stringify({ error: 'Failed to place node' })
    await this.save()
    return JSON.stringify({ placed: true })
  }

  private handleLocateNode(args: Record<string, unknown>): string {
    const { nodeId } = z.object({ nodeId: z.string().min(1) }).parse(args)
    const loc = this.mem.palace.findLocationForNode(nodeId)
    return JSON.stringify(loc ?? { error: 'Node not found in any location' })
  }

  private handleIndexVector(args: Record<string, unknown>): string {
    const schema = z.object({
      nodeId: z.string().min(1),
      vector: z.array(z.number()),
    })
    const params = schema.parse(args)
    this.mem.indexVector(params.nodeId, new Float32Array(params.vector))
    return JSON.stringify({ indexed: true, nodeId: params.nodeId })
  }

  private handleSearchVectors(args: Record<string, unknown>): string {
    const schema = z.object({
      vector: z.array(z.number()),
      topK: z.number().default(10),
    })
    const params = schema.parse(args)
    const results = this.mem.findSimilar(new Float32Array(params.vector), params.topK)
    return JSON.stringify(results)
  }

  private handleCompress(args: Record<string, unknown>): string {
    const { text } = z.object({ text: z.string().min(1) }).parse(args)
    const result = this.mem.compressText(text)
    return JSON.stringify(result)
  }

  private handleDecompress(args: Record<string, unknown>): string {
    const schema = z.object({
      compressed: z.string().min(1),
      dictionary: z.record(z.string()),
    })
    const params = schema.parse(args)
    const text = this.mem.decompressText(params.compressed, params.dictionary)
    return JSON.stringify({ text })
  }
}

const TOOL_DEFINITIONS: MCPMemoryTool[] = [
  {
    name: 'memory_add_node',
    description: 'Add a knowledge node to the graph',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique node ID' },
        title: { type: 'string', description: 'Node title' },
        content: { type: 'string', description: 'Node content' },
        type: {
          type: 'string',
          description: 'Node type (concept, fact, pattern, etc.)',
          default: 'concept',
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Source URLs or references',
        },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['id', 'title'],
    },
  },
  {
    name: 'memory_get_node',
    description: 'Get a knowledge node by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Node ID' } },
      required: ['id'],
    },
  },
  {
    name: 'memory_update_node',
    description: 'Update a knowledge node',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Node ID' },
        title: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        sources: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
      required: ['id'],
    },
  },
  {
    name: 'memory_delete_node',
    description: 'Delete a knowledge node',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Node ID' } },
      required: ['id'],
    },
  },
  {
    name: 'memory_search_nodes',
    description: 'Search knowledge nodes by text, type, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Search text' },
        types: { type: 'array', items: { type: 'string' }, description: 'Filter by node types' },
        limit: { type: 'number', description: 'Max results', default: 20 },
        offset: { type: 'number', description: 'Offset for pagination', default: 0 },
      },
    },
  },
  {
    name: 'memory_link_nodes',
    description: 'Create a directed edge between two nodes',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: { type: 'string', description: 'Source node ID' },
        targetId: { type: 'string', description: 'Target node ID' },
        relation: { type: 'string', description: 'Relation type' },
        strength: { type: 'number', description: 'Edge strength (0-1)', default: 1.0 },
      },
      required: ['sourceId', 'targetId', 'relation'],
    },
  },
  {
    name: 'memory_get_connected',
    description: 'Get nodes connected to a given node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Node ID' },
        direction: { type: 'string', enum: ['outgoing', 'incoming', 'both'], default: 'both' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'memory_graph_stats',
    description: 'Get knowledge graph statistics',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'memory_list_nodes',
    description: 'List all nodes with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 100 },
        offset: { type: 'number', default: 0 },
      },
    },
  },
  {
    name: 'memory_create_wing',
    description: 'Create a top-level wing in the memory palace',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Wing name' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['name'],
    },
  },
  {
    name: 'memory_create_room',
    description: 'Create a room inside a wing',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Room name' },
        wingId: { type: 'string', description: 'Parent wing ID' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['name', 'wingId'],
    },
  },
  {
    name: 'memory_create_hall',
    description: 'Create a hall inside a room',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Hall name' },
        roomId: { type: 'string', description: 'Parent room ID' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['name', 'roomId'],
    },
  },
  {
    name: 'memory_place_node',
    description: 'Place a knowledge node in a memory palace location',
    inputSchema: {
      type: 'object',
      properties: {
        locationId: { type: 'string', description: 'Location ID' },
        nodeId: { type: 'string', description: 'Node ID' },
      },
      required: ['locationId', 'nodeId'],
    },
  },
  {
    name: 'memory_locate_node',
    description: 'Find which location a node is stored in',
    inputSchema: {
      type: 'object',
      properties: { nodeId: { type: 'string', description: 'Node ID' } },
      required: ['nodeId'],
    },
  },
  {
    name: 'memory_index_vector',
    description: 'Index a vector embedding for a node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: 'Node ID' },
        vector: { type: 'array', items: { type: 'number' }, description: 'Embedding vector' },
      },
      required: ['nodeId', 'vector'],
    },
  },
  {
    name: 'memory_search_vectors',
    description: 'Search for similar vectors',
    inputSchema: {
      type: 'object',
      properties: {
        vector: { type: 'array', items: { type: 'number' }, description: 'Query vector' },
        topK: { type: 'number', description: 'Number of results', default: 10 },
      },
      required: ['vector'],
    },
  },
  {
    name: 'memory_compress',
    description: 'Compress text using AAAK dictionary compression',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to compress' } },
      required: ['text'],
    },
  },
  {
    name: 'memory_decompress',
    description: 'Decompress AAAK-compressed text',
    inputSchema: {
      type: 'object',
      properties: {
        compressed: { type: 'string', description: 'Compressed text' },
        dictionary: { type: 'object', description: 'Compression dictionary (code -> original)' },
      },
      required: ['compressed', 'dictionary'],
    },
  },
]
