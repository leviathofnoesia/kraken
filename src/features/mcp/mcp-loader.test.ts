import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { MCPLoader } from './mcp-loader'
import type { RemoteMcpConfig } from './types'

describe('MCPLoader', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('calls remote MCP via JSON-RPC and returns result payload', async () => {
    let requestUrl = ''
    let requestBody = ''

    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
      requestUrl = String(url)
      requestBody = String(init?.body || '')

      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const loader = new MCPLoader()
    const config: RemoteMcpConfig = {
      type: 'remote',
      url: 'https://mcp.example.com',
      enabled: true,
    }

    const result = await loader.callTool('search', { query: 'kraken' }, config)

    expect(requestUrl).toBe('https://mcp.example.com')
    expect(requestBody).toContain('"method":"tools/call"')
    expect(requestBody).toContain('"name":"search"')
    expect(result).toEqual({ ok: true })
  })

  test('throws when MCP is disabled', async () => {
    const loader = new MCPLoader()
    const config: RemoteMcpConfig = {
      type: 'remote',
      url: 'https://mcp.example.com',
      enabled: false,
    }

    await expect(loader.callTool('search', { query: 'kraken' }, config)).rejects.toThrow('disabled')
  })

  test('throws when remote server returns an error response', async () => {
    globalThis.fetch = (async () => {
      return new Response('server unavailable', { status: 503 })
    }) as unknown as typeof fetch

    const loader = new MCPLoader()
    const config: RemoteMcpConfig = {
      type: 'remote',
      url: 'https://mcp.example.com',
      enabled: true,
    }

    await expect(loader.callTool('search', { query: 'kraken' }, config)).rejects.toThrow(
      'MCP request failed',
    )
  })
})
