import { describe, it, expect } from 'bun:test'
import { checkVersion, getVersionCheckDefinition } from './version'

describe('Version Check', () => {
  it('should return a valid status', async () => {
    const result = await checkVersion()
    expect(['pass', 'warn', 'fail']).toContain(result.status)
    expect(result.name).toBeDefined()
    expect(result.message).toBeDefined()
  })

  it('should return correct check definition', () => {
    const definition = getVersionCheckDefinition()
    expect(definition.category).toBe('updates')
    expect(definition.critical).toBe(false)
  })
})
