/**
 * Thermocline Detector
 * Detects rapid complexity gradient shifts in conversation effort scores.
 * Uses a sliding window and 2σ threshold detection.
 */

import type { ThermoclineResult } from '../types'

const DEFAULT_WINDOW_SIZE = 5
const DEFAULT_SENSITIVITY = 2.0

export class ThermoclineDetector {
  private window: number[] = []
  private readonly windowSize: number
  private readonly sensitivity: number

  constructor(windowSize: number = DEFAULT_WINDOW_SIZE, sensitivity: number = DEFAULT_SENSITIVITY) {
    this.windowSize = windowSize
    this.sensitivity = sensitivity
  }

  /**
   * Add a new effort score to the window.
   */
  update(score: number): void {
    this.window.push(score)
    if (this.window.length > this.windowSize) {
      this.window.shift()
    }
  }

  /**
   * Detect a thermocline (rapid complexity shift).
   */
  detect(): ThermoclineResult {
    if (this.window.length < 3) {
      return { detected: false, direction: null, magnitude: 0 }
    }

    // Calculate deltas between consecutive scores
    const deltas: number[] = []
    for (let i = 1; i < this.window.length; i++) {
      deltas.push(this.window[i] - this.window[i - 1])
    }

    const mu = mean(deltas)
    const sigma = stddev(deltas, mu)

    // No variance — no thermocline possible
    if (sigma < 0.01) {
      return { detected: false, direction: null, magnitude: 0 }
    }

    // Check the most recent deltas (last 3)
    const recentStart = Math.max(0, deltas.length - 3)
    for (let i = recentStart; i < deltas.length; i++) {
      const absDelta = Math.abs(deltas[i])
      if (absDelta > this.sensitivity * sigma) {
        const direction = deltas[i] > 0 ? 'ascending' : 'descending'
        const magnitude = absDelta / sigma
        return { detected: true, direction, magnitude }
      }
    }

    return { detected: false, direction: null, magnitude: 0 }
  }

  /**
   * Get the current window contents (for serialization).
   */
  getWindow(): number[] {
    return [...this.window]
  }

  /**
   * Restore from a serialized window.
   */
  setWindow(window: number[]): void {
    this.window = [...window]
  }

  /**
   * Reset the detector.
   */
  reset(): void {
    this.window = []
  }
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stddev(values: number[], mu: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / values.length
  return Math.sqrt(variance)
}
