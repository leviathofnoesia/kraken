import { describe, it, expect } from "bun:test"
import { atlasAgent } from "../../src/agents/atlas"

describe("Atlas Agent", () => {
  it("should export atlasAgent", () => {
    expect(atlasAgent).toBeDefined()
  })

  it("should have required properties", () => {
    expect(atlasAgent.name).toBe("Atlas")
    expect(atlasAgent.description).toBeDefined()
    expect(atlasAgent.prompt).toBeDefined()
  })

  it("should have correct agent name", () => {
    expect(atlasAgent.name).toBe("Atlas")
  })

  it("should have valid prompt structure", () => {
    const prompt = atlasAgent.prompt
    expect(typeof prompt).toBe("string")
    expect(prompt.length).toBeGreaterThan(100)
  })

  it("should have description", () => {
    expect(atlasAgent.description).toBeDefined()
    expect(typeof atlasAgent.description).toBe("string")
  })
})
