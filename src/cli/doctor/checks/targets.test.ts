import { describe, expect, test } from 'bun:test'
import { getTargetCheckDefinitions } from './targets'

describe('target doctor checks', () => {
  test('returns no extra checks for opencode', () => {
    expect(getTargetCheckDefinitions('opencode')).toHaveLength(0)
  })

  test('returns universal bootstrap and bridge checks for codex', () => {
    const checks = getTargetCheckDefinitions('codex')
    const ids = checks.map((c) => c.id)
    expect(ids).toContain('universal-bootstrap')
    expect(ids).toContain('bridge-binary')
    expect(ids).toContain('host-adapter')
  })

  test('includes host adapter check for Claude', () => {
    const checks = getTargetCheckDefinitions('claude')
    const ids = checks.map((c) => c.id)
    expect(ids).toContain('host-adapter')
  })
})
