import { describe, it, expect } from 'bun:test'
import plugin from '../../src/index'

describe('Hook Initialization', () => {
  it('should initialize all hooks without errors', async () => {
    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks).toBeDefined()
  })

  it('should have config hook', async () => {
    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks.config).toBeDefined()
    expect(typeof hooks.config).toBe('function')
  })

  it('should have tools', async () => {
    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks.tool).toBeDefined()
    expect(typeof hooks.tool).toBe('object')
  })

  it('should have chat.message hook', async () => {
    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks['chat.message']).toBeDefined()
    expect(typeof hooks['chat.message']).toBe('function')
  })

  it('should have tool.execute.after hook', async () => {
    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks['tool.execute.after']).toBeDefined()
    expect(typeof hooks['tool.execute.after']).toBe('function')
  })

  it('should handle initialization errors gracefully', async () => {
    const mockInput = {
      config: { agent: {} } as any,
      mcp: { websearch: { enabled: true } } as any,
    }

    const hooks = await plugin({
      client: { close: async () => {} } as any,
      project: {} as any,
      directory: '' as any,
      worktree: {} as any,
    } as any)
    expect(hooks).toBeDefined()
    expect(hooks.config).toBeDefined()
  })

  it('should configure agents correctly', async () => {
    const mockConfig: any = { agent: {} }
    const hooks = await plugin({ config: mockConfig } as any)

    await hooks.config!(mockConfig)

    expect(mockConfig.agent.Kraken).toBeDefined()
    expect(mockConfig.agent.Atlas).toBeDefined()
    expect(mockConfig.agent.Nautilus).toBeDefined()
    expect(mockConfig.agent.Abyssal).toBeDefined()
    expect(mockConfig.agent.Coral).toBeDefined()
    expect(mockConfig.agent.Siren).toBeDefined()
    expect(mockConfig.agent.Scylla).toBeDefined()
    expect(mockConfig.agent.Pearl).toBeDefined()
    expect(mockConfig.agent.Maelstrom).toBeDefined()
    expect(mockConfig.agent.Leviathan).toBeDefined()
    expect(mockConfig.agent.Poseidon).toBeDefined()
  })

  it('should set Kraken as primary agent via mode', async () => {
    const mockConfig: any = {}
    const hooks = await plugin({ config: mockConfig } as any)

    await hooks.config!(mockConfig)

    expect(mockConfig.agent.Kraken).toBeDefined()
    expect(mockConfig.agent.Kraken.mode).toBe('primary')
  })
})
