import { describe, it, expect } from "bun:test"
import { initializeCommandLoader, getCommandLoader } from "../../src/features/command-loader"

describe("Command Loader Feature", () => {
  describe("initializeCommandLoader", () => {
    it("should initialize command loader", async () => {
      const result = await initializeCommandLoader()
      expect(result).toBeDefined()
    })
  })

  describe("getCommandLoader", () => {
    it("should return loader after initialization", async () => {
      await initializeCommandLoader()
      const loader = getCommandLoader()
      expect(loader).toBeDefined()
    })
  })
})
