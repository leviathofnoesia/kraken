import { describe, it, expect, spyOn, afterEach, beforeEach } from "bun:test"
import { websearchMCP, initializeWebsearchMCP } from "./websearch"
import * as types from "./types"

describe("websearch MCP", () => {
  beforeEach(async () => {
    // Clear environment variables for each test
    delete process.env.EXA_API_KEY
    // Reset config
    await initializeWebsearchMCP({ apiKey: undefined, timeout: undefined, numResults: undefined })
  })

  describe("initialization", () => {
    it("initializes with default config", async () => {
      // #given no config
      // #when initializing
      await initializeWebsearchMCP({})

      // #then should not throw
      expect(true).toBe(true)
    })

    it("accepts custom configuration", async () => {
      // #given custom config
      const config = {
        apiKey: "test-key",
        timeout: 60000,
        numResults: 10,
      }

      // #when initializing with config
      await initializeWebsearchMCP(config)

      // #then should not throw
      expect(true).toBe(true)
    })

    it("warns when no API key provided", async () => {
      // #given no API key
      // #when initializing without API key
      const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})
      await initializeWebsearchMCP({})

      // #then should warn
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe("MCP server definition", () => {
    it("has correct server metadata", () => {
      // #given
      // #then server should have correct metadata
      expect(websearchMCP.name).toBe("websearch")
      expect(websearchMCP.description).toContain("Exa AI")
      expect(websearchMCP.version).toBe("1.0.0")
    })

    it("exports two tools", () => {
      // #given
      // #then should have two tools
      expect(websearchMCP.tools.length).toBe(2)
      expect(websearchMCP.tools.some(t => t.description.includes("Search the web"))).toBe(true)
      expect(websearchMCP.tools.some(t => t.description.includes("Fetch and parse"))).toBe(true)
    })

    it("has configuration schema", () => {
      // #given
      // #then should have config schema
      expect(websearchMCP.configSchema).toBeDefined()
      expect(websearchMCP.configSchema?.apiKey).toBe("string (optional)")
      expect(websearchMCP.configSchema?.numResults).toContain("1-20")
    })
  })

  describe("tool definitions", () => {
    it("tools have correct server metadata", () => {
      // #given
      // #then all tools should have websearch server name
      websearchMCP.tools.forEach(tool => {
        expect(tool.serverName).toBe("websearch")
        expect(tool.category).toBe("search")
        expect(tool.rateLimit).toBe(60)
      })
    })
  })

  describe("lifecycle methods", () => {
    it("has initialize function", async () => {
      // #given
      // #when calling initialize
      await websearchMCP.initialize?.({ apiKey: "test" })

      // #then should not throw
      expect(true).toBe(true)
    })

    it("has shutdown function", async () => {
      // #given
      // #when calling shutdown
      await websearchMCP.shutdown?.()

      // #then should not throw
      expect(true).toBe(true)
    })

    it("has health check function", async () => {
      // #given no API key
      // #when checking health
      const healthy = await websearchMCP.healthCheck?.()

      // #then should return false without API key
      expect(healthy).toBe(false)
    })
  })
})

describe("RateLimiter utility", () => {
  it("allows requests within rate limit", async () => {
    // #given rate limiter with 2 requests per 100ms
    const limiter = new types.RateLimiter(2, 100)

    // #when making 2 requests
    await limiter.waitIfNeeded()
    await limiter.waitIfNeeded()

    // #then should not throw
    expect(true).toBe(true)
  })

  it("waits when rate limit exceeded", async () => {
    // #given rate limiter with 2 requests per 100ms
    const limiter = new types.RateLimiter(2, 100)

    // #when making 3 requests quickly
    const start = Date.now()
    await limiter.waitIfNeeded()
    await limiter.waitIfNeeded()
    await limiter.waitIfNeeded()
    const elapsed = Date.now() - start

    // #then should have waited
    expect(elapsed).toBeGreaterThanOrEqual(100)
  })

  it("resets after time window", async () => {
    // #given rate limiter with 2 requests per 100ms
    const limiter = new types.RateLimiter(2, 100)

    // #when making requests, waiting, then making more
    await limiter.waitIfNeeded()
    await limiter.waitIfNeeded()
    await new Promise(resolve => setTimeout(resolve, 110))

    const start = Date.now()
    await limiter.waitIfNeeded()
    await limiter.waitIfNeeded()
    const elapsed = Date.now() - start

    // #then should not wait after window reset
    expect(elapsed).toBeLessThan(50)
  })
})
