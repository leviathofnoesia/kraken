import { spawn, type ChildProcess } from "child_process"
import * as path from "path"
import * as os from "os"
import * as fs from "fs"

let kratosProcess: ChildProcess | null = null
let requestId = 0
const pendingRequests = new Map<number, { resolve: (value: any) => void, reject: (reason: any) => void }>()

const KRATOS_STORAGE_PATH = path.join(os.homedir(), ".kratos")

export async function initializeKratos() {
  if (kratosProcess) {
    console.log("[Kratos MCP] Already initialized")
    return
  }

  // Ensure kratos directory exists
  if (!fs.existsSync(KRATOS_STORAGE_PATH)) {
    fs.mkdirSync(KRATOS_STORAGE_PATH, { recursive: true })
  }

  // Start kratos-mcp as subprocess
  kratosProcess = spawn('npx', ['--yes', 'kratos-mcp@latest'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      KRATOS_STORAGE_PATH: KRATOS_STORAGE_PATH
    }
  })

  if (!kratosProcess.stdin || !kratosProcess.stdout) {
    console.error("[Kratos MCP] Failed to create stdio pipes")
    return
  }

  kratosProcess.on('error', (err) => {
    console.error("[Kratos MCP] Failed to start:", err)
    kratosProcess = null
  })

  kratosProcess.on('exit', (code) => {
    console.log(`[Kratos MCP] Process exited with code ${code}`)
    kratosProcess = null
    // Reject all pending requests
    for (const [id, { reject }] of pendingRequests.entries()) {
      reject(new Error(`Kratos process exited: code ${code}`))
      pendingRequests.delete(id)
    }
  })

  // Handle stderr
  kratosProcess.stderr?.on('data', (data) => {
    console.error(`[Kratos MCP] ${data}`)
  })

  // Handle stdout (JSON-RPC responses)
  kratosProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim())
    for (const line of lines) {
      try {
        const response = JSON.parse(line)
        if (response.id !== undefined) {
          const pending = pendingRequests.get(response.id)
          if (pending) {
            if (response.error) {
              pending.reject(new Error(response.error.message || 'Kratos MCP error'))
            } else {
              pending.resolve(response.result)
            }
            pendingRequests.delete(response.id)
          }
        }
      } catch (e) {
        // Ignore non-JSON output (like logs)
      }
    }
  })

  console.log("[Kratos MCP] Initialized")
}

export async function shutdownKratos() {
  if (kratosProcess) {
    kratosProcess.kill()
    kratosProcess = null
    console.log("[Kratos MCP] Shutdown")
  }
}

async function sendKratosRequest(method: string, params: any = {}): Promise<any> {
  if (!kratosProcess || !kratosProcess.stdin) {
    throw new Error("Kratos MCP not initialized. Call initializeKratos() first.")
  }

  const id = ++requestId

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject })

    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params
    }

    kratosProcess.stdin!.write(JSON.stringify(request) + '\n')

    // Set timeout
    const timeout = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error('Kratos MCP request timeout'))
    }, 30000)

    // Store timeout to clear it when response arrives
    const originalResolve = resolve
    const wrappedResolve = (value: any) => {
      clearTimeout(timeout)
      originalResolve(value)
    }
    pendingRequests.set(id, { resolve: wrappedResolve, reject })
  })
}

// Memory Save Tool
export const memorySaveTool = {
  name: "memory_save",
  description: "Save a memory to Kratos project database",
  inputSchema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Short 1-2 line summary of memory" },
      text: { type: "string", description: "Full memory content" },
      tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" },
      paths: { type: "array", items: { type: "string" }, description: "Related file paths" },
      importance: { type: "number", minimum: 1, maximum: 5, default: 3, description: "Importance 1-5" }
    }
  },
  handler: async (args: any) => {
    try {
      const result = await sendKratosRequest('call_tool', {
        name: 'memory_save',
        arguments: args
      })

      return result?.content?.[0]?.text || "Memory saved successfully"
    } catch (error: any) {
      console.error(`[Kratos] Error saving memory:`, error)
      throw new Error(`Failed to save memory: ${error.message}`)
    }
  }
}

// Memory Search Tool
export const memorySearchTool = {
  name: "memory_search",
  description: "Search Kratos memories by query or tags",
  inputSchema: {
    type: "object",
    properties: {
      q: { type: "string", description: "Search query or keywords" },
      k: { type: "number", default: 10, description: "Maximum results" },
      tags: { type: "array", items: { type: "string" }, description: "Filter by tags" }
    }
  },
  handler: async (args: any) => {
    try {
      const result = await sendKratosRequest('call_tool', {
        name: 'memory_search',
        arguments: args
      })

      return result?.content?.[0]?.text || JSON.stringify(result)
    } catch (error: any) {
      console.error(`[Kratos] Error searching memory:`, error)
      throw new Error(`Failed to search memory: ${error.message}`)
    }
  }
}

// Memory Get Recent Tool
export const memoryGetRecentTool = {
  name: "memory_get_recent",
  description: "Get recent memories from Kratos",
  inputSchema: {
    type: "object",
    properties: {
      k: { type: "number", default: 10, description: "Maximum results" },
      path_prefix: { type: "string", description: "Filter by path prefix" }
    }
  },
  handler: async (args: any) => {
    try {
      const result = await sendKratosRequest('call_tool', {
        name: 'memory_get_recent',
        arguments: args
      })

      return result?.content?.[0]?.text || JSON.stringify(result)
    } catch (error: any) {
      console.error(`[Kratos] Error getting recent memories:`, error)
      throw new Error(`Failed to get recent memories: ${error.message}`)
    }
  }
}

// Memory Ask Tool
export const memoryAskTool = {
  name: "memory_ask",
  description: "Ask Kratos natural language questions",
  inputSchema: {
    type: "object",
    properties: {
      question: { type: "string", description: "Natural language question" },
      limit: { type: "number", default: 5, description: "Maximum results" }
    }
  },
  handler: async (args: any) => {
    try {
      const result = await sendKratosRequest('call_tool', {
        name: 'memory_ask',
        arguments: args
      })

      return result?.content?.[0]?.text || JSON.stringify(result)
    } catch (error: any) {
      console.error(`[Kratos] Error asking question:`, error)
      throw new Error(`Failed to ask question: ${error.message}`)
    }
  }
}
