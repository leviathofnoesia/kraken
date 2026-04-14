import type {
  KnowledgeNode,
  KnowledgeEdge,
  SearchQuery,
  SearchResult,
  GraphStats,
  NodeType,
} from './types'
import { VALID_NODE_TYPES } from './types'

interface StoredNode {
  id: string
  title: string
  content: string
  type: string
  tags: string
  sources: string
  metadata: string
  created_at: number
  updated_at: number
  accessed_at: number
  access_count: number
}

interface StoredEdge {
  id: string
  source_id: string
  target_id: string
  relation: string
  strength: number
  created_at: number
  metadata: string
}

export class KnowledgeGraph {
  private db: any

  constructor(db: any) {
    this.db = db
    this.initSchema()
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'concept',
        tags TEXT NOT NULL DEFAULT '[]',
        sources TEXT NOT NULL DEFAULT '[]',
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        accessed_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        access_count INTEGER NOT NULL DEFAULT 0
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        relation TEXT NOT NULL,
        strength REAL NOT NULL DEFAULT 1.0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        metadata TEXT NOT NULL DEFAULT '{}',
        UNIQUE(source_id, target_id, relation)
      )
    `)

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_tags ON knowledge_nodes(tags)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_edges(source_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_edges(target_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_edges_relation ON knowledge_edges(relation)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_title ON knowledge_nodes(title)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_content ON knowledge_nodes(content)`)
  }

  addNode(
    node: Omit<KnowledgeNode, 'createdAt' | 'updatedAt' | 'accessedAt' | 'accessCount'>,
  ): KnowledgeNode {
    const now = Date.now()
    const full: KnowledgeNode = {
      ...node,
      createdAt: now,
      updatedAt: now,
      accessedAt: now,
      accessCount: 0,
    }

    this.db.run(
      `INSERT OR REPLACE INTO knowledge_nodes (id, title, content, type, tags, sources, metadata, created_at, updated_at, accessed_at, access_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full.id,
        full.title,
        full.content,
        full.type,
        JSON.stringify(full.tags),
        JSON.stringify(full.sources),
        JSON.stringify(full.metadata),
        full.createdAt,
        full.updatedAt,
        full.accessedAt,
        full.accessCount,
      ],
    )

    return full
  }

  getNode(id: string): KnowledgeNode | null {
    const row = this.db.exec(`SELECT * FROM knowledge_nodes WHERE id = ?`, [id])
    if (!row[0]?.values?.length) return null
    return this.mapNode(row[0].columns, row[0].values[0])
  }

  updateNode(
    id: string,
    updates: Partial<
      Pick<KnowledgeNode, 'title' | 'content' | 'type' | 'tags' | 'sources' | 'metadata'>
    >,
  ): KnowledgeNode | null {
    const existing = this.getNode(id)
    if (!existing) return null

    const merged = { ...existing, ...updates, updatedAt: Date.now() }

    this.db.run(
      `UPDATE knowledge_nodes SET title = ?, content = ?, type = ?, tags = ?, sources = ?, metadata = ?, updated_at = ? WHERE id = ?`,
      [
        merged.title,
        merged.content,
        merged.type,
        JSON.stringify(merged.tags),
        JSON.stringify(merged.sources),
        JSON.stringify(merged.metadata),
        merged.updatedAt,
        id,
      ],
    )

    return merged
  }

  deleteNode(id: string): boolean {
    const existing = this.getNode(id)
    if (!existing) return false
    this.db.run(`DELETE FROM knowledge_edges WHERE source_id = ? OR target_id = ?`, [id, id])
    this.db.run(`DELETE FROM knowledge_nodes WHERE id = ?`, [id])
    return true
  }

  touchNode(id: string): void {
    this.db.run(
      `UPDATE knowledge_nodes SET accessed_at = ?, access_count = access_count + 1 WHERE id = ?`,
      [Date.now(), id],
    )
  }

  addEdge(edge: Omit<KnowledgeEdge, 'createdAt'> & { createdAt?: number }): KnowledgeEdge | null {
    const source = this.getNode(edge.sourceId)
    const target = this.getNode(edge.targetId)
    if (!source || !target) return null

    const full: KnowledgeEdge = {
      ...edge,
      createdAt: edge.createdAt ?? Date.now(),
    }

    this.db.run(
      `INSERT OR REPLACE INTO knowledge_edges (id, source_id, target_id, relation, strength, created_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full.id,
        full.sourceId,
        full.targetId,
        full.relation,
        full.strength,
        full.createdAt,
        JSON.stringify(full.metadata),
      ],
    )

    return full
  }

  getEdge(id: string): KnowledgeEdge | null {
    const row = this.db.exec(`SELECT * FROM knowledge_edges WHERE id = ?`, [id])
    if (!row[0]?.values?.length) return null
    return this.mapEdge(row[0].columns, row[0].values[0])
  }

  deleteEdge(id: string): boolean {
    const existing = this.getEdge(id)
    if (!existing) return false
    this.db.run(`DELETE FROM knowledge_edges WHERE id = ?`, [id])
    return true
  }

  getConnectedNodes(
    nodeId: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
  ): Array<{ edge: KnowledgeEdge; node: KnowledgeNode }> {
    let sql: string
    if (direction === 'outgoing') {
      sql = `SELECT e.* FROM knowledge_edges e WHERE e.source_id = ?`
    } else if (direction === 'incoming') {
      sql = `SELECT e.* FROM knowledge_edges e WHERE e.target_id = ?`
    } else {
      sql = `SELECT e.* FROM knowledge_edges e WHERE e.source_id = ? OR e.target_id = ?`
    }

    const params = direction === 'both' ? [nodeId, nodeId] : [nodeId]
    const rows = this.db.exec(sql, params)

    const results: Array<{ edge: KnowledgeEdge; node: KnowledgeNode }> = []
    if (!rows[0]?.values) return results

    for (const val of rows[0].values) {
      const edge = this.mapEdge(rows[0].columns, val)
      const connectedId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId
      const node = this.getNode(connectedId)
      if (node) results.push({ edge, node })
    }

    return results
  }

  search(query: SearchQuery): SearchResult[] {
    const conditions: string[] = []
    const params: any[] = []

    if (query.text) {
      conditions.push(`(n.title LIKE ? OR n.content LIKE ? OR n.tags LIKE ?)`)
      const pattern = `%${query.text}%`
      params.push(pattern, pattern, pattern)
    }

    if (query.types?.length) {
      const placeholders = query.types.map(() => '?').join(',')
      conditions.push(`n.type IN (${placeholders})`)
      params.push(...query.types)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0

    const sql = `
      SELECT n.*
      FROM knowledge_nodes n
      ${where}
      ORDER BY n.updated_at DESC
      LIMIT ? OFFSET ?
    `

    const rows = this.db.exec(sql, [...params, limit, offset])
    const results: SearchResult[] = []
    if (!rows[0]?.values) return results

    for (const val of rows[0].values) {
      const node = this.mapNode(rows[0].columns, val)
      const score = this.computeSearchScore(node, query.text)
      const matchedFields: string[] = []
      if (query.text) {
        const lower = query.text.toLowerCase()
        if (node.title.toLowerCase().includes(lower)) matchedFields.push('title')
        if (node.content.toLowerCase().includes(lower)) matchedFields.push('content')
        if (node.tags.some((t) => t.toLowerCase().includes(lower))) matchedFields.push('tags')
      }
      results.push({ node, score, matchedFields })
    }

    results.sort((a, b) => b.score - a.score)
    return results
  }

  private computeSearchScore(node: KnowledgeNode, queryText?: string): number {
    if (!queryText) return 1.0
    const lower = queryText.toLowerCase()
    let score = 0
    if (node.title.toLowerCase().includes(lower)) score += 3
    if (node.tags.some((t) => t.toLowerCase().includes(lower))) score += 2
    if (node.content.toLowerCase().includes(lower)) score += 1
    return score
  }

  getStats(): GraphStats {
    const nodeCount = this.db.exec(`SELECT COUNT(*) FROM knowledge_nodes`)
    const edgeCount = this.db.exec(`SELECT COUNT(*) FROM knowledge_edges`)
    const byType = this.db.exec(`SELECT type, COUNT(*) as cnt FROM knowledge_nodes GROUP BY type`)
    const avgConn = this.db.exec(`
      SELECT AVG(conn_count) FROM (
        SELECT COUNT(*) as conn_count FROM knowledge_edges GROUP BY source_id
        UNION ALL
        SELECT COUNT(*) as conn_count FROM knowledge_edges GROUP BY target_id
      )
    `)
    const orphans = this.db.exec(`
      SELECT COUNT(*) FROM knowledge_nodes n
      WHERE NOT EXISTS (SELECT 1 FROM knowledge_edges e WHERE e.source_id = n.id)
        AND NOT EXISTS (SELECT 1 FROM knowledge_edges e WHERE e.target_id = n.id)
    `)

    const nc = (nodeCount[0]?.values?.[0]?.[0] as number) ?? 0
    const ec = (edgeCount[0]?.values?.[0]?.[0] as number) ?? 0
    const ac = (avgConn[0]?.values?.[0]?.[0] as number) ?? 0
    const oc = (orphans[0]?.values?.[0]?.[0] as number) ?? 0

    const nodesByType: Record<string, number> = {}
    for (const nt of VALID_NODE_TYPES) nodesByType[nt] = 0
    if (byType[0]?.values) {
      for (const row of byType[0].values) {
        nodesByType[row[0] as string] = row[1] as number
      }
    }

    return {
      nodeCount: nc,
      edgeCount: ec,
      nodesByType: nodesByType as Record<NodeType, number>,
      avgConnections: ac,
      orphans: oc,
    }
  }

  getAllNodes(limit = 1000, offset = 0): KnowledgeNode[] {
    const rows = this.db.exec(
      `SELECT * FROM knowledge_nodes ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    )
    if (!rows[0]?.values) return []
    return rows[0].values.map((val) => this.mapNode(rows[0].columns, val))
  }

  private mapNode(columns: string[], values: any[]): KnowledgeNode {
    const obj: Record<string, any> = {}
    columns.forEach((col, i) => {
      obj[col] = values[i]
    })
    return {
      id: obj.id,
      title: obj.title,
      content: obj.content,
      type: obj.type,
      tags: JSON.parse(obj.tags || '[]'),
      sources: JSON.parse(obj.sources || '[]'),
      metadata: JSON.parse(obj.metadata || '{}'),
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
      accessedAt: obj.accessed_at,
      accessCount: obj.access_count,
    }
  }

  private mapEdge(columns: string[], values: any[]): KnowledgeEdge {
    const obj: Record<string, any> = {}
    columns.forEach((col, i) => {
      obj[col] = values[i]
    })
    return {
      id: obj.id,
      sourceId: obj.source_id,
      targetId: obj.target_id,
      relation: obj.relation,
      strength: obj.strength,
      createdAt: obj.created_at,
      metadata: JSON.parse(obj.metadata || '{}'),
    }
  }
}
