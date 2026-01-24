import { describe, it, expect, spyOn, afterEach } from "bun:test"
import * as fs from "node:fs"
import * as config from "./config"

describe("Config Check", () => {
  describe("checkConfigValidity", () => {
    let existsSyncSpy: ReturnType<typeof spyOn>
    let readFileSyncSpy: ReturnType<typeof spyOn>

    afterEach(() => {
      existsSyncSpy?.mockRestore()
      readFileSyncSpy?.mockRestore()
    })

    it("should return pass for valid config", async () => {
      // #given valid config file exists
      existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true)
      readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue('{"test": true}')

      // #when checking config
      const result = await config.checkConfigValidity()

      // #then should pass
      expect(result.status).toBe("pass")
      expect(result.message).toContain("valid")
    })

    it("should return fail when config file not found", async () => {
      // #given config file doesn't exist
      existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false)

      // #when checking config
      const result = await config.checkConfigValidity()

      // #then should fail
      expect(result.status).toBe("fail")
      expect(result.message).toContain("not found")
    })

    it("should return fail for invalid JSONC", async () => {
      // #given invalid config file
      existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true)
      readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue("{ invalid json }")

      // #when checking config
      const result = await config.checkConfigValidity()

      // #then should fail
      expect(result.status).toBe("fail")
      expect(result.message).toContain("parse error")
    })
  })

  describe("getConfigCheckDefinition", () => {
    it("should return correct check definition", () => {
      const definition = config.getConfigCheckDefinition()
      expect(definition.category).toBe("configuration")
      expect(definition.critical).toBe(false)
    })
  })
})
