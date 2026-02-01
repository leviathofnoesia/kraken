import { describe, it, expect } from "bun:test"
import { memory } from "../../src/features/memory"

describe("Memory Feature", () => {
  describe("memory.kratos", () => {
    it("should be exported", () => {
      expect(memory.kratos).toBeDefined()
    })

    it("should have store method", () => {
      expect(typeof memory.kratos.store).toBe("function")
    })

    it("should have retrieve method", () => {
      expect(typeof memory.kratos.retrieve).toBe("function")
    })
  })
})
