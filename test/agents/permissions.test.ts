import { describe, it, expect } from 'bun:test'
import {
  AGENT_PROFILES,
  getProfile,
  isToolAllowed,
  canDelegate,
  getAllowedToolsList,
  buildPermissionConfig,
  buildToolsConfig,
  getFilteredToolMap,
} from '../../src/agents/permissions'
import type { AgentName } from '../../src/agents'

const ALL_AGENTS: AgentName[] = [
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
]

describe('permissions', () => {
  describe('AGENT_PROFILES', () => {
    it('should have a profile for every agent', () => {
      for (const name of ALL_AGENTS) {
        expect(AGENT_PROFILES[name]).toBeDefined()
        expect(AGENT_PROFILES[name].agent).toBe(name)
      }
    })

    it('should have non-empty allowedBuiltinTools for every agent', () => {
      for (const name of ALL_AGENTS) {
        const profile = getProfile(name)
        expect(profile.allowedBuiltinTools.length).toBeGreaterThan(0)
      }
    })

    it('should have a description for every profile', () => {
      for (const name of ALL_AGENTS) {
        expect(getProfile(name).description.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getProfile', () => {
    it('should return the correct profile for Kraken', () => {
      const profile = getProfile('Kraken')
      expect(profile.agent).toBe('Kraken')
      expect(profile.maxDelegationDepth).toBe(2)
      expect(profile.permissions.bash).toBe('allow')
      expect(profile.permissions.edit).toBe('allow')
    })

    it('should return read-only profiles for advisory agents', () => {
      for (const name of ['Atlas', 'Maelstrom', 'Leviathan', 'Poseidon', 'Scylla'] as AgentName[]) {
        const profile = getProfile(name)
        expect(profile.permissions.edit).toBe('deny')
        expect(profile.permissions.bash).toBe('deny')
      }
    })

    it('should return write access for Coral and Siren', () => {
      for (const name of ['Coral', 'Siren'] as AgentName[]) {
        const profile = getProfile(name)
        expect(profile.permissions.edit).toBe('allow')
        expect(profile.permissions.bash).toBe('allow')
      }
    })
  })

  describe('isToolAllowed', () => {
    it('should allow everything for Kraken', () => {
      expect(isToolAllowed('Kraken', 'edit')).toBe(true)
      expect(isToolAllowed('Kraken', 'write')).toBe(true)
      expect(isToolAllowed('Kraken', 'websearch')).toBe(true)
      expect(isToolAllowed('Kraken', 'nonexistent')).toBe(true)
    })

    it('should allow Nautilus to use search tools', () => {
      expect(isToolAllowed('Nautilus', 'grep')).toBe(true)
      expect(isToolAllowed('Nautilus', 'ast_grep_search')).toBe(true)
      expect(isToolAllowed('Nautilus', 'lsp_hover')).toBe(true)
    })

    it('should deny Nautilus from using write tools', () => {
      expect(isToolAllowed('Nautilus', 'edit')).toBe(false)
      expect(isToolAllowed('Nautilus', 'write')).toBe(false)
    })

    it('should allow Abyssal to use MCP tools', () => {
      expect(isToolAllowed('Abyssal', 'websearch')).toBe(true)
      expect(isToolAllowed('Abyssal', 'context7-search')).toBe(true)
    })

    it('should deny Pearl from using MCP tools', () => {
      expect(isToolAllowed('Pearl', 'websearch')).toBe(false)
      expect(isToolAllowed('Pearl', 'context7-search')).toBe(false)
    })

    it('should correctly check builtin vs MCP tools', () => {
      expect(isToolAllowed('Scylla', 'grep-search')).toBe(true)
      expect(isToolAllowed('Scylla', 'websearch')).toBe(false)
    })
  })

  describe('canDelegate', () => {
    it('should allow Kraken to delegate at depth 0 and 1', () => {
      expect(canDelegate('Kraken', 0)).toBe(true)
      expect(canDelegate('Kraken', 1)).toBe(true)
      expect(canDelegate('Kraken', 2)).toBe(false)
    })

    it('should allow Atlas to delegate at depth 0 only', () => {
      expect(canDelegate('Atlas', 0)).toBe(true)
      expect(canDelegate('Atlas', 1)).toBe(false)
    })

    it('should not allow worker agents to delegate', () => {
      for (const name of [
        'Nautilus',
        'Abyssal',
        'Coral',
        'Siren',
        'Scylla',
        'Pearl',
        'Leviathan',
        'Maelstrom',
        'Poseidon',
      ] as AgentName[]) {
        expect(canDelegate(name, 0)).toBe(false)
      }
    })
  })

  describe('getAllowedToolsList', () => {
    it('should return combined builtin + MCP tools', () => {
      const tools = getAllowedToolsList('Abyssal')
      expect(tools).toContain('grep')
      expect(tools).toContain('websearch')
      expect(tools).toContain('context7-search')
      expect(tools).toContain('grep-search')
    })
  })

  describe('buildPermissionConfig', () => {
    it('should return a valid permission map', () => {
      const perms = buildPermissionConfig('Nautilus')
      expect(perms.bash).toBe('deny')
      expect(perms.edit).toBe('deny')
      expect(perms.webfetch).toBe('deny')
      expect(perms.external_directory).toBe('deny')
    })
  })

  describe('buildToolsConfig', () => {
    it('should return boolean tool map', () => {
      const tools = buildToolsConfig('Nautilus')
      expect(tools.grep).toBe(true)
      expect(tools.edit).toBe(false)
      expect(tools.write).toBe(false)
    })
  })

  describe('getFilteredToolMap', () => {
    it('should return all tools for Kraken', () => {
      const all = { a: 1, b: 2, c: 3 }
      const filtered = getFilteredToolMap('Kraken', all)
      expect(Object.keys(filtered)).toHaveLength(3)
    })

    it('should filter tools for non-Kraken agents', () => {
      const all = { grep: {}, edit: {}, websearch: {}, task: {} }
      const filtered = getFilteredToolMap('Nautilus', all)
      expect(filtered.grep).toBeDefined()
      expect(filtered.edit).toBeUndefined()
      expect(filtered.websearch).toBeUndefined()
    })
  })
})
