export * from "./types"
export * from "./mcp-config-parser"
export * from "./mcp-manager"

import { SkillMcpManager } from "./mcp-manager"

let manager: SkillMcpManager | null = null

export async function initializeSkillMcpManager() {
  if (!manager) {
    manager = new SkillMcpManager()
    await manager.initialize()
  }
  return manager
}

export function getSkillMcpManager(): SkillMcpManager | null {
  return manager
}

export function resetSkillMcpManager() {
  if (manager) {
    manager.disconnectAll()
  }
  manager = null
}
