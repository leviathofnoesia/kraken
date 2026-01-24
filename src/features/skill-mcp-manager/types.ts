export interface SkillMcpClientInfo {
  skillName: string
  mcpName: string
  sessionID: string
}

export interface SkillMcpConfig {
  [mcpName: string]: {
    command: string
    args: string[]
    env?: Record<string, string>
  }
}

export interface SkillMcpClientConfig {
  info: SkillMcpClientInfo
  config: SkillMcpConfig[string]
}

export interface Tool {
  name: string
  description?: string
  inputSchema: any
}

export interface Resource {
  uri: string
  name?: string
  description?: string
  mimeType?: string
}

export interface Prompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}

export interface Client {
  listTools(): Promise<Tool[]>
  listResources(): Promise<Resource[]>
  listPrompts(): Promise<Prompt[]>
  callTool(name: string, args: any): Promise<any>
  readResource(uri: string): Promise<any>
  getPrompt(name: string, args?: Record<string, string>): Promise<any>
  close(): Promise<void>
}

export interface SkillMcpManagerOptions {
  idleTimeout?: number
  maxConnections?: number
}
