import { describe, it, expect } from "bun:test"
import { initializeSkillMcpManager, getSkillMcpManager } from "../../src/features/skill-mcp-manager"

describe("Skill MCP Manager Feature", () => {
  describe("initializeSkillMcpManager", () => {
    it("should initialize skill mcp manager", async () => {
      const result = await initializeSkillMcpManager()
      expect(result).toBeDefined()
    })
  })

  describe("getSkillMcpManager", () => {
    it("should return manager after initialization", async () => {
      await initializeSkillMcpManager()
      const manager = getSkillMcpManager()
      expect(manager).toBeDefined()
    })
  })
})
