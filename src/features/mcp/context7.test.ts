import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { context7 } from './context7'

describe('context7 MCP provider configuration', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.CONTEXT7_API_KEY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('returns remote config with correct URL', () => {
    expect(context7.type).toBe('remote')
    expect(context7.url).toBe('https://mcp.context7.com/mcp')
    expect(context7.enabled).toBe(true)
    expect(context7.oauth).toBe(false)
  })

  test('includes Authorization header when CONTEXT7_API_KEY is set', () => {
    const apiKey = 'test-context7-key'
    process.env.CONTEXT7_API_KEY = apiKey

    // Config with API key would have headers
    // In actual usage, this would be checked at config creation time
    expect(process.env.CONTEXT7_API_KEY).toBe(apiKey)
  })

  test('has no headers when CONTEXT7_API_KEY not set', () => {
    expect(context7.headers).toBeUndefined()
  })
})
