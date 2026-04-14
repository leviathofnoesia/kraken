import { describe, it, expect } from 'bun:test'
import { AdaptiveRouter, DepthGatingLayer, DepthLevel, getRouter } from '../../src/router'
import type { RouterFeatures } from '../../src/router'

describe('DepthGatingLayer', () => {
  it('should extract features from prompt', () => {
    const layer = new DepthGatingLayer()
    const features = layer.extractFeatures('function add(a, b) { return a + b }')
    expect(features.promptLength).toBeGreaterThan(0)
    expect(features.codeRatio).toBeGreaterThanOrEqual(0)
    expect(features.tokenDensity).toBeGreaterThan(0)
    expect(features.tokenDensity).toBeLessThanOrEqual(1)
  })

  it('should detect code in prompts', () => {
    const layer = new DepthGatingLayer()
    const codeFeatures = layer.extractFeatures('function class const let if for while')
    expect(codeFeatures.codeRatio).toBeGreaterThan(0.5)
  })

  it('should compute a score between 0 and 1', () => {
    const layer = new DepthGatingLayer()
    const features: RouterFeatures = {
      promptLength: 100,
      codeRatio: 0.3,
      tokenDensity: 0.5,
      noveltyScore: 0.5,
      cacheHitProbability: 0.0,
    }
    const score = layer.computeScore(features)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('should route to CACHE_HIT for high cache probability', () => {
    const layer = new DepthGatingLayer()
    const features: RouterFeatures = {
      promptLength: 100,
      codeRatio: 0.2,
      tokenDensity: 0.5,
      noveltyScore: 0.5,
      cacheHitProbability: 0.95,
    }
    expect(layer.route(features)).toBe(DepthLevel.CACHE_HIT)
  })
})

describe('AdaptiveRouter', () => {
  it('should route a request and return a decision', () => {
    const router = new AdaptiveRouter()
    const decision = router.routeRequest('function add(a, b) { return a + b }')
    expect(decision.depth).toBeDefined()
    expect(decision.confidence).toBeGreaterThan(0)
    expect(decision.confidence).toBeLessThanOrEqual(1)
    expect(decision.reason.length).toBeGreaterThan(0)
  })

  it('should cache and hit on repeated prompts', () => {
    const router = new AdaptiveRouter()
    const prompt = 'test prompt for caching'

    router.updateCache(prompt, { result: 'cached' })
    const decision = router.routeRequest(prompt)

    expect(decision.depth).toBe(DepthLevel.CACHE_HIT)
    expect(decision.confidence).toBe(0.95)
  })

  it('should track stats', () => {
    const router = new AdaptiveRouter()
    router.routeRequest('prompt 1')
    router.routeRequest('prompt 2')
    router.updateCache('prompt 1', { result: 'cached' })
    router.routeRequest('prompt 1')

    const stats = router.getStats()
    expect(stats.totalRequests).toBe(3)
    expect(stats.cacheHits).toBe(1)
    expect(stats.cacheMisses).toBe(2)
  })

  it('should accept context', () => {
    const router = new AdaptiveRouter()
    const decision = router.routeRequest('test', { noveltyScore: 0.1 })
    expect(decision).toBeDefined()
  })
})

describe('getRouter', () => {
  it('should return a singleton', () => {
    const a = getRouter()
    const b = getRouter()
    expect(a).toBe(b)
  })
})
