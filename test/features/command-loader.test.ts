import { describe, it, expect } from "bun:test"
import { initializeCommandLoader, getCommands } from "../../src/features/command-loader"

describe("Command Loader Feature", () => {
  describe("initializeCommandLoader", () => {
    it("should initialize command loader", async () => {
      const result = await initializeCommandLoader()
      expect(result).toBeDefined()
    })
  })

  describe("getCommands", () => {
    it("should get available commands", async () => {
      const commands = await getCommands()
      expect(Array.isArray(commands)).toBe(true)
    })
  })
})
