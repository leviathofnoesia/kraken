import { describe, expect, test } from 'bun:test'
import { wrapToolsWithPolicy } from './tool-wrapper'

describe('tool wrapper policy enforcement', () => {
  test('blocks write-class tools in strict mode', async () => {
    const tools = wrapToolsWithPolicy(
      {
        'model-switcher': {
          execute: async () => 'ok',
        },
      },
      { target: 'codex', mode: 'strict' },
    )

    await expect(tools['model-switcher'].execute?.()).rejects.toThrow('blocked')
  })

  test('allows read-class tools in strict mode', async () => {
    const tools = wrapToolsWithPolicy(
      {
        lsp_hover: {
          execute: async () => 'ok',
        },
      },
      { target: 'claude', mode: 'strict' },
    )

    await expect(tools.lsp_hover.execute?.()).resolves.toBe('ok')
  })
})
