import { describe, it, expect } from "bun:test"
import { addExperience, initializeLearning, searchExperiences } from "../../src/features/memory"

describe("Learning Feature", () => {
  describe("initializeLearning", () => {
    it("should initialize unified learning", async () => {
      const result = await initializeLearning()
      expect(result).toBeDefined()
    })

  describe("addExperience", () => {
    it("should save experience", async () => {
      const result = await addExperience({
        summary: "Test experience",
        details: "Test details",
        tags: ["test"],
        outcome: "ok",
        confidence: 0.7
      })
      expect(result).toBeDefined()
    })

  describe("searchExperiences", () => {
    it("should search experiences", () => {
      const results = searchExperiences("test")
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
