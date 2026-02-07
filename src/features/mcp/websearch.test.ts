import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { createWebsearchConfig } from './websearch'

describe('websearch MCP provider configuration', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.EXA_API_KEY
    delete process.env.TAVILY_API_KEY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('returns Exa config when no config provided', () => {
    const result = createWebsearchConfig()

    expect(result.url).toContain('mcp.exa.ai')
    expect(result.type).toBe('remote')
    expect(result.enabled).toBe(true)
  })

  test('returns Exa config when provider is exa', () => {
    const config = { provider: 'exa' as const }

    const result = createWebsearchConfig(config)

    expect(result.url).toContain('mcp.exa.ai')
    expect(result.type).toBe('remote')
  })

  test('includes x-api-key header when EXA_API_KEY is set', () => {
    const apiKey = 'test-exa-key-12345'
    process.env.EXA_API_KEY = apiKey

    const result = createWebsearchConfig()

    expect(result.headers).toEqual({ 'x-api-key': apiKey })
  })

  test('returns Tavily config when provider is tavily and TAVILY_API_KEY set', () => {
    const tavilyKey = 'test-tavily-key-67890'
    process.env.TAVILY_API_KEY = tavilyKey
    const config = { provider: 'tavily' as const }

    const result = createWebsearchConfig(config)

    expect(result.url).toContain('mcp.tavily.com')
    expect(result.headers).toEqual({ Authorization: `Bearer ${tavilyKey}` })
  })

  test('returns disabled config when provider is tavily but TAVILY_API_KEY missing', () => {
    delete process.env.TAVILY_API_KEY
    const config = { provider: 'tavily' as const }

    const result = createWebsearchConfig(config)

    expect(result.enabled).toBe(false)
    expect(result.url).toContain('mcp.tavily.com')
    expect(result.name).toBe('websearch')
  })

  test('returns Exa when both keys present but no explicit provider', () => {
    process.env.EXA_API_KEY = 'test-exa-key'
    process.env.TAVILY_API_KEY = 'test-tavily-key'

    const result = createWebsearchConfig()

    expect(result.url).toContain('mcp.exa.ai')
    expect(result.headers).toEqual({ 'x-api-key': 'test-exa-key' })
  })

  test('Tavily config uses Authorization Bearer header format', () => {
    const tavilyKey = 'tavily-secret-key-xyz'
    process.env.TAVILY_API_KEY = tavilyKey
    const config = { provider: 'tavily' as const }

    const result = createWebsearchConfig(config)

    expect(result.headers?.Authorization).toMatch(/^Bearer /)
    expect(result.headers?.Authorization).toBe(`Bearer ${tavilyKey}`)
  })

  test('Exa config has no headers when EXA_API_KEY not set', () => {
    delete process.env.EXA_API_KEY

    const result = createWebsearchConfig()

    expect(result.url).toContain('mcp.exa.ai')
    expect(result.headers).toBeUndefined()
  })
})
