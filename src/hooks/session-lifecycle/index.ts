import type { Hooks, PluginInput } from '@opencode-ai/plugin'

export interface SessionLifecycleConfig {
  enabled?: boolean
  maxSessionDurationMinutes?: number
  maxToolsPerSession?: number
  warningThresholdTools?: number
  warningThresholdMinutes?: number
}

interface SessionStats {
  startTime: number
  toolCount: number
  warningsIssued: Set<string>
}

export function createSessionLifecycle(
  _input: PluginInput,
  config?: SessionLifecycleConfig,
): Hooks {
  const cfg = {
    enabled: config?.enabled ?? true,
    maxSessionDurationMinutes: config?.maxSessionDurationMinutes ?? 45,
    maxToolsPerSession: config?.maxToolsPerSession ?? 100,
    warningThresholdTools: config?.warningThresholdTools ?? 0.7, // 70% of max
    warningThresholdMinutes: config?.warningThresholdMinutes ?? 0.8, // 80% of max
  }

  if (!cfg.enabled) return {}

  const sessionStats = new Map<string, SessionStats>()

  const getStats = (sessionID: string): SessionStats => {
    if (!sessionStats.has(sessionID)) {
      sessionStats.set(sessionID, {
        startTime: Date.now(),
        toolCount: 0,
        warningsIssued: new Set(),
      })
    }
    return sessionStats.get(sessionID)!
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return {
    'tool.execute.before': async (input) => {
      const sessionID = (input as any).sessionID
      if (!sessionID) return

      const stats = getStats(sessionID)
      stats.toolCount++

      const duration = Date.now() - stats.startTime
      const durationMinutes = duration / 60000

      // Check tool count warnings
      const toolWarningThreshold = Math.floor(cfg.maxToolsPerSession * cfg.warningThresholdTools)
      if (stats.toolCount === toolWarningThreshold) {
        if (!stats.warningsIssued.has('tools-70')) {
          stats.warningsIssued.add('tools-70')
          console.warn(
            `[kraken-code:session-lifecycle] ⚠️  Session approaching tool limit (${stats.toolCount}/${cfg.maxToolsPerSession})`,
          )
          console.warn(
            `[kraken-code:session-lifecycle] Consider starting a new session soon to prevent memory issues`,
          )
        }
      }

      // Check tool count critical
      if (stats.toolCount === cfg.maxToolsPerSession) {
        console.error(
          `[kraken-code:session-lifecycle] 🔴 Session has reached tool limit (${cfg.maxToolsPerSession})`,
        )
        console.error(
          `[kraken-code:session-lifecycle] Memory leak risk is HIGH. Start a new session immediately.`,
        )
      }

      // Check duration warnings
      const durationWarningThreshold = cfg.maxSessionDurationMinutes * cfg.warningThresholdMinutes
      if (
        durationMinutes >= durationWarningThreshold &&
        durationMinutes < cfg.maxSessionDurationMinutes
      ) {
        if (!stats.warningsIssued.has('duration-80')) {
          stats.warningsIssued.add('duration-80')
          const remaining = Math.round(cfg.maxSessionDurationMinutes - durationMinutes)
          console.warn(
            `[kraken-code:session-lifecycle] ⏰ Session running long (${Math.round(durationMinutes)}m)`,
          )
          console.warn(
            `[kraken-code:session-lifecycle] Recommend restart within ${remaining} minutes`,
          )
        }
      }

      // Check duration critical
      if (durationMinutes >= cfg.maxSessionDurationMinutes) {
        console.error(
          `[kraken-code:session-lifecycle] ⏰ Session exceeded max duration (${cfg.maxSessionDurationMinutes}m)`,
        )
        console.error(
          `[kraken-code:session-lifecycle] Current: ${Math.round(durationMinutes)}m - Memory leak risk CRITICAL`,
        )
      }

      // Log stats every 25 tools
      if (stats.toolCount % 25 === 0) {
        console.log(
          `[kraken-code:session-lifecycle] Session stats: ${stats.toolCount} tools, ${formatDuration(duration)} elapsed`,
        )
      }
    },

    event: async (input) => {
      const eventAny = input as any
      const sessionID = eventAny?.sessionID

      if (eventAny?.type === 'session.start' && sessionID) {
        // Initialize stats for new session
        getStats(sessionID)
        console.log(
          `[kraken-code:session-lifecycle] Session started - Limits: ${cfg.maxToolsPerSession} tools, ${cfg.maxSessionDurationMinutes}min`,
        )
      }

      if (eventAny?.type === 'session.end' && sessionID) {
        // Log final stats
        const stats = sessionStats.get(sessionID)
        if (stats) {
          const duration = Date.now() - stats.startTime
          console.log(
            `[kraken-code:session-lifecycle] Session ended: ${stats.toolCount} tools in ${formatDuration(duration)}`,
          )
          sessionStats.delete(sessionID)
        }
      }
    },
  }
}
