import { supportsNewPermissionSystem } from './opencode-version'

export type PermissionValue = 'ask' | 'allow' | 'deny'

export interface LegacyToolsFormat {
  tools: Record<string, boolean>
}

export interface NewPermissionFormat {
  permission: Record<string, PermissionValue>
}

export type VersionAwareRestrictions = LegacyToolsFormat | NewPermissionFormat

const VALID_PERMISSION_KEYS = new Set([
  'edit',
  'bash',
  'webfetch',
  'doom_loop',
  'external_directory',
])

export function createAgentToolRestrictions(denyTools: string[]): VersionAwareRestrictions {
  if (supportsNewPermissionSystem()) {
    const permission: Record<string, PermissionValue> = {}
    const tools: Record<string, boolean> = {}

    for (const tool of denyTools) {
      if (VALID_PERMISSION_KEYS.has(tool)) {
        permission[tool] = 'deny'
      } else {
        tools[tool] = false
      }
    }

    if (Object.keys(tools).length > 0 && Object.keys(permission).length > 0) {
      return { permission, tools } as VersionAwareRestrictions
    } else if (Object.keys(tools).length > 0) {
      return { tools } as VersionAwareRestrictions
    } else {
      return { permission } as VersionAwareRestrictions
    }
  }

  return {
    tools: Object.fromEntries(denyTools.map((tool) => [tool, false])),
  }
}

export function migrateToolsToPermission(
  tools: Record<string, boolean>,
): Record<string, PermissionValue> {
  return Object.fromEntries(
    Object.entries(tools).map(([key, value]) => [
      key,
      value ? ('allow' as const) : ('deny' as const),
    ]),
  )
}

export function migratePermissionToTools(
  permission: Record<string, PermissionValue>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(permission)
      .filter(([, value]) => value !== 'ask')
      .map(([key, value]) => [key, value === 'allow']),
  )
}

export function migrateAgentConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result = { ...config }

  if (supportsNewPermissionSystem()) {
    if (result.tools && typeof result.tools === 'object') {
      const existingPermission = (result.permission as Record<string, PermissionValue>) || {}
      const migratedPermission = migrateToolsToPermission(result.tools as Record<string, boolean>)
      result.permission = { ...migratedPermission, ...existingPermission }
      delete result.tools
    }
  } else {
    if (result.permission && typeof result.permission === 'object') {
      const existingTools = (result.tools as Record<string, boolean>) || {}
      const migratedTools = migratePermissionToTools(
        result.permission as Record<string, PermissionValue>,
      )
      result.tools = { ...migratedTools, ...existingTools }
      delete result.permission
    }
  }

  return result
}
