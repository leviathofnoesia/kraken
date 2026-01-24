import { describe, it, expect } from "bun:test"
import { createThinkingBlockValidator } from "../../src/hooks/thinking-block-validator"

describe("Thinking Block Validator", () => {
  describe("createThinkingBlockValidator", () => {
    it("should create thinking block validator", () => {
      const hook = createThinkingBlockValidator({})
      expect(hook).toBeDefined()
    })

    it("should have chat message hook", () => {
      const hook = createThinkingBlockValidator({})
      expect(hook["chat.message"]).toBeDefined()
    })
  })
})
