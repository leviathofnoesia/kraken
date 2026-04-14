/**
 * Markov Transition Matrix
 * Session-scoped 5×5 transition probability matrix.
 * Starts uniform, learns from observed transitions.
 */

import { EFFORT_STATE_INDEX, INDEX_TO_EFFORT_STATE } from '../types'
import type { EffortState } from '../types'

const K = 5 // number of states
const ALPHA = 1 // Laplace smoothing prior

export class MarkovMatrix {
  private counts: number[][] = []
  private matrix: number[][] = []

  constructor() {
    this.reset()
  }

  /**
   * Initialize with uniform probabilities.
   */
  reset(): void {
    this.counts = Array.from({ length: K }, () => Array(K).fill(0))
    this.recompute()
  }

  /**
   * Record an observed transition.
   */
  observe(from: EffortState, to: EffortState): void {
    const i = EFFORT_STATE_INDEX[from]
    const j = EFFORT_STATE_INDEX[to]
    this.counts[i][j]++
    this.recomputeRow(i)
  }

  /**
   * Predict the most likely next state given current state.
   */
  predict(current: EffortState): { state: EffortState; confidence: number } {
    const i = EFFORT_STATE_INDEX[current]
    const row = this.matrix[i]

    let bestJ = 0
    let bestP = row[0]
    for (let j = 1; j < K; j++) {
      if (row[j] > bestP) {
        bestP = row[j]
        bestJ = j
      }
    }

    return {
      state: INDEX_TO_EFFORT_STATE[bestJ],
      confidence: bestP,
    }
  }

  /**
   * Serialize the matrix and counts for compaction survival.
   */
  serialize(): { matrix: number[][]; counts: number[][] } {
    return {
      matrix: this.matrix.map((row) => [...row]),
      counts: this.counts.map((row) => [...row]),
    }
  }

  /**
   * Deserialize from a previously saved state.
   */
  deserialize(data: { matrix: number[][]; counts: number[][] }): void {
    if (data.matrix.length === K && data.counts.length === K) {
      this.matrix = data.matrix.map((row) => [...row])
      this.counts = data.counts.map((row) => [...row])
    }
  }

  /**
   * Recompute the entire matrix from counts.
   */
  private recompute(): void {
    this.matrix = this.counts.map((row) => {
      const total = row.reduce((sum, c) => sum + c, 0) + K * ALPHA
      return row.map((c) => (c + ALPHA) / total)
    })
  }

  /**
   * Recompute a single row (more efficient after single observation).
   */
  private recomputeRow(i: number): void {
    const row = this.counts[i]
    const total = row.reduce((sum, c) => sum + c, 0) + K * ALPHA
    this.matrix[i] = row.map((c) => (c + ALPHA) / total)
  }
}
