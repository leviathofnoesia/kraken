import initSqlJs, { type Database } from 'sql.js'
import { KnowledgeGraph } from './graph'
import { Palace } from './palace'
import { VectorStore } from './vector'
import { AAAKCompressor } from './compression'
import type { KnowledgeNode, KnowledgeEdge, SearchQuery, SearchResult } from './graph/types'
import type { PalaceLocation, PalaceLevel } from './palace/types'
import type { TurboQuantConfig } from './vector/types'

export interface KrakenMemoryConfig {
  dbPath?: string
  vectorConfig?: Partial<TurboQuantConfig>
}

export class KrakenMemory {
  private db!: Database
  private _graph!: KnowledgeGraph
  private _palace!: Palace
  private _vectors!: VectorStore
  private _compressor!: AAAKCompressor
  private initialized = false

  get graph(): KnowledgeGraph {
    return this._graph
  }

  get palace(): Palace {
    return this._palace
  }

  get vectors(): VectorStore {
    return this._vectors
  }

  get compressor(): AAAKCompressor {
    return this._compressor
  }

  async init(config?: KrakenMemoryConfig): Promise<void> {
    if (this.initialized) return

    const SQL = await initSqlJs()

    if (config?.dbPath) {
      const fs = await import('fs/promises')
      try {
        const data = await fs.readFile(config.dbPath)
        this.db = new SQL.Database(data)
      } catch {
        this.db = new SQL.Database()
      }
    } else {
      this.db = new SQL.Database()
    }

    this.db.run('PRAGMA journal_mode=WAL')
    this.db.run('PRAGMA foreign_keys=ON')

    this._graph = new KnowledgeGraph(this.db)
    this._palace = new Palace(this.db)
    this._vectors = new VectorStore(config?.vectorConfig)
    this._compressor = new AAAKCompressor()
    this.initialized = true
  }

  async save(path: string): Promise<void> {
    const data = this.db.export()
    const fs = await import('fs/promises')
    const dir = await import('path').then((m) => m.dirname(path))
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path, Buffer.from(data))
  }

  close(): void {
    if (this.db) {
      this.db.close()
    }
  }

  addNode(
    node: Omit<KnowledgeNode, 'createdAt' | 'updatedAt' | 'accessedAt' | 'accessCount'>,
  ): KnowledgeNode {
    return this._graph.addNode(node)
  }

  getNode(id: string): KnowledgeNode | null {
    return this._graph.getNode(id)
  }

  searchNodes(query: SearchQuery): SearchResult[] {
    return this._graph.search(query)
  }

  linkNodes(
    sourceId: string,
    targetId: string,
    relation: string,
    strength = 1.0,
  ): KnowledgeEdge | null {
    const id = `${sourceId}->${relation}->${targetId}`
    return this._graph.addEdge({ id, sourceId, targetId, relation, strength, metadata: {} })
  }

  storeWing(name: string, description = ''): PalaceLocation {
    const id = `wing:${name.toLowerCase().replace(/\s+/g, '-')}`
    return this._palace.createLocation({
      id,
      name,
      level: 'wing',
      parentId: null,
      description,
      metadata: {},
    })
  }

  storeRoom(name: string, wingId: string, description = ''): PalaceLocation {
    const id = `room:${wingId}:${name.toLowerCase().replace(/\s+/g, '-')}`
    return this._palace.createLocation({
      id,
      name,
      level: 'room',
      parentId: wingId,
      description,
      metadata: {},
    })
  }

  storeHall(name: string, roomId: string, description = ''): PalaceLocation {
    const id = `hall:${roomId}:${name.toLowerCase().replace(/\s+/g, '-')}`
    return this._palace.createLocation({
      id,
      name,
      level: 'hall',
      parentId: roomId,
      description,
      metadata: {},
    })
  }

  storeTunnel(name: string, hallId: string, description = ''): PalaceLocation {
    const id = `tunnel:${hallId}:${name.toLowerCase().replace(/\s+/g, '-')}`
    return this._palace.createLocation({
      id,
      name,
      level: 'tunnel',
      parentId: hallId,
      description,
      metadata: {},
    })
  }

  storeDrawer(name: string, tunnelId: string, description = ''): PalaceLocation {
    const id = `drawer:${tunnelId}:${name.toLowerCase().replace(/\s+/g, '-')}`
    return this._palace.createLocation({
      id,
      name,
      level: 'drawer',
      parentId: tunnelId,
      description,
      metadata: {},
    })
  }

  placeNode(locationId: string, nodeId: string): boolean {
    return this._palace.addNodeToLocation(locationId, nodeId)
  }

  indexVector(nodeId: string, vector: Float32Array): void {
    this._vectors.add(nodeId, vector, nodeId)
  }

  findSimilar(vector: Float32Array, topK = 10) {
    return this._vectors.search(vector, topK)
  }

  compressText(text: string) {
    return this._compressor.compress(text)
  }

  decompressText(compressed: string, dictionary: Record<string, string>) {
    return this._compressor.decompress(compressed, dictionary)
  }
}
