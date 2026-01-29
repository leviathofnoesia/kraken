import { supportsNewPermissionSystem } from "./opencode-version"

export type PermissionValue = "ask" | "allow" | "deny"

export interface LegacyToolsFormat {
  tools: Record<string, boolean>
}

export interface NewPermissionFormat {
  permission: Record<string, PermissionValue>
}

export type VersionAwareRestrictions = LegacyToolsFormat | NewPermissionFormat

// Valid OpenCode permission keys according to AgentPermissionSchema
const VALID_PERMISSION_KEYS = ["edit", "bash", "webfetch", "doom_loop", "external_directory"] as const;

// Map legacy tool names to valid permission keys
const TOOL_TO_PERMISSION_MAP: Record<string, keyof typeof VALID_PERMISSION_KEYS> = {
  "write": "edit",
  "task": "bash",
  "read": "edit",
  "edit": "edit",
};

export function createAgentToolRestrictions(
  denyTools: string[]
): VersionAwareRestrictions {
  if (supportsNewPermissionSystem()) {
    // Map deny tools to valid permission keys
    const mappedPermissions: Record<string, PermissionValue> = {};
    for (const tool of denyTools) {
      const validKey = TOOL_TO_PERMISSION_MAP[tool];
      if (validKey) {
        mappedPermissions[validKey] = "deny" as const;
      } else {
        // If tool doesn't map to a valid key, skip it
        // Log for debugging
        console.warn(`[kraken-code] Skipping invalid permission key: ${tool}`);
      }
    }
    return {
      permission: mappedPermissions,
    };
  }

  return {
    tools: Object.fromEntries(denyTools.map((tool) => [tool, false])),
  }
}

export function migrateToolsToPermission(
  tools: Record<string, boolean>
): Record<string, PermissionValue> {
  return Object.fromEntries(
    Object.entries(tools).map(([key, value]) => [
      key,
      value ? ("allow" as const) : ("deny" as const),
    ])
  )
}

export function migratePermissionToTools(
  permission: Record<string, PermissionValue>
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(permission)
      .filter(([, value]) => value !== "ask")
      .map(([key, value]) => [key, value === "allow"])
  )
}

export function migrateAgentConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...config }

  if (supportsNewPermissionSystem()) {
    if (result.tools && typeof result.tools === "object") {
      const existingPermission =
        (result.permission as Record<string, PermissionValue>) || {}
      const migratedPermission = migrateToolsToPermission(
        result.tools as Record<string, boolean>
      )
      result.permission = { ...migratedPermission, ...existingPermission }
      delete result.tools
    }
  } else {
    if (result.permission && typeof result.permission === "object") {
      const existingTools = (result.tools as Record<string, boolean>) || {}
      const migratedTools = migratePermissionToTools(
        result.permission as Record<string, PermissionValue>
      )
      result.tools = { ...migratedTools, ...existingTools }
      delete result.permission
    }
  }

  return result
}
