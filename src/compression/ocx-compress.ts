import { createHash, randomBytes } from 'node:crypto'
import { deflateSync, inflateSync } from 'node:zlib'

export interface CompressionStats {
  originalTokens: number
  compressedTokens: number
  ratio: number
  bleuDrop: number
}

export class DynamicDictionary {
  private patterns = new Map<string, number>()
  private reverse = new Map<number, string>()
  private counter = 0

  constructor(private maxEntries: number = 65536) {}

  addPattern(pattern: string): number {
    const existing = this.patterns.get(pattern)
    if (existing !== undefined) return existing

    if (this.patterns.size >= this.maxEntries) {
      this.evictLru()
    }

    const idx = this.counter++
    this.patterns.set(pattern, idx)
    this.reverse.set(idx, pattern)
    return idx
  }

  getPattern(idx: number): string | undefined {
    return this.reverse.get(idx)
  }

  get size(): number {
    return this.patterns.size
  }

  private evictLru(): void {
    const firstKey = this.patterns.keys().next().value
    if (firstKey !== undefined) {
      const idx = this.patterns.get(firstKey)!
      this.patterns.delete(firstKey)
      this.reverse.delete(idx)
    }
  }
}

const BASE_PATTERNS = [
  'function',
  'const',
  'let',
  'return',
  'import',
  'export',
  'class',
  'interface',
  'type',
  'async',
  'await',
  'try',
  'catch',
  'throw',
  'if',
  'else',
  'for',
  'while',
  'switch',
  'case',
  'break',
  'continue',
  'new',
  'this',
  'super',
  'extends',
  'implements',
  'static',
  'public',
  'private',
  'protected',
  'readonly',
  'abstract',
  'enum',
]

export class LLMTLDRCompressor {
  private dictionary = new DynamicDictionary()

  constructor() {
    for (const pattern of BASE_PATTERNS) {
      this.dictionary.addPattern(pattern)
    }
  }

  private tokenize(text: string): string[] {
    const tokens: string[] = []
    const words = text.match(/[\w']+|[^\w\s]/g) ?? []
    for (const word of words) {
      if (word.length > 6) {
        tokens.push(word.slice(0, 3) + '##' + word.slice(3))
      } else {
        tokens.push(word)
      }
    }
    return tokens
  }

  private extractPatterns(tokens: string[]): string[] {
    const ngramCounts = new Map<string, number>()
    const patterns: string[] = []

    for (let i = 0; i < tokens.length - 2; i++) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`
      const count = (ngramCounts.get(trigram) ?? 0) + 1
      ngramCounts.set(trigram, count)
      if (count >= 2) patterns.push(trigram)
    }

    return patterns
  }

  compress(text: string): Buffer {
    const tokens = this.tokenize(text)
    const patterns = this.extractPatterns(tokens)

    const patternIds: number[] = []
    const remainingTokens: string[] = []

    let i = 0
    while (i < tokens.length) {
      let matched = false
      for (const pattern of patterns) {
        const patternTokens = pattern.split(' ')
        if (
          patternTokens.length > 0 &&
          tokens.slice(i, i + patternTokens.length).join(' ') === pattern
        ) {
          patternIds.push(this.dictionary.addPattern(pattern))
          i += patternTokens.length
          matched = true
          break
        }
      }
      if (!matched) {
        remainingTokens.push(tokens[i])
        i++
      }
    }

    const magic = 0x4f43
    const version = 1

    const headerSize = 12
    const patternDataSize = patternIds.length * 2
    const remainingBuf = Buffer.from(remainingTokens.join(' '), 'utf-8')

    const header = Buffer.alloc(headerSize)
    header.writeUInt16LE(magic, 0)
    header.writeUInt16LE(version, 2)
    header.writeUInt32LE(patternIds.length, 4)
    header.writeUInt32LE(remainingTokens.length, 8)

    const patternBuf = Buffer.alloc(patternDataSize)
    for (let j = 0; j < patternIds.length; j++) {
      patternBuf.writeUInt16LE(patternIds[j], j * 2)
    }

    const payload = Buffer.concat([header, patternBuf, remainingBuf])
    return deflateSync(payload)
  }

  decompress(data: Buffer): string {
    let payload: Buffer
    try {
      payload = inflateSync(data)
    } catch {
      throw new Error('Invalid magic number')
    }

    const magic = payload.readUInt16LE(0)
    const version = payload.readUInt16LE(2)
    const numPatterns = payload.readUInt32LE(4)
    const _numTokens = payload.readUInt32LE(8)

    if (magic !== 0x4f43) throw new Error('Invalid magic number')
    if (version !== 1) throw new Error(`Unsupported version: ${version}`)

    let offset = 12
    const patternIds: number[] = []
    for (let j = 0; j < numPatterns; j++) {
      patternIds.push(payload.readUInt16LE(offset))
      offset += 2
    }

    const remainingText = payload.subarray(offset).toString('utf-8')

    const decompressedParts: string[] = []
    for (const pid of patternIds) {
      const pattern = this.dictionary.getPattern(pid)
      if (pattern) decompressedParts.push(pattern)
    }
    decompressedParts.push(remainingText)

    return decompressedParts.join(' ')
  }

  roundTrip(text: string): string {
    const compressed = this.compress(text)
    return this.decompress(compressed)
  }
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
}

export function calculateCompressionRatio(original: string, compressed: Buffer): number {
  const origTokens = estimateTokenCount(original)
  const compTokens = compressed.length / 4
  return compTokens > 0 ? origTokens / compTokens : 0
}

export function estimateBleuDrop(original: string, decompressed: string): number {
  const origWords = new Set(original.toLowerCase().split(/\s+/))
  const decompWords = new Set(decompressed.toLowerCase().split(/\s+/))

  if (origWords.size === 0) return 0

  let overlap = 0
  for (const word of decompWords) {
    if (origWords.has(word)) overlap++
  }
  const precision = decompWords.size > 0 ? overlap / decompWords.size : 0
  return (1 - precision) * 100
}
