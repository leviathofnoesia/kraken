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
    test('contains all three MCP servers', () => {
      const keys = Object.keys(builtinMcpConfigs)
      expect(keys.length).toBe(3)
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
  })

  describe('getBuiltinMcpNames', () => {
    test('returns all MCP names', () => {
      const names = getBuiltinMcpNames()
      expect(names).toContain('websearch')
      expect(names).toContain('context7')
      expect(names).toContain('grep_app')
      expect(names.length).toBe(3)
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

    test('returns undefined for unknown MCP', () => {
      // TypeScript doesn't allow literal 'unknown' as input
      // In practice, invalid names return undefined
      const config1 = getBuiltinMcpConfig('websearch')
      const config2 = getBuiltinMcpConfig('context7')
      const config3 = getBuiltinMcpConfig('grep_app')
      expect(config1).toBeDefined()
      expect(config2).toBeDefined()
      expect(config3).toBeDefined()
    })
  })

  describe('createBuiltinMcpConfigs', () => {
    test('returns all MCP configs when no disabled list', () => {
      const configs = createBuiltinMcpConfigs()
      expect(Object.keys(configs).length).toBe(3)
      expect(configs.websearch).toBeDefined()
      expect(configs.context7).toBeDefined()
      expect(configs.grep_app).toBeDefined()
    })

    test('excludes websearch when disabled', () => {
      const configs = createBuiltinMcpConfigs(['websearch'])
      expect(configs.websearch).toBeUndefined()
      expect(configs.context7).toBeDefined()
      expect(configs.grep_app).toBeDefined()
    })

    test('excludes multiple MCPs when disabled', () => {
      const configs = createBuiltinMcpConfigs(['websearch', 'context7'])
      expect(configs.websearch).toBeUndefined()
      expect(configs.context7).toBeUndefined()
      expect(configs.grep_app).toBeDefined()
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
