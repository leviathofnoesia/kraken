import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

export const call_kraken_agent = tool({
  description:
    'Call a specialized Kraken Code agent for a specific task. ' +
    'Use this to delegate to agents like Atlas (navigation), Nautilus (semantic search), ' +
    'Abyssal (external research), Coral (UI/UX), Siren (documentation), Scylla (code review), ' +
    'Pearl (testing), or Cartographer (advanced planning).',
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
        'Cartographer',
      ])
      .describe('Agent to call'),
    task: z.string().describe('Task or instruction for the agent'),
  },
  async execute(args): Promise<string> {
    const { agent, task } = args

    const agentInstructions: Record<string, string> = {
      Atlas: 'Navigate and explore codebase structure',
      Nautilus: 'Perform semantic code understanding and search',
      Abyssal: 'Conduct external research and investigation',
      Coral: 'Handle UI/UX design and visual changes',
      Siren: 'Write or review documentation',
      Scylla: 'Audit and review code for issues',
      Pearl: 'Create tests and validate implementations',
      Leviathan: 'Architectural design and system-level decisions',
      Maelstrom: 'Orchestrate complex multi-step workflows',
      Poseidon: 'Plan and coordinate complex tasks',
      Cartographer:
        'Advanced planning with hierarchical task decomposition and subagent delegation',
    }

    const defaultTask = agentInstructions[agent] || 'Execute your specialized function'

    const response = `Calling @${agent.toLowerCase()} for task: ${task || defaultTask}`

    return response
  },
})
