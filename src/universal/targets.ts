export type UniversalTarget =
  | 'opencode'
  | 'codex'
  | 'claude'
  | 'cline'
  | 'cursor'
  | 'vscode'
  | 'ci'

export type UniversalMode = 'standard' | 'strict'

export interface TargetCapabilities {
  write: boolean
  edit: boolean
  taskDelegation: boolean
  hooks: boolean
  mcp: boolean
  backgroundTasks: boolean
}

export interface TargetDefinition {
  id: UniversalTarget
  mode: UniversalMode
  capabilities: TargetCapabilities
}

export const UNIVERSAL_TARGETS: readonly UniversalTarget[] = [
  'opencode',
  'codex',
  'claude',
  'cline',
  'cursor',
  'vscode',
  'ci',
]

export const TARGET_DEFINITIONS: Record<UniversalTarget, TargetDefinition> = {
  opencode: {
    id: 'opencode',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: true,
      mcp: true,
      backgroundTasks: true,
    },
  },
  codex: {
    id: 'codex',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: false,
      mcp: true,
      backgroundTasks: true,
    },
  },
  claude: {
    id: 'claude',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: true,
      mcp: true,
      backgroundTasks: true,
    },
  },
  cline: {
    id: 'cline',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: false,
      mcp: true,
      backgroundTasks: true,
    },
  },
  cursor: {
    id: 'cursor',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: false,
      mcp: true,
      backgroundTasks: true,
    },
  },
  vscode: {
    id: 'vscode',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: false,
      mcp: true,
      backgroundTasks: true,
    },
  },
  ci: {
    id: 'ci',
    mode: 'standard',
    capabilities: {
      write: true,
      edit: true,
      taskDelegation: true,
      hooks: false,
      mcp: true,
      backgroundTasks: false,
    },
  },
}

export function isUniversalTarget(value: string): value is UniversalTarget {
  return (UNIVERSAL_TARGETS as readonly string[]).includes(value)
}
