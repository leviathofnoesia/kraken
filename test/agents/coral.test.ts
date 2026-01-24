import { describe, it, expect } from "bun:test"
import { coralAgent } from "../../src/agents/coral"

describe("Coral Agent", () => {
  it("should export coralAgent", () => {
    expect(coralAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(coralAgent.name).toBe("Coral")
    expect(coralAgent.description).toBeDefined()
    expect(coralAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(coralAgent.name).toBe("Coral")
  })

  it("should have valid prompt structure", () => {
    const prompt = coralAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(coralAgent.description).toBeDefined()
    expect(typeof coralAgent.description).toBe("string")
  })
})
