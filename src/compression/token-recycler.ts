import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface DecomposedPrompt {
  skeleton: string
  ink: string
  skeletonHash: string
  originalTokens: number
}

const SKELETON_TOKEN_LIMIT = 256
const LARGE_PROMPT_THRESHOLD = 2000
const LRU_CACHE_SIZE = 500

const PRIORITY_PATTERNS = [
  /^(import|export|const|let|var|function|class|interface|type)/,
  /^\s*(#|\/\/|\/\*)/,
  /^\s*(-|\*|\d+\.)/,
  /^\s*\|\s*\w+/,
  /^[A-Z][A-Z_]+:/,
]

export class TokenRecycler {
  private skeletonCache = new Map<string, string>()
  private accessOrder: string[] = []
  private cachePath: string

  constructor(cachePath?: string) {
    this.cachePath =
      cachePath ??
      path.join(
        process.env.HOME ?? process.env.USERPROFILE ?? '~',
        '.kraken-code',
        'skeleton_cache.json',
      )
    this.loadCache()
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
  }

  private extractSkeleton(prompt: string): string {
    const lines = prompt.split('\n')
    const skeletonLines: string[] = []

    for (const line of lines) {
      if (this.estimateTokens(skeletonLines.join(' ')) >= SKELETON_TOKEN_LIMIT) break

      let matched = false
      for (const pattern of PRIORITY_PATTERNS) {
        if (pattern.test(line)) {
          skeletonLines.push(line)
          matched = true
          break
        }
      }
      if (matched) continue

      if (/[{}()\[\]]/.test(line) || /->|=>/.test(line)) {
        skeletonLines.push(line)
      }
    }

    let skeleton = skeletonLines.join('\n')
    while (this.estimateTokens(skeleton) > SKELETON_TOKEN_LIMIT && skeletonLines.length > 1) {
      skeletonLines.splice(Math.floor(skeletonLines.length / 2))
      skeleton = skeletonLines.join('\n')
    }

    return skeleton
  }

  private extractInk(prompt: string, skeleton: string): string {
    const skeletonSet = new Set(skeleton.split('\n'))
    return prompt
      .split('\n')
      .filter((line) => !skeletonSet.has(line))
      .join('\n')
  }

  private mergeParts(skeleton: string, ink: string): string {
    return skeleton + '\n\n' + ink
  }

  private computeSkeletonHash(skeleton: string): string {
    return createHash('sha256').update(skeleton, 'utf-8').digest('hex')
  }

  private loadCache(): void {
    try {
      if (!fs.existsSync(this.cachePath)) return
      const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8')) as Record<string, string>
      for (const [key, val] of Object.entries(data)) {
        this.skeletonCache.set(key, val)
        this.accessOrder.push(key)
      }
    } catch {
      // empty cache is fine
    }
  }

  private saveCache(): void {
    try {
      const dir = path.dirname(this.cachePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const obj: Record<string, string> = {}
      for (const [key, val] of this.skeletonCache) {
        obj[key] = val
      }
      fs.writeFileSync(this.cachePath, JSON.stringify(obj))
    } catch {
      // write failure is non-critical
    }
  }

  private updateLru(key: string): void {
    this.skeletonCache.delete(key)
    this.accessOrder = this.accessOrder.filter((k) => k !== key)

    while (this.skeletonCache.size > LRU_CACHE_SIZE) {
      const oldest = this.accessOrder.shift()
      if (oldest) this.skeletonCache.delete(oldest)
    }
  }

  decompose(prompt: string): DecomposedPrompt {
    const tokenCount = this.estimateTokens(prompt)

    if (tokenCount < LARGE_PROMPT_THRESHOLD) {
      return {
        skeleton: prompt,
        ink: '',
        skeletonHash: this.computeSkeletonHash(prompt),
        originalTokens: tokenCount,
      }
    }

    const skeleton = this.extractSkeleton(prompt)
    const ink = this.extractInk(prompt, skeleton)
    const skeletonHash = this.computeSkeletonHash(skeleton)

    this.updateLru(skeletonHash)
    if (!this.skeletonCache.has(skeletonHash)) {
      this.skeletonCache.set(skeletonHash, skeleton)
      this.accessOrder.push(skeletonHash)
      this.saveCache()
    }

    return { skeleton, ink, skeletonHash, originalTokens: tokenCount }
  }

  reconstruct(skeletonHash: string, ink: string): string | undefined {
    const skeleton = this.skeletonCache.get(skeletonHash)
    if (!skeleton) return undefined
    return this.mergeParts(skeleton, ink)
  }

  getStats(): Record<string, any> {
    const totalCached = this.skeletonCache.size
    let avgSkeletonTokens = 0
    if (totalCached > 0) {
      let total = 0
      for (const skel of this.skeletonCache.values()) {
        total += this.estimateTokens(skel)
      }
      avgSkeletonTokens = total / totalCached
    }

    return {
      cachedSkeletons: totalCached,
      cacheCapacity: LRU_CACHE_SIZE,
      avgSkeletonTokens,
      skeletonTokenLimit: SKELETON_TOKEN_LIMIT,
    }
  }
}

let globalRecycler: TokenRecycler | null = null

export function getRecycler(): TokenRecycler {
  if (!globalRecycler) {
    globalRecycler = new TokenRecycler()
  }
  return globalRecycler
}

export function decomposePrompt(prompt: string): DecomposedPrompt {
  return getRecycler().decompose(prompt)
}

export function reconstructPrompt(skeletonHash: string, ink: string): string | undefined {
  return getRecycler().reconstruct(skeletonHash, ink)
}
