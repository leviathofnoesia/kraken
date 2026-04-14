import type { AgentExecutionContext, AgentExecutionResult } from './types'

export interface OutputFormatOptions {
  includeMetadata?: boolean
  includeDuration?: boolean
  maxOutputLength?: number
}

export function formatAgentOutput(
  result: AgentExecutionResult,
  options: OutputFormatOptions = {},
): string {
  const { includeMetadata = true, includeDuration = true, maxOutputLength } = options

  const parts: string[] = []

  if (result.output) {
    let output = result.output
    if (maxOutputLength && output.length > maxOutputLength) {
      output = output.slice(0, maxOutputLength) + '\n...[truncated]'
    }
    parts.push(output)
  }

  if (!includeMetadata) {
    return parts.join('\n')
  }

  parts.push('')
  parts.push('<task_metadata>')
  parts.push(`agent: ${result.agent}`)
  if (result.sessionID) parts.push(`session_id: ${result.sessionID}`)
  parts.push(`success: ${result.success}`)
  if (includeDuration) parts.push(`duration_ms: ${result.duration}`)
  if (result.error) parts.push(`error: ${result.error}`)
  parts.push('</task_metadata>')

  return parts.join('\n')
}

export function formatErrorResponse(
  agent: string,
  error: string,
  ctx: AgentExecutionContext,
): AgentExecutionResult {
  return {
    success: false,
    error,
    agent: ctx.agent,
    duration: Date.now() - ctx.startTime,
    metadata: ctx.metadata,
  }
}

export function formatJsonResponse(result: AgentExecutionResult): string {
  return JSON.stringify(
    {
      success: result.success,
      taskId: result.metadata.taskId,
      agent: result.agent,
      status: result.success ? 'completed' : 'failed',
      result: result.output,
      error: result.error,
      duration: result.duration,
    },
    null,
    2,
  )
}
