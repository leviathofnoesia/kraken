import { describe, it, expect } from "bun:test"
import { createSessionStorage } from "../../src/features/session-storage"

describe("Session Storage Feature", () => {
  describe("createSessionStorage", () => {
    it("should create session storage", () => {
      const storage = createSessionStorage({})
      expect(storage).toBeDefined()
    })
  })
})
