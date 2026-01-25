import * as os from "os"

// @ts-ignore - MCP SDK types are complex
import { Client } from "@modelcontextprotocol/sdk/client"
// @ts-ignore
import type { Tool, Resource, Prompt } from "@modelcontextprotocol/sdk/client"

import type {
  SkillMcpClientInfo,
  SkillMcpConfig,
} from "./mcp-config-parser"

const IDLE_TIMEOUT = 5 * 60 * 1000

interface PendingConnection {
  promise: Promise<Client>
  resolve: (client: Client) => void
  reject: (error: Error) => void
  timestamp: number
}

interface ClientInfo {
  client: Client
  lastUsed: number
  idleSince: number
  cleanupTimer?: NodeJS.Timeout | ReturnType<typeof setTimeout>
}

export class SkillMcpManager {
  private clients: Map<string, ClientInfo> = new Map()
  private pendingConnections: Map<string, PendingConnection> = new Map()

  async getOrCreateClient(
    info: SkillMcpClientInfo,
    config: any
  ): Promise<Client> {
    const { serverName } = info
    const key = `${serverName}:${info.command}`

    if (this.clients.has(key)) {
      const clientInfo = this.clients.get(key)!
      console.log(`[skill-mcp-manager] Reusing existing client for ${serverName}`)
      clientInfo.lastUsed = Date.now()
      return clientInfo.client
    }

    if (this.pendingConnections.has(key)) {
      console.log(`[skill-mcp-manager] Reusing pending connection for ${serverName}`)
      return this.pendingConnections.get(key)!.promise
    }

    console.log(`[skill-mcp-manager] Creating new MCP client for ${serverName}`)

    const client = new Client({
      name: serverName,
      version: "1.0.0",
    })

    await client.connect()

    const clientInfo = {
      client,
      lastUsed: Date.now(),
      idleSince: Date.now(),
    }

    this.clients.set(key, clientInfo)
    this.pendingConnections.delete(key)

    console.log(`[skill-mcp-manager] Connected to ${serverName} MCP server`)

    this.startIdleCheck(serverName, clientInfo)

    return client
  }

  async disconnectSession(sessionID: string): Promise<void> {
    console.log(`[skill-mcp-manager] Disconnecting MCP clients for session ${sessionID}`)

    for (const [key, clientInfo] of this.clients.entries()) {
      if (clientInfo.cleanupTimer) clearTimeout(clientInfo.cleanupTimer)
      try {
        await clientInfo.client.close()
        console.log(`[skill-mcp-manager] Disconnected from ${key}`)
      } catch (error) {
        console.error(`[skill-mcp-manager] Error disconnecting from ${key}:`, error)
      }
      this.clients.delete(key)
    }

    this.pendingConnections.clear()
  }

  async disconnectAll(): Promise<void> {
    console.log("[skill-mcp-manager] Disconnecting all MCP clients")

    for (const [key] of this.clients.keys()) {
      const clientInfo = this.clients.get(key)!
      if (clientInfo.cleanupTimer) clearTimeout(clientInfo.cleanupTimer)
      try {
        await clientInfo.client.close()
        console.log(`[skill-mcp-manager] Disconnected from ${key}`)
      } catch (error) {
        console.error(`[skill-mcp-manager] Error disconnecting from ${key}:`, error)
      }
      this.clients.delete(key)
    }

    this.clients.clear()
    this.pendingConnections.clear()
  }

  async listTools(
    info: SkillMcpClientInfo,
    context: any
  ): Promise<Tool[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const tools = await client.listTools() ?? []
      console.log(`[skill-mcp-manager] Listed ${tools.length} tools from ${info.serverName}`)
      return tools
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing tools from ${info.serverName}:`, error)
      return []
    }
  }

  async listResources(
    info: SkillMcpClientInfo,
    context: any
  ): Promise<Resource[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const resources = await client.listResources() ?? []
      console.log(`[skill-mcp-manager] Listed ${resources.length} resources from ${info.serverName}`)
      return resources
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing resources from ${info.serverName}:`, error)
      return []
    }
  }

  async listPrompts(
    info: SkillMcpClientInfo,
    context: any
  ): Promise<Prompt[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const prompts = await client.listPrompts() ?? []
      console.log(`[skill-mcp-manager] Listed ${prompts.length} prompts from ${info.serverName}`)
      return prompts
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing prompts from ${info.serverName}:`, error)
      return []
    }
  }

  async callTool(
    info: SkillMcpClientInfo,
    context: any,
    name: string,
    args: any
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.callTool({
        name,
        arguments: args,
      })
      console.log(`[skill-mcp-manager] Called tool ${name} on ${info.serverName}`)
      return result
    } catch (error) {
      console.error(`[skill-mcp-manager] Error calling tool ${name} on ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  async readResource(
    info: SkillMcpClientInfo,
    context: any,
    uri: string
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.readResource(uri)
      console.log(`[skill-mcp-manager] Read resource ${uri} from ${info.serverName}`)
      return result
    } catch (error) {
      console.error(`[skill-mcp-manager] Error reading resource ${uri} from ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getPrompt(
    info: SkillMcpClientInfo,
    context: any,
    name: string,
    args: any
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.getPrompt({
        name,
        arguments: args,
      })
      console.log(`[skill-mcp-manager] Got prompt ${name} from ${info.serverName}`)
      return result
    } catch (error) {
      console.error(`[skill-mcp-manager] Error getting prompt ${name} from ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  private startIdleCheck(serverName: string, clientInfo: ClientInfo): void {
    clientInfo.cleanupTimer = setTimeout(() => {
      const idleTime = Date.now() - clientInfo.lastUsed

      console.log(`[skill-mcp-manager] Checking idle status for ${serverName}: ${idleTime}ms idle`)

      if (idleTime >= IDLE_TIMEOUT) {
        console.log(`[skill-mcp-manager] Disconnecting ${serverName} due to idle (${Math.floor(idleTime / 1000 / 60)}min)`)
        this.disconnectClientInternal(serverName, clientInfo)
      }
    }, 60000)
  }

  private disconnectClientInternal(serverName: string, clientInfo: ClientInfo): void {
    if (clientInfo.cleanupTimer) {
      clearTimeout(clientInfo.cleanupTimer)
    }

    try {
      clientInfo.client.close()
      console.log(`[skill-mcp-manager] Disconnected from ${serverName}`)
    } catch (error) {
      console.error(`[skill-mcp-manager] Error disconnecting from ${serverName}:`, error)
    }

    const key = `${serverName}:1.0.0`
    this.clients.delete(key)
  }

  getConnectedServers(): string[] {
    const servers = Array.from(this.clients.keys())
    console.log(`[skill-mcp-manager] Connected servers: ${servers.length}`)
    return servers
  }

  isConnected(info: SkillMcpClientInfo): boolean {
    const key = `${info.serverName}:${info.command}`
    return this.clients.has(key)
  }
}

const managerInstance = new SkillMcpManager()

process.on('SIGINT', async () => {
  console.log("[skill-mcp-manager] Received SIGINT, shutting down MCP clients")
  await managerInstance.disconnectAll()
})

process.on('SIGTERM', async () => {
  console.log("[skill-mcp-manager] Received SIGTERM, shutting down MCP clients")
  await managerInstance.disconnectAll()
})

export function getMcpManager(): SkillMcpManager {
  return managerInstance
}
