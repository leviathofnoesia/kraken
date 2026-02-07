import type { AgentConfig } from '@opencode-ai/sdk'

export type AgentFactory = (model?: string) => AgentConfig

/**
 * Agent category for grouping in Kraken prompt sections
 */
export type AgentCategory = 'exploration' | 'specialist' | 'advisor' | 'utility'

/**
 * Cost classification for Tool Selection table
 */
export type AgentCost = 'FREE' | 'CHEAP' | 'EXPENSIVE'

/**
 * Delegation trigger for Kraken prompt's Delegation Table
 */
export interface DelegationTrigger {
  /** Domain of work (e.g., "Frontend UI/UX") */
  domain: string
  /** When to delegate (e.g., "Visual changes only...") */
  trigger: string
}

/**
 * Metadata for generating Kraken prompt sections dynamically
 * This allows adding/removing agents without manually updating Kraken prompt
 */
export interface AgentPromptMetadata {
  /** Category for grouping in prompt sections */
  category: AgentCategory

  /** Cost classification for Tool Selection table */
  cost: AgentCost

  /** Domain triggers for Delegation Table */
  triggers: DelegationTrigger[]

  /** When to use this agent (for detailed sections) */
  useWhen?: string[]

  /** When NOT to use this agent */
  avoidWhen?: string[]

  /** Optional dedicated prompt section (markdown) - for agents like Oracle that have special sections */
  dedicatedSection?: string

  /** Nickname/alias used in prompt (e.g., "Oracle" instead of "oracle") */
  promptAlias?: string

  /** Key triggers that should appear in Phase 0 (e.g., "External library mentioned → fire librarian") */
  keyTrigger?: string
}

export function isGptModel(model: string): boolean {
  return model.startsWith('openai/') || model.startsWith('github-copilot/gpt-')
}

export type BuiltinAgentName =
  | 'Kraken'
  | 'Maelstrom'
  | 'Abyssal'
  | 'Nautilus'
  | 'Coral'
  | 'Siren'
  | 'Leviathan'
  | 'Poseidon'
  | 'Scylla'
  | 'Cartographer'
  | 'orchestrator-kraken'

export type OverridableAgentName = 'build' | 'plan' | BuiltinAgentName

export type AgentName = BuiltinAgentName

export type AgentOverrideConfig = Partial<AgentConfig> & {
  prompt_append?: string
}

export type AgentOverrides = Partial<Record<OverridableAgentName, AgentOverrideConfig>>
