/**
 * Signal: taskNovelty
 * How different the current message is from recent messages.
 * Uses Jaccard similarity on word sets.
 */

import type { SignalContext, SignalValue } from '../types'

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0

  let intersection = 0
  for (const word of a) {
    if (b.has(word)) intersection++
  }

  const union = a.size + b.size - intersection
  return union > 0 ? intersection / union : 0
}

export function extractTaskNovelty(ctx: SignalContext): SignalValue {
  const currentWords = wordSet(ctx.messageText)

  if (currentWords.size === 0) {
    return { name: 'taskNovelty', value: 0.5, confidence: 0.2 }
  }

  // Use previous signals' text as the comparison baseline
  // In practice, the hook accumulates recent message texts
  // For now we use a simple heuristic: if we have no history, moderate novelty
  if (!ctx.previousSignals) {
    return { name: 'taskNovelty', value: 0.6, confidence: 0.3 }
  }

  // Approximate novelty from how different signal patterns are from previous
  const prevNovelty = ctx.previousSignals.taskNovelty?.value ?? 0.5
  const messageLenRatio = ctx.messageText.length > 0 ? 1 : 0

  // Simple proxy: longer, different messages are more novel
  const value = Math.min(1, Math.max(0, prevNovelty * 0.7 + messageLenRatio * 0.3))

  return {
    name: 'taskNovelty',
    value,
    confidence: 0.5,
  }
}

// Export word helpers for external use
export { wordSet, jaccardSimilarity }
