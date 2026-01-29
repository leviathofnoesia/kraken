import { describe, it, expect } from "bun:test"
import { scyllaAgent } from "../../src/agents/scylla"

describe("Scylla Agent", () => {
  it("should export scyllaAgent", () => {
    expect(scyllaAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(scyllaAgent.description).toBeDefined()
    expect(scyllaAgent.prompt).toBeDefined()
  })

  it("should have valid prompt structure", () => {
    const prompt = scyllaAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(scyllaAgent.description).toBeDefined()
    expect(typeof scyllaAgent.description).toBe("string")
  })
})
