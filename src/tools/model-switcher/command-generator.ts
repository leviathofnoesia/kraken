import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const COMMAND_TEMPLATES: Record<string, string> = {
  'models.md': `---
description: Switch agent models with intelligent presets
---

<command-instruction>
Use the model_switcher tool to manage agent configurations.

Parse user input:
- No arguments: Show interactive menu
- One argument (agent name): Show model selection for that agent
- Two arguments (agent name, model): Direct model assignment
  Example: /models Kraken claude-opus-4-5
- "preset <name>": Apply preset
  Example: /models preset performance
- "create-preset <name>": Save current config as preset
  Example: /models create-preset my-workflow
- "history": Show configuration history
- "status": Show all agent models

Supported agents: Kraken, Cartographer, Maelstrom, Nautilus, Abyssal, Coral, Siren, Leviathan, Poseidon, Scylla, Pearl
</command-instruction>
`,

  'model-setup.md': `---
description: Configure model subscriptions and set intelligent defaults
---

<command-instruction>
Run the model switcher setup wizard.

The wizard will:
1. Ask which providers you have access to (Anthropic, OpenAI, Google)
2. Ask about subscription tiers
3. Generate optimal configuration
4. Apply to .opencode/config.json

After setup, use /models to customize your configuration.
</command-instruction>
`,

  'model-preset.md': `---
description: Apply model configuration preset
---

<command-instruction>
Apply $1 preset using model_switcher tool.

Available presets:
  performance  - All agents to fastest available models
  quality      - All agents to best quality models
  balanced     - Optimal mix based on agent roles
  economy      - All agents to most cost-effective
  custom       - User-defined preset (use $2 for preset name)

Example: /model-preset quality
Example: /model-preset custom my-workflow
</command-instruction>
`,

  'model-status.md': `---
description: Show current agent model configuration
---

<command-instruction>
Use model_switcher tool with action "status" to display configuration.

Display formatted table showing:
- Agent name
- Current model
- Provider
- Status

Include summary of active providers and cost tracking status.
</command-instruction>
`,

  'model-history.md': `---
description: View configuration history and rollback
---

<command-instruction>
Use model_switcher tool to show last 5 configurations.

Each history entry shows:
- Timestamp
- Type (agent change, preset, all agents)
- What changed

Use /model-rollback <index> to restore a configuration.
Example: /model-rollback 0 (restores most recent change)
</command-instruction>
`,

  'model-costs.md': `---
description: Show model usage costs and estimates
---

<command-instruction>
Check if cost tracking is enabled in config.

If disabled:
  Show message about enabling costs with /model-config --enable-costs

If enabled:
  Display session costs per agent
  Show estimated monthly costs
  Show cost optimization suggestions
  Compare with alternative configurations
</command-instruction>
`,

  'model-rollback.md': `---
description: Restore previous configuration from history
---

<command-instruction>
Restore configuration from history using model_switcher tool.

Usage: /model-rollback <index>
- Index 0 = most recent change
- Index 4 = oldest available change

Use /model-history first to see available rollback points.
Example: /model-rollback 2
</command-instruction>
`,

  'model-available.md': `---
description: List all available models from all providers
---

<command-instruction>
Use model_switcher tool with action "available" to list all models.

Display models grouped by provider:
- Anthropic (Claude)
- OpenAI (ChatGPT)
- Google (Antigravity)

For each model show:
- Display name
- Tier (flagship, balanced, fast)
- Cost per 1k tokens
- Max context window
- Capabilities
</command-instruction>
`,
}

export async function ensureCommands(worktree: string): Promise<void> {
  const commandDir = join(worktree, '.opencode', 'command')

  try {
    await mkdir(commandDir, { recursive: true })
  } catch {
    // Directory already exists
  }

  for (const [filename, content] of Object.entries(COMMAND_TEMPLATES)) {
    const filePath = join(commandDir, filename)
    await writeFile(filePath, content)
  }
}
