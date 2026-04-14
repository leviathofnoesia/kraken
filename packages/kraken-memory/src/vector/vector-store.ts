import type { VectorEntry, VectorSearchResult, TurboQuantConfig } from './types'

const DEFAULT_TURBOQUANT: TurboQuantConfig = {
  subspaces: 16,
  bitsPerSubspace: 8,
  codebookSize: 256,
}

export class VectorStore {
  private entries: Map<string, VectorEntry> = new Map()
  private config: TurboQuantConfig
  private codebooks: Float32Array[][] = []

  constructor(config?: Partial<TurboQuantConfig>) {
    this.config = { ...DEFAULT_TURBOQUANT, ...config }
  }

  add(id: string, vector: Float32Array, nodeId: string): void {
    const norm = this.computeNorm(vector)
    const normalized = this.normalize(vector, norm)
    const compressed = this.compress(normalized)

    this.entries.set(id, {
      id,
      vector: normalized,
      nodeId,
      compressed,
      norm,
    })
  }

  remove(id: string): boolean {
    return this.entries.delete(id)
  }

  search(query: Float32Array, topK = 10): VectorSearchResult[] {
    const norm = this.computeNorm(query)
    const normalized = this.normalize(query, norm)

    const scores: VectorSearchResult[] = []
    for (const entry of this.entries.values()) {
      const score = this.cosineSimilarity(normalized, entry.vector)
      scores.push({ id: entry.id, nodeId: entry.nodeId, score })
    }

    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, topK)
  }

  get(id: string): VectorEntry | undefined {
    return this.entries.get(id)
  }

  size(): number {
    return this.entries.size
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0
    const len = Math.min(a.length, b.length)
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i]
    }
    return dot
  }

  private computeNorm(v: Float32Array): number {
    let sum = 0
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i]
    }
    return Math.sqrt(sum)
  }

  private normalize(v: Float32Array, norm: number): Float32Array {
    if (norm === 0) return v
    const result = new Float32Array(v.length)
    for (let i = 0; i < v.length; i++) {
      result[i] = v[i] / norm
    }
    return result
  }

  private compress(vector: Float32Array): Uint8Array {
    const dim = vector.length
    const subspaces = Math.min(this.config.subspaces, dim)
    const dimPerSubspace = Math.ceil(dim / subspaces)
    const compressed = new Uint8Array(subspaces)

    for (let s = 0; s < subspaces; s++) {
      let sum = 0
      const start = s * dimPerSubspace
      const end = Math.min(start + dimPerSubspace, dim)
      for (let i = start; i < end; i++) {
        sum += vector[i]
      }
      const avg = sum / (end - start)
      compressed[s] = Math.max(0, Math.min(255, Math.floor((avg + 1) * 127.5)))
    }

    return compressed
  }

  decompress(compressed: Uint8Array, targetDim: number): Float32Array {
    const result = new Float32Array(targetDim)
    const subspaces = compressed.length
    const dimPerSubspace = Math.ceil(targetDim / subspaces)

    for (let s = 0; s < subspaces; s++) {
      const value = compressed[s] / 127.5 - 1
      const start = s * dimPerSubspace
      const end = Math.min(start + dimPerSubspace, targetDim)
      for (let i = start; i < end; i++) {
        result[i] = value
      }
    }

    return result
  }
}
