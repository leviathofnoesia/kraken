import type { Hooks, PluginInput } from '@opencode-ai/plugin'

export interface MemoryGuardConfig {
  enabled?: boolean
  warningThresholdMB?: number
  criticalThresholdMB?: number
  killThresholdMB?: number
  checkInterval?: number
}

interface MemorySnapshot {
  rss: number
  heapUsed: number
  external: number
  timestamp: number
}

export function createMemoryGuard(_input: PluginInput, config?: MemoryGuardConfig): Hooks {
  const cfg = {
    enabled: config?.enabled ?? true,
    warningThresholdMB: config?.warningThresholdMB ?? 1024, // 1GB
    criticalThresholdMB: config?.criticalThresholdMB ?? 1536, // 1.5GB
    killThresholdMB: config?.killThresholdMB ?? 2048, // 2GB
    checkInterval: config?.checkInterval ?? 10, // Every 10 tools
  }

  if (!cfg.enabled) return {}

  let toolCount = 0
  let memoryHistory: MemorySnapshot[] = []
  const MAX_HISTORY = 50

  const getMemoryUsage = (): MemorySnapshot => {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      timestamp: Date.now(),
    }
  }

  const formatMemory = (snapshot: MemorySnapshot): string => {
    return `RSS: ${snapshot.rss}MB | Heap: ${snapshot.heapUsed}MB | External: ${snapshot.external}MB`
  }

  const calculateGrowth = (): number => {
    if (memoryHistory.length < 2) return 0
    const recent = memoryHistory.slice(-5)
    const first = recent[0]
    const last = recent[recent.length - 1]
    return Math.round(((last.rss - first.rss) / first.rss) * 100)
  }

  return {
    'tool.execute.after': async (input, _output) => {
      try {
        toolCount++

        // Only check memory periodically
        if (toolCount % cfg.checkInterval !== 0) return

        const snapshot = getMemoryUsage()
        memoryHistory.push(snapshot)

        // Keep history bounded
        if (memoryHistory.length > MAX_HISTORY) {
          memoryHistory = memoryHistory.slice(-MAX_HISTORY)
        }

        const growth = calculateGrowth()
        const { rss } = snapshot

        // Warning level
        if (rss > cfg.warningThresholdMB && rss < cfg.criticalThresholdMB) {
          console.warn(
            `[kraken-code:memory-guard] ⚠️  Memory usage elevated: ${formatMemory(snapshot)}`,
          )
          if (growth > 20) {
            console.warn(
              `[kraken-code:memory-guard] 📈 Memory growing rapidly (+${growth}% in last ${cfg.checkInterval} tools)`,
            )
          }
        }

        // Critical level
        if (rss >= cfg.criticalThresholdMB && rss < cfg.killThresholdMB) {
          console.error(`[kraken-code:memory-guard] 🔴 CRITICAL: Memory at ${rss}MB`)
          console.error(`[kraken-code:memory-guard] Consider starting a new session soon`)

          // Try to trigger GC if available
          if (globalThis.gc) {
            console.log('[kraken-code:memory-guard] Attempting garbage collection...')
            globalThis.gc()

            // Check if GC helped
            const afterGC = getMemoryUsage()
            const freed = rss - afterGC.rss
            if (freed > 50) {
              console.log(`[kraken-code:memory-guard] GC freed ~${freed}MB`)
            }
          }
        }

        // Kill threshold - prevent crash
        if (rss >= cfg.killThresholdMB) {
          console.error(
            `[kraken-code:memory-guard] 💀 FATAL: Memory at ${rss}MB exceeds kill threshold (${cfg.killThresholdMB}MB)`,
          )
          console.error(`[kraken-code:memory-guard] Emergency shutdown to prevent segfault`)

          // Log session info for debugging
          const sessionID = (input as any).sessionID || 'unknown'
          console.error(
            `[kraken-code:memory-guard] Session: ${sessionID}, Tools executed: ${toolCount}`,
          )

          // Graceful exit
          setTimeout(() => {
            process.exit(1)
          }, 100)
        }
      } catch (error) {
        console.error('[kraken-code:memory-guard] Error in tool.execute.after:', error)
      }
    },

    event: async (input) => {
      try {
        const eventAny = input as any
        if (eventAny?.type === 'session.end') {
          // Log final memory stats
          const snapshot = getMemoryUsage()
          console.log(
            `[kraken-code:memory-guard] Session ended. Final memory: ${formatMemory(snapshot)}`,
          )

          // Log memory trend
          if (memoryHistory.length > 2) {
            const start = memoryHistory[0].rss
            const end = snapshot.rss
            const change = end - start
            const trend = change > 0 ? '↗️ increased' : change < 0 ? '↘️ decreased' : '➡️ stable'
            console.log(
              `[kraken-code:memory-guard] Memory trend: ${trend} by ${Math.abs(change)}MB during session`,
            )
          }
        }
      } catch (error) {
        console.error('[kraken-code:memory-guard] Error in event:', error)
      }
    },
  }
}
