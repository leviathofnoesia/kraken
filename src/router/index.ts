import { createHash } from 'node:crypto'

export enum DepthLevel {
  CACHE_HIT = 1,
  PARTIAL = 2,
  FULL = 3,
}

export interface RouterDecision {
  depth: DepthLevel
  confidence: number
  reason: string
}

export interface RouterFeatures {
  promptLength: number
  codeRatio: number
  tokenDensity: number
  noveltyScore: number
  cacheHitProbability: number
}

const FEATURE_WEIGHTS: Record<string, number> = {
  promptLength: 0.3,
  tokenDensity: 0.25,
  codeRatio: 0.2,
  noveltyScore: 0.15,
  cacheHitProbability: 0.1,
}

const LAYER1_CONFIG = {
  bias: -0.5,
  thresholdLow: 0.3,
  thresholdHigh: 0.7,
}

const CODE_KEYWORDS = /\b(function|class|const|let|var|if|for|while)\b/g

export class DepthGatingLayer {
  extractFeatures(prompt: string, context: Record<string, any> = {}): RouterFeatures {
    const words = prompt.split(/\s+/)
    const promptLength = words.length

    const codeMatches = prompt.match(CODE_KEYWORDS)
    const codeRatio = (codeMatches?.length ?? 0) / Math.max(promptLength, 1)

    const uniqueWords = new Set(words)
    const tokenDensity = uniqueWords.size / Math.max(promptLength, 1)

    return {
      promptLength,
      codeRatio,
      tokenDensity,
      noveltyScore: context.noveltyScore ?? 0.5,
      cacheHitProbability: context.cacheHitProbability ?? 0.0,
    }
  }

  computeScore(features: RouterFeatures): number {
    let score = 0
    for (const [feature, value] of Object.entries(features)) {
      const weight = FEATURE_WEIGHTS[feature] ?? 0.2
      score += weight * (typeof value === 'number' ? value : 0)
    }

    score = Math.max(0, Math.min(1, score))
    score = Math.max(0, score + LAYER1_CONFIG.bias)

    return score
  }

  route(features: RouterFeatures): DepthLevel {
    const score = this.computeScore(features)
    const cacheProb = features.cacheHitProbability

    if (cacheProb > 0.9) return DepthLevel.CACHE_HIT
    if (score < LAYER1_CONFIG.thresholdLow) return DepthLevel.PARTIAL
    if (score < LAYER1_CONFIG.thresholdHigh) return DepthLevel.FULL
    return DepthLevel.FULL
  }
}

const REASON_MAP: Record<number, string> = {
  [DepthLevel.CACHE_HIT]: 'Cached response available',
  [DepthLevel.PARTIAL]: 'Partial expansion sufficient',
  [DepthLevel.FULL]: 'Full expansion required',
}

export class AdaptiveRouter {
  private gatingLayer = new DepthGatingLayer()
  private cache = new Map<string, any>()
  private cacheStats = { hits: 0, misses: 0, totalRequests: 0 }

  private computeCacheHash(prompt: string): string {
    return createHash('sha256').update(prompt, 'utf-8').digest('hex')
  }

  checkCache(prompt: string): any | undefined {
    return this.cache.get(this.computeCacheHash(prompt))
  }

  updateCache(prompt: string, result: any): void {
    const key = this.computeCacheHash(prompt)
    this.cache.set(key, result)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
  }

  routeRequest(prompt: string, context?: Record<string, any>): RouterDecision {
    const ctx = context ?? {}
    this.cacheStats.totalRequests++

    const cached = this.checkCache(prompt)
    if (cached) {
      this.cacheStats.hits++
      return { depth: DepthLevel.CACHE_HIT, confidence: 0.95, reason: 'Cache hit' }
    }

    this.cacheStats.misses++

    const features = this.gatingLayer.extractFeatures(prompt, {
      ...ctx,
    })

    const depth = this.gatingLayer.route(features)
    const score = this.gatingLayer.computeScore(features)
    const confidence = Math.min(0.9, 0.5 + score * 0.4)

    return {
      depth,
      confidence,
      reason: REASON_MAP[depth] ?? 'Unknown',
    }
  }

  getStats(): Record<string, any> {
    const total = this.cacheStats.totalRequests
    return {
      totalRequests: total,
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses,
      hitRate: total > 0 ? this.cacheStats.hits / total : 0,
      cacheSize: this.cache.size,
    }
  }
}

let globalRouter: AdaptiveRouter | null = null

export function getRouter(): AdaptiveRouter {
  if (!globalRouter) {
    globalRouter = new AdaptiveRouter()
  }
  return globalRouter
}
