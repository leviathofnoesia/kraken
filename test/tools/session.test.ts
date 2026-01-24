import { describe, it, expect } from "bun:test"
import { session_list, session_read, session_search, session_info } from "../../src/tools/session"

describe("Session Tools", () => {
  describe("session_list", () => {
    it("should export session_list tool", () => {
      expect(session_list).toBeDefined()
    })

    it("should have required properties", () => {
      expect(session_list.description).toBeDefined()
      expect(session_list.args).toBeDefined()
      expect(session_list.execute).toBeDefined()
    })

    it("should list sessions successfully", async () => {
      const result = await session_list.execute({})
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(Array.isArray(parsed.sessions)).toBe(true)
    })

    it("should handle limit parameter", async () => {
      const result = await session_list.execute({ limit: 5 })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.sessions.length).toBeLessThanOrEqual(5)
    })

    it("should handle date filtering", async () => {
      const result = await session_list.execute({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(Array.isArray(parsed.sessions)).toBe(true)
    })

    it("should handle order parameter", async () => {
      const result = await session_list.execute({ order: "asc" })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
    })

    it("should handle includeMetadata parameter", async () => {
      const result = await session_list.execute({ includeMetadata: true })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
    })
  })

  describe("session_read", () => {
    it("should export session_read tool", () => {
      expect(session_read).toBeDefined()
    })

    it("should have required properties", () => {
      expect(session_read.description).toBeDefined()
      expect(session_read.args).toBeDefined()
      expect(session_read.execute).toBeDefined()
    })

    it("should handle session reading", async () => {
      const result = await session_read.execute({ sessionID: "test-session" })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("session_search", () => {
    it("should export session_search tool", () => {
      expect(session_search).toBeDefined()
    })

    it("should have required properties", () => {
      expect(session_search.description).toBeDefined()
      expect(session_search.args).toBeDefined()
      expect(session_search.execute).toBeDefined()
    })

    it("should handle session search", async () => {
      const result = await session_search.execute({ query: "test" })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })

    it("should handle search with options", async () => {
      const result = await session_search.execute({
        query: "function",
        maxResults: 10,
        includeMatches: true,
      })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })

  describe("session_info", () => {
    it("should export session_info tool", () => {
      expect(session_info).toBeDefined()
    })

    it("should have required properties", () => {
      expect(session_info.description).toBeDefined()
      expect(session_info.args).toBeDefined()
      expect(session_info.execute).toBeDefined()
    })

    it("should handle session info retrieval", async () => {
      const result = await session_info.execute({ sessionID: "test-session" })
      const parsed = JSON.parse(result)
      expect(parsed).toBeDefined()
    })
  })
})
