import { describe, it, expect } from "bun:test"
import { initializeKratos, saveMemory, searchMemories } from "../../src/features/memory"

describe("Memory Feature", () => {
  describe("initializeKratos", () => {
    it("should initialize kratos memory", async () => {
      const result = await initializeKratos()
      expect(result).toBeDefined()
    })
  })

  describe("saveMemory", () => {
    it("should save memory", async () => {
      const result = await saveMemory({
        summary: "Test memory",
        content: "Test content",
        tags: ["test"],
        importance: "medium"
      })
      expect(result).toBeDefined()
    })
  })

  describe("searchMemories", () => {
    it("should search memories", async () => {
      const results = await searchMemories("test")
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
