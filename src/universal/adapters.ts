import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { platform } from 'node:os'
import { dirname, join } from 'node:path'
import { getHomeDir } from '../shared/home-dir'
import type { UniversalTarget } from './targets'

type NonOpenCodeTarget = Exclude<UniversalTarget, 'opencode'>

interface McpServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

interface AdapterResult {
  path: string
  configured: boolean
  message: string
}

function parseJsonFile(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) {
    return {}
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function getVsCodeSettingsPath(): string {
  const home = getHomeDir()
  if (platform() === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Code', 'User', 'settings.json')
  }
  if (platform() === 'win32') {
    const appData = process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    return join(appData, 'Code', 'User', 'settings.json')
  }
  return join(home, '.config', 'Code', 'User', 'settings.json')
}

export function getTargetAdapterPath(target: NonOpenCodeTarget): string {
  const home = getHomeDir()
  switch (target) {
    case 'claude':
      return join(home, '.claude', 'settings.local.json')
    case 'codex':
      return join(home, '.codex', 'config.json')
    case 'cline':
      return join(
        home,
        '.config',
        'Code',
        'User',
        'globalStorage',
        'saoudrizwan.claude-dev',
        'settings',
        'cline_mcp_settings.json',
      )
    case 'cursor':
      return join(home, '.cursor', 'mcp.json')
    case 'vscode':
      return getVsCodeSettingsPath()
    case 'ci':
      return join(home, '.config', 'kraken', 'ci', 'bridge.json')
  }
}

function withMcpServer(
  current: Record<string, unknown>,
  mcpServer: McpServerConfig,
): Record<string, unknown> {
  const currentServers =
    typeof current.mcpServers === 'object' && current.mcpServers
      ? (current.mcpServers as Record<string, unknown>)
      : {}

  return {
    ...current,
    mcpServers: {
      ...currentServers,
      kraken: mcpServer,
    },
  }
}

export function applyTargetAdapter(
  target: NonOpenCodeTarget,
  mcpServer: McpServerConfig,
): AdapterResult {
  const configPath = getTargetAdapterPath(target)

  if (target === 'ci') {
    writeJsonFile(configPath, {
      transport: 'stdio',
      server: mcpServer,
      note: 'Launch kraken-code bridge and connect your CI agent over stdio.',
    })

    return {
      path: configPath,
      configured: true,
      message: 'CI bridge manifest generated',
    }
  }

  const current = parseJsonFile(configPath)
  const merged = withMcpServer(current, mcpServer)

  if (target === 'vscode') {
    const dotted = (merged['mcp.servers'] as Record<string, unknown>) || {}
    merged['mcp.servers'] = { ...dotted, kraken: mcpServer }
  }

  writeJsonFile(configPath, merged)

  return {
    path: configPath,
    configured: true,
    message: `${target} MCP server configured`,
  }
}

export function verifyTargetAdapter(
  target: NonOpenCodeTarget,
): { ok: boolean; path: string; message: string } {
  const configPath = getTargetAdapterPath(target)
  if (!existsSync(configPath)) {
    return {
      ok: false,
      path: configPath,
      message: 'Adapter config file not found',
    }
  }

  if (target === 'ci') {
    return {
      ok: true,
      path: configPath,
      message: 'CI bridge manifest present',
    }
  }

  const parsed = parseJsonFile(configPath)
  const nested = parsed?.mcpServers as Record<string, unknown> | undefined
  const dotted = parsed?.['mcp.servers'] as Record<string, unknown> | undefined
  const server =
    (nested && typeof nested === 'object' ? nested.kraken : undefined) ??
    (dotted && typeof dotted === 'object' ? dotted.kraken : undefined)

  const command =
    server && typeof server === 'object'
      ? (server as Record<string, unknown>).command
      : undefined

  if (command === 'kraken-code') {
    return {
      ok: true,
      path: configPath,
      message: 'MCP server registration found',
    }
  }

  return {
    ok: false,
    path: configPath,
    message: 'MCP server registration missing',
  }
}
