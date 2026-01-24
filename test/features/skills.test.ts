import { describe, it, expect } from "bun:test"
import { initializeSkillLoader, getSkills, getSkillContent } from "../../src/features/skills"

describe("Skills Feature", () => {
  describe("initializeSkillLoader", () => {
    it("should initialize skill loader", async () => {
      const result = await initializeSkillLoader()
      expect(result).toBeDefined()
    })
  })

  describe("getSkills", () => {
    it("should get available skills", async () => {
      const skills = await getSkills()
      expect(Array.isArray(skills)).toBe(true)
    })
  })

  describe("getSkillContent", () => {
    it("should get skill content", async () => {
      const content = await getSkillContent("test-skill")
      expect(content).toBeDefined()
    })

    it("should handle missing skill", async () => {
      const content = await getSkillContent("nonexistent-skill")
      expect(content).toBeNull()
    })
  })
})
