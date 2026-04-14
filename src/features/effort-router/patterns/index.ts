/**
 * Pattern Crystallizer
 * Learns recurring state transition patterns within a session.
 * After N similar transitions, crystallizes into a heuristic.
 */

import type { EffortState, TransitionRecord, CrystallizedPattern } from '../types'
import { cosineSimilarity, vectorMean } from './similarity'

const DEFAULT_CRYSTALLIZATION_THRESHOLD = 3
const DEFAULT_MAX_PATTERNS = 5
const DEFAULT_DECAY_MESSAGES = 20
const SIMILARITY_THRESHOLD = 0.8

export class PatternCrystallizer {
  private history: TransitionRecord[] = []
  private patterns: CrystallizedPattern[] = []
  private readonly threshold: number
  private readonly maxPatterns: number
  private readonly decayMessages: number

  constructor(
    threshold: number = DEFAULT_CRYSTALLIZATION_THRESHOLD,
    maxPatterns: number = DEFAULT_MAX_PATTERNS,
    decayMessages: number = DEFAULT_DECAY_MESSAGES,
  ) {
    this.threshold = threshold
    this.maxPatterns = maxPatterns
    this.decayMessages = decayMessages
  }

  /**
   * Record a state transition.
   */
  record(transition: TransitionRecord): void {
    this.history.push(transition)
    // Keep only recent transitions
    if (this.history.length > 50) {
      this.history.shift()
    }
  }

  /**
   * Try to crystallize a new pattern from recent history.
   * Returns the newly crystallized pattern, or null.
   */
  crystallize(): CrystallizedPattern | null {
    // Group by (fromState, toState)
    const groups = new Map<string, TransitionRecord[]>()
    for (const t of this.history) {
      const key = `${t.fromState}->${t.toState}`
      const group = groups.get(key) ?? []
      group.push(t)
      groups.set(key, group)
    }

    for (const [, group] of groups) {
      if (group.length < this.threshold) continue

      // Check if we already have a pattern for this transition
      const existing = this.patterns.find(
        (p) => p.fromState === group[0].fromState && p.toState === group[0].toState,
      )
      if (existing) continue

      // Check signal similarity
      const snapshots = group.map((t) => t.signalSnapshot)
      const centroid = vectorMean(snapshots)
      const similarities = snapshots.map((s) => cosineSimilarity(s, centroid))
      const avgSimilarity = mean(similarities)

      if (avgSimilarity > SIMILARITY_THRESHOLD) {
        const pattern: CrystallizedPattern = {
          fromState: group[0].fromState,
          toState: group[0].toState,
          signalSignature: centroid,
          confidence: avgSimilarity,
          occurrences: group.length,
          lastSeenMessageIndex: group[group.length - 1].messageIndex,
          lastSeen: Date.now(),
        }

        this.addPattern(pattern)
        return pattern
      }
    }

    return null
  }

  /**
   * Match current signals against crystallized patterns.
   */
  match(signals: number[], currentState: EffortState): CrystallizedPattern | null {
    const candidates = this.patterns.filter((p) => p.fromState === currentState)
    if (candidates.length === 0) return null

    let bestMatch: CrystallizedPattern | null = null
    let bestScore = 0

    for (const pattern of candidates) {
      const similarity = cosineSimilarity(signals, pattern.signalSignature)
      if (similarity > 0.75 && similarity > bestScore) {
        bestMatch = pattern
        bestScore = similarity
      }
    }

    return bestMatch
  }

  /**
   * Remove stale patterns.
   */
  decay(currentMessageIndex: number): void {
    this.patterns = this.patterns.filter(
      (p) => currentMessageIndex - p.lastSeenMessageIndex < this.decayMessages,
    )
  }

  /**
   * Serialize patterns for compaction survival.
   */
  serialize(): CrystallizedPattern[] {
    return this.patterns.map((p) => ({ ...p, signalSignature: [...p.signalSignature] }))
  }

  /**
   * Deserialize patterns from a previously saved state.
   */
  deserialize(data: CrystallizedPattern[]): void {
    this.patterns = data.map((p) => ({ ...p, signalSignature: [...p.signalSignature] }))
  }

  /**
   * Get all current patterns (read-only).
   */
  getPatterns(): ReadonlyArray<CrystallizedPattern> {
    return this.patterns
  }

  private addPattern(pattern: CrystallizedPattern): void {
    this.patterns.push(pattern)
    // FIFO eviction
    if (this.patterns.length > this.maxPatterns) {
      this.patterns.sort((a, b) => a.lastSeen - b.lastSeen)
      this.patterns = this.patterns.slice(1)
    }
  }
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}
