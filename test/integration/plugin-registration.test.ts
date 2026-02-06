import { describe, it, expect } from 'bun:test'

describe('Plugin Agent Registration', () => {
  it('should register all 12 sea-themed agents', async () => {
    const plugin = (await import('../../src/index')).default
    const mockConfig: any = {}
    const hooks = await plugin({} as any)

    await hooks.config!(mockConfig)

    const expectedAgents = [
      'Kraken',
      'Atlas',
      'Nautilus',
      'Abyssal',
      'Coral',
      'Siren',
      'Scylla',
      'Pearl',
      'Maelstrom',
      'Leviathan',
      'Poseidon',
      'Cartographer',
    ]

    for (const agent of expectedAgents) {
      expect(mockConfig.agent[agent]).toBeDefined()
      expect(mockConfig.agent[agent].description).toBeDefined()
      expect(mockConfig.agent[agent].prompt).toBeDefined()
    }
  })

  it('should set both Kraken and Cartographer as primary agents via mode', async () => {
    const plugin = (await import('../../src/index')).default
    const mockConfig: any = {}
    const hooks = await plugin({} as any)
    await hooks.config!(mockConfig)

    expect(mockConfig.agent['Kraken'].mode).toBe('primary')
    expect(mockConfig.agent['Cartographer'].mode).toBe('primary')
  })

  it('should enforce primary mode even when user overrides exist', async () => {
    const plugin = (await import('../../src/index')).default
    // Simulate user config that partially overrides Cartographer without setting mode
    const mockConfig: any = {
      agent: {
        Cartographer: { model: 'openai/gpt-5', temperature: 0.5 },
      },
    }
    const hooks = await plugin({} as any)
    await hooks.config!(mockConfig)

    // mode:primary must be enforced even with user overrides
    expect(mockConfig.agent['Cartographer'].mode).toBe('primary')
    // User overrides should still be applied
    expect(mockConfig.agent['Cartographer'].model).toBe('openai/gpt-5')
    expect(mockConfig.agent['Cartographer'].temperature).toBe(0.5)
    // Plugin defaults should fill gaps
    expect(mockConfig.agent['Cartographer'].prompt).toBeDefined()
    expect(mockConfig.agent['Cartographer'].description).toBeDefined()
  })

  it('should merge plugin defaults with user overrides for all agents', async () => {
    const plugin = (await import('../../src/index')).default
    // Simulate user config that partially overrides Nautilus
    const mockConfig: any = {
      agent: {
        Nautilus: { model: 'custom/model' },
      },
    }
    const hooks = await plugin({} as any)
    await hooks.config!(mockConfig)

    // User override should win for model
    expect(mockConfig.agent['Nautilus'].model).toBe('custom/model')
    // Plugin defaults should fill in prompt and description
    expect(mockConfig.agent['Nautilus'].prompt).toBeDefined()
    expect(mockConfig.agent['Nautilus'].description).toBeDefined()
    expect(mockConfig.agent['Nautilus'].mode).toBe('subagent')
  })

  it('should register Cartographer as a primary agent', async () => {
    const plugin = (await import('../../src/index')).default
    const mockConfig: any = {}
    const hooks = await plugin({} as any)
    await hooks.config!(mockConfig)

    expect(mockConfig.agent['Cartographer']).toBeDefined()
    expect(mockConfig.agent['Cartographer'].mode).toBe('primary')
  })
})
