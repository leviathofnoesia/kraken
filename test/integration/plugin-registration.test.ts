import { describe, it, expect } from "bun:test"

describe("Plugin Agent Registration", () => {
  it("should register all 11 sea-themed agents", async () => {
    const plugin = (await import("../../src/index")).default
    const mockConfig: any = {}
    const hooks = await plugin({} as any)
    
    await hooks.config!(mockConfig)
    
    const expectedAgents = [
      "Kraken", "Atlas", "Nautilus", "Abyssal", "Coral", "Siren",
      "Scylla", "Pearl", "Maelstrom", "Leviathan", "Poseidon"
    ]
    
    for (const agent of expectedAgents) {
      expect(mockConfig.agent[agent]).toBeDefined()
      expect(mockConfig.agent[agent].description).toBeDefined()
      expect(mockConfig.agent[agent].prompt).toBeDefined()
    }
  })

  it("should set default_agent to Kraken", async () => {
    const plugin = (await import("../../src/index")).default
    const mockConfig: any = {}
    const hooks = await plugin({} as any)
    await hooks.config!(mockConfig)
    
    expect(mockConfig.default_agent).toBe("Kraken")
  })
})
