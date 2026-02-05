import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import * as path from 'path'
import * as os from 'os'
import type { OpenCodeXConfig } from './schema'
import { OpenCodeXConfigSchema } from './schema'

const CONFIG_PATH = path.join(os.homedir(), '.config', 'opencode', 'kraken-code.json')

let _config: OpenCodeXConfig | null = null

export function getConfig(): OpenCodeXConfig {
  if (!_config) {
    if (!existsSync(CONFIG_PATH)) {
      _config = {}
    } else {
      try {
        const raw = readFileSync(CONFIG_PATH, 'utf-8')
        _config = OpenCodeXConfigSchema.parse(JSON.parse(raw))
      } catch (error) {
        console.error(`[config-manager] Error loading config from ${CONFIG_PATH}:`, error)
        _config = {}
      }
    }
  }
  return _config
}

export function getConfigValue<K extends keyof OpenCodeXConfig>(
  key: K,
): OpenCodeXConfig[K] | undefined {
  return getConfig()[key]
}

export function getBlitzkriegConfig() {
  return getConfigValue('blitzkrieg')
}

export function getMemoryConfig() {
  return getConfigValue('memory')
}

export function getLearningConfig() {
  return getConfigValue('learning')
}

export function getModesConfig() {
  return getConfigValue('modes')
}

export function getEnhancedConfig() {
  return getConfigValue('enhanced')
}

export function getClaudeCodeCompatibilityConfig() {
  return getConfigValue('claudeCodeCompatibility')
}

export function getMcpConfig() {
  return getConfigValue('mcp')
}

export function getLspConfig() {
  return getConfigValue('lsp')
}

export function getNotificationsConfig() {
  return getConfigValue('notifications')
}

export function getAgentOverrides() {
  return getConfigValue('agents')
}

export function getThinkModeConfig() {
  return getConfigValue('thinkMode')
}

export function getCompressionConfig() {
  return getConfigValue('compression')
}

export function getSkillMcpConfig() {
  return getConfigValue('skillMcp')
}

export function getCommandLoaderConfig() {
  return getConfigValue('commandLoader')
}

export function getBackgroundTaskConfig() {
  return getConfigValue('backgroundTask')
}

export function getRalphLoopConfig() {
  return getConfigValue('ralphLoop')
}
