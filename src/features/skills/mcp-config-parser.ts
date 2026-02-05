import * as yaml from 'js-yaml'
import type { ParsedFrontmatter } from '../command-loader/types'

export interface SkillMcpClientInfo {
  serverName: string
  command: string
  args: string[]
  env?: Record<string, string>
  timeout?: number
}

export interface SkillMcpConfig {
  [serverName: string]: SkillMcpClientInfo
}

export interface ParsedSkillFrontmatter extends ParsedFrontmatter {
  description?: string
  agent?: string
  model?: string
  subtask?: boolean
  mcp?: SkillMcpConfig
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/

export function parseSkillFrontmatter(content: string): ParsedSkillFrontmatter {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) {
    return {}
  }

  const frontmatter = match[1]

  try {
    const parsed = yaml.load(frontmatter) as any

    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    const result: ParsedSkillFrontmatter = {}

    for (const [key, value] of Object.entries(parsed)) {
      if (key === 'mcp') {
        if (value && typeof value === 'object') {
          result.mcp = value as SkillMcpConfig
        }
      } else if (value === 'true') {
        result[key] = true
      } else if (value === 'false') {
        result[key] = false
      } else if (!isNaN(Number(value))) {
        result[key] = Number(value)
      } else {
        result[key] = value
      }
    }

    return result
  } catch (error) {
    console.error('[mcp-config-parser] Error parsing YAML frontmatter:', error)
    return {}
  }
}

export function expandEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || ''
  })
}

export function expandEnvVarsInConfig(config: SkillMcpClientInfo): SkillMcpClientInfo {
  return {
    ...config,
    command: expandEnvVars(config.command),
    args: config.args.map((arg) => expandEnvVars(arg)),
    env: config.env
      ? Object.fromEntries(Object.entries(config.env).map(([k, v]) => [k, expandEnvVars(v)]))
      : undefined,
  }
}

export function validateMcpConfig(config: any): SkillMcpConfig | null {
  if (!config || typeof config !== 'object') {
    return null
  }

  const result: SkillMcpConfig = {}

  for (const [serverName, serverConfig] of Object.entries(config)) {
    const configObj = serverConfig as any

    if (!configObj || typeof configObj !== 'object' || !('command' in configObj)) {
      console.warn(`[mcp-config-parser] Invalid MCP config for server ${serverName}`)
      continue
    }

    const command = String(configObj.command || '')
    const args = Array.isArray(configObj.args)
      ? configObj.args.map((a: any) => String(a || ''))
      : []
    const env =
      typeof configObj.env === 'object' ? (configObj.env as Record<string, string>) : undefined
    const timeout = typeof configObj.timeout === 'number' ? configObj.timeout : 30000

    const clientInfo: SkillMcpClientInfo = {
      serverName,
      command,
      args,
      env,
      timeout,
    }

    result[serverName] = clientInfo
  }

  return Object.keys(result).length > 0 ? result : null
}

export function hasMcpConfig(content: string): boolean {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) {
    return false
  }

  const frontmatter = match[1].toLowerCase()
  return frontmatter.includes('mcp:')
}
