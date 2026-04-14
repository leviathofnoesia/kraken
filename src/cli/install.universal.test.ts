import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { install } from './install'
import { getTargetAdapterPath } from '../universal/adapters'
import type { UniversalTarget } from '../universal/targets'

type Target = Exclude<UniversalTarget, 'opencode'>

const targets: Target[] = ['codex', 'claude', 'cline', 'cursor', 'vscode', 'ci']

describe('install (universal targets)', () => {
  let homeBackup: string | undefined
  let testHome: string

  beforeEach(() => {
    homeBackup = process.env.HOME
    testHome = mkdtempSync(join(tmpdir(), 'kraken-install-universal-'))
    process.env.HOME = testHome
    delete process.env.APPDATA
  })

  afterEach(() => {
    process.env.HOME = homeBackup
    rmSync(testHome, { recursive: true, force: true })
  })

  test('creates bootstrap and adapters for all non-opencode targets', async () => {
    for (const target of targets) {
      const result = await install(target)
      expect(result.success).toBe(true)

      const targetConfigPath = join(testHome, '.config', 'kraken', 'targets', `${target}.json`)
      expect(existsSync(targetConfigPath)).toBe(true)
      expect(existsSync(getTargetAdapterPath(target))).toBe(true)
    }
  })
})
