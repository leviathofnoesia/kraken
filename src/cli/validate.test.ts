import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInit } from './init'
import { runValidate } from './validate'

describe('validate command', () => {
  let homeBackup: string | undefined
  let testHome: string

  beforeEach(() => {
    homeBackup = process.env.HOME
    testHome = mkdtempSync(join(tmpdir(), 'kraken-validate-'))
    process.env.HOME = testHome
  })

  afterEach(() => {
    process.env.HOME = homeBackup
    rmSync(testHome, { recursive: true, force: true })
  })

  test('passes for initialized non-opencode target', async () => {
    await runInit({ target: 'codex', minimal: true })
    const result = await runValidate({ target: 'codex' })
    expect(result.success).toBe(true)
    expect(result.checks.every((check) => check.ok)).toBe(true)
  })

  test('fails adapter schema check when target is not initialized', async () => {
    const result = await runValidate({ target: 'claude' })
    expect(result.success).toBe(false)
    const adapter = result.checks.find((check) => check.name === 'adapter-schema')
    expect(adapter?.ok).toBe(false)
  })
})
