import { describe, it, expect, beforeEach } from 'bun:test'
import { TokenRecycler, decomposePrompt } from '../../src/compression/token-recycler'
import { PromptJournal } from '../../src/compression/prompt-journal'
import { LLMTLDRCompressor, estimateTokenCount } from '../../src/compression/ocx-compress'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kraken-test-'))

describe('TokenRecycler', () => {
  it('should return small prompts as-is', () => {
    const recycler = new TokenRecycler(path.join(tmpDir(), 'cache.json'))
    const result = recycler.decompose('short prompt')
    expect(result.skeleton).toBe('short prompt')
    expect(result.ink).toBe('')
    expect(result.originalTokens).toBeLessThan(2000)
  })

  it('should decompose large prompts into skeleton + ink', () => {
    const longText = Array(500).fill('function test() { return true }').join('\n')
    const recycler = new TokenRecycler(path.join(tmpDir(), 'cache.json'))
    const result = recycler.decompose(longText)
    expect(result.skeleton.length).toBeGreaterThan(0)
    expect(result.originalTokens).toBeGreaterThan(2000)
    expect(result.skeletonHash.length).toBeGreaterThan(0)
  })

  it('should reconstruct from cached skeleton', () => {
    const cachePath = path.join(tmpDir(), 'cache.json')
    const recycler = new TokenRecycler(cachePath)
    const longText = Array(500).fill("import { test } from 'module'").join('\n')
    const decomposed = recycler.decompose(longText)
    const reconstructed = recycler.reconstruct(decomposed.skeletonHash, decomposed.ink)
    expect(reconstructed).toBeDefined()
    expect(reconstructed!.length).toBeGreaterThan(0)
  })

  it('should return undefined for unknown skeleton hash', () => {
    const recycler = new TokenRecycler(path.join(tmpDir(), 'cache.json'))
    expect(recycler.reconstruct('nonexistent', '')).toBeUndefined()
  })

  it('should report stats', () => {
    const recycler = new TokenRecycler(path.join(tmpDir(), 'cache.json'))
    const stats = recycler.getStats()
    expect(stats.cacheCapacity).toBe(500)
    expect(stats.skeletonTokenLimit).toBe(256)
  })
})

describe('PromptJournal', () => {
  it('should record and check prompts', () => {
    const journal = new PromptJournal(path.join(tmpDir(), 'journal.json'))
    journal.recordPrompt('test prompt', { level: 'full' })
    const result = journal.checkRepeat('test prompt')
    expect(result).toBeDefined()
    expect(result.level).toBe('full')
  })

  it('should return null for unknown prompts', () => {
    const journal = new PromptJournal(path.join(tmpDir(), 'journal.json'))
    expect(journal.checkRepeat('unknown prompt')).toBeNull()
  })

  it('should track stats', () => {
    const journal = new PromptJournal(path.join(tmpDir(), 'journal.json'))
    journal.recordPrompt('prompt a', {})
    journal.recordPrompt('prompt b', {})
    journal.checkRepeat('prompt a')
    const stats = journal.getStats()
    expect(stats.uniquePrompts).toBe(2)
    expect(stats.totalLookups).toBeGreaterThan(0)
  })
})

describe('LLMTLDRCompressor round-trip fidelity', () => {
  it('should preserve code-like content reasonably', () => {
    const compressor = new LLMTLDRCompressor()
    const code = `function add(a: number, b: number): number {
      return a + b
    }
    const result = add(1, 2)
    console.log(result)`
    const roundTripped = compressor.roundTrip(code)
    expect(roundTripped.length).toBeGreaterThan(0)
  })

  it('should compress longer texts better', () => {
    const compressor = new LLMTLDRCompressor()
    const short = 'hello world'
    const long = Array(100).fill('function test() { const x = 1; return x }').join('\n')

    const shortCompressed = compressor.compress(short)
    const longCompressed = compressor.compress(long)

    const shortRatio = Buffer.byteLength(short) / shortCompressed.length
    const longRatio = Buffer.byteLength(long) / longCompressed.length

    expect(longRatio).toBeGreaterThan(shortRatio)
  })
})
