import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'

export interface AgentUsageReminderConfig {
  enabled?: boolean
  threshold?: number
}

export function createAgentUsageReminder(
  _input: PluginInput,
  options?: { config?: AgentUsageReminderConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    threshold: 10,
  }

  let agentCallCount = 0

  return {
    'tool.execute.after': async (input, output) => {
      if (!config.enabled) return
      if (input.tool === 'task') {
        agentCallCount++
        const threshold = config.threshold ?? 10
        if (agentCallCount % threshold === 0) {
          console.log(
            `[agent-usage-reminder] Agent has been called ${agentCallCount} times in this session`,
          )
        }
      }
    },
  }
}
