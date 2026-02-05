export interface ModeConfig {
  name: string
  enabled: boolean
  parallelAgents?: number
  concurrencyLimits?: Record<string, number>
  thinkingBudget?: number
  maxResults?: number
  expertAgents?: string[]
  useExplore?: boolean
  useLibrarian?: boolean
  consultationPhases?: number
  autoVariantSwitch?: boolean
}

export interface ModeActivation {
  mode: string
  keyword: string
  language?: string
}

export const DEFAULT_MODES: Record<string, ModeConfig> = {
  blitzkrieg: {
    name: 'Ultrawork',
    enabled: true,
    parallelAgents: 4,
    concurrencyLimits: {
      anthropic: 2,
      openai: 3,
      google: 3,
    },
  },
  search: {
    name: 'Search',
    enabled: true,
    maxResults: 50,
    useExplore: true,
    useLibrarian: true,
  },
  analyze: {
    name: 'Analyze',
    enabled: true,
    consultationPhases: 3,
    expertAgents: ['oracle', 'Abyssal', 'Siren'],
  },
  ultrathink: {
    name: 'Ultrathink',
    enabled: true,
    thinkingBudget: 32000,
    autoVariantSwitch: true,
  },
}

export function getModeConfig(modeName: string): ModeConfig | undefined {
  return DEFAULT_MODES[modeName]
}

export function isModeEnabled(modeName: string): boolean {
  return DEFAULT_MODES[modeName]?.enabled ?? false
}
