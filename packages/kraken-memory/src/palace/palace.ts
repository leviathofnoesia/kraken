import type { PalaceLocation, PalaceLevel, PalaceTraversal } from './types'
import { LEVEL_HIERARCHY } from './types'
import type { KnowledgeNode } from '../graph/types'

interface StoredLocation {
  id: string
  name: string
  level: string
  parent_id: string | null
  description: string
  node_ids: string
  child_ids: string
  metadata: string
  created_at: number
  updated_at: number
}

export class Palace {
  private db: any

  constructor(db: any) {
    this.db = db
    this.initSchema()
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS palace_locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        level TEXT NOT NULL,
        parent_id TEXT REFERENCES palace_locations(id) ON DELETE CASCADE,
        description TEXT NOT NULL DEFAULT '',
        node_ids TEXT NOT NULL DEFAULT '[]',
        child_ids TEXT NOT NULL DEFAULT '[]',
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      )
    `)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_palace_parent ON palace_locations(parent_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_palace_level ON palace_locations(level)`)
  }

  createLocation(
    loc: Omit<PalaceLocation, 'createdAt' | 'updatedAt' | 'childIds' | 'nodeIds'> & {
      childIds?: string[]
      nodeIds?: string[]
    },
  ): PalaceLocation {
    const now = Date.now()
    const full: PalaceLocation = {
      ...loc,
      childIds: loc.childIds ?? [],
      nodeIds: loc.nodeIds ?? [],
      createdAt: now,
      updatedAt: now,
    }

    this.db.run(
      `INSERT OR REPLACE INTO palace_locations (id, name, level, parent_id, description, node_ids, child_ids, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full.id,
        full.name,
        full.level,
        full.parentId,
        full.description,
        JSON.stringify(full.nodeIds),
        JSON.stringify(full.childIds),
        JSON.stringify(full.metadata),
        full.createdAt,
        full.updatedAt,
      ],
    )

    if (full.parentId) {
      const parent = this.getLocation(full.parentId)
      if (parent && !parent.childIds.includes(full.id)) {
        parent.childIds.push(full.id)
        this.db.run(`UPDATE palace_locations SET child_ids = ?, updated_at = ? WHERE id = ?`, [
          JSON.stringify(parent.childIds),
          Date.now(),
          parent.id,
        ])
      }
    }

    return full
  }

  getLocation(id: string): PalaceLocation | null {
    const row = this.db.exec(`SELECT * FROM palace_locations WHERE id = ?`, [id])
    if (!row[0]?.values?.length) return null
    return this.mapLocation(row[0].columns, row[0].values[0])
  }

  getChildren(parentId: string): PalaceLocation[] {
    const rows = this.db.exec(`SELECT * FROM palace_locations WHERE parent_id = ? ORDER BY name`, [
      parentId,
    ])
    if (!rows[0]?.values) return []
    return rows[0].values.map((val) => this.mapLocation(rows[0].columns, val))
  }

  getWings(): PalaceLocation[] {
    const rows = this.db.exec(`SELECT * FROM palace_locations WHERE level = 'wing' ORDER BY name`)
    if (!rows[0]?.values) return []
    return rows[0].values.map((val) => this.mapLocation(rows[0].columns, val))
  }

  addNodeToLocation(locationId: string, nodeId: string): boolean {
    const loc = this.getLocation(locationId)
    if (!loc) return false
    if (loc.nodeIds.includes(nodeId)) return true
    loc.nodeIds.push(nodeId)
    this.db.run(`UPDATE palace_locations SET node_ids = ?, updated_at = ? WHERE id = ?`, [
      JSON.stringify(loc.nodeIds),
      Date.now(),
      locationId,
    ])
    return true
  }

  removeNodeFromLocation(locationId: string, nodeId: string): boolean {
    const loc = this.getLocation(locationId)
    if (!loc) return false
    loc.nodeIds = loc.nodeIds.filter((id) => id !== nodeId)
    this.db.run(`UPDATE palace_locations SET node_ids = ?, updated_at = ? WHERE id = ?`, [
      JSON.stringify(loc.nodeIds),
      Date.now(),
      locationId,
    ])
    return true
  }

  deleteLocation(id: string, recursive = false): boolean {
    const loc = this.getLocation(id)
    if (!loc) return false

    if (loc.childIds.length > 0 && !recursive) return false

    if (recursive) {
      for (const childId of loc.childIds) {
        this.deleteLocation(childId, true)
      }
    }

    if (loc.parentId) {
      const parent = this.getLocation(loc.parentId)
      if (parent) {
        parent.childIds = parent.childIds.filter((cid) => cid !== id)
        this.db.run(`UPDATE palace_locations SET child_ids = ?, updated_at = ? WHERE id = ?`, [
          JSON.stringify(parent.childIds),
          Date.now(),
          parent.id,
        ])
      }
    }

    this.db.run(`DELETE FROM palace_locations WHERE id = ?`, [id])
    return true
  }

  traverse(
    locationId: string,
    getGraphNode: (id: string) => KnowledgeNode | null,
  ): PalaceTraversal {
    const path: PalaceLocation[] = []
    const nodes: KnowledgeNode[] = []

    let currentId: string | null = locationId
    while (currentId) {
      const loc = this.getLocation(currentId)
      if (!loc) break
      path.unshift(loc)
      currentId = loc.parentId
    }

    const loc = this.getLocation(locationId)
    if (loc) {
      for (const nodeId of loc.nodeIds) {
        const node = getGraphNode(nodeId)
        if (node) nodes.push(node)
      }
    }

    return { path, nodes }
  }

  findLocationForNode(nodeId: string): PalaceLocation | null {
    const rows = this.db.exec(`SELECT * FROM palace_locations WHERE node_ids LIKE ? LIMIT 1`, [
      `%"${nodeId}"%`,
    ])
    if (!rows[0]?.values?.length) return null
    return this.mapLocation(rows[0].columns, rows[0].values[0])
  }

  private mapLocation(columns: string[], values: any[]): PalaceLocation {
    const obj: Record<string, any> = {}
    columns.forEach((col, i) => {
      obj[col] = values[i]
    })
    return {
      id: obj.id,
      name: obj.name,
      level: obj.level as PalaceLevel,
      parentId: obj.parent_id,
      description: obj.description,
      nodeIds: JSON.parse(obj.node_ids || '[]'),
      childIds: JSON.parse(obj.child_ids || '[]'),
      metadata: JSON.parse(obj.metadata || '{}'),
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    }
  }
}
