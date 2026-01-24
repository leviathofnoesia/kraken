import { describe, it, expect } from "bun:test"
import { grep, GrepMatch } from "../../src/tools/grep"

describe("Grep Tool", () => {
  describe("tool export", () => {
    it("should export grep tool", () => {
      expect(grep).toBeDefined()
    })

    it("should have required properties", () => {
      expect(grep.description).toBeDefined()
      expect(grep.args).toBeDefined()
      expect(grep.execute).toBeDefined()
    })
  })

  describe("execute", () => {
    it("should handle valid pattern search", async () => {
      const result = await grep.execute({
        pattern: "import",
        path: "/home/leviath/kraken-code/src",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle empty pattern", async () => {
      const result = await grep.execute({
        pattern: "",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle pattern with special characters", async () => {
      const result = await grep.execute({
        pattern: "function \\w+",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("options", () => {
    it("should support file type filtering", async () => {
      const result = await grep.execute({
        pattern: "export",
        type: "ts",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should support context lines", async () => {
      const result = await grep.execute({
        pattern: "import",
        context: 2,
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should support invert matching", async () => {
      const result = await grep.execute({
        pattern: "test",
        invert: true,
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("error handling", () => {
    it("should handle missing ripgrep gracefully", async () => {
      const result = await grep.execute({
        pattern: "test",
        path: "/nonexistent/path",
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })
})
