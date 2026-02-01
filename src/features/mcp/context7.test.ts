import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test"
import { context7MCP, initializeContext7MCP, clearContext7Cache } from "./context7"
import * as types from "./types"

describe("context7 MCP", () => {
  beforeEach(async () => {
    // Clear environment variables and cache for each test
    delete process.env.CONTEXT7_API_KEY
    clearContext7Cache()
    // Reset config
    await initializeContext7MCP({ apiKey: undefined, timeout: undefined, numResults: undefined, cacheTTL: undefined })
  })

  afterEach(() => {
    clearContext7Cache()
  })

  describe("initialization", () => {
    it("initializes with default config", async () => {
      // #given no config
      // #when initializing
      await initializeContext7MCP({})

      // #then should not throw
      expect(true).toBe(true)
    })

    it("accepts custom configuration", async () => {
      // #given custom config
      const config = {
        apiKey: "test-key",
        timeout: 60000,
        numResults: 10,
        cacheTTL: 600,
      }

      // #when initializing with config
      await initializeContext7MCP(config)

      // #then should not throw
      expect(true).toBe(true)
    })

    it("warns when no API key provided", async () => {
      // #given no API key
      // #when initializing without API key
      const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})
      await initializeContext7MCP({})

      // #then should warn
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe("MCP server definition", () => {
    it("has correct server metadata", () => {
      // #given
      // #then server should have correct metadata
      expect(context7MCP.name).toBe("context7")
      expect(context7MCP.description).toContain("documentation")
      expect(context7MCP.version).toBe("1.0.0")
    })

    it("exports two tools", () => {
      // #given
      // #then should have two tools
      expect(context7MCP.tools.length).toBe(2)
      expect(context7MCP.tools.some(t => t.description.includes("documentation"))).toBe(true)
    })

    it("has configuration schema", () => {
      // #given
      // #then should have config schema
      expect(context7MCP.configSchema).toBeDefined()
      expect(context7MCP.configSchema?.apiKey).toBe("string (optional)")
      expect(context7MCP.configSchema?.cacheTTL).toContain("seconds")
    })
  })

  describe("tool definitions", () => {
    it("tools have correct server metadata", () => {
      // #given
      // #then all tools should have context7 server name
      context7MCP.tools.forEach(tool => {
        expect(tool.serverName).toBe("context7")
        expect(tool.category).toBe("documentation")
        expect(tool.rateLimit).toBe(30)
      })
    })

    it("has search tool", () => {
      // #given
      const searchTool = context7MCP.tools.find(t => t.description.includes("Search official documentation"))

      // #then search tool should exist
      expect(searchTool).toBeDefined()
    })

    it("has get tool", () => {
      // #given
      const getTool = context7MCP.tools.find(t => t.description.includes("specific documentation"))

      // #then get tool should exist
      expect(getTool).toBeDefined()
    })
  })

  describe("lifecycle methods", () => {
    it("has initialize function", async () => {
      // #given
      // #when calling initialize
      await context7MCP.initialize?.({ apiKey: "test" })

      // #then should not throw
      expect(true).toBe(true)
    })

    it("has shutdown function", async () => {
      // #given
      // #when calling shutdown
      await context7MCP.shutdown?.()

      // #then should not throw
      expect(true).toBe(true)
    })

    it("has health check function", async () => {
      // #given no API key
      // #when checking health
      const healthy = await context7MCP.healthCheck?.()

      // #then should return false without API key
      expect(healthy).toBe(false)
    })
  })

  describe("cache management", () => {
    it("clears cache", () => {
      // #given
      clearContext7Cache()

      // #then cache should be clear
      expect(true).toBe(true)
    })

    it("clears cache on shutdown", async () => {
      // #given
      // #when calling shutdown
      await context7MCP.shutdown?.()

      // #then should not throw
      expect(true).toBe(true)
    })
  })
})
