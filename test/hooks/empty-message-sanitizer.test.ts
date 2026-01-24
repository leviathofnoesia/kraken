import { describe, it, expect } from "bun:test"
import { createEmptyMessageSanitizer } from "../../src/hooks/empty-message-sanitizer"

describe("Empty Message Sanitizer", () => {
  describe("createEmptyMessageSanitizer", () => {
    it("should create empty message sanitizer", () => {
      const hook = createEmptyMessageSanitizer({})
      expect(hook).toBeDefined()
    })
  })
})
