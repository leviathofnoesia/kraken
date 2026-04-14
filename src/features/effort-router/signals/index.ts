/**
 * Signal Registry
 * Extracts all 12 signals from a SignalContext.
 */

import type { SignalContext, SignalExtractor, SignalVector, SignalName } from '../types'
import { SIGNAL_NAMES } from '../types'

import { extractMessageLength } from './message-length'
import { extractToolCallCount } from './tool-call-count'
import { extractEditFileCount } from './edit-file-count'
import { extractAgentDelegationDepth } from './agent-delegation'
import { extractErrorRate } from './error-rate'
import { extractContextPressure } from './context-pressure'
import { extractTaskNovelty } from './task-novelty'
import { extractDomainComplexity } from './domain-complexity'
import { extractConversationDepth } from './conversation-depth'
import { extractUserUrgencySignal } from './user-urgency'
import { extractCompactionRisk } from './compaction-risk'
import { extractStallRate } from './stall-rate'

const EXTRACTORS: Record<SignalName, SignalExtractor> = {
  messageLength: extractMessageLength,
  toolCallCount: extractToolCallCount,
  editFileCount: extractEditFileCount,
  agentDelegationDepth: extractAgentDelegationDepth,
  errorRate: extractErrorRate,
  contextPressure: extractContextPressure,
  taskNovelty: extractTaskNovelty,
  domainComplexity: extractDomainComplexity,
  conversationDepth: extractConversationDepth,
  userUrgencySignal: extractUserUrgencySignal,
  compactionRisk: extractCompactionRisk,
  stallRate: extractStallRate,
}

/**
 * Extract all 12 signals from the given context.
 */
export function extractAllSignals(ctx: SignalContext): SignalVector {
  const vector = {} as SignalVector

  for (const name of SIGNAL_NAMES) {
    const extractor = EXTRACTORS[name]
    const result = extractor(ctx)
    // Clamp values to [0, 1]
    vector[name] = {
      name: result.name,
      value: Math.max(0, Math.min(1, result.value)),
      confidence: Math.max(0, Math.min(1, result.confidence)),
    }
  }

  return vector
}

/**
 * Compute a weighted composite score from a signal vector.
 */
export function computeCompositeScore(
  vector: SignalVector,
  weights: Record<string, number>,
): number {
  let score = 0
  for (const name of SIGNAL_NAMES) {
    const w = weights[name] ?? 0
    score += w * (vector[name]?.value ?? 0)
  }
  return Math.max(0, Math.min(1, score))
}

/**
 * Extract signal values as a plain number array (for pattern matching).
 */
export function signalVectorToArray(vector: SignalVector): number[] {
  return SIGNAL_NAMES.map((name) => vector[name]?.value ?? 0)
}

export { EXTRACTORS }
