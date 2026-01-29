import { describe, it, expect } from "bun:test"
import { krakenAgent } from "../../src/agents/kraken"

describe("Kraken Agent", () => {
  it("should export krakenAgent", () => {
    expect(krakenAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(krakenAgent.description).toBeDefined()
    expect(krakenAgent.prompt).toBeDefined()
  })

  it("should have valid prompt structure", () => {
    const prompt = krakenAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(krakenAgent.description).toBeDefined()
    expect(typeof krakenAgent.description).toBe("string")
  })
})
