import { describe, it, expect } from "bun:test"
import { abyssalAgent } from "../../src/agents/abyssal"

describe("Abyssal Agent", () => {
  it("should export abyssalAgent", () => {
    expect(abyssalAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(abyssalAgent.description).toBeDefined()
    expect(abyssalAgent.prompt).toBeDefined()
  })

  it("should have valid prompt structure", () => {
    const prompt = abyssalAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(abyssalAgent.description).toBeDefined()
    expect(typeof abyssalAgent.description).toBe("string")
  })
})
