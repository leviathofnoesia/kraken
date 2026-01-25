// MCP SDK types have changed significantly. The skill MCP manager
// is disabled until the API is updated.
// TODO: Update skill MCP manager to use the new @modelcontextprotocol/sdk API

import type {
  SkillMcpClientInfo,
  SkillMcpConfig,
} from "./mcp-config-parser"

export class SkillMcpManager {
  private clients: Map<string, any> = new Map()
  private pendingConnections: Map<string, any> = new Map()

  async getOrCreateClient(
    info: SkillMcpClientInfo,
    config: any
  ): Promise<any> {
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

    console.log(`[skill-mcp-manager] MCP manager is disabled - SDK API has changed`)
    console.log(`[skill-mcp-manager] Server: ${serverName}`)

    throw new Error(`Skill MCP manager is temporarily disabled. Please check ${serverName} manually.`)
  }

  async disconnectSession(sessionID: string): Promise<void> {
    console.log(`[skill-mcp-manager] Disconnecting MCP clients for session ${sessionID}`)
    
    this.clients.clear()
    this.pendingConnections.clear()
  }

  async disconnectAll(): Promise<void> {
    console.log("[skill-mcp-manager] Disconnecting all MCP clients")
    this.clients.clear()
    this.pendingConnections.clear()
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
