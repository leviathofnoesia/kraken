import { describe, test, expect } from 'bun:test'
import {
  builtinMcpNames,
  builtinMcpConfigs,
  getBuiltinMcpNames,
  getBuiltinMcpConfig,
  createBuiltinMcpConfigs,
} from './index'

describe('MCP remote configuration index', () => {
  describe('builtinMcpConfigs', () => {
    test('contains all seven MCP servers', () => {
      const keys = Object.keys(builtinMcpConfigs)
      expect(keys.length).toBe(7)
    })

    test('contains websearch config', () => {
      expect(builtinMcpConfigs.websearch).toBeDefined()
      expect(builtinMcpConfigs.websearch.type).toBe('remote')
      expect(builtinMcpConfigs.websearch.url).toContain('mcp.exa.ai')
    })

    test('contains context7 config', () => {
      expect(builtinMcpConfigs.context7).toBeDefined()
      expect(builtinMcpConfigs.context7.type).toBe('remote')
      expect(builtinMcpConfigs.context7.url).toBe('https://mcp.context7.com/mcp')
    })

    test('contains grep_app config', () => {
      expect(builtinMcpConfigs.grep_app).toBeDefined()
      expect(builtinMcpConfigs.grep_app.type).toBe('remote')
      expect(builtinMcpConfigs.grep_app.url).toBe('https://mcp.grep.app')
    })

    test('contains deepwiki config', () => {
      expect(builtinMcpConfigs.deepwiki).toBeDefined()
      expect(builtinMcpConfigs.deepwiki.type).toBe('remote')
      expect(builtinMcpConfigs.deepwiki.url).toBe('https://mcp.deepwiki.com/mcp')
    })

    test('contains semgrep config', () => {
      expect(builtinMcpConfigs.semgrep).toBeDefined()
      expect(builtinMcpConfigs.semgrep.type).toBe('remote')
      expect(builtinMcpConfigs.semgrep.url).toBe('https://mcp.semgrep.ai/sse')
    })

    test('contains sequential_thinking config', () => {
      expect(builtinMcpConfigs.sequential_thinking).toBeDefined()
      expect(builtinMcpConfigs.sequential_thinking.type).toBe('remote')
      expect(builtinMcpConfigs.sequential_thinking.url).toBe(
        'https://remote-mcp-servers.org/sequential-thinking/mcp',
      )
    })

    test('contains bridgemind config', () => {
      expect(builtinMcpConfigs.bridgemind).toBeDefined()
      expect(builtinMcpConfigs.bridgemind.type).toBe('remote')
      expect(builtinMcpConfigs.bridgemind.url).toBe('https://remote-mcp-servers.org/bridgemind/mcp')
    })
  })

  describe('getBuiltinMcpNames', () => {
    test('returns all MCP names', () => {
      const names = getBuiltinMcpNames()
      expect(names).toContain('websearch')
      expect(names).toContain('context7')
      expect(names).toContain('grep_app')
      expect(names).toContain('deepwiki')
      expect(names).toContain('semgrep')
      expect(names).toContain('sequential_thinking')
      expect(names).toContain('bridgemind')
      expect(names.length).toBe(7)
    })

    test('returns readonly array', () => {
      const names = getBuiltinMcpNames()
      expect(names).toBe(builtinMcpNames)
    })
  })

  describe('getBuiltinMcpConfig', () => {
    test('returns websearch config', () => {
      const config = getBuiltinMcpConfig('websearch')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toContain('mcp.exa.ai')
    })

    test('returns context7 config', () => {
      const config = getBuiltinMcpConfig('context7')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://mcp.context7.com/mcp')
    })

    test('returns grep_app config', () => {
      const config = getBuiltinMcpConfig('grep_app')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://mcp.grep.app')
    })

    test('returns deepwiki config', () => {
      const config = getBuiltinMcpConfig('deepwiki')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://mcp.deepwiki.com/mcp')
    })

    test('returns semgrep config', () => {
      const config = getBuiltinMcpConfig('semgrep')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://mcp.semgrep.ai/sse')
    })

    test('returns sequential_thinking config', () => {
      const config = getBuiltinMcpConfig('sequential_thinking')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://remote-mcp-servers.org/sequential-thinking/mcp')
    })

    test('returns bridgemind config', () => {
      const config = getBuiltinMcpConfig('bridgemind')
      expect(config).toBeDefined()
      expect(config?.type).toBe('remote')
      expect(config?.url).toBe('https://remote-mcp-servers.org/bridgemind/mcp')
    })
  })

  describe('createBuiltinMcpConfigs', () => {
    test('returns all MCP configs when no disabled list', () => {
      const configs = createBuiltinMcpConfigs()
      expect(Object.keys(configs).length).toBe(7)
      expect(configs.websearch).toBeDefined()
      expect(configs.context7).toBeDefined()
      expect(configs.grep_app).toBeDefined()
      expect(configs.deepwiki).toBeDefined()
      expect(configs.semgrep).toBeDefined()
      expect(configs.sequential_thinking).toBeDefined()
      expect(configs.bridgemind).toBeDefined()
    })

    test('excludes websearch when disabled', () => {
      const configs = createBuiltinMcpConfigs(['websearch'])
      expect(configs.websearch).toBeUndefined()
      expect(configs.context7).toBeDefined()
      expect(configs.grep_app).toBeDefined()
      expect(configs.deepwiki).toBeDefined()
      expect(configs.semgrep).toBeDefined()
      expect(configs.sequential_thinking).toBeDefined()
      expect(configs.bridgemind).toBeDefined()
    })

    test('excludes multiple MCPs when disabled', () => {
      const configs = createBuiltinMcpConfigs(['websearch', 'context7', 'deepwiki'])
      expect(configs.websearch).toBeUndefined()
      expect(configs.context7).toBeUndefined()
      expect(configs.deepwiki).toBeUndefined()
      expect(configs.grep_app).toBeDefined()
      expect(configs.semgrep).toBeDefined()
      expect(configs.sequential_thinking).toBeDefined()
      expect(configs.bridgemind).toBeDefined()
    })

    test('passes websearch config through', () => {
      const tavilyKey = 'test-tavily-key'
      process.env.TAVILY_API_KEY = tavilyKey
      const websearchConfig = { provider: 'tavily' as const }
      const configs = createBuiltinMcpConfigs([], { websearch: websearchConfig })
      // Config should respect provider option
      expect(configs.websearch.url).toContain('mcp.tavily.com')
      delete process.env.TAVILY_API_KEY
    })
  })
})
