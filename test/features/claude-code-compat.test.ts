import { describe, it, expect } from "bun:test"
import { loadClaudeCodeSettings, executeSettingsHooks, isFeatureEnabled, isPluginEnabled } from "../../src/features/claude-code-compatibility"

describe("Claude Code Compatibility Feature", () => {
  describe("loadClaudeCodeSettings", () => {
    it("should export load function", () => {
      expect(loadClaudeCodeSettings).toBeDefined()
    })
  })

  describe("executeSettingsHooks", () => {
    it("should export hook execution function", () => {
      expect(executeSettingsHooks).toBeDefined()
    })
  })
  
  describe("feature flags", () => {
    it("should export isFeatureEnabled", () => {
      expect(isFeatureEnabled).toBeDefined()
    })
    
    it("should export isPluginEnabled", () => {
      expect(isPluginEnabled).toBeDefined()
    })
  })
})
