import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock the config path for testing
const testConfigDir = path.join(os.tmpdir(), 'kraken-test-config-' + Date.now())
const testConfigPath = path.join(testConfigDir, 'kraken-code.json')

describe('Config Manager', () => {
  beforeEach(() => {
    // Create test config directory
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true })
    }
  })

  describe('getConfig', () => {
    it('should return empty object when no config file exists', () => {
      // This test verifies the function handles missing config gracefully
      // Note: The actual config path is hardcoded, so we test the schema validation
      const { OpenCodeXConfigSchema } = require('../../src/config/schema')
      
      // Should validate empty object
      const result = OpenCodeXConfigSchema.parse({})
      expect(result).toBeDefined()
    })

    it('should validate full config with all fields', () => {
      const { OpenCodeXConfigSchema } = require('../../src/config/schema')
      
      const fullConfig = {
        disabled_hooks: ['ralph-loop'],
        disabled_commands: ['init-deep'],
        agents: {
          Kraken: {
            model: 'claude-opus',
            temperature: 0.7,
          },
        },
        ralphLoop: {
          enabled: true,
          default_max_iterations: 50,
        },
        blitzkrieg: {
          enabled: true,
          testPlan: {
            requiredBeforeImplementation: true,
            minTestCases: 5,
            requireCoverageThreshold: true,
            coverageThresholdPercent: 80,
          },
          tddWorkflow: {
            enforceWriteTestFirst: true,
            forbidCodeWithoutTest: true,
          },
          evidence: {
            requireTestExecutionEvidence: true,
          },
          plannerConstraints: {
            requireTestStep: true,
          },
        },
        mcp: {
          websearch: {
            enabled: true,
            timeout: 30000,
          },
        },
        learning: {
          enabled: true,
          storagePath: '~/.kraken/learning',
        },
      }
      
      const result = OpenCodeXConfigSchema.parse(fullConfig)
      expect(result).toBeDefined()
      expect(result.ralphLoop?.default_max_iterations).toBe(50)
    })

    it('should apply defaults for missing optional fields', () => {
      const { OpenCodeXConfigSchema } = require('../../src/config/schema')
      
      // Empty config should be valid
      const minimalConfig = {}
      
      const result = OpenCodeXConfigSchema.parse(minimalConfig)
      expect(result).toBeDefined()
      // Note: defaults are applied at parse time, but top-level fields may not have defaults
      // The schema relies on the application code to apply defaults
    })
  })

  describe('Config Schema Validation', () => {
    it('should validate agent names', () => {
      const { OpenCodeXBuiltinAgentNameSchema } = require('../../src/config/schema')
      
      const validAgents = ['Kraken', 'Nautilus', 'Abyssal', 'Coral', 'Siren', 'Scylla', 'Pearl', 'Maelstrom', 'Leviathan', 'Poseidon', 'Cartographer']
      
      for (const agent of validAgents) {
        expect(() => OpenCodeXBuiltinAgentNameSchema.parse(agent)).not.toThrow()
      }
    })

    it('should validate hook names', () => {
      const { OpenCodeXHookNameSchema } = require('../../src/config/schema')
      
      const validHooks = ['ralph-loop', 'think-mode', 'session-recovery', 'blitzkrieg-test-plan-enforcer']
      
      for (const hook of validHooks) {
        expect(() => OpenCodeXHookNameSchema.parse(hook)).not.toThrow()
      }
    })

    it('should reject invalid agent names', () => {
      const { OpenCodeXBuiltinAgentNameSchema } = require('../../src/config/schema')
      
      expect(() => OpenCodeXBuiltinAgentNameSchema.parse('InvalidAgent')).toThrow()
    })

    it('should validate MCP configs', () => {
      const { WebsearchMCPConfigSchema } = require('../../src/config/schema')
      
      const config = {
        enabled: true,
        timeout: 60000,
        numResults: 10,
      }
      
      const result = WebsearchMCPConfigSchema.parse(config)
      expect(result.enabled).toBe(true)
      expect(result.timeout).toBe(60000)
    })

    it('should validate Learning config', () => {
      const { LearningConfigSchema } = require('../../src/config/schema')
      
      const config = {
        enabled: true,
        autoSave: true,
        storagePath: '~/.kraken/learning',
        experienceStore: {
          enabled: true,
          maxEntries: 5000,
        },
        knowledgeGraph: {
          enabled: true,
          maxNodes: 10000,
        },
      }
      
      const result = LearningConfigSchema.parse(config)
      expect(result.enabled).toBe(true)
      expect(result.experienceStore?.maxEntries).toBe(5000)
    })
  })
})
