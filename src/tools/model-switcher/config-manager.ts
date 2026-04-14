import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import type { AgentConfig } from "./catalog"

export type { AgentConfig }

export interface HistoryEntry {
  timestamp: number
  type: 'agent' | 'all' | 'preset'
  agent?: string
  model?: string
  name?: string
}

export interface PresetConfig {
  description: string
  config: AgentConfig
  createdAt: number
}

const MAX_HISTORY = 5

export async function loadAgentConfig(worktree: string): Promise<AgentConfig> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  return config.agents || {}
}

export async function saveAgentConfig(worktree: string, updates: Partial<AgentConfig>): Promise<void> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  
  config.agents = { ...config.agents, ...updates }
  config.modelSwitcher = config.modelSwitcher || {}
  config.modelSwitcher.lastUpdated = Date.now()
  
  await writeFile(configPath, JSON.stringify(config, null, 2))
}

export async function getHistory(worktree: string): Promise<HistoryEntry[]> {
  const historyPath = join(worktree, '.opencode', 'model-switcher-history.json')
  
  try {
    const content = await readFile(historyPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function addToHistory(worktree: string, entry: Omit<HistoryEntry, 'timestamp'>): Promise<void> {
  const historyPath = join(worktree, '.opencode', 'model-switcher-history.json')
  let history = await getHistory(worktree)
  
  history = [{ ...entry, timestamp: Date.now() }, ...history].slice(0, MAX_HISTORY)
  
  await writeFile(historyPath, JSON.stringify(history, null, 2))
}

export async function loadPresets(worktree: string): Promise<Record<string, PresetConfig>> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  
  const builtInPresets: Record<string, PresetConfig> = {
    performance: {
      description: 'Fastest available models for quick iterations',
      config: {},
      createdAt: Date.now()
    },
    quality: {
      description: 'Best quality models for complex tasks',
      config: {},
      createdAt: Date.now()
    },
    balanced: {
      description: 'Optimal mix based on agent roles',
      config: {},
      createdAt: Date.now()
    },
    economy: {
      description: 'Most cost-effective models',
      config: {},
      createdAt: Date.now()
    }
  }
  
  if (config.modelSwitcher?.presets) {
    for (const [name, presetConfig] of Object.entries(config.modelSwitcher.presets)) {
      if (builtInPresets[name] && typeof presetConfig === 'object') {
        builtInPresets[name].config = presetConfig as AgentConfig
      }
    }
  }
  
  const customPresets = config.modelSwitcher?.customPresets || {}
  
  return { ...builtInPresets, ...customPresets }
}

export async function savePreset(worktree: string, name: string, preset: PresetConfig): Promise<void> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  
  config.modelSwitcher = config.modelSwitcher || {}
  config.modelSwitcher.customPresets = config.modelSwitcher.customPresets || {}
  config.modelSwitcher.customPresets[name] = preset
  
  await writeFile(configPath, JSON.stringify(config, null, 2))
}

export async function isSetupComplete(worktree: string): Promise<boolean> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  return !!config.modelSwitcher?.setupComplete
}

export async function saveSetupComplete(worktree: string, subscriptions: { provider: string; tier: string }[]): Promise<void> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  
  config.modelSwitcher = config.modelSwitcher || {}
  config.modelSwitcher.setupComplete = true
  config.modelSwitcher.setupDate = Date.now()
  config.modelSwitcher.subscriptions = subscriptions
  
  await writeFile(configPath, JSON.stringify(config, null, 2))
}

export async function getSubscriptions(worktree: string): Promise<{ provider: string; tier: string }[]> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  return config.modelSwitcher?.subscriptions || []
}

export async function savePresets(worktree: string, presets: Record<string, AgentConfig>): Promise<void> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  
  config.modelSwitcher = config.modelSwitcher || {}
  config.modelSwitcher.presets = presets
  
  await writeFile(configPath, JSON.stringify(config, null, 2))
}
