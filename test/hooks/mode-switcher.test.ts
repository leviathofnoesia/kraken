import { describe, it, expect } from "bun:test"
import { createModeSwitcher } from "../../src/hooks/think-mode/mode-switcher"

describe("Mode Switcher", () => {
  describe("createModeSwitcher", () => {
    it("should create mode switcher", () => {
      const switcher = createModeSwitcher({})
      expect(switcher).toBeDefined()
    })
  })
})
