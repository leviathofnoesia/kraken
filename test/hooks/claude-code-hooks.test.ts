import { describe, it, expect } from "bun:test"
import { createClaudeCodeHooks } from "../../src/hooks/claude-code-hooks"

describe("Claude Code Hooks", () => {
  describe("createClaudeCodeHooks", () => {
    it("should create claude code hooks", () => {
      const hook = createClaudeCodeHooks({})
      expect(hook).toBeDefined()
    })

    it("should have config hook", () => {
      const hook = createClaudeCodeHooks({})
      expect(hook.config).toBeDefined()
    })
  })
})
