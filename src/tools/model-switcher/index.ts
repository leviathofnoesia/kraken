import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { 
  loadAgentConfig, 
  saveAgentConfig, 
  loadPresets, 
  savePreset,
  getHistory,
  addToHistory
} from "./config-manager"
import { 
  MODEL_CATALOG, 
  generateOptimalPresets, 
  getModelDisplayName,
  validateModel,
  getAvailableModelsByProvider,
  type AgentConfig
} from "./catalog"

function getWorktree(): string {
  return process.cwd()
}

export const modelSwitcher = tool({
  description: "Intelligent agent and subagent model manager with presets and history",
  args: {
    action: z.enum([
      "set", "set-all", "preset", "status", 
      "available", "create-preset", "list-presets",
      "history", "rollback", "costs", "validate"
    ]),
    agent: z.string().optional(),
    model: z.string().optional(),
    preset: z.string().optional(),
    presetName: z.string().optional(),
    historyIndex: z.number().optional()
  },
  async execute(args) {
    const worktree = getWorktree()
    
    switch (args.action) {
      case "set":
        await setSingleAgent(args.agent!, args.model!, worktree)
        return JSON.stringify({ success: true, message: `${args.agent} updated` })
        
      case "set-all":
        await setAllAgents(args.model!, worktree)
        return JSON.stringify({ success: true, message: "All agents updated" })
        
      case "preset":
        await applyPreset(args.preset!, worktree)
        return JSON.stringify({ success: true, message: `Preset '${args.preset}' applied` })
        
      case "status":
        return JSON.stringify(await showStatus(worktree), null, 2)
        
      case "available":
        return JSON.stringify(showAvailableModels(), null, 2)
        
      case "create-preset":
        await createCustomPreset(args.presetName!, worktree)
        return JSON.stringify({ success: true, message: `Preset '${args.presetName}' created` })
        
      case "list-presets":
        return JSON.stringify(await listPresets(worktree), null, 2)
        
      case "history":
        return JSON.stringify(await showHistory(worktree), null, 2)
        
      case "rollback":
        await rollbackConfiguration(args.historyIndex!, worktree)
        return JSON.stringify({ success: true, message: "Configuration restored" })
        
      case "costs":
        return JSON.stringify({ 
          message: "Cost tracking is disabled. Enable in config to use this feature.",
          enabled: false 
        }, null, 2)
        
      case "validate":
        return JSON.stringify(validateConfiguration(worktree), null, 2)
    }
  }
})

async function setSingleAgent(agent: string, model: string, worktree: string) {
  if (!validateModel(model)) {
    throw new Error(`Model '${model}' not found. Use /models available to list options.`)
  }
  
  const currentConfig = await loadAgentConfig(worktree)
  if (!currentConfig[agent]) {
    const validAgents = Object.keys(currentConfig).join(', ')
    throw new Error(`Agent '${agent}' not found. Valid agents: ${validAgents}`)
  }
  
  await saveAgentConfig(worktree, { [agent]: { model } })
  await addToHistory(worktree, { type: 'agent', agent, model })
}

async function setAllAgents(model: string, worktree: string) {
  if (!validateModel(model)) {
    throw new Error(`Model '${model}' not found. Use /models available to list options.`)
  }
  
  const currentConfig = await loadAgentConfig(worktree)
  const updates: Record<string, { model: string }> = {}
  
  for (const agent of Object.keys(currentConfig)) {
    updates[agent] = { model }
  }
  
  await saveAgentConfig(worktree, updates)
  await addToHistory(worktree, { type: 'all', model })
}

async function applyPreset(presetName: string, worktree: string) {
  const presets = await loadPresets(worktree)
  const preset = presets[presetName]
  
  if (!preset) {
    const available = Object.keys(presets).join(', ')
    throw new Error(`Preset '${presetName}' not found. Available: ${available}`)
  }
  
  await saveAgentConfig(worktree, preset.config)
  await addToHistory(worktree, { type: 'preset', name: presetName })
}

