import { select, confirm, isCancel } from '@clack/prompts'
import { readFile, writeFile } from 'fs/promises'
import {
  loadAgentConfig,
  saveAgentConfig,
  loadPresets,
  savePreset,
  getHistory,
  addToHistory,
} from '../tools/model-switcher/config-manager'
import type { AgentConfig } from '../tools/model-switcher/catalog'
import {
  MODEL_CATALOG,
  getModelDisplayName,
  getAvailableModelsByProvider,
} from '../tools/model-switcher/catalog'

export async function showModelMenu(worktree: string): Promise<void> {
  const currentConfig = await loadAgentConfig(worktree)

  const action = await select({
    message: '🔧 Agent Model Switcher',
    options: [
      {
        value: 'agent',
        label: 'Change individual agent model',
        hint: 'Select specific agent and model',
      },
      {
        value: 'all',
        label: 'Set all agents to one model',
        hint: 'Batch configuration',
      },
      {
        value: 'preset',
        label: 'Apply preset',
        hint: 'Performance, quality, balanced, economy, or custom',
      },
      {
        value: 'create-preset',
        label: 'Create custom preset',
        hint: 'Save current configuration as preset',
      },
      {
        value: 'history',
        label: 'View history & rollback',
        hint: 'Last 5 configurations',
      },
      {
        value: 'status',
        label: 'Show current configuration',
        hint: 'View all agent models',
      },
    ],
  })

  if (isCancel(action)) return

  switch (action) {
    case 'agent':
      await selectAgentModel(worktree, currentConfig)
      break
    case 'all':
      await setAllAgentsModel(worktree)
      break
    case 'preset':
      await selectPreset(worktree)
      break
    case 'create-preset':
      await createCustomPreset(worktree)
      break
    case 'history':
      await showHistoryMenu(worktree)
      break
    case 'status':
      await showStatusTable(currentConfig)
      break
  }
}

async function selectAgentModel(worktree: string, currentConfig: AgentConfig): Promise<void> {
  const agent = await select({
    message: 'Select agent',
    options: Object.keys(currentConfig).map((agentName) => ({
      value: agentName,
      label: agentName,
      hint: currentConfig[agentName].model,
    })),
  })

  if (isCancel(agent)) return

  const provider = await select({
    message: 'Select provider',
    options: [
      { value: 'anthropic', label: '🤖 Anthropic' },
      { value: 'openai', label: '🧠 OpenAI' },
      { value: 'google', label: '🔍 Google (Antigravity)' },
    ],
  })

  if (isCancel(provider)) return

  const providerModels = getAvailableModelsByProvider(provider as 'anthropic' | 'openai' | 'google')

  const model = await select({
    message: 'Select model',
    options: providerModels.map((m) => ({
      value: m.id,
      label: m.displayName,
      hint: `${m.tier} | $${m.costPer1kTokens}/1k tokens`,
    })),
  })

  if (isCancel(model)) return

  await saveAgentConfig(worktree, { [agent]: { model } })
  await addToHistory(worktree, { type: 'agent', agent, model })

  console.log(`\n  ✅ ${agent} now using ${getModelDisplayName(model)}\n`)
}

async function setAllAgentsModel(worktree: string): Promise<void> {
  const provider = await select({
    message: 'Select provider for all agents',
    options: [
      { value: 'anthropic', label: '🤖 Anthropic' },
      { value: 'openai', label: '🧠 OpenAI' },
      { value: 'google', label: '🔍 Google' },
    ],
  })

  if (isCancel(provider)) return

  const models = getAvailableModelsByProvider(provider as 'anthropic' | 'openai' | 'google')

  const model = await select({
    message: `Select ${provider} model for all agents`,
    options: models.map((m) => ({
      value: m.id,
      label: m.displayName,
      hint: `${m.tier} | $${m.costPer1kTokens}/1k tokens`,
    })),
  })

  if (isCancel(model)) return

  const confirmed = await confirm({
    message: `Set all agents to ${getModelDisplayName(model)}?`,
  })

  if (!confirmed) return

  const currentConfig = await loadAgentConfig(worktree)
  const updates: Record<string, { model: string }> = {}

  for (const agent of Object.keys(currentConfig)) {
    updates[agent] = { model }
  }

  await saveAgentConfig(worktree, updates)
  await addToHistory(worktree, { type: 'all', model })

  console.log(`\n  ✅ All agents now using ${getModelDisplayName(model)}\n`)
}

async function selectPreset(worktree: string): Promise<void> {
  const presets = await loadPresets(worktree)

  const preset = await select({
    message: 'Select preset',
    options: Object.entries(presets).map(([name, config]) => ({
      value: name,
      label: name,
      hint: config.description,
    })),
  })

  if (isCancel(preset)) return

  await saveAgentConfig(worktree, presets[preset].config)
  await addToHistory(worktree, { type: 'preset', name: preset })

  const agentCount = Object.keys(presets[preset].config).length
  console.log(`\n  ✅ ${agentCount} agents configured with '${preset}' preset\n`)
}

async function createCustomPreset(worktree: string): Promise<void> {
  console.log('\n  Creating custom preset from current configuration...\n')

  const name = await promptText('Preset name')
  if (!name) {
    console.log('  ⚠️  Preset name is required\n')
    return
  }

  const description = await promptText('Description (optional)')

  const currentConfig = await loadAgentConfig(worktree)
  await savePreset(worktree, name, {
    description: description || `Custom preset: ${name}`,
    config: currentConfig,
    createdAt: Date.now(),
  })

  console.log(`\n  ✅ Custom preset '${name}' saved. Use /models preset ${name} to apply.\n`)
}

async function promptText(message: string): Promise<string | null> {
  const result = await confirm({
    message: `${message}?`,
  })

  if (isCancel(result) || !result) return null

  console.log(`\n  Note: Interactive text input requires additional TUI setup.`)
  console.log(`  Please use the command line: /models create-preset <name>\n`)

  return null
}

async function showHistoryMenu(worktree: string): Promise<void> {
  const history = await getHistory(worktree)

  if (history.length === 0) {
    console.log('\n  ⚠️  No configuration history yet.\n')
    return
  }

  console.log('\n  📜 Configuration History\n')

  for (let i = 0; i < history.length; i++) {
    const entry = history[i]
    const timestamp = new Date(entry.timestamp).toLocaleString()
    const description = formatHistoryEntry(entry)
    console.log(`  [${i}] ${description}`)
    console.log(`      ${timestamp}\n`)
  }

  console.log('  Use /model-rollback <index> to restore a configuration.\n')
}

function formatHistoryEntry(entry: any): string {
  if (entry.type === 'preset') {
    return `📁 Preset: ${entry.name}`
  } else if (entry.type === 'all') {
    return `🔄 All → ${getModelDisplayName(entry.model)}`
  } else {
    return `${entry.agent} → ${getModelDisplayName(entry.model)}`
  }
}

async function showStatusTable(currentConfig: AgentConfig): Promise<void> {
  console.log('\n  📊 Current Configuration\n')
  console.log('  Agent'.padEnd(25) + 'Model'.padEnd(35) + 'Provider')
  console.log('  ' + '─'.repeat(75))

  for (const [agent, cfg] of Object.entries(currentConfig)) {
    const modelInfo = MODEL_CATALOG[cfg.model]
    const provider = modelInfo?.provider.toUpperCase() || 'UNKNOWN'
    console.log(`  ${agent}`.padEnd(25) + `${getModelDisplayName(cfg.model)}`.padEnd(35) + provider)
  }

  console.log()
}
