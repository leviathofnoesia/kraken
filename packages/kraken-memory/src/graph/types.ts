export interface KnowledgeNode {
  id: string
  title: string
  content: string
  type: NodeType
  tags: string[]
  sources: string[]
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
  accessedAt: number
  accessCount: number
}

export type NodeType =
  | 'concept'
  | 'fact'
  | 'procedure'
  | 'pattern'
  | 'decision'
  | 'error'
  | 'reference'
  | 'experience'

export interface KnowledgeEdge {
  id: string
  sourceId: string
  targetId: string
  relation: string
  strength: number
  createdAt: number
  metadata: Record<string, unknown>
}

export interface SearchQuery {
  text: string
  tags?: string[]
  types?: NodeType[]
  limit?: number
  offset?: number
  minStrength?: number
}

export interface SearchResult {
  node: KnowledgeNode
  score: number
  matchedFields: string[]
}

export interface GraphStats {
  nodeCount: number
  edgeCount: number
  nodesByType: Record<NodeType, number>
  avgConnections: number
  orphans: number
}

export const VALID_NODE_TYPES: NodeType[] = [
  'concept',
  'fact',
  'procedure',
  'pattern',
  'decision',
  'error',
  'reference',
  'experience',
]
