import { LSPClient } from './client'
import type { Diagnostic } from './types'

const clients = new Map<string, LSPClient>()
const initializing = new Map<string, Promise<LSPClient>>()

export async function getClient(root: string, server: ResolvedServer): Promise<LSPClient> {
  const key = `${root}:${server.id}`

  if (clients.has(key)) {
    return clients.get(key)!
  }

  if (initializing.has(key)) {
    return initializing.get(key)!
  }

  const promise = (async () => {
    const client = new LSPClient(root, server)
    await client.start()
    await client.initialize()
    clients.set(key, client)
    initializing.delete(key)
    return client
  })()

  initializing.set(key, promise)
  return promise
}

export async function warmupClient(root: string, server: ResolvedServer): Promise<void> {
  await getClient(root, server)
}

export function releaseClient(root: string, serverId: string): void {
  const key = `${root}:${serverId}`
  const client = clients.get(key)
  if (client) {
    client.stop().catch(console.error)
    clients.delete(key)
  }
}

export function isServerInitializing(root: string, serverId: string): boolean {
  const key = `${root}:${serverId}`
  return initializing.has(key) && !clients.has(key)
}

export async function stopAll(): Promise<void> {
  const stopPromises = Array.from(clients.values()).map((client) => client.stop())
  await Promise.all(stopPromises)
  clients.clear()
  initializing.clear()
}

export const lspManager = {
  getClient,
  warmupClient,
  releaseClient,
  isServerInitializing,
  stopAll,
}
