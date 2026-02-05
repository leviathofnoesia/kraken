export interface ModelInfo {
  id: string
  provider: 'anthropic' | 'openai' | 'google'
  displayName: string
  tier: 'flagship' | 'balanced' | 'fast'
  capabilities: string[]
  costPer1kTokens: number
  maxContext: number
  recommendedFor: string[]
}

export const MODEL_CATALOG: Record<string, ModelInfo> = {
  'anthropic/claude-opus-4-5': {
    id: 'anthropic/claude-opus-4-5',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.5',
    tier: 'flagship',
    capabilities: ['code', 'thinking', 'vision', 'multimodal'],
    costPer1kTokens: 15.0,
    maxContext: 200000,
    recommendedFor: ['Kraken', 'Maelstrom', 'Leviathan', 'Poseidon', 'Scylla'],
  },
  'anthropic/claude-sonnet-4-5': {
    id: 'anthropic/claude-sonnet-4-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.5',
    tier: 'balanced',
    capabilities: ['code', 'thinking', 'vision', 'multimodal'],
    costPer1kTokens: 3.0,
    maxContext: 200000,
    recommendedFor: ['Nautilus', 'Abyssal', 'Coral', 'Siren', 'Pearl'],
  },
  'anthropic/claude-haiku-4-5': {
    id: 'anthropic/claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    tier: 'fast',
    capabilities: ['code', 'vision'],
    costPer1kTokens: 0.25,
    maxContext: 200000,
    recommendedFor: ['Nautilus', 'Pearl'],
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    tier: 'flagship',
    capabilities: ['code', 'vision', 'multimodal'],
    costPer1kTokens: 5.0,
    maxContext: 128000,
    recommendedFor: ['Abyssal', 'Coral'],
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    tier: 'fast',
    capabilities: ['code', 'vision'],
    costPer1kTokens: 0.15,
    maxContext: 128000,
    recommendedFor: ['Nautilus', 'Siren'],
  },
  'google/antigravity-gemini-3-flash': {
    id: 'google/antigravity-gemini-3-flash',
    provider: 'google',
    displayName: 'Gemini 3 Flash',
    tier: 'fast',
    capabilities: ['code', 'vision', 'multimodal'],
    costPer1kTokens: 0.075,
    maxContext: 1048576,
    recommendedFor: ['Nautilus', 'Pearl'],
  },
  'google/antigravity-gemini-3-pro': {
    id: 'google/antigravity-gemini-3-pro',
    provider: 'google',
    displayName: 'Gemini 3 Pro',
    tier: 'flagship',
    capabilities: ['code', 'vision', 'multimodal'],
    costPer1kTokens: 1.5,
    maxContext: 1048576,
    recommendedFor: ['Kraken', 'Maelstrom', 'Leviathan'],
  },
  'google/antigravity-claude-opus-4-5-thinking': {
    id: 'google/antigravity-claude-opus-4-5-thinking',
    provider: 'google',
    displayName: 'Claude Opus 4.5 (Antigravity)',
    tier: 'flagship',
    capabilities: ['code', 'thinking', 'vision', 'multimodal'],
    costPer1kTokens: 10.0,
    maxContext: 200000,
    recommendedFor: ['Kraken', 'Maelstrom', 'Leviathan', 'Poseidon', 'Scylla'],
  },
  'google/antigravity-claude-sonnet-4-5-thinking': {
    id: 'google/antigravity-claude-sonnet-4-5-thinking',
    provider: 'google',
    displayName: 'Claude Sonnet 4.5 (Antigravity)',
    tier: 'balanced',
    capabilities: ['code', 'thinking', 'vision', 'multimodal'],
    costPer1kTokens: 3.0,
    maxContext: 200000,
    recommendedFor: ['Nautilus', 'Abyssal', 'Coral', 'Siren', 'Pearl'],
  },
}

export interface ProviderSubscription {
  provider: 'anthropic' | 'openai' | 'google'
  tier: 'free' | 'basic' | 'pro' | 'max20' | 'team'
}

export interface AgentConfig {
  [agent: string]: { model: string; enabled?: boolean }
}

