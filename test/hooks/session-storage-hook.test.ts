import { describe, it, expect } from "bun:test"
import { createSessionStorageHook } from "../../src/hooks/session-storage-hook"

describe("Session Storage Hook", () => {
  describe("createSessionStorageHook", () => {
    it("should create session storage hook", () => {
      const hook = createSessionStorageHook({})
      expect(hook).toBeDefined()
    })

    it("should have tool execution tracking", () => {
      const hook = createSessionStorageHook({})
      expect(hook["tool.execute.after"]).toBeDefined()
    })
    
    it("should have message tracking", () => {
      const hook = createSessionStorageHook({})
      expect(hook["chat.message"]).toBeDefined()
    })
  })
})
