import { describe, expect, test } from 'bun:test'
import { createReadOnlyRestrictions } from './permission-compat'

describe('createReadOnlyRestrictions', () => {
  test('keeps task delegation enabled by default', () => {
    const restrictions = createReadOnlyRestrictions()
    const tools = (restrictions as { tools?: Record<string, boolean> }).tools
    const permission = (restrictions as { permission?: Record<string, string> }).permission

    expect(tools?.write).toBe(false)
    expect(tools?.task).toBeUndefined()
    expect(permission?.edit).toBe('deny')
  })

  test('can disable task delegation explicitly', () => {
    const restrictions = createReadOnlyRestrictions({ allowTaskDelegation: false })
    const tools = (restrictions as { tools?: Record<string, boolean> }).tools
    expect(tools?.task).toBe(false)
  })
})
