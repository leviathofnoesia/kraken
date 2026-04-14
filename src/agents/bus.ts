import type { AgentName } from './index'
import { createLogger } from '../utils/logger'

const logger = createLogger('agent-bus')

type Listener<T = any> = (data: T, channel: string, source?: string) => void

interface StateEntry {
  value: unknown
  updatedAt: number
  updatedBy: string
}

interface ChannelSubscription {
  id: string
  listener: Listener
  agent?: AgentName
}

export class AgentBus {
  private static instance: AgentBus | null = null
  private channels = new Map<string, ChannelSubscription[]>()
  private state = new Map<string, Map<string, StateEntry>>()
  private subIdCounter = 0

  private constructor() {}

  static getInstance(): AgentBus {
    if (!AgentBus.instance) {
      AgentBus.instance = new AgentBus()
    }
    return AgentBus.instance
  }

  static reset(): void {
    if (AgentBus.instance) {
      AgentBus.instance.channels.clear()
      AgentBus.instance.state.clear()
      AgentBus.instance = null
    }
  }

  publish(channel: string, data: unknown, source?: string): void {
    const subs = this.channels.get(channel)
    if (!subs || subs.length === 0) return

    for (const sub of subs) {
      try {
        sub.listener(data, channel, source)
      } catch (err) {
        logger.error(`Bus error on channel "${channel}" subscriber ${sub.id}:`, err)
      }
    }
  }

  subscribe(channel: string, listener: Listener, agent?: AgentName): string {
    const id = `sub_${++this.subIdCounter}`
    let subs = this.channels.get(channel)
    if (!subs) {
      subs = []
      this.channels.set(channel, subs)
    }
    subs.push({ id, listener, agent })
    return id
  }

  unsubscribe(subscriptionId: string): boolean {
    for (const [channelName, subs] of this.channels) {
      const idx = subs.findIndex((s) => s.id === subscriptionId)
      if (idx !== -1) {
        subs.splice(idx, 1)
        if (subs.length === 0) {
          this.channels.delete(channelName)
        }
        return true
      }
    }
    return false
  }

  setState(sessionID: string, key: string, value: unknown, updatedBy: string = 'system'): void {
    let sessionState = this.state.get(sessionID)
    if (!sessionState) {
      sessionState = new Map()
      this.state.set(sessionID, sessionState)
    }

    const prev = sessionState.get(key)?.value
    sessionState.set(key, {
      value,
      updatedAt: Date.now(),
      updatedBy,
    })

    this.publish(`state:${key}`, { key, value, previous: prev, sessionID, updatedBy }, updatedBy)
  }

  getState<T = unknown>(sessionID: string, key: string): T | undefined {
    return this.state.get(sessionID)?.get(key)?.value as T | undefined
  }

  getStateMeta(sessionID: string, key: string): StateEntry | undefined {
    return this.state.get(sessionID)?.get(key)
  }

  getAllState(sessionID: string): Record<string, unknown> {
    const sessionState = this.state.get(sessionID)
    if (!sessionState) return {}
    const result: Record<string, unknown> = {}
    for (const [key, entry] of sessionState) {
      result[key] = entry.value
    }
    return result
  }

  deleteState(sessionID: string, key: string): boolean {
    return this.state.get(sessionID)?.delete(key) ?? false
  }

  clearSession(sessionID: string): void {
    this.state.delete(sessionID)
    this.publish('session:cleared', { sessionID })
  }

  getChannelSubscribers(channel: string): number {
    return this.channels.get(channel)?.length ?? 0
  }

  getSessionKeys(sessionID: string): string[] {
    const sessionState = this.state.get(sessionID)
    if (!sessionState) return []
    return [...sessionState.keys()]
  }
}

export function getBus(): AgentBus {
  return AgentBus.getInstance()
}

export type { Listener, StateEntry }
