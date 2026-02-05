import * as os from 'os'

import { Client } from '@modelcontextprotocol/sdk/client'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import type { SkillMcpClientInfo } from './mcp-config-parser'
import { createLogger } from '../../utils/logger'

const logger = createLogger('skill-mcp-manager')

// Type aliases for MCP client responses
type Tool = { name: string; description?: string; inputSchema?: unknown }
type Resource = { uri: string; name?: string; description?: string; mimeType?: string }
type Prompt = {
  name: string
  description?: string
  arguments?: Array<{ name: string; description?: string; required?: boolean }>
}

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
  cleanupTimer?: NodeJS.Timeout
}

export class SkillMcpManager {
  private clients: Map<string, ClientInfo> = new Map()
  private pendingConnections: Map<string, PendingConnection> = new Map()

  async getOrCreateClient(info: SkillMcpClientInfo, _config: unknown): Promise<Client> {
    const { serverName } = info
    const key = `${serverName}:${info.command}`

    if (this.clients.has(key)) {
      const clientInfo = this.clients.get(key)!
      logger.debug(`Reusing existing client for ${serverName}`)
      clientInfo.lastUsed = Date.now()
      return clientInfo.client
    }

    if (this.pendingConnections.has(key)) {
      logger.debug(`Reusing pending connection for ${serverName}`)
      return this.pendingConnections.get(key)!.promise
    }

    logger.debug(`Creating new MCP client for ${serverName}`)

    const client = new Client({
      name: serverName,
      version: '1.0.0',
    })

    const transport = new StdioClientTransport({
      command: info.command,
      args: info.args,
      env: info.env,
    })

    await client.connect(transport)

    const clientInfo = {
      client,
      lastUsed: Date.now(),
      idleSince: Date.now(),
    }

    this.clients.set(key, clientInfo)
    this.pendingConnections.delete(key)

    logger.debug(`Connected to ${serverName} MCP server`)

    this.startIdleCheck(serverName, clientInfo)

    return client
  }

  async disconnectSession(sessionID: string): Promise<void> {
    logger.info(`Disconnecting MCP clients for session ${sessionID}`)

    for (const [key, clientInfo] of this.clients.entries()) {
      if (clientInfo.cleanupTimer) clearTimeout(clientInfo.cleanupTimer)
      try {
        await clientInfo.client.close()
        logger.debug(`Disconnected from ${key}`)
      } catch (error) {
        logger.error(`Error disconnecting from ${key}:`, error)
      }
      this.clients.delete(key)
    }

    this.pendingConnections.clear()
  }

  async disconnectAll(): Promise<void> {
    logger.info('Disconnecting all MCP clients')

    for (const [key] of this.clients.keys()) {
      const clientInfo = this.clients.get(key)!
      if (clientInfo.cleanupTimer) clearTimeout(clientInfo.cleanupTimer)
      try {
        await clientInfo.client.close()
        logger.debug(`Disconnected from ${key}`)
      } catch (error) {
        logger.error(`Error disconnecting from ${key}:`, error)
      }
      this.clients.delete(key)
    }

    this.clients.clear()
    this.pendingConnections.clear()
  }

  async listTools(info: SkillMcpClientInfo, context: unknown): Promise<Tool[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.listTools()
      const tools = result.tools ?? []
      logger.debug(`Listed ${tools.length} tools from ${info.serverName}`)
      return tools
    } catch (error) {
      logger.error(`Error listing tools from ${info.serverName}:`, error)
      return []
    }
  }

  async listResources(info: SkillMcpClientInfo, context: unknown): Promise<Resource[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.listResources()
      const resources = result.resources ?? []
      logger.debug(`Listed ${resources.length} resources from ${info.serverName}`)
      return resources
    } catch (error) {
      logger.error(`Error listing resources from ${info.serverName}:`, error)
      return []
    }
  }

  async listPrompts(info: SkillMcpClientInfo, context: unknown): Promise<Prompt[]> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.listPrompts()
      const prompts = result.prompts ?? []
      logger.debug(`Listed ${prompts.length} prompts from ${info.serverName}`)
      return prompts
    } catch (error) {
      logger.error(`Error listing prompts from ${info.serverName}:`, error)
      return []
    }
  }

  async callTool(
    info: SkillMcpClientInfo,
    context: { [key: string]: unknown } | undefined,
    name: string,
    args: { [key: string]: unknown },
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.callTool({
        name,
        arguments: args,
      })
      logger.debug(`Called tool ${name} on ${info.serverName}`)
      return result
    } catch (error) {
      logger.error(`Error calling tool ${name} on ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  async readResource(
    info: SkillMcpClientInfo,
    context: { [key: string]: unknown } | undefined,
    uri: string,
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.readResource({ uri })
      logger.debug(`Read resource ${uri} from ${info.serverName}`)
      return result
    } catch (error) {
      logger.error(`Error reading resource ${uri} from ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getPrompt(
    info: SkillMcpClientInfo,
    context: unknown,
    name: string,
    args: any,
  ): Promise<unknown> {
    const client = await this.getOrCreateClient(info, context)

    try {
      const result = await client.getPrompt({
        name,
        arguments: args,
      })
      logger.debug(`Got prompt ${name} from ${info.serverName}`)
      return result
    } catch (error) {
      logger.error(`Error getting prompt ${name} from ${info.serverName}:`, error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }

  private startIdleCheck(serverName: string, clientInfo: ClientInfo): void {
    clientInfo.cleanupTimer = setTimeout(() => {
      const idleTime = Date.now() - clientInfo.lastUsed

      logger.debug(`Checking idle status for ${serverName}: ${idleTime}ms idle`)

      if (idleTime >= IDLE_TIMEOUT) {
        logger.debug(
          `Disconnecting ${serverName} due to idle (${Math.floor(idleTime / 1000 / 60)}min)`,
        )
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
      logger.debug(`Disconnected from ${serverName}`)
    } catch (error) {
      logger.error(`Error disconnecting from ${serverName}:`, error)
    }

    const key = `${serverName}:1.0.0`
    this.clients.delete(key)
  }

  getConnectedServers(): string[] {
    const servers = Array.from(this.clients.keys())
    logger.debug(`Connected servers: ${servers.length}`)
    return servers
  }

  isConnected(info: SkillMcpClientInfo): boolean {
    const key = `${info.serverName}:${info.command}`
    return this.clients.has(key)
  }
}

const managerInstance = new SkillMcpManager()

process.on('SIGINT', async () => {
  console.log('[skill-mcp-manager] Received SIGINT, shutting down MCP clients')
  await managerInstance.disconnectAll()
})

process.on('SIGTERM', async () => {
  console.log('[skill-mcp-manager] Received SIGTERM, shutting down MCP clients')
  await managerInstance.disconnectAll()
})

export function getMcpManager(): SkillMcpManager {
  return managerInstance
}
