import { describe, it, expect } from "bun:test"
import { poseidonAgent } from "../../src/agents/poseidon"

describe("Poseidon Agent", () => {
  it("should export poseidonAgent", () => {
    expect(poseidonAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(poseidonAgent.name).toBe("Poseidon")
    expect(poseidonAgent.description).toBeDefined()
    expect(poseidonAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(poseidonAgent.name).toBe("Poseidon")
  })

  it("should have valid prompt structure", () => {
    const prompt = poseidonAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(poseidonAgent.description).toBeDefined()
    expect(typeof poseidonAgent.description).toBe("string")
  })
})
