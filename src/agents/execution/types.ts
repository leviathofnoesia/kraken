import type { AgentName } from '../index'
import type { PermissionValue } from '../../shared/permission-compat'

export interface AgentExecutionContext {
  agent: AgentName
  task: string
  context?: string
  sessionID?: string
  parentSessionID?: string
  delegationDepth: number
  enrichedPrompt: string
  metadata: Record<string, unknown>
  startTime: number
}

export interface AgentExecutionResult {
  success: boolean
  output?: string
  error?: string
  sessionID?: string
  agent: AgentName
  duration: number
  metadata: Record<string, unknown>
}

export interface PipelineMiddleware {
  name: string
  before?: (ctx: AgentExecutionContext) => AgentExecutionContext | Promise<AgentExecutionContext>
  after?: (
    ctx: AgentExecutionContext,
    result: AgentExecutionResult,
  ) => AgentExecutionResult | Promise<AgentExecutionResult>
}

export interface DelegationClient {
  session: {
    create: (args: any) => Promise<any>
    prompt: (args: any) => Promise<any>
    messages: (args: any) => Promise<any>
  }
}

export interface PipelineOptions {
  delegationDepth?: number
  parentSessionID?: string
  context?: string
  metadata?: Record<string, unknown>
}

export type { PermissionValue }
