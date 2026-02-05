import type {
  SkillMcpClientInfo,
  SkillMcpConfig,
  Tool,
  Resource,
  Prompt,
  Client,
  SkillMcpManagerOptions,
} from './types'
import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { Readable } from 'stream'
import { createLogger } from '../../utils/logger'

const DEFAULT_IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const MAX_RETRIES = 3
const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === '1' ||
  process.env.DEBUG === '1' ||
  process.env.KRAKEN_LOG === '1'
const logger = createLogger('skill-mcp-manager')

interface PendingConnection {
  promise: Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

interface ClientWrapper {
  client: Client
  process: ChildProcess
  lastUsed: number
  pendingRequests: number
}

export class SkillMcpManager {
  private clients: Map<string, ClientWrapper> = new Map()
  private pendingConnections: Map<string, PendingConnection> = new Map()
  private idleTimeout: number
  private maxConnections: number
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options: SkillMcpManagerOptions = {}) {
    this.idleTimeout = options.idleTimeout || DEFAULT_IDLE_TIMEOUT
    this.maxConnections = options.maxConnections || 10
    this.startCleanupInterval()
    this.setupProcessCleanup()
  }

  async initialize(): Promise<void> {
    if (SHOULD_LOG) {
      logger.debug('Manager initialized')
    }
  }

  private getClientKey(info: SkillMcpClientInfo): string {
    return `${info.skillName}:${info.mcpName}:${info.sessionID}`
  }

  private processExists(pid: number): boolean {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  async getOrCreateClient(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
  ): Promise<Client> {
    const key = this.getClientKey(info)

    // Check for pending connection
    const pending = this.pendingConnections.get(key)
    if (pending) {
      return pending.promise
    }

    // Check for existing client
    const wrapper = this.clients.get(key)
    if (wrapper && this.isClientHealthy(wrapper)) {
      wrapper.lastUsed = Date.now()
      return wrapper.client
    }

    // Create new connection
    const promise = new Promise<Client>((resolve, reject) => {
      this.createClientProcess(info, config)
        .then((client) => {
          this.clients.set(key, {
            client,
            process: (client as any).process,
            lastUsed: Date.now(),
            pendingRequests: 0,
          })
          resolve(client)
        })
        .catch((error) => {
          reject(error)
        })
    })

    this.pendingConnections.set(key, {
      promise,
      resolve: promise as any,
      reject: promise as any,
    })

    try {
      const client = await promise
      return client
    } finally {
      this.pendingConnections.delete(key)
    }
  }

  private async createClientProcess(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
  ): Promise<Client> {
    const { command, args, env = {} } = config

    if (SHOULD_LOG) {
      logger.debug(`Starting MCP process for ${info.skillName}:${info.mcpName}`)
    }

    const commandPath = await this.resolveCommand(command)
    if (!commandPath) {
      throw new Error(
        `MCP command '${command}' not found. Install it and ensure it is on your PATH.`,
      )
    }

    return new Promise((resolve, reject) => {
      let retryCount = 0
      let currentProcess: ChildProcess | null = null

      const attemptConnection = () => {
        currentProcess = spawn(commandPath, args, {
          env: { ...process.env, ...env },
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let client: Client | null = null
        let requestID = 0
        const pendingRequests = new Map<number, any>()

        const sendRequest = (method: string, params: any): Promise<any> => {
          const id = ++requestID
          const request = {
            jsonrpc: '2.0',
            id,
            method,
            params,
          }

          if (currentProcess?.stdin) {
            currentProcess.stdin.write(JSON.stringify(request) + '\n')
          }

          return new Promise((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject })

            setTimeout(() => {
              pendingRequests.delete(id)
              reject(new Error(`Request ${method} timeout`))
            }, 30000) // 30 second timeout
          })
        }

        client = {
          listTools: async (): Promise<Tool[]> => {
            const response = await sendRequest('tools/list', {})
            return response.result?.tools || []
          },

          listResources: async (): Promise<Resource[]> => {
            const response = await sendRequest('resources/list', {})
            return response.result?.resources || []
          },

          listPrompts: async (): Promise<Prompt[]> => {
            const response = await sendRequest('prompts/list', {})
            return response.result?.prompts || []
          },

          callTool: async (name: string, args: any): Promise<any> => {
            const response = await sendRequest('tools/call', {
              name,
              arguments: args,
            })
            return response.result
          },

          readResource: async (uri: string): Promise<any> => {
            const response = await sendRequest('resources/read', { uri })
            return response.result
          },

          getPrompt: async (name: string, args?: Record<string, string>): Promise<any> => {
            const response = await sendRequest('prompts/get', {
              name,
              arguments: args || {},
            })
            return response.result
          },

          close: async (): Promise<void> => {
            if (currentProcess) {
              currentProcess.kill()
            }
          },
        }

        if (currentProcess.stdout) {
          const handleOutput = (data: Buffer) => {
            const lines = data.toString().split('\n')
            for (const line of lines) {
              if (!line.trim()) continue

              try {
                const response = JSON.parse(line)
                const { id, result, error } = response

                if (id !== undefined && pendingRequests.has(id)) {
                  const pending = pendingRequests.get(id)!
                  pendingRequests.delete(id)

                  if (error) {
                    pending.reject(new Error(error.message))
                  } else {
                    pending.resolve(result)
                  }
                }
              } catch (parseError) {
                if (SHOULD_LOG) {
                  logger.warn('Failed to parse response:', parseError)
                }
              }
            }
          }

          currentProcess.stdout.on('data', handleOutput)

          currentProcess.on('error', (error) => {
            if (SHOULD_LOG) {
              logger.warn(`MCP process error for ${info.skillName}:${info.mcpName}:`, error)
            }

            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
              reject(new Error(`MCP command '${command}' not found.`))
              return
            }

            if (retryCount < MAX_RETRIES) {
              retryCount++
              if (SHOULD_LOG) {
                logger.debug(`Retrying connection (${retryCount}/${MAX_RETRIES})`)
              }
              setTimeout(attemptConnection, 1000 * retryCount)
            } else {
              reject(error)
            }
          })

          currentProcess.on('exit', (code, signal) => {
            if (SHOULD_LOG) {
              logger.debug(
                `MCP process exited for ${info.skillName}:${info.mcpName} with code ${code}, signal ${signal}`,
              )
            }

            if (retryCount < MAX_RETRIES && code !== 0) {
              retryCount++
              if (SHOULD_LOG) {
                logger.debug(`Retrying connection (${retryCount}/${MAX_RETRIES})`)
              }
              setTimeout(attemptConnection, 1000 * retryCount)
            } else if (client && code === 0) {
              resolve(client)
            }
          })

          // Send initialize request
          setTimeout(async () => {
            try {
              await sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                  name: 'kraken-code',
                  version: '5.0.0',
                },
              })
              await sendRequest('notifications/initialized', {})
              resolve(client)
            } catch (error) {
              reject(error)
            }
          }, 500)
        }
      }

