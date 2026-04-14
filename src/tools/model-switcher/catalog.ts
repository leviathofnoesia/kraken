export interface ModelInfo {
  id: string
  provider: 'anthropic' | 'openai' | 'google' | 'zai'
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
  'google/gemini-3-flash': {
    id: 'google/gemini-3-flash',
    provider: 'google',
    displayName: 'Gemini 3 Flash',
    tier: 'fast',
    capabilities: ['code', 'vision', 'multimodal'],
    costPer1kTokens: 0.075,
    maxContext: 1048576,
    recommendedFor: ['Nautilus', 'Pearl'],
  },
  'google/gemini-3-pro': {
    id: 'google/gemini-3-pro',
    provider: 'google',
    displayName: 'Gemini 3 Pro',
    tier: 'flagship',
    capabilities: ['code', 'vision', 'multimodal'],
    costPer1kTokens: 1.5,
    maxContext: 1048576,
    recommendedFor: ['Kraken', 'Maelstrom', 'Leviathan'],
  },
  'zai-coding-plan/glm-5.1': {
    id: 'zai-coding-plan/glm-5.1',
    provider: 'zai',
    displayName: 'GLM 5.1',
    tier: 'flagship',
    capabilities: ['code', 'thinking', 'vision', 'multimodal'],
    costPer1kTokens: 0,
    maxContext: 128000,
    recommendedFor: [
      'Kraken',
      'Atlas',
      'Nautilus',
      'Abyssal',
      'Coral',
      'Siren',
      'Scylla',
      'Pearl',
      'Maelstrom',
      'Leviathan',
      'Poseidon',
    ],
  },
}

export interface ProviderSubscription {
  provider: 'anthropic' | 'openai' | 'google' | 'zai'
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
    Kraken: { model: 'zai-coding-plan/glm-5.1' },
    Maelstrom: { model: 'zai-coding-plan/glm-5.1' },
    Nautilus: { model: 'zai-coding-plan/glm-5.1' },
    Abyssal: { model: 'zai-coding-plan/glm-5.1' },
    Coral: { model: 'zai-coding-plan/glm-5.1' },
    Siren: { model: 'zai-coding-plan/glm-5.1' },
    Leviathan: { model: 'zai-coding-plan/glm-5.1' },
    'Poseidon (Plan Consultant)': { model: 'zai-coding-plan/glm-5.1' },
    'Scylla (Plan Reviewer)': { model: 'zai-coding-plan/glm-5.1' },
    Pearl: { model: 'zai-coding-plan/glm-5.1' },
  }

  presets.quality = {
    Kraken: { model: 'zai-coding-plan/glm-5.1' },
    Maelstrom: { model: 'zai-coding-plan/glm-5.1' },
    Nautilus: { model: 'zai-coding-plan/glm-5.1' },
    Abyssal: { model: 'zai-coding-plan/glm-5.1' },
    Coral: { model: 'zai-coding-plan/glm-5.1' },
    Siren: { model: 'zai-coding-plan/glm-5.1' },
    Leviathan: { model: 'zai-coding-plan/glm-5.1' },
    'Poseidon (Plan Consultant)': { model: 'zai-coding-plan/glm-5.1' },
    'Scylla (Plan Reviewer)': { model: 'zai-coding-plan/glm-5.1' },
    Pearl: { model: 'zai-coding-plan/glm-5.1' },
  }

  presets.economy = {
    Kraken: { model: 'zai-coding-plan/glm-5.1' },
    Maelstrom: { model: 'zai-coding-plan/glm-5.1' },
    Nautilus: { model: 'zai-coding-plan/glm-5.1' },
    Abyssal: { model: 'zai-coding-plan/glm-5.1' },
    Coral: { model: 'zai-coding-plan/glm-5.1' },
    Siren: { model: 'zai-coding-plan/glm-5.1' },
    Leviathan: { model: 'zai-coding-plan/glm-5.1' },
    'Poseidon (Plan Consultant)': { model: 'zai-coding-plan/glm-5.1' },
    'Scylla (Plan Reviewer)': { model: 'zai-coding-plan/glm-5.1' },
    Pearl: { model: 'zai-coding-plan/glm-5.1' },
  }

  presets.balanced = {
    Kraken: { model: 'zai-coding-plan/glm-5.1' },
    Maelstrom: { model: 'zai-coding-plan/glm-5.1' },
    Nautilus: { model: 'zai-coding-plan/glm-5.1' },
    Abyssal: { model: 'zai-coding-plan/glm-5.1' },
    Coral: { model: 'zai-coding-plan/glm-5.1' },
    Siren: { model: 'zai-coding-plan/glm-5.1' },
    Leviathan: { model: 'zai-coding-plan/glm-5.1' },
    'Poseidon (Plan Consultant)': { model: 'zai-coding-plan/glm-5.1' },
    'Scylla (Plan Reviewer)': { model: 'zai-coding-plan/glm-5.1' },
    Pearl: { model: 'zai-coding-plan/glm-5.1' },
  }

  return presets
}

export function getAvailableModelsByProvider(
  provider: 'anthropic' | 'openai' | 'google' | 'zai',
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