export function generateOptimalPresets(
  subscriptions: ProviderSubscription[],
): Record<string, AgentConfig> {
  const hasAnthropic = subscriptions.some((s) => s.provider === 'anthropic')
  const hasOpenAI = subscriptions.some((s) => s.provider === 'openai')
  const hasGoogle = subscriptions.some((s) => s.provider === 'google')

  const presets: Record<string, AgentConfig> = {}

  presets.performance = {
    Kraken: {
      model: hasAnthropic ? 'anthropic/claude-sonnet-4-5' : 'google/antigravity-gemini-3-pro',
    },
    Maelstrom: { model: 'anthropic/claude-sonnet-4-5' },
    Nautilus: {
      model: hasGoogle ? 'google/antigravity-gemini-3-flash' : 'anthropic/claude-haiku-4-5',
    },
    Abyssal: { model: hasOpenAI ? 'openai/gpt-4o-mini' : 'anthropic/claude-sonnet-4-5' },
    Coral: { model: 'anthropic/claude-sonnet-4-5' },
    Siren: { model: 'anthropic/claude-sonnet-4-5' },
    Leviathan: { model: 'anthropic/claude-sonnet-4-5' },
    'Poseidon (Plan Consultant)': { model: 'anthropic/claude-opus-4-5' },
    'Scylla (Plan Reviewer)': { model: 'anthropic/claude-sonnet-4-5' },
    Pearl: {
      model: hasGoogle ? 'google/antigravity-gemini-3-flash' : 'anthropic/claude-haiku-4-5',
    },
  }

  presets.quality = {
    Kraken: { model: 'anthropic/claude-opus-4-5' },
    Maelstrom: { model: 'anthropic/claude-opus-4-5' },
    Nautilus: { model: 'anthropic/claude-sonnet-4-5' },
    Abyssal: { model: 'openai/gpt-4o' },
    Coral: { model: 'anthropic/claude-sonnet-4-5' },
    Siren: { model: 'anthropic/claude-sonnet-4-5' },
    Leviathan: { model: 'anthropic/claude-opus-4-5' },
    'Poseidon (Plan Consultant)': { model: 'anthropic/claude-opus-4-5' },
    'Scylla (Plan Reviewer)': { model: 'anthropic/claude-sonnet-4-5' },
    Pearl: { model: 'anthropic/claude-sonnet-4-5' },
  }

  presets.economy = {
    Kraken: { model: 'anthropic/claude-haiku-4-5' },
    Maelstrom: { model: 'anthropic/claude-haiku-4-5' },
    Nautilus: { model: 'anthropic/claude-haiku-4-5' },
    Abyssal: { model: 'openai/gpt-4o-mini' },
    Coral: { model: 'anthropic/claude-haiku-4-5' },
    Siren: { model: 'anthropic/claude-haiku-4-5' },
    Leviathan: { model: 'anthropic/claude-haiku-4-5' },
    'Poseidon (Plan Consultant)': { model: 'anthropic/claude-sonnet-4-5' },
    'Scylla (Plan Reviewer)': { model: 'anthropic/claude-sonnet-4-5' },
    Pearl: { model: 'anthropic/claude-haiku-4-5' },
  }

  presets.balanced = {
    Kraken: { model: 'anthropic/claude-opus-4-5' },
    Maelstrom: { model: 'anthropic/claude-opus-4-5' },
    Nautilus: { model: 'google/antigravity-gemini-3-flash' },
    Abyssal: { model: 'openai/gpt-4o' },
    Coral: { model: 'anthropic/claude-sonnet-4-5' },
    Siren: { model: 'anthropic/claude-sonnet-4-5' },
    Leviathan: { model: 'anthropic/claude-opus-4-5' },
    'Poseidon (Plan Consultant)': { model: 'anthropic/claude-opus-4-5' },
    'Scylla (Plan Reviewer)': { model: 'anthropic/claude-sonnet-4-5' },
    Pearl: { model: 'google/antigravity-gemini-3-flash' },
  }

  return presets
}

export function getAvailableModelsByProvider(
  provider: 'anthropic' | 'openai' | 'google',
): ModelInfo[] {
  return Object.values(MODEL_CATALOG)
    .filter((m) => m.provider === provider)
    .sort((a, b) => {
      const tierOrder = { flagship: 0, balanced: 1, fast: 2 }
      return tierOrder[a.tier] - tierOrder[b.tier]
    })
}

export function getModelDisplayName(modelId: string): string {
  return MODEL_CATALOG[modelId]?.displayName || modelId
}

export function validateModel(modelId: string): boolean {
  return modelId in MODEL_CATALOG
}
