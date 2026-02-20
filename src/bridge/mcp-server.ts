import { createInterface } from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'

import { ast_grep_replace, ast_grep_search } from '../tools/ast-grep'
import { grep } from '../tools/grep'
import { session_info, session_list, session_read, session_search } from '../tools/session'
import type { UniversalMode, UniversalTarget } from '../universal/targets'
import { canExecuteTool, filterAllowedTools } from '../universal/tool-policy'

type BridgeTool = {
  description?: string
  execute?: (...args: any[]) => Promise<unknown> | unknown
}

type JsonRpcRequest = {
  jsonrpc?: '2.0'
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

const PROTOCOL_VERSION = '2024-11-05'

interface BridgeRuntimeContext {
  target?: UniversalTarget
  mode?: UniversalMode
}

export function createBridgeTools(): Record<string, BridgeTool> {
  return {
    grep,
    session_list,
    session_read,
    session_search,
    session_info,
    ast_grep_search,
    ast_grep_replace,
  }
}

function asJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export async function handleMcpRequest(
  request: JsonRpcRequest,
  tools: Record<string, BridgeTool>,
  runtimeContext?: BridgeRuntimeContext,
): Promise<JsonRpcResponse | null> {
  const target = runtimeContext?.target ?? 'opencode'
  const mode = runtimeContext?.mode ?? 'standard'
  const id = request.id ?? null
  const method = request.method

  if (!method) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: 'Invalid request: missing method' },
    }
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: {
          name: 'kraken-bridge',
          version: '1.0.0',
        },
        capabilities: {
          tools: {},
          experimental: {
            target,
            mode,
          },
        },
      },
    }
  }

  if (method === 'notifications/initialized') {
    return null
  }

  if (method === 'tools/list') {
    const allowedToolNames = new Set(filterAllowedTools(Object.keys(tools), target, mode))
    const toolList = Object.entries(tools)
      .filter(([name]) => allowedToolNames.has(name))
      .map(([name, tool]) => ({
        name,
        description: tool.description ?? `${name} tool`,
        inputSchema: {
          type: 'object',
          additionalProperties: true,
        },
      }))

    return {
      jsonrpc: '2.0',
      id,
      result: { tools: toolList },
    }
  }

  if (method === 'tools/call') {
    const name = String(request.params?.name ?? '')
    const args = (request.params?.arguments as Record<string, unknown>) ?? {}
    const tool = tools[name]
    const policy = canExecuteTool(name, target, mode)

    if (!tool || typeof tool.execute !== 'function') {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${name}` },
      }
    }
    if (!policy.allowed) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32001, message: policy.reason },
      }
    }

    try {
      const result = await tool.execute(args)
      return {
        jsonrpc: '2.0',
        id,
        result: asJson(result),
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  }
}

export async function startMcpBridge(runtimeContext?: BridgeRuntimeContext): Promise<void> {
  const tools = createBridgeTools()
  const rl = createInterface({ input, crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    let request: JsonRpcRequest
    try {
      request = JSON.parse(trimmed) as JsonRpcRequest
    } catch {
      const invalid: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }
      output.write(`${JSON.stringify(invalid)}\n`)
      continue
    }

    const response = await handleMcpRequest(request, tools, runtimeContext)
    if (response) {
      output.write(`${JSON.stringify(response)}\n`)
    }
  }
}
