import { describe, expect, test } from 'bun:test'
import { canExecuteTool, filterAllowedTools, getToolAccessClass } from './tool-policy'

describe('universal tool policy', () => {
  test('allows read tools in strict mode', () => {
    expect(canExecuteTool('grep', 'codex', 'strict')).toEqual({ allowed: true })
  })

  test('blocks edit tools in strict mode', () => {
    const result = canExecuteTool('ast_grep_replace', 'claude', 'strict')
    expect(result.allowed).toBe(false)
  })

  test('filters tools by target mode', () => {
    const allowed = filterAllowedTools(
      ['grep', 'session_read', 'ast_grep_replace'],
      'cursor',
      'strict',
    )
    expect(allowed).toEqual(['grep', 'session_read'])
  })

  test('classifies plugin tool families as read where expected', () => {
    expect(getToolAccessClass('lsp_hover')).toBe('read')
    expect(getToolAccessClass('learning_search_experiences')).toBe('read')
    expect(getToolAccessClass('context7SearchTool')).toBe('read')
  })

  test('classifies model-switcher as write', () => {
    expect(getToolAccessClass('model-switcher')).toBe('write')
  })
})
