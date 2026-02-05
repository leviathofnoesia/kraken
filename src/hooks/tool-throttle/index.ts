import type { Hooks, PluginInput } from '@opencode-ai/plugin'

export interface ToolThrottleConfig {
  enabled?: boolean
  toolsBeforePause?: number
  pauseDurationMs?: number
  gcHintInterval?: number
  highMemoryPauseMs?: number
  highMemoryThresholdMB?: number
}

export function createToolThrottle(_input: PluginInput, config?: ToolThrottleConfig): Hooks {
  const cfg = {
    enabled: config?.enabled ?? true,
    toolsBeforePause: config?.toolsBeforePause ?? 15,
    pauseDurationMs: config?.pauseDurationMs ?? 50,
    gcHintInterval: config?.gcHintInterval ?? 5,
    highMemoryPauseMs: config?.highMemoryPauseMs ?? 200,
    highMemoryThresholdMB: config?.highMemoryThresholdMB ?? 1200,
  }

  if (!cfg.enabled) return {}

  let toolCount = 0
  let lastPauseTime = 0

  const getMemoryMB = (): number => {
    return Math.round(process.memoryUsage().rss / 1024 / 1024)
  }

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  return {
    'tool.execute.before': async (input) => {
      try {
        toolCount++

        // Periodic GC hint (every N tools)
        if (toolCount % cfg.gcHintInterval === 0) {
          // Small yield to allow event loop to process and GC to run
          await sleep(1)

          // Force GC if available (Node/Bun flag)
          if (globalThis.gc && toolCount % (cfg.gcHintInterval * 4) === 0) {
            globalThis.gc()
          }
        }

        // Regular pause every N tools
        if (toolCount % cfg.toolsBeforePause === 0) {
          const now = Date.now()
          const timeSinceLastPause = now - lastPauseTime

          // Only pause if we haven't recently
          if (timeSinceLastPause > cfg.pauseDurationMs) {
            const memoryMB = getMemoryMB()

            // Longer pause if memory is high
            const pauseDuration =
              memoryMB > cfg.highMemoryThresholdMB ? cfg.highMemoryPauseMs : cfg.pauseDurationMs

            if (memoryMB > cfg.highMemoryThresholdMB) {
              console.warn(
                `[kraken-code:tool-throttle] High memory (${memoryMB}MB), pausing ${pauseDuration}ms to allow cleanup`,
              )
            }

            await sleep(pauseDuration)
            lastPauseTime = Date.now()
          }
        }

        // Extra precaution: if bash tool, add breathing room
        const toolName = (input as any).tool || ''
        if (toolName === 'bash' && toolCount % 3 === 0) {
          // Bash tool uses web-tree-sitter which leaks memory
          // Extra yield after every 3rd bash call
          await sleep(5)
        }
      } catch (error) {
        console.error('[kraken-code:tool-throttle] Error in tool.execute.before:', error)
      }
    },

    'tool.execute.after': async (input, output) => {
      try {
        // Check for large outputs and truncate if needed
        const toolName = (input as any).tool || ''

        if (toolName === 'bash' && output?.output) {
          const outputSize =
            typeof output.output === 'string'
              ? output.output.length
              : JSON.stringify(output.output).length

          // If output is huge, truncate to prevent memory buildup
          if (outputSize > 500000) {
            // 500KB
            console.warn(
              `[kraken-code:tool-throttle] Large bash output (${Math.round(outputSize / 1024)}KB), truncating`,
            )

            if (typeof output.output === 'string') {
              output.output =
                output.output.slice(0, 100000) +
                '\n\n[Output truncated by kraken-code due to size - ' +
                `${Math.round(outputSize / 1024)}KB exceeded 500KB limit]`
            }
          }
        }
      } catch (error) {
        console.error('[kraken-code:tool-throttle] Error in tool.execute.after:', error)
      }
    },
  }
}
