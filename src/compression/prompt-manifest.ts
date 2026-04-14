import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { LLMTLDRCompressor, estimateTokenCount } from './ocx-compress'

export interface PromptMetadata {
  key: string
  category: string
  originalTokens: number
  compressedSize: number
  compressionRatio: number
}

export class PromptManifest {
  private compressor = new LLMTLDRCompressor()
  private prompts = new Map<string, Buffer>()
  private metadata = new Map<string, PromptMetadata>()
  private manifestPath: string

  constructor(manifestPath?: string) {
    this.manifestPath = manifestPath ?? path.join(__dirname, 'data', 'prompt_manifest.json')
    this.loadManifest()
  }

  private loadManifest(): void {
    try {
      if (!fs.existsSync(this.manifestPath)) return
      const data = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'))
      const entries = data.metadata ?? {}
      for (const [name, meta] of Object.entries(entries) as [string, any][]) {
        this.metadata.set(name, meta)
      }
    } catch {
      // empty manifest is fine
    }
  }

  private saveManifest(): void {
    try {
      const dir = path.dirname(this.manifestPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const metaObj: Record<string, any> = {}
      for (const [name, meta] of this.metadata) {
        metaObj[name] = meta
      }
      fs.writeFileSync(
        this.manifestPath,
        JSON.stringify({ metadata: metaObj, version: '1.0' }, null, 2),
      )
    } catch {
      // write failure is non-critical
    }
  }

  private generateKey(name: string): string {
    const hashBytes = createHash('md5').update(name, 'utf-8').digest()
    return hashBytes.subarray(0, 2).toString('hex')
  }

  registerPrompt(name: string, prompt: string, category: string = 'general'): string {
    const key = this.generateKey(name)
    const compressed = this.compressor.compress(prompt)

    this.prompts.set(key, compressed)
    this.metadata.set(name, {
      key,
      category,
      originalTokens: estimateTokenCount(prompt),
      compressedSize: compressed.length,
      compressionRatio: estimateTokenCount(prompt) / (compressed.length / 4 || 1),
    })

    this.saveManifest()
    return key
  }

  getPrompt(key: string): string | undefined {
    const compressed = this.prompts.get(key)
    if (!compressed) return undefined
    return this.compressor.decompress(compressed)
  }

  getPromptByName(name: string): string | undefined {
    return this.prompt(this.generateKey(name))
  }

  private prompt(key: string): string | undefined {
    return this.getPrompt(key)
  }

  getStats(): Record<string, any> {
    if (this.metadata.size === 0) return {}

    let totalOriginal = 0
    let totalCompressed = 0
    const names: string[] = []

    for (const [name, meta] of this.metadata) {
      totalOriginal += meta.originalTokens
      totalCompressed += meta.compressedSize
      names.push(name)
    }

    const avgRatio = totalCompressed > 0 ? totalOriginal / (totalCompressed / 4) : 0

    return {
      totalPrompts: this.metadata.size,
      totalOriginalTokens: totalOriginal,
      totalCompressedBytes: totalCompressed,
      averageCompressionRatio: avgRatio,
      prompts: names,
    }
  }
}

let globalManifest: PromptManifest | null = null

export function getManifest(): PromptManifest {
  if (!globalManifest) {
    globalManifest = new PromptManifest()
  }
  return globalManifest
}

export function lookupPrompt(keyOrName: string): string | undefined {
  const manifest = getManifest()
  const byKey = manifest.getPrompt(keyOrName)
  if (byKey !== undefined) return byKey
  return manifest.getPromptByName(keyOrName)
}
