export interface ModeHooksConfig {
  enabled?: boolean
  autoActivate?: boolean
}

export interface SessionStorageConfig {
  enabled?: boolean
  recordTodos?: boolean
  recordTranscripts?: boolean
}

export interface ClaudeCodeCompatibilityConfig {
  enabled?: boolean
  mcp?: boolean
  commands?: boolean
  skills?: boolean
  agents?: boolean
  dataStorage?: {
    path?: string
    maxSize?: number
  }
}

export interface HookOptions {
  modes?: ModeHooksConfig
  sessionStorage?: SessionStorageConfig
  claudeCodeCompatibility?: ClaudeCodeCompatibilityConfig
}
