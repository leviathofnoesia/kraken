import { describe, it, expect } from "bun:test"
import { coralAgent } from "../../src/agents/coral"

describe("Coral Agent", () => {
  it("should export coralAgent", () => {
    expect(coralAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(coralAgent.description).toBeDefined()
    expect(coralAgent.prompt).toBeDefined()
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
