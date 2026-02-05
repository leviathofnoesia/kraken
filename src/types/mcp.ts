export type ToolInput = Record<string, unknown>
export type ToolOutput = unknown

export interface ToolResult {
  content?: {
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: unknown
    mimeType?: string
  }
  isError?: boolean
}

export interface ToolError {
  error: string | Error
}

export interface McpCallContext {
  sessionID?: string
  userID?: string
  messageID?: string
}

export type ToolCallResult = ToolResult | ToolError

export function isToolError(result: unknown): result is ToolError {
  return typeof result === 'object' && result !== null && 'error' in result
}

export function isToolResult(result: unknown): result is ToolResult {
  return (
    typeof result === 'object' && result !== null && ('content' in result || 'isError' in result)
  )
}
