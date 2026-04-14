import { describe, expect, test } from 'bun:test'
import { handleMcpRequest } from './mcp-server'

describe('MCP bridge server', () => {
  test('returns initialize response', async () => {
    const response = await handleMcpRequest(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      {},
    )

    expect(response?.result).toBeDefined()
    expect((response?.result as any).protocolVersion).toBeDefined()
  })

  test('returns tools list', async () => {
    const response = await handleMcpRequest(
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      {
        sample: {
          description: 'sample tool',
          execute: async () => ({ ok: true }),
        },
      },
    )

    const tools = (response?.result as any).tools
    expect(Array.isArray(tools)).toBe(true)
    expect(tools[0].name).toBe('sample')
  })

  test('calls tool and returns parsed JSON payload', async () => {
    const response = await handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'sample', arguments: { a: 1 } },
      },
      {
        sample: {
          execute: async () => '{"ok":true}',
        },
      },
    )

    expect(response?.result).toEqual({ ok: true })
  })

  test('strict mode hides non-read tools in tools/list', async () => {
    const response = await handleMcpRequest(
      { jsonrpc: '2.0', id: 4, method: 'tools/list', params: {} },
      {
        grep: {
          description: 'read tool',
          execute: async () => ({ ok: true }),
        },
        ast_grep_replace: {
          description: 'edit tool',
          execute: async () => ({ ok: true }),
        },
      },
      { target: 'claude', mode: 'strict' },
    )

    const tools = (response?.result as any).tools as Array<{ name: string }>
    expect(tools.map((tool) => tool.name)).toEqual(['grep'])
  })

  test('strict mode blocks edit tools at call time', async () => {
    const response = await handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'ast_grep_replace', arguments: {} },
      },
      {
        ast_grep_replace: {
          execute: async () => ({ ok: true }),
        },
      },
      { target: 'codex', mode: 'strict' },
    )

    expect(response?.error?.code).toBe(-32001)
    expect(response?.error?.message).toContain('blocked')
  })

  test('write-capable tool call is allowed in standard and blocked in strict for all targets', async () => {
    const targets = ['opencode', 'codex', 'claude', 'cline', 'cursor', 'vscode', 'ci'] as const

    for (const target of targets) {
      const standard = await handleMcpRequest(
        {
          jsonrpc: '2.0',
          id: `${target}-standard`,
          method: 'tools/call',
          params: { name: 'custom_write_tool', arguments: { value: 1 } },
        },
        {
          custom_write_tool: {
            execute: async () => ({ ok: true, target }),
          },
        },
        { target, mode: 'standard' },
      )
      expect((standard?.result as any)?.ok).toBe(true)

      const strict = await handleMcpRequest(
        {
          jsonrpc: '2.0',
          id: `${target}-strict`,
          method: 'tools/call',
          params: { name: 'custom_write_tool', arguments: { value: 1 } },
        },
        {
          custom_write_tool: {
            execute: async () => ({ ok: true, target }),
          },
        },
        { target, mode: 'strict' },
      )

      expect(strict?.error?.code).toBe(-32001)
      expect(strict?.error?.message).toContain('blocked')
    }
  })
})
