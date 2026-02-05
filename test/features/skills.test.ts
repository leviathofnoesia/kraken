import { describe, it, expect } from "bun:test"
import { skillLoader } from "../../src/features/skills"

describe("Skills Feature", () => {
  describe("skillLoader", () => {
    it("should be exported", () => {
      expect(skillLoader).toBeDefined()
    })

    it("should load skills", () => {
      // Assuming loadSkills returns an array
      const skills = skillLoader.loadSkills()
      expect(Array.isArray(skills)).toBe(true)
    })
  })
})
