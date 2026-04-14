import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface CacheEntry {
  crc64: string
  timestamp: number
  promptHash: string
  result: Record<string, any>
  accessCount: number
  lastAccess: number
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_ENTRIES = 10000

export class PromptJournal {
  private cache = new Map<string, CacheEntry>()
  private crc64History: Array<{ crc64: string; timestamp: number }> = []
  private cachePath: string

  constructor(cachePath?: string) {
    this.cachePath =
      cachePath ??
      path.join(
        process.env.HOME ?? process.env.USERPROFILE ?? '~',
        '.kraken-code',
        'prompt_cache.json',
      )
    this.loadCache()
  }

  private computeCrc64(text: string): string {
    return createHash('sha256').update(text, 'utf-8').digest().subarray(0, 8).toString('hex')
  }

  private computeContentHash(text: string): string {
    return createHash('sha256').update(text, 'utf-8').digest('hex')
  }

  private loadCache(): void {
    try {
      if (!fs.existsSync(this.cachePath)) return
      const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8')) as {
        cache?: Record<string, any>
        history?: Array<{ crc64: string; timestamp: number }>
      }
      if (data.cache) {
        for (const [key, val] of Object.entries(data.cache)) {
          this.cache.set(key, val as CacheEntry)
        }
      }
      if (data.history) {
        this.crc64History = data.history
      }
      this.cleanupExpired()
    } catch {
      this.cache.clear()
      this.crc64History = []
    }
  }

  private saveCache(): void {
    try {
      const dir = path.dirname(this.cachePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const cacheObj: Record<string, any> = {}
      for (const [key, val] of this.cache) {
        cacheObj[key] = val
      }
      fs.writeFileSync(
        this.cachePath,
        JSON.stringify({ cache: cacheObj, history: this.crc64History }),
      )
    } catch {
      // non-critical
    }
  }

  private cleanupExpired(): void {
    const cutoff = Date.now() - CACHE_TTL_MS
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < cutoff) this.cache.delete(key)
    }
    this.crc64History = this.crc64History.filter((h) => h.timestamp > cutoff)
  }

  private evictLru(): void {
    if (this.cache.size < MAX_ENTRIES) return

    let oldestKey: string | null = null
    let oldestTime = Infinity
    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess
        oldestKey = key
      }
    }
    if (oldestKey) this.cache.delete(oldestKey)
  }

  checkRepeat(prompt: string): Record<string, any> | null {
    const crc64 = this.computeCrc64(prompt)
    const contentHash = this.computeContentHash(prompt)

    const entry = this.cache.get(crc64)
    if (entry) {
      if (entry.promptHash === contentHash) {
        entry.accessCount++
        entry.lastAccess = Date.now()
        this.saveCache()
        return entry.result
      }
    }

    for (let i = this.crc64History.length - 1; i >= 0; i--) {
      const hist = this.crc64History[i]
      if (hist.crc64 === crc64) {
        const age = Date.now() - hist.timestamp
        if (age < CACHE_TTL_MS) {
          return { is_repeat: true, age_hours: age / (1000 * 60 * 60) }
        }
      }
    }

    return null
  }

  recordPrompt(prompt: string, result: Record<string, any>): void {
    const crc64 = this.computeCrc64(prompt)
    const contentHash = this.computeContentHash(prompt)

    this.evictLru()

    this.cache.set(crc64, {
      crc64,
      timestamp: Date.now(),
      promptHash: contentHash,
      result,
      accessCount: 1,
      lastAccess: Date.now(),
    })

    this.crc64History.push({ crc64, timestamp: Date.now() })
    if (this.crc64History.length > MAX_ENTRIES * 2) {
      this.crc64History = this.crc64History.slice(-MAX_ENTRIES)
    }

    this.saveCache()
  }

  getStats(): Record<string, any> {
    let totalLookups = 0
    for (const entry of this.cache.values()) {
      totalLookups += entry.accessCount
    }

    const uniquePrompts = this.cache.size
    const totalHistory = this.crc64History.length
    const uniqueCrc64 = new Set(this.crc64History.map((h) => h.crc64)).size
    const repeatRate = totalHistory > 0 ? ((totalHistory - uniqueCrc64) / totalHistory) * 100 : 0

    return {
      uniquePrompts,
      totalLookups,
      repeatRatePercent: repeatRate,
      historySize: totalHistory,
      cacheSize: this.cache.size,
    }
  }
}

let globalJournal: PromptJournal | null = null

export function getJournal(): PromptJournal {
  if (!globalJournal) {
    globalJournal = new PromptJournal()
  }
  return globalJournal
}

export function checkPromptRepeat(prompt: string): Record<string, any> | null {
  return getJournal().checkRepeat(prompt)
}

export function recordPrompt(prompt: string, result: Record<string, any>): void {
  getJournal().recordPrompt(prompt, result)
}
