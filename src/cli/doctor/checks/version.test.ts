import { describe, it, expect } from "bun:test"
import { checkVersion, getVersionCheckDefinition } from "./version"

describe("Version Check", () => {
  it("should return info message", async () => {
    const result = await checkVersion()
    expect(result.status).toBe("pass")
  })

  it("should return correct check definition", () => {
    const definition = getVersionCheckDefinition()
    expect(definition.category).toBe("updates")
    expect(definition.critical).toBe(false)
  })
})