      attemptConnection()
    })
  }

  private async resolveCommand(command: string): Promise<string | null> {
    if (path.isAbsolute(command) && existsSync(command)) {
      return command
    }

    if (command.includes('/') || command.includes('\\')) {
      return existsSync(command) ? command : null
    }

    const locator = process.platform === 'win32' ? 'where' : 'which'
    try {
      const proc = spawn(locator, [command], { stdio: ['ignore', 'pipe', 'pipe'] })
      const output = await this.readStream(proc.stdout)
      await new Promise<void>((resolve) => {
        proc.on('close', () => resolve())
      })
      if (proc.exitCode === 0) {
        return output.trim().split('\n')[0]?.trim() ?? null
      }
    } catch {
      return null
    }

    return null
  }

  private readStream(stream: Readable | null): Promise<string> {
    if (!stream) return Promise.resolve('')

    return new Promise((resolve) => {
      let data = ''
      stream.on('data', (chunk) => {
        data += chunk.toString()
      })
      stream.on('end', () => resolve(data))
      stream.on('error', () => resolve(data))
    })
  }

  private isClientHealthy(wrapper: ClientWrapper): boolean {
    const process = wrapper.process

    if (!process || !process.pid) {
      return false
    }

    return this.processExists(process.pid)
  }

  async listTools(info: SkillMcpClientInfo, config: SkillMcpConfig[string]): Promise<Tool[]> {
    const client = await this.getOrCreateClient(info, config)
    return client.listTools()
  }

  async listResources(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
  ): Promise<Resource[]> {
    const client = await this.getOrCreateClient(info, config)
    return client.listResources()
  }

  async listPrompts(info: SkillMcpClientInfo, config: SkillMcpConfig[string]): Promise<Prompt[]> {
    const client = await this.getOrCreateClient(info, config)
    return client.listPrompts()
  }

  async callTool(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
    name: string,
    args: any,
  ): Promise<any> {
    const client = await this.getOrCreateClient(info, config)
    return client.callTool(name, args)
  }

  async readResource(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
    uri: string,
  ): Promise<any> {
    const client = await this.getOrCreateClient(info, config)
    return client.readResource(uri)
  }

  async getPrompt(
    info: SkillMcpClientInfo,
    config: SkillMcpConfig[string],
    name: string,
    args?: Record<string, string>,
  ): Promise<any> {
    const client = await this.getOrCreateClient(info, config)
    return client.getPrompt(name, args)
  }

  async disconnectSession(sessionID: string): Promise<void> {
    const toDelete: string[] = []

    for (const [key, wrapper] of this.clients.entries()) {
      if (key.includes(`:${sessionID}`)) {
        await wrapper.client.close()
        toDelete.push(key)
      }
    }

    for (const key of toDelete) {
      this.clients.delete(key)
    }

    if (SHOULD_LOG) {
      logger.debug(`Disconnected ${toDelete.length} clients for session ${sessionID}`)
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises: Promise<void>[] = []

    for (const wrapper of this.clients.values()) {
      disconnectPromises.push(wrapper.client.close())
    }

    await Promise.all(disconnectPromises)
    this.clients.clear()

    if (SHOULD_LOG) {
      logger.debug('Disconnected all clients')
    }
  }

  getConnectedServers(): string[] {
    const servers = new Set<string>()

    for (const key of this.clients.keys()) {
      const parts = key.split(':')
      if (parts.length >= 2) {
        servers.add(`${parts[0]}:${parts[1]}`)
      }
    }

    return Array.from(servers)
  }

  isConnected(info: SkillMcpClientInfo): boolean {
    const key = this.getClientKey(info)
    const wrapper = this.clients.get(key)

    if (!wrapper) {
      return false
    }

    return this.isClientHealthy(wrapper)
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleClients()
    }, 60000) // Check every minute
  }

  private cleanupIdleClients(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, wrapper] of this.clients.entries()) {
      if (now - wrapper.lastUsed > this.idleTimeout) {
        toDelete.push(key)
      }
    }

    if (toDelete.length > 0) {
      if (SHOULD_LOG) {
        logger.debug(`Cleaning up ${toDelete.length} idle clients`)
      }

      for (const key of toDelete) {
        const wrapper = this.clients.get(key)!
        wrapper.client.close()
        this.clients.delete(key)
      }
    }
  }

  private setupProcessCleanup(): void {
    const cleanup = async (signal: string) => {
      if (SHOULD_LOG) {
        logger.debug(`Received ${signal}, cleaning up...`)
      }
      await this.disconnectAll()
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }
      process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }
}
