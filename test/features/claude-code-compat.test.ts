import { describe, it, expect } from "bun:test"
import { createClaudeCodeCompatibilityLayer } from "../../src/features/claude-code-compatibility"

describe("Claude Code Compatibility Feature", () => {
  describe("createClaudeCodeCompatibilityLayer", () => {
    it("should create claude code compatibility layer", () => {
      const layer = createClaudeCodeCompatibilityLayer({})
      expect(layer).toBeDefined()
    })

    it("should have config hook", () => {
      const layer = createClaudeCodeCompatibilityLayer({})
      expect(layer.config).toBeDefined()
    })
  })
})
