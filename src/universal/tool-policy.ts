import {
  TARGET_DEFINITIONS,
  type TargetCapabilities,
  type UniversalMode,
  type UniversalTarget,
} from './targets'

type ToolAccessClass = 'read' | 'edit' | 'write' | 'taskDelegation' | 'backgroundTasks' | 'hooks'

export const TOOL_ACCESS_CLASS: Record<string, ToolAccessClass> = {
  // Bridge tools
  grep: 'read',
  session_list: 'read',
  session_read: 'read',
  session_search: 'read',
  session_info: 'read',
  ast_grep_search: 'read',
  ast_grep_replace: 'edit',

  // Built-in plugin tools
  'kraken-compress': 'read',
  'model-switcher': 'write',
  'ralph-loop': 'write',

  // Existing MCP tools
  websearchTool: 'read',
  webfetchTool: 'read',
  context7SearchTool: 'read',
  context7GetTool: 'read',
  grepSearchTool: 'read',
  grepGetFileTool: 'read',

  // Additional MCP tools
  mcpDeepwikiSearch: 'read',
  mcpSemgrepSearch: 'read',
  mcpSequentialThinking: 'read',
  mcpBridgemind: 'read',

  // Background agent tools
  call_agent: 'taskDelegation',
  background_task_status: 'backgroundTasks',
  background_task_list: 'backgroundTasks',
  background_task_cancel: 'backgroundTasks',

  // LSP tools (if exposed)
  lsp_hover: 'read',
  lsp_goto_definition: 'read',
  lsp_find_references: 'read',
  lsp_document_symbols: 'read',
  lsp_workspace_symbols: 'read',
  lsp_diagnostics: 'read',
  lsp_prepare_rename: 'read',
  lsp_rename: 'edit',
  lsp_code_actions: 'read',
  lsp_code_action_resolve: 'read',
  lsp_servers: 'read',
}

function getEffectiveCapabilities(
  target: UniversalTarget,
  mode: UniversalMode,
): TargetCapabilities {
  const base = TARGET_DEFINITIONS[target].capabilities

  if (mode !== 'strict') {
    return base
  }

  return {
    ...base,
    write: false,
    edit: false,
    taskDelegation: false,
    backgroundTasks: false,
  }
}

function requiredCapability(toolName: string): keyof TargetCapabilities {
  const accessClass = getToolAccessClass(toolName)

  switch (accessClass) {
    case 'read':
      return 'mcp'
    case 'edit':
      return 'edit'
    case 'write':
      return 'write'
    case 'taskDelegation':
      return 'taskDelegation'
    case 'backgroundTasks':
      return 'backgroundTasks'
    case 'hooks':
      return 'hooks'
  }
}

export function getToolAccessClass(toolName: string): ToolAccessClass {
  if (TOOL_ACCESS_CLASS[toolName]) {
    return TOOL_ACCESS_CLASS[toolName]
  }

  // Tool families where all known tools are read-only.
  if (toolName.startsWith('learning_')) return 'read'

  // Conservative default for unknown tools.
  return 'write'
}

export function canExecuteTool(
  toolName: string,
  target: UniversalTarget = 'opencode',
  mode: UniversalMode = 'standard',
): { allowed: true } | { allowed: false; reason: string } {
  const capabilities = getEffectiveCapabilities(target, mode)
  const required = requiredCapability(toolName)

  if (!capabilities[required]) {
    return {
      allowed: false,
      reason: `Tool "${toolName}" is blocked for target="${target}" mode="${mode}" (requires ${required})`,
    }
  }

  return { allowed: true }
}

export function filterAllowedTools(
  toolNames: string[],
  target: UniversalTarget = 'opencode',
  mode: UniversalMode = 'standard',
): string[] {
  return toolNames.filter((toolName) => canExecuteTool(toolName, target, mode).allowed)
}
