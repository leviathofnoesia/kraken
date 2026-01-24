import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test"
import {
  builtinMCPs,
  getBuiltinMcpNames,
  getBuiltinMcpInfo,
  getBuiltinMcpTools,
  getAllBuiltinMcpTools,
  getEnabledMcpServers,
  initializeAllMcpServers,
  shutdownAllMcpServers,
  checkAllMcpHealth,
} from "./index"

describe("MCP integration index", () => {
  beforeEach(() => {
    // Clear environment variables for each test
    delete process.env.EXA_API_KEY
    delete process.env.CONTEXT7_API_KEY
    delete process.env.GITHUB_TOKEN
  })

  afterEach(() => {
    // Shutdown all MCPs after each test
    shutdownAllMcpServers()
  })

  describe("builtinMCPs", () => {
    it("contains all three MCP servers", () => {
      // #given
      // #then should have 3 servers
      expect(builtinMCPs.length).toBe(3)
    })

    it("contains websearch MCP", () => {
      // #given
      // #then should include websearch
      expect(builtinMCPs.some(mcp => mcp.name === "websearch")).toBe(true)
    })

    it("contains context7 MCP", () => {
      // #given
      // #then should include context7
      expect(builtinMCPs.some(mcp => mcp.name === "context7")).toBe(true)
    })

    it("contains grep_app MCP", () => {
      // #given
      // #then should include grep_app
      expect(builtinMCPs.some(mcp => mcp.name === "grep_app")).toBe(true)
    })
  })

  describe("getBuiltinMcpNames", () => {
    it("returns all MCP names", () => {
      // #given
      // #when getting names
      const names = getBuiltinMcpNames()

      // #then should return all names
      expect(names).toEqual(["websearch", "context7", "grep_app"])
    })
  })

  describe("getBuiltinMcpInfo", () => {
    it("returns correct MCP for websearch", () => {
      // #given
      // #when getting websearch info
      const mcp = getBuiltinMcpInfo("websearch")

      // #then should return websearch MCP
      expect(mcp).toBeDefined()
      expect(mcp?.name).toBe("websearch")
      expect(mcp?.description).toContain("Exa AI")
    })

    it("returns correct MCP for context7", () => {
      // #given
      // #when getting context7 info
      const mcp = getBuiltinMcpInfo("context7")

      // #then should return context7 MCP
      expect(mcp).toBeDefined()
      expect(mcp?.name).toBe("context7")
      expect(mcp?.description).toContain("documentation")
    })

    it("returns correct MCP for grep_app", () => {
      // #given
      // #when getting grep_app info
      const mcp = getBuiltinMcpInfo("grep_app")

      // #then should return grep_app MCP
      expect(mcp).toBeDefined()
      expect(mcp?.name).toBe("grep_app")
      expect(mcp?.description).toContain("GitHub")
    })

    it("returns undefined for unknown MCP", () => {
      // #given
      // #when getting unknown MCP
      const mcp = getBuiltinMcpInfo("unknown")

      // #then should return undefined
      expect(mcp).toBeUndefined()
    })
  })

  describe("getBuiltinMcpTools", () => {
    it("returns tools for websearch", () => {
      // #given
      // #when getting websearch tools
      const tools = getBuiltinMcpTools("websearch")

      // #then should return 2 tools
      expect(tools.length).toBe(2)
    })

    it("returns tools for context7", () => {
      // #given
      // #when getting context7 tools
      const tools = getBuiltinMcpTools("context7")

      // #then should return 2 tools
      expect(tools.length).toBe(2)
    })

    it("returns tools for grep_app", () => {
      // #given
      // #when getting grep_app tools
      const tools = getBuiltinMcpTools("grep_app")

      // #then should return 2 tools
      expect(tools.length).toBe(2)
    })

    it("returns empty array for unknown MCP", () => {
      // #given
      // #when getting unknown MCP tools
      const tools = getBuiltinMcpTools("unknown")

      // #then should return empty array
      expect(tools).toEqual([])
    })
  })

  describe("getAllBuiltinMcpTools", () => {
    it("returns all tools from all MCPs", () => {
      // #given
      // #when getting all tools
      const tools = getAllBuiltinMcpTools()

      // #then should return 6 tools total (2 per MCP)
      expect(tools.length).toBe(6)
    })
  })

  describe("getEnabledMcpServers", () => {
    it("returns all enabled MCPs by default", () => {
      // #given all MCPs enabled by default
      // #when getting enabled servers
      const enabled = getEnabledMcpServers()

      // #then should return all 3
      expect(enabled.length).toBe(3)
    })
  })

  describe("initializeAllMcpServers", () => {
    it("initializes all MCP servers", async () => {
      // #given
      const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})

      // #when initializing all
      await initializeAllMcpServers({})

      // #then should not throw
      expect(true).toBe(true)
      consoleWarnSpy.mockRestore()
    })

    it("accepts per-MCP configuration", async () => {
      // #given per-MCP configs
      const configs = {
        websearch: { numResults: 5 },
        context7: { cacheTTL: 600 },
        grep_app: { maxResults: 20 },
      }

      // #when initializing with configs
      await initializeAllMcpServers(configs)

      // #then should not throw
      expect(true).toBe(true)
    })
  })

  describe("shutdownAllMcpServers", () => {
    it("shuts down all MCP servers", async () => {
      // #given initialized servers
      await initializeAllMcpServers({})

      // #when shutting down
      await shutdownAllMcpServers()

      // #then should not throw
      expect(true).toBe(true)
    })
  })

  describe("checkAllMcpHealth", () => {
    it("returns health status for all MCPs", async () => {
      // #given
      // #when checking health
      const health = await checkAllMcpHealth()

      // #then should return status for all 3
      expect(Object.keys(health)).toEqual(["websearch", "context7", "grep_app"])
    })

    it("returns false for MCPs without API keys", async () => {
      // #given no API keys set
      // #when checking health
      const health = await checkAllMcpHealth()

      // #then websearch and context7 should be false
      expect(health.websearch).toBe(false)
      expect(health.context7).toBe(false)
    })

    it("returns true for grep_app (works without token)", async () => {
      // #given no GitHub token
      // #when checking health
      const health = await checkAllMcpHealth()

      // #then grep_app should be true
      expect(health.grep_app).toBe(true)
    })
  })
})
