export interface VectorEntry {
  id: string
  vector: Float32Array
  nodeId: string
  compressed?: Uint8Array
  norm?: number
}

export interface VectorSearchResult {
  id: string
  nodeId: string
  score: number
}

export interface TurboQuantConfig {
  subspaces: number
  bitsPerSubspace: number
  codebookSize: number
}