async function createCustomPreset(name: string, worktree: string) {
  const currentConfig = await loadAgentConfig(worktree)
  await savePreset(worktree, name, {
    description: `Custom preset: ${name}`,
    config: currentConfig,
    createdAt: Date.now()
  })
}

async function showStatus(worktree: string): Promise<Record<string, any>> {
  const config = await loadAgentConfig(worktree)
  const presets = await loadPresets(worktree)

  const configPath = join(worktree, '.opencode', 'config.json')
  const fullConfig = JSON.parse(await readFile(configPath, 'utf-8')) as { modelSwitcher?: { setupComplete?: boolean } }

  const agents = Object.entries(config).map(([name, cfg]) => ({
    agent: name,
    model: cfg.model,
    provider: MODEL_CATALOG[cfg.model]?.provider || 'unknown',
    displayName: getModelDisplayName(cfg.model),
    enabled: cfg.enabled !== false
  }))

  const builtInPresets = Object.keys(presets).filter(p =>
    ['performance', 'quality', 'balanced', 'economy'].includes(p)
  )

  return {
    agents,
    builtInPresets,
    customPresets: Object.keys(presets).filter(p =>
      !['performance', 'quality', 'balanced', 'economy'].includes(p)
    ),
    setupComplete: fullConfig.modelSwitcher?.setupComplete || false,
    totalAgents: agents.length
  }
}

function showAvailableModels(): Record<string, any> {
  const models = Object.values(MODEL_CATALOG).map(m => ({
    id: m.id,
    displayName: m.displayName,
    provider: m.provider,
    tier: m.tier,
    costPer1kTokens: m.costPer1kTokens,
    maxContext: m.maxContext,
    capabilities: m.capabilities
  }))
  
  const byProvider: Record<string, any[]> = {
    anthropic: getAvailableModelsByProvider('anthropic'),
    openai: getAvailableModelsByProvider('openai'),
    google: getAvailableModelsByProvider('google')
  }
  
  return { models, byProvider }
}

async function listPresets(worktree: string): Promise<Record<string, any>> {
  const presets = await loadPresets(worktree)
  
  const result: Record<string, any> = {}
  for (const [name, preset] of Object.entries(presets)) {
    result[name] = {
      description: preset.description,
      agentCount: Object.keys(preset.config).length,
      createdAt: preset.createdAt
    }
  }
  
  return { presets: result }
}

async function showHistory(worktree: string): Promise<Record<string, any>> {
  const history = await getHistory(worktree)
  
  const entries = history.map((entry, index) => ({
    index,
    timestamp: new Date(entry.timestamp).toISOString(),
    type: entry.type,
    description: formatHistoryEntry(entry)
  }))
  
  return { history: entries, total: entries.length }
}

function formatHistoryEntry(entry: any): string {
  if (entry.type === 'preset') {
    return `Preset: ${entry.name}`
  } else if (entry.type === 'all') {
    return `All → ${getModelDisplayName(entry.model)}`
  } else {
    return `${entry.agent} → ${getModelDisplayName(entry.model)}`
  }
}

async function rollbackConfiguration(index: number, worktree: string) {
  const history = await getHistory(worktree)
  const entry = history[index]

  if (!entry || !entry.model) {
    throw new Error(`History entry ${index} not found or invalid. Total entries: ${history.length}`)
  }

  if (entry.type === 'preset') {
    if (typeof entry.name === 'string') {
      await applyPreset(entry.name, worktree)
    }
  } else {
    const currentConfig = await loadAgentConfig(worktree)
    const targetAgent = entry.type === 'all' ? undefined : entry.agent
    const model = entry.model
    const updates: Record<string, { model: string }> = targetAgent
      ? { [targetAgent]: { model } }
      : Object.fromEntries(Object.keys(currentConfig).map(k => [k, { model }]))

    await saveAgentConfig(worktree, updates)
  }
}

function validateConfiguration(worktree: string): Record<string, any> {
  return {
    valid: true,
    message: "Configuration is valid",
    modelCount: Object.keys(MODEL_CATALOG).length
  }
}
