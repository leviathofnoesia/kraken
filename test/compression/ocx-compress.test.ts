import { describe, it, expect } from 'bun:test'
import {
  LLMTLDRCompressor,
  DynamicDictionary,
  estimateTokenCount,
  calculateCompressionRatio,
  estimateBleuDrop,
} from '../../src/compression/ocx-compress'

describe('DynamicDictionary', () => {
  it('should add patterns and return IDs', () => {
    const dict = new DynamicDictionary()
    const id1 = dict.addPattern('function')
    const id2 = dict.addPattern('const')
    expect(id1).not.toBe(id2)
    expect(dict.getPattern(id1)).toBe('function')
    expect(dict.getPattern(id2)).toBe('const')
  })

  it('should return same ID for duplicate patterns', () => {
    const dict = new DynamicDictionary()
    const id1 = dict.addPattern('hello')
    const id2 = dict.addPattern('hello')
    expect(id1).toBe(id2)
  })

  it('should return undefined for unknown IDs', () => {
    const dict = new DynamicDictionary()
    expect(dict.getPattern(99999)).toBeUndefined()
  })

  it('should report size correctly', () => {
    const dict = new DynamicDictionary()
    expect(dict.size).toBe(0)
    dict.addPattern('a')
    expect(dict.size).toBe(1)
    dict.addPattern('a')
    expect(dict.size).toBe(1)
  })

  it('should evict when exceeding maxEntries', () => {
    const dict = new DynamicDictionary(3)
    dict.addPattern('a')
    dict.addPattern('b')
    dict.addPattern('c')
    dict.addPattern('d')
    expect(dict.size).toBe(3)
  })
})

describe('LLMTLDRCompressor', () => {
  it('should compress and decompress text', () => {
    const compressor = new LLMTLDRCompressor()
    const original = 'function add(a, b) { return a + b }'
    const compressed = compressor.compress(original)
    const decompressed = compressor.decompress(compressed)

    expect(compressed).toBeInstanceOf(Buffer)
    expect(compressed.length).toBeGreaterThan(0)
    expect(typeof decompressed).toBe('string')
  })

  it('should round-trip text', () => {
    const compressor = new LLMTLDRCompressor()
    const text = 'This is a test string for compression with some repeated patterns'
    const result = compressor.roundTrip(text)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should produce compressed output smaller than original for large text', () => {
    const compressor = new LLMTLDRCompressor()
    const text = 'function add(a, b) { return a + b } '.repeat(50)
    const compressed = compressor.compress(text)
    expect(compressed.length).toBeLessThan(Buffer.byteLength(text, 'utf-8'))
  })

  it('should reject invalid data on decompress', () => {
    const compressor = new LLMTLDRCompressor()
    const badData = Buffer.alloc(20, 0)
    expect(() => compressor.decompress(badData)).toThrow()
  })

  it('should handle empty-ish text', () => {
    const compressor = new LLMTLDRCompressor()
    const text = 'hello world'
    const result = compressor.roundTrip(text)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('estimateTokenCount', () => {
  it('should return positive for non-empty text', () => {
    expect(estimateTokenCount('Hello world')).toBeGreaterThan(0)
  })

  it('should scale with text length', () => {
    const short = estimateTokenCount('Hello')
    const long = estimateTokenCount('Hello world this is a longer text')
    expect(long).toBeGreaterThan(short)
  })
})

describe('calculateCompressionRatio', () => {
  it('should calculate ratio', () => {
    const original = 'function test() { return true }'
    const compressor = new LLMTLDRCompressor()
    const compressed = compressor.compress(original)
    const ratio = calculateCompressionRatio(original, compressed)
    expect(ratio).toBeGreaterThan(0)
  })
})

describe('estimateBleuDrop', () => {
  it('should return 0 for identical text', () => {
    expect(estimateBleuDrop('hello world test', 'hello world test')).toBe(0)
  })

  it('should return positive for different text', () => {
    const drop = estimateBleuDrop('hello world', 'foo bar baz')
    expect(drop).toBeGreaterThan(0)
  })
})
