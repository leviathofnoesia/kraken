import { describe, it, expect } from "bun:test"
import { nautilusAgent } from "../../src/agents/nautilus"

describe("Nautilus Agent", () => {
  it("should export nautilusAgent", () => {
    expect(nautilusAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(nautilusAgent.name).toBe("Nautilus")
    expect(nautilusAgent.description).toBeDefined()
    expect(nautilusAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(nautilusAgent.name).toBe("Nautilus")
  })

  it("should have valid prompt structure", () => {
    const prompt = nautilusAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(nautilusAgent.description).toBeDefined()
    expect(typeof nautilusAgent.description).toBe("string")
  })
})
