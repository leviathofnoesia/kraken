export type PalaceLevel = 'wing' | 'room' | 'hall' | 'tunnel' | 'drawer'

export interface PalaceLocation {
  id: string
  name: string
  level: PalaceLevel
  parentId: string | null
  description: string
  nodeIds: string[]
  childIds: string[]
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface PalaceTraversal {
  path: PalaceLocation[]
  nodes: import('../graph/types').KnowledgeNode[]
}

export const LEVEL_HIERARCHY: Record<PalaceLevel, number> = {
  wing: 0,
  room: 1,
  hall: 2,
  tunnel: 3,
  drawer: 4,
}

export function canContain(parent: PalaceLevel, child: PalaceLevel): boolean {
  return LEVEL_HIERARCHY[child] === LEVEL_HIERARCHY[parent] + 1
}
