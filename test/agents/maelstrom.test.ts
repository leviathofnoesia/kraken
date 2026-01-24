import { describe, it, expect } from "bun:test"
import { maelstromAgent } from "../../src/agents/maelstrom"

describe("Maelstrom Agent", () => {
  it("should export maelstromAgent", () => {
    expect(maelstromAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(maelstromAgent.name).toBe("Maelstrom")
    expect(maelstromAgent.description).toBeDefined()
    expect(maelstromAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(maelstromAgent.name).toBe("Maelstrom")
  })

  it("should have valid prompt structure", () => {
    const prompt = maelstromAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(maelstromAgent.description).toBeDefined()
    expect(typeof maelstromAgent.description).toBe("string")
  })
})
