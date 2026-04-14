import type { PermissionValue } from '../shared/permission-compat'
import type { AgentName } from './index'

export interface AgentPermissionProfile {
  agent: AgentName
  allowedBuiltinTools: readonly string[]
  allowedMcpTools: readonly string[]
  permissions: Record<string, PermissionValue>
  maxDelegationDepth: number
  description: string
}

const READ_TOOLS = [
  'grep',
  'ast_grep_search',
  'ast_grep_replace',
  'session_list',
  'session_read',
  'session_search',
  'session_info',
] as const
const LSP_TOOLS = [
  'lsp_hover',
  'lsp_goto_definition',
  'lsp_find_references',
  'lsp_document_symbols',
  'lsp_workspace_symbols',
  'lsp_diagnostics',
  'lsp_prepare_rename',
  'lsp_rename',
  'lsp_code_actions',
  'lsp_code_action_resolve',
  'lsp_servers',
] as const
const WRITE_TOOLS = ['edit', 'write'] as const
const DELEGATION_TOOLS = [
  'call-kraken-agent',
  'background_task_status',
  'background_task_list',
  'background_task_cancel',
] as const
const UTILITY_TOOLS = ['model-switcher', 'ralph-loop', 'kraken-compress'] as const
const MCP_WEB = ['websearch', 'webfetch'] as const
const MCP_DOCS = ['context7-search', 'context7-get'] as const
const MCP_CODE = ['grep-search', 'grep-get-file'] as const

type ToolGroup = readonly string[]

function union(...groups: ToolGroup[]): string[] {
  return [...new Set(groups.flat())]
}

const DENY_ALL_EXEC: Record<string, PermissionValue> = {
  bash: 'deny',
  edit: 'deny',
  webfetch: 'deny',
  external_directory: 'deny',
}

const ALLOW_EXEC: Record<string, PermissionValue> = {
  bash: 'allow',
  edit: 'allow',
  webfetch: 'allow',
  external_directory: 'allow',
}

const ALLOW_READONLY_EXEC: Record<string, PermissionValue> = {
  bash: 'allow',
  edit: 'deny',
  webfetch: 'allow',
  external_directory: 'allow',
}

export const AGENT_PROFILES: Record<AgentName, AgentPermissionProfile> = {
  Kraken: {
    agent: 'Kraken',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS, WRITE_TOOLS, DELEGATION_TOOLS, UTILITY_TOOLS),
    allowedMcpTools: union(MCP_WEB, MCP_DOCS, MCP_CODE),
    permissions: ALLOW_EXEC,
    maxDelegationDepth: 2,
    description: 'Orchestrator — full access, can delegate to all agents up to depth 2',
  },

  Atlas: {
    agent: 'Atlas',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS, DELEGATION_TOOLS),
    allowedMcpTools: union(MCP_WEB, MCP_DOCS, MCP_CODE),
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 1,
    description:
      'Architecture advisor — read-only analysis, can delegate to Nautilus/Abyssal for research',
  },

  Nautilus: {
    agent: 'Nautilus',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS),
    allowedMcpTools: union(MCP_DOCS, MCP_CODE),
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'Codebase search — read-only exploration with LSP and grep tools',
  },

  Abyssal: {
    agent: 'Abyssal',
    allowedBuiltinTools: [...READ_TOOLS],
    allowedMcpTools: union(MCP_WEB, MCP_DOCS, MCP_CODE),
    permissions: { ...DENY_ALL_EXEC, webfetch: 'allow' },
    maxDelegationDepth: 0,
    description: 'External research — web search and documentation lookup only',
  },

  Coral: {
    agent: 'Coral',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS, WRITE_TOOLS),
    allowedMcpTools: [],
    permissions: ALLOW_EXEC,
    maxDelegationDepth: 0,
    description: 'Visual/UI specialist — full file read/write for frontend changes',
  },

  Siren: {
    agent: 'Siren',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS, WRITE_TOOLS),
    allowedMcpTools: [],
    permissions: ALLOW_EXEC,
    maxDelegationDepth: 0,
    description: 'Documentation specialist — full file read/write for documentation',
  },

  Scylla: {
    agent: 'Scylla',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS),
    allowedMcpTools: union(MCP_CODE),
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'Code review — read-only analysis and code search',
  },

  Pearl: {
    agent: 'Pearl',
    allowedBuiltinTools: [...READ_TOOLS],
    allowedMcpTools: [],
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'Multimedia analysis — read-only for image/PDF analysis',
  },

  Maelstrom: {
    agent: 'Maelstrom',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS),
    allowedMcpTools: union(MCP_WEB, MCP_DOCS),
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'Strategic advisor — read-only analysis with web search',
  },

  Leviathan: {
    agent: 'Leviathan',
    allowedBuiltinTools: union(READ_TOOLS, LSP_TOOLS),
    allowedMcpTools: union(MCP_CODE),
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'System architect — read-only structural analysis with code search',
  },

  Poseidon: {
    agent: 'Poseidon',
    allowedBuiltinTools: [...READ_TOOLS],
    allowedMcpTools: [],
    permissions: DENY_ALL_EXEC,
    maxDelegationDepth: 0,
    description: 'Pre-planning consultant — read-only constraint analysis',
  },
}

export function getProfile(agent: AgentName): AgentPermissionProfile {
  return AGENT_PROFILES[agent]
}

export function isToolAllowed(agent: AgentName, toolName: string): boolean {
  const profile = getProfile(agent)
  if (profile.agent === 'Kraken') return true
  return (
    profile.allowedBuiltinTools.includes(toolName) || profile.allowedMcpTools.includes(toolName)
  )
}

export function canDelegate(agent: AgentName, currentDepth: number): boolean {
  const profile = getProfile(agent)
  return currentDepth < profile.maxDelegationDepth
}

export function getAllowedToolsList(agent: AgentName): string[] {
  const profile = getProfile(agent)
  return [...profile.allowedBuiltinTools, ...profile.allowedMcpTools]
}

export function buildPermissionConfig(agent: AgentName): Record<string, PermissionValue> {
  const profile = getProfile(agent)
  return { ...profile.permissions }
}

export function buildToolsConfig(agent: AgentName): Record<string, boolean> {
  const profile = getProfile(agent)
  const allKnownTools = new Set([
    ...profile.allowedBuiltinTools,
    ...profile.allowedMcpTools,
    'write',
    'edit',
    'bash',
    'task',
    'webfetch',
    'external_directory',
    'doom_loop',
  ])

  const tools: Record<string, boolean> = {}
  for (const tool of allKnownTools) {
    tools[tool] =
      profile.allowedBuiltinTools.includes(tool) || profile.allowedMcpTools.includes(tool)
  }
  return tools
}

export function getFilteredToolMap(
  agent: AgentName,
  allTools: Record<string, any>,
): Record<string, any> {
  const profile = getProfile(agent)
  if (profile.agent === 'Kraken') return { ...allTools }

  const allowed = new Set([...profile.allowedBuiltinTools, ...profile.allowedMcpTools])
  const filtered: Record<string, any> = {}
  for (const [name, toolDef] of Object.entries(allTools)) {
    if (allowed.has(name)) {
      filtered[name] = toolDef
    }
  }
  return filtered
}
