import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentPromptMetadata, AgentOverrides } from "./types"
import { createKrakenConfig } from "./sea-themed/kraken"
import { createMaelstromConfig } from "./sea-themed/maelstrom"
import { createNautilusConfig } from "./sea-themed/nautilus"
import { createScyllaConfig } from "./sea-themed/scylla"
import { createPoseidonConfig } from "./sea-themed/poseidon"
import { createAbyssalConfig } from "./sea-themed/abyssal"
import { createCoralConfig } from "./sea-themed/coral"
import { createSirenConfig } from "./sea-themed/siren"
import { createLeviathanConfig } from "./sea-themed/leviathan"
import { createPearlConfig } from "./sea-themed/pearl"

export interface AvailableAgent {
  name: string
  description: string
  metadata: AgentPromptMetadata
}

const agentFactories: Record<string, (model?: string) => AgentConfig> = {
  Kraken: createKrakenConfig,
  Maelstrom: createMaelstromConfig,
  Nautilus: createNautilusConfig,
  Scylla: createScyllaConfig,
  "Poseidon (Plan Consultant)": createPoseidonConfig,
  Abyssal: createAbyssalConfig,
  Coral: createCoralConfig,
  Siren: createSirenConfig,
  Leviathan: createLeviathanConfig,
  Pearl: createPearlConfig,
}

const agentMetadata: Record<string, AgentPromptMetadata> = {
  Maelstrom: {
    category: "advisor",
    cost: "EXPENSIVE",
    promptAlias: "Maelstrom",
    triggers: [
      { domain: "Architecture decisions", trigger: "Multi-system tradeoffs, unfamiliar patterns" },
      { domain: "Self-review", trigger: "After completing significant implementation" },
      { domain: "Hard debugging", trigger: "After 2+ failed fix attempts" },
    ],
    useWhen: [
      "Complex architecture design",
      "After completing significant work",
      "2+ failed fix attempts",
      "Unfamiliar code patterns",
      "Security/performance concerns",
      "Multi-system tradeoffs",
    ],
    avoidWhen: [
      "Simple file operations",
      "First attempt at any fix",
      "Questions answerable from code you've read",
      "Trivial decisions",
    ],
  },
  Nautilus: {
    category: "exploration",
    cost: "FREE",
    promptAlias: "Nautilus",
    keyTrigger: "2+ modules involved → fire Nautilus background",
    triggers: [
      { domain: "Nautilus", trigger: "Find existing codebase structure, patterns and styles" },
    ],
    useWhen: [
      "Multiple search angles needed",
      "Unfamiliar module structure",
      "Cross-layer pattern discovery",
    ],
    avoidWhen: [
      "You know exactly what to search",
      "Single keyword/pattern suffices",
      "Known file location",
    ],
  },
  Poseidon: {
    category: "advisor",
    cost: "EXPENSIVE",
    promptAlias: "Poseidon",
    triggers: [
      { domain: "Pre-planning analysis", trigger: "Complex task requiring scope clarification" },
    ],
    useWhen: [
      "Before planning non-trivial tasks",
      "When user request is ambiguous",
      "To prevent AI over-engineering",
    ],
    avoidWhen: ["Simple, well-defined tasks"],
  },
  Scylla: {
    category: "advisor",
    cost: "EXPENSIVE",
    promptAlias: "Scylla",
    triggers: [
      { domain: "Plan review", trigger: "Evaluate work plans for clarity and completeness" },
      { domain: "Quality assurance", trigger: "Catch gaps before implementation" },
    ],
    useWhen: [
      "After planner creates a work plan",
      "Before executing a complex todo list",
      "To validate plan quality",
    ],
    avoidWhen: [
      "Simple, single-task requests",
      "When user explicitly wants to skip review",
    ],
  },
  Abyssal: {
    category: "exploration",
    cost: "CHEAP",
    promptAlias: "Abyssal",
    keyTrigger: "External library/source mentioned → fire Abyssal background",
    triggers: [
      { domain: "Abyssal", trigger: "Unfamiliar packages, external library behavior" },
    ],
    useWhen: [
      "How do I use a library?",
      "Best practice for framework feature?",
      "Why does external dependency behave this way?",
      "Find examples of library usage",
    ],
  },
  Coral: {
    category: "specialist",
    cost: "CHEAP",
    promptAlias: "Coral",
    triggers: [
      { domain: "Frontend UI/UX", trigger: "Visual changes only" },
    ],
    useWhen: [
      "Visual/UI/UX changes: Color, spacing, layout, typography, animation",
    ],
    avoidWhen: [
      "Pure logic: API calls, data fetching, state management",
    ],
  },
  Siren: {
    category: "specialist",
    cost: "CHEAP",
    promptAlias: "Siren",
    triggers: [
      { domain: "Documentation", trigger: "README, API docs, guides" },
    ],
  },
  Leviathan: {
    category: "advisor",
    cost: "EXPENSIVE",
    promptAlias: "Leviathan",
    triggers: [
      { domain: "Architecture", trigger: "System design, structural analysis" },
    ],
    useWhen: [
      "Complex architectural questions",
      "Large-scale refactoring planning",
      "Technology selection and migration",
      "Performance optimization at system level",
    ],
    avoidWhen: [
      "Simple implementation questions",
      "Quick fixes that don't affect architecture",
    ],
  },
  Pearl: {
    category: "utility",
    cost: "CHEAP",
    promptAlias: "Pearl",
    triggers: [
      { domain: "Multimedia Analysis", trigger: "PDFs, images, diagrams" },
    ],
    useWhen: [
      "Analyzing PDF documents",
      "Describing visual content in images",
      "Extracting data from charts or diagrams",
    ],
    avoidWhen: [
      "Plain text files",
      "Files needing editing afterward",
    ],
  },
}

export function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {}
): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {}

  for (const [name, factory] of Object.entries(agentFactories)) {
    if (disabledAgents.includes(name)) continue

    const override = agentOverrides[name as keyof AgentOverrides]
    let config = factory(override?.model)

    if (override?.prompt_append && config.prompt) {
      config = { ...config, prompt: config.prompt + "\n\n" + override.prompt_append }
    }

    result[name] = config
  }

  return result
}

export function getAvailableAgents(): AvailableAgent[] {
  return Object.entries(agentMetadata).map(([name, metadata]) => ({
    name,
    description: agentFactories[name]().description || "",
    metadata,
  }))
}

export function getAgentMetadata(name: string): AgentPromptMetadata | undefined {
  return agentMetadata[name]
}

export function isGptModel(model: string): boolean {
  return model.startsWith("openai/") || model.startsWith("github-copilot/gpt-")
}
