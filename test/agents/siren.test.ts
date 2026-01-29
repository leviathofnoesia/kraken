import { describe, it, expect } from "bun:test"
import { sirenAgent } from "../../src/agents/siren"

describe("Siren Agent", () => {
  it("should export sirenAgent", () => {
    expect(sirenAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(sirenAgent.description).toBeDefined()
    expect(sirenAgent.prompt).toBeDefined()
  })

  it("should have valid prompt structure", () => {
    const prompt = sirenAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(sirenAgent.description).toBeDefined()
    expect(typeof sirenAgent.description).toBe("string")
  })
})
