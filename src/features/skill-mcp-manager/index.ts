export * from './types'
export * from './mcp-config-parser'
export * from './mcp-manager'

import type { SkillMcpConfig } from './types'
import { SkillMcpManager } from './mcp-manager'

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

export function createSkillMcpServer(
  skillName: string,
  config: SkillMcpConfig | string,
): { skillName: string; config: SkillMcpConfig | string } {
  return { skillName, config }
}

export function resetSkillMcpManager() {
  if (manager) {
    manager.disconnectAll()
  }
  manager = null
}
