import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import { SHOULD_LOG } from '../../utils/logger'

export interface PreemptiveCompactionConfig {
  enabled?: boolean
  threshold?: number
}

export function createPreemptiveCompaction(
  _input: PluginInput,
  options?: { config?: PreemptiveCompactionConfig },
): Hooks {
  const config = options?.config ?? { enabled: true, threshold: 10000 }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return
      const threshold = config.threshold ?? 10000
      if (SHOULD_LOG)
        console.log(
          `[preemptive-compaction] Monitoring message length for preemptive compaction (threshold: ${threshold})`,
        )
    },
    'experimental.session.compacting': async (input, output) => {
      if (!config.enabled) return
      if (SHOULD_LOG)
        console.log('[preemptive-compaction] Triggering preemptive session compaction')
    },
  }
}
