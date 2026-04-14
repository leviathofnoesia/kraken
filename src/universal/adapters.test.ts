import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  applyTargetAdapter,
  getTargetAdapterPath,
  verifyTargetAdapter,
} from './adapters'
import type { UniversalTarget } from './targets'

type Target = Exclude<UniversalTarget, 'opencode'>

const targets: Target[] = ['codex', 'claude', 'cline', 'cursor', 'vscode', 'ci']

describe('universal adapters', () => {
  let homeBackup: string | undefined
  let testHome: string

  beforeEach(() => {
    homeBackup = process.env.HOME
    testHome = mkdtempSync(join(tmpdir(), 'kraken-adapters-'))
    process.env.HOME = testHome
    delete process.env.APPDATA
  })

  afterEach(() => {
    process.env.HOME = homeBackup
    rmSync(testHome, { recursive: true, force: true })
  })

  test('writes and verifies adapter config for every universal target', () => {
    for (const target of targets) {
      const result = applyTargetAdapter(target, {
        command: 'kraken-code',
        args: ['bridge', 'start', '--protocol', 'mcp'],
      })

      expect(result.configured).toBe(true)
      expect(existsSync(result.path)).toBe(true)

      const verification = verifyTargetAdapter(target)
      expect(verification.ok).toBe(true)
      expect(verification.path).toBe(result.path)
    }
  })

  test('stores expected config keys per client', () => {
    applyTargetAdapter('vscode', { command: 'kraken-code' })
    applyTargetAdapter('cursor', { command: 'kraken-code' })
    applyTargetAdapter('ci', { command: 'kraken-code' })

    const vscode = JSON.parse(readFileSync(getTargetAdapterPath('vscode'), 'utf-8'))
    const cursor = JSON.parse(readFileSync(getTargetAdapterPath('cursor'), 'utf-8'))
    const ci = JSON.parse(readFileSync(getTargetAdapterPath('ci'), 'utf-8'))

    expect(vscode['mcp.servers']?.kraken?.command).toBe('kraken-code')
    expect(cursor.mcpServers?.kraken?.command).toBe('kraken-code')
    expect(ci.transport).toBe('stdio')
    expect(ci.server?.command).toBe('kraken-code')
  })
})
