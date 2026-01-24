import { describe, it, expect } from "bun:test"
import { pearlAgent } from "../../src/agents/pearl"

describe("Pearl Agent", () => {
  it("should export pearlAgent", () => {
    expect(pearlAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(pearlAgent.name).toBe("Pearl")
    expect(pearlAgent.description).toBeDefined()
    expect(pearlAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(pearlAgent.name).toBe("Pearl")
  })

  it("should have valid prompt structure", () => {
    const prompt = pearlAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(pearlAgent.description).toBeDefined()
    expect(typeof pearlAgent.description).toBe("string")
  })
})
