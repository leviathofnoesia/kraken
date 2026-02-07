import { describe, expect, test } from 'bun:test'
import { grep_app } from './grep-app'

describe('grep-app MCP provider configuration', () => {
  test('returns remote config with correct URL', () => {
    expect(grep_app.type).toBe('remote')
    expect(grep_app.url).toBe('https://mcp.grep.app')
    expect(grep_app.enabled).toBe(true)
    expect(grep_app.oauth).toBe(false)
  })

  test('has no headers (uses OAuth via OpenCode)', () => {
    expect(grep_app.headers).toBeUndefined()
  })
})
