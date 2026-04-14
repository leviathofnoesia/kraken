import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runDoctor } from './doctor'
import { runInit } from './init'
import { runStatus } from './status'
import { runValidate } from './validate'
import { getTargetAdapterPath } from '../universal/adapters'
import type { UniversalTarget } from '../universal/targets'

type Target = Exclude<UniversalTarget, 'opencode'>

const targets: Target[] = ['codex', 'claude', 'cline', 'cursor', 'vscode', 'ci']

describe('universal target integration', () => {
  let homeBackup: string | undefined
  let testHome: string
  let logSpy: ReturnType<typeof vi.spyOn>
  let errSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    homeBackup = process.env.HOME
    testHome = mkdtempSync(join(tmpdir(), 'kraken-universal-cli-'))
    process.env.HOME = testHome
    delete process.env.APPDATA
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.env.HOME = homeBackup
    rmSync(testHome, { recursive: true, force: true })
  })

  test('init creates bootstrap and adapter for each target', async () => {
    for (const target of targets) {
      await runInit({ target, minimal: true })
      const targetConfigPath = join(testHome, '.config', 'kraken', 'targets', `${target}.json`)
      expect(existsSync(targetConfigPath)).toBe(true)
      expect(existsSync(getTargetAdapterPath(target))).toBe(true)
    }
  })

  test('status runs after universal initialization', async () => {
    for (const target of targets) {
      await runInit({ target, minimal: true })
      await runStatus({ target })
    }
    expect(logSpy).toHaveBeenCalled()
  })

  test('doctor installation checks pass in standard and strict modes', async () => {
    for (const target of targets) {
      await runInit({ target, minimal: true })

      const standard = await runDoctor({
        target,
        category: 'installation',
        json: true,
        strict: false,
      })
      expect(standard.exitCode).toBe(0)

      const strict = await runDoctor({
        target,
        category: 'installation',
        json: true,
        strict: true,
      })
      expect(strict.exitCode).toBe(0)
    }
  })

  test('validate passes for initialized targets', async () => {
    for (const target of targets) {
      await runInit({ target, minimal: true })
      const result = await runValidate({ target })
      expect(result.success).toBe(true)
    }
  })
})
