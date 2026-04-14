export type CommandScope = "user" | "project" | "opencode" | "opencode-project" | "builtin" | "skill"

export interface HandoffDefinition {
  label: string
  agent: string
  prompt: string
  send?: boolean
}

export interface CommandDefinition {
  name: string
  description?: string
  template: string
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
  handoffs?: HandoffDefinition[]
}

export interface LoadedCommand {
  name: string
  path: string
  definition: CommandDefinition
  scope: CommandScope
  prefix?: string
}

export interface CommandTemplateContext {
  arguments?: string
  [key: string]: any
}

export interface CommandLoaderOptions {
  userCommandsDir?: string
  projectCommandsDir?: string
  opencodeGlobalCommandsDir?: string
  opencodeProjectCommandsDir?: string
  disabledScopes?: CommandScope[]
}

export interface ParsedFrontmatter {
  description?: string
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
  [key: string]: any
}
