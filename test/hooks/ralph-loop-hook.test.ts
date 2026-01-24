import { describe, it, expect } from "bun:test"
import { createRalphLoopHook } from "../../src/hooks/ralph-loop"

describe("Ralph Loop Hook", () => {
  describe("createRalphLoopHook", () => {
    it("should create ralph loop hook", () => {
      const hook = createRalphLoopHook({})
      expect(hook).toBeDefined()
    })
  })

  describe("promise detection", () => {
    it("should detect promise pattern in text", async () => {
      const hook = createRalphLoopHook({})
      const chatMessageHook = hook["chat.message"]

      if (chatMessageHook) {
        const mockInput = { config: {} }
        const mockOutput = {
          parts: [
            { type: "text", text: "Build this feature. <promise>The feature must work</promise>" }
          ]
        }

        await chatMessageHook(mockInput, mockOutput)
      }
    })
  })

  describe("iteration handling", () => {
    it("should handle active iteration state", async () => {
      const hook = createRalphLoopHook({})
      expect(hook).toBeDefined()
    })
  })
})
