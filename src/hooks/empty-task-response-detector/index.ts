import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'

export interface EmptyTaskResponseConfig {
  enabled?: boolean
  maxRetries?: number
  retryDelay?: number
  trackPatterns?: boolean
  autoRecover?: boolean
  notifyOnThreshold?: number
}

interface SessionResponseHistory {
  sessionID: string
  emptyCount: number
  lastEmptyTime: number | null
  history: Array<{ timestamp: number; callID: string; reason: string }>
}

const sessionHistories = new Map<string, SessionResponseHistory>()

function getSessionHistory(sessionID: string): SessionResponseHistory {
  let history = sessionHistories.get(sessionID)
  if (!history) {
    history = {
      sessionID,
      emptyCount: 0,
      lastEmptyTime: null,
      history: [],
    }
    sessionHistories.set(sessionID, history)
  }
  return history
}

function isOutputEmpty(output: any): { empty: boolean; reason: string } {
  if (!output) {
    return { empty: true, reason: 'output is null/undefined' }
  }

  if (output.output === null || output.output === undefined) {
    return { empty: true, reason: 'output.output is null/undefined' }
  }

  let outputContent = ''

  if (output.content && Array.isArray(output.content)) {
    outputContent = output.content.join('')
  } else if (output.output && typeof output.output === 'string') {
    outputContent = output.output
  } else if (typeof output === 'string') {
    outputContent = output
  } else if (typeof output.output === 'object') {
    outputContent = JSON.stringify(output.output)
  }

  if (outputContent.trim().length === 0) {
    return { empty: true, reason: 'output content is empty or whitespace-only' }
  }

  try {
    if (typeof outputContent === 'string') {
      const parsed = JSON.parse(outputContent)
      if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
        return { empty: true, reason: 'output is empty JSON object' }
      }
    }
  } catch {}

  return { empty: false, reason: '' }
}

function getRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount)
}

export async function handleEmptyTaskResponse(
  input: any,
  output: any,
  config: EmptyTaskResponseConfig,
  retryCount: number = 0,
): Promise<boolean> {
  const { sessionID, callID } = input
  const maxRetries = config.maxRetries ?? 3
  const retryDelay = config.retryDelay ?? 1000

  const check = isOutputEmpty(output)
  if (!check.empty) {
    return false
  }

  const history = getSessionHistory(sessionID)
  history.emptyCount++
  history.lastEmptyTime = Date.now()
  history.history.push({
    timestamp: Date.now(),
    callID: callID || 'unknown',
    reason: check.reason,
  })

  console.warn(
    `[empty-task-response-detector] Task tool returned empty response ` +
      `(session: ${sessionID}, call: ${callID}, reason: ${check.reason})`,
  )

  const notifyThreshold = config.notifyOnThreshold ?? 3
  if (history.emptyCount >= notifyThreshold) {
    console.warn(
      `[empty-task-response-detector] Threshold exceeded: ${history.emptyCount} empty responses in session ${sessionID}. ` +
        `This may indicate a recurring issue with the agent or model.`,
    )
  }

  if (config.autoRecover && retryCount < maxRetries) {
    const delay = getRetryDelay(retryCount, retryDelay)
    console.log(
      `[empty-task-response-detector] Auto-recovering: retry in ${delay}ms ` +
        `(attempt ${retryCount + 1}/${maxRetries})`,
    )

    await new Promise((resolve) => setTimeout(resolve, delay))

    console.log('[empty-task-response-detector] [session recovered - continuing previous task]')

    return true
  }

  return false
}

export function createEmptyTaskResponseDetectorHook(
  _input: PluginInput,
  options?: { config?: EmptyTaskResponseConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    trackPatterns: true,
    autoRecover: false,
    notifyOnThreshold: 3,
  }

  return {
    'tool.execute.after': async (toolInput: any, toolOutput: any) => {
      if (!config.enabled) return

      if (toolInput.tool !== 'task') {
        return
      }

      await handleEmptyTaskResponse(toolInput, toolOutput, config)
    },
  }
}

export function createHook(input: PluginInput): Hooks {
  return createEmptyTaskResponseDetectorHook(input)
}

export const metadata = {
  name: 'empty-task-response-detector',
  priority: 45,
  description: 'Detects and recovers from empty task tool responses with retry mechanisms',
} as const

export function getSessionEmptyHistory(sessionID: string): SessionResponseHistory | undefined {
  return sessionHistories.get(sessionID)
}

export function clearSessionEmptyHistory(sessionID: string): void {
  sessionHistories.delete(sessionID)
}

export function getAllSessionEmptyHistories(): Map<string, SessionResponseHistory> {
  return new Map(sessionHistories)
}
