import { describe, it, expect, spyOn, beforeEach } from "bun:test"
import { grepAppMCP, initializeGrepAppMCP } from "./grep-app"
import * as types from "./types"

describe("grep-app MCP", () => {
  beforeEach(async () => {
    // Clear environment variables for each test
    delete process.env.GITHUB_TOKEN
    // Reset config
    await initializeGrepAppMCP({ githubToken: undefined, timeout: undefined, maxResults: undefined })
  })

  describe("initialization", () => {
    it("initializes with default config", async () => {
      // #given no config
      // #when initializing
      await initializeGrepAppMCP({})

      // #then should not throw
      expect(true).toBe(true)
    })

    it("accepts custom configuration", async () => {
      // #given custom config
      const config = {
        githubToken: "test-token",
        timeout: 60000,
        maxResults: 20,
      }

      // #when initializing with config
      await initializeGrepAppMCP(config)

      // #then should not throw
      expect(true).toBe(true)
    })

    it("warns when no GitHub token provided", async () => {
      // #given no GitHub token
      // #when initializing without token
      process.env.KRAKEN_LOG = "1"
      const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})
      await initializeGrepAppMCP({})

      // #then should warn about rate limits
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
      delete process.env.KRAKEN_LOG
    })
  })

  describe("MCP server definition", () => {
    it("has correct server metadata", () => {
      // #given
      // #then server should have correct metadata
      expect(grepAppMCP.name).toBe("grep_app")
      expect(grepAppMCP.description).toContain("GitHub")
      expect(grepAppMCP.version).toBe("1.0.0")
    })

    it("exports two tools", () => {
      // #given
      // #then should have two tools
      expect(grepAppMCP.tools.length).toBe(2)
      expect(grepAppMCP.tools.some(t => t.description.includes("GitHub"))).toBe(true)
    })

    it("has configuration schema", () => {
      // #given
      // #then should have config schema
      expect(grepAppMCP.configSchema).toBeDefined()
      expect(grepAppMCP.configSchema?.githubToken).toBe("string (optional, GitHub personal access token)")
      expect(grepAppMCP.configSchema?.maxResults).toContain("1-30")
    })
  })

  describe("tool definitions", () => {
    it("tools have correct server metadata", () => {
      // #given
      // #then all tools should have grep_app server name
      grepAppMCP.tools.forEach(tool => {
        expect(tool.serverName).toBe("grep_app")
        expect(tool.category).toBe("code")
        expect(tool.rateLimit).toBe(60)
      })
    })

    it("has search tool", () => {
      // #given
      const searchTool = grepAppMCP.tools.find(t => t.description.includes("Search code across public GitHub repositories"))

      // #then search tool should exist
      expect(searchTool).toBeDefined()
    })

    it("has get file tool", () => {
      // #given
      const getFileTool = grepAppMCP.tools.find(t => t.description.includes("file content"))

      // #then get file tool should exist
      expect(getFileTool).toBeDefined()
    })
  })

  describe("lifecycle methods", () => {
    it("has initialize function", async () => {
      // #given
      // #when calling initialize
      await grepAppMCP.initialize?.({ githubToken: "test" })

      // #then should not throw
      expect(true).toBe(true)
    })

    it("has shutdown function", async () => {
      // #given
      // #when calling shutdown
      await grepAppMCP.shutdown?.()

      // #then should not throw
      expect(true).toBe(true)
    })

    it("health check returns true (works without token)", async () => {
      // #given no GitHub token
      // #when checking health
      const healthy = await grepAppMCP.healthCheck?.()

      // #then should return true (works with or without token)
      expect(healthy).toBe(true)
    })
  })
})

describe("language inference", () => {
  // Helper function to test language inference (extracted from grep-app.ts logic)
  function inferLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      c: 'C',
      cpp: 'C++',
      h: 'C',
      hpp: 'C++',
      rb: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      kt: 'Kotlin',
      scala: 'Scala',
      cs: 'C#',
      sh: 'Shell',
      bash: 'Shell',
      zsh: 'Shell',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      md: 'Markdown',
    }

    return languageMap[ext || ''] || 'unknown'
  }

  it("infers TypeScript from .ts", () => {
    expect(inferLanguageFromPath("src/index.ts")).toBe("TypeScript")
  })

  it("infers TypeScript from .tsx", () => {
    expect(inferLanguageFromPath("App.tsx")).toBe("TypeScript")
  })

  it("infers JavaScript from .js", () => {
    expect(inferLanguageFromPath("script.js")).toBe("JavaScript")
  })

  it("infers Python from .py", () => {
    expect(inferLanguageFromPath("main.py")).toBe("Python")
  })

  it("infers Go from .go", () => {
    expect(inferLanguageFromPath("main.go")).toBe("Go")
  })

  it("infers Rust from .rs", () => {
    expect(inferLanguageFromPath("lib.rs")).toBe("Rust")
  })

  it("returns unknown for unrecognized extensions", () => {
    expect(inferLanguageFromPath("file.xyz")).toBe("unknown")
  })

  it("returns unknown for files without extension", () => {
    expect(inferLanguageFromPath("Makefile")).toBe("unknown")
  })
})
