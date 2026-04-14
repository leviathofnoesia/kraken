import { tool } from '@opencode-ai/plugin'
import { getPluginInput } from '../features/background-agent/plugin-input'
import { AgentPipeline } from '../agents/execution/pipeline'
import { createDefaultMiddleware } from '../agents/execution'
import { formatAgentOutput } from '../agents/execution'
import type { AgentName } from '../agents'

const z = tool.schema

export const call_kraken_agent = tool({
  description:
    'Call a specialized Kraken Code agent for a specific task. ' +
    'Use this to delegate to agents like Atlas (architecture), Nautilus (codebase search), ' +
    'Abyssal (external research), Coral (UI/UX), Siren (documentation), Scylla (code review), ' +
    'Pearl (multimedia), Maelstrom (strategic advice), Leviathan (structural analysis), or Poseidon (pre-planning). ' +
    "Creates a child session and returns the agent's response.",
  args: {
    agent: z
      .enum([
        'Atlas',
        'Nautilus',
        'Abyssal',
        'Coral',
        'Siren',
        'Scylla',
        'Pearl',
        'Leviathan',
        'Maelstrom',
        'Poseidon',
      ])
      .describe('Agent to call'),
    task: z.string().min(5).describe('Task or instruction for the agent'),
  },
  async execute(args): Promise<string> {
    const { agent, task } = args as { agent: AgentName; task: string }
    const input = getPluginInput()

    if (!input) {
      return JSON.stringify({
        success: false,
        error:
          'Plugin input not initialized. Agent delegation requires access to the OpenCode client.',
      })
    }

    const pipeline = new AgentPipeline()
    for (const mw of createDefaultMiddleware()) {
      pipeline.use(mw)
    }

    const result = await pipeline.execute(agent, task, input.client, {
      delegationDepth: 0,
      metadata: { source: 'call_kraken_agent' },
    })

    if (!result.success) {
      return JSON.stringify({
        success: false,
        error: result.error,
        agent,
      })
    }

    return formatAgentOutput(result)
  },
})
