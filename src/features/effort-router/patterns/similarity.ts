/**
 * Cosine Similarity
 * Used by pattern crystallizer to compare signal snapshots.
 */

/**
 * Compute cosine similarity between two vectors.
 * Returns a value in [-1, 1], where 1 = identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)

  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

/**
 * Compute mean of a 2D array along the first axis.
 * Returns the centroid of the vectors.
 */
export function vectorMean(vectors: number[][]): number[] {
  if (vectors.length === 0) return []

  const len = vectors[0].length
  const result = new Array(len).fill(0)

  for (const vec of vectors) {
    for (let i = 0; i < len; i++) {
      result[i] += vec[i]
    }
  }

  for (let i = 0; i < len; i++) {
    result[i] /= vectors.length
  }

  return result
}
