import { describe, it, expect } from "bun:test"
import { createSessionStorageHook, sessionStorageHooks } from "../../src/hooks/session-storage-hook"

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
  })

  describe("sessionStorageHooks", () => {
    it("should export sessionStorageHooks", () => {
      expect(sessionStorageHooks).toBeDefined()
    })
  })
})
