/**
 * Signal: domainComplexity
 * Keyword-weighted complexity score based on domain-specific language.
 */

import type { SignalContext, SignalValue } from '../types'

interface ComplexityRule {
  pattern: RegExp
  weight: number
}

const COMPLEXITY_RULES: ComplexityRule[] = [
  // High complexity (weight 3)
  { pattern: /\b(design|architect|redesign|refactor|optimize|distributed)\b/i, weight: 3 },
  // Medium complexity (weight 2)
  {
    pattern: /\b(implement|integrate|migrate|security|performance|scalab|concurren)\b/i,
    weight: 2,
  },
  // Low complexity (weight 1)
  { pattern: /\b(fix|update|add|change|configure|modify)\b/i, weight: 1 },
  // Minimal complexity (weight 0) — explicitly reduces score
  { pattern: /\b(rename|typo|comment|format|lint|whitespace)\b/i, weight: 0 },
]

const MAX_RAW_SCORE = 12 // 4 keywords × weight 3

export function extractDomainComplexity(ctx: SignalContext): SignalValue {
  const text = ctx.messageText

  if (text.length < 5) {
    return { name: 'domainComplexity', value: 0, confidence: 0.9 }
  }

  let rawScore = 0
  let matchCount = 0

  for (const rule of COMPLEXITY_RULES) {
    const matches = text.match(rule.pattern)
    if (matches) {
      rawScore += rule.weight * matches.length
      matchCount += matches.length
    }
  }

  const value = Math.min(rawScore / MAX_RAW_SCORE, 1.0)

  return {
    name: 'domainComplexity',
    value,
    confidence: matchCount > 0 ? 0.85 : 0.4,
  }
}
