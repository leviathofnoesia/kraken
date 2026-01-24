import { describe, it, expect } from "bun:test"
import { opencodeXCompress, estimateTokens } from "../../src/tools/compression"

describe("Compression Tool", () => {
  describe("tool export", () => {
    it("should export opencodeXCompress tool", () => {
      expect(opencodeXCompress).toBeDefined()
    })

    it("should have required properties", () => {
      expect(opencodeXCompress.description).toBeDefined()
      expect(opencodeXCompress.args).toBeDefined()
      expect(opencodeXCompress.execute).toBeDefined()
    })
  })

  describe("execute", () => {
    it("should handle valid text compression", async () => {
      const result = await opencodeXCompress.execute({
        text: "This is a test string for compression",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle empty text", async () => {
      const result = await opencodeXCompress.execute({
        text: "",
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
    })

    it("should handle whitespace-only text", async () => {
      const result = await opencodeXCompress.execute({
        text: "   ",
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
    })

    it("should handle cache_hit level", async () => {
      const result = await opencodeXCompress.execute({
        text: "Test text",
        level: "cache_hit",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle partial level", async () => {
      const result = await opencodeXCompress.execute({
        text: "Test text for partial compression",
        level: "partial",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle full level", async () => {
      const result = await opencodeXCompress.execute({
        text: "Test text for full compression",
        level: "full",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("estimateTokens", () => {
    it("should estimate tokens for empty string", () => {
      const tokens = estimateTokens("")
      expect(tokens).toBeGreaterThanOrEqual(0)
    })

    it("should estimate tokens for short text", () => {
      const tokens = estimateTokens("Hello world")
      expect(tokens).toBeGreaterThan(0)
    })

    it("should estimate tokens for long text", () => {
      const longText = "This is a test string. ".repeat(100)
      const tokens = estimateTokens(longText)
      expect(tokens).toBeGreaterThan(100)
    })
  })
})
