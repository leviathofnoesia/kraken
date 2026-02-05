import type { AgentPromptMetadata, AgentCost } from './types'

export interface AvailableAgent {
  name: string
  description: string
  metadata: AgentPromptMetadata
}

export interface AvailableTool {
  name: string
  category: 'lsp' | 'ast' | 'search' | 'session' | 'command' | 'other'
}

export interface AvailableSkill {
  name: string
  description: string
  location: 'user' | 'project' | 'plugin'
}

export function categorizeTools(toolNames: string[]): AvailableTool[] {
  return toolNames.map((name) => {
    let category: AvailableTool['category'] = 'other'
    if (name.startsWith('lsp_')) {
      category = 'lsp'
    } else if (name.startsWith('ast_grep')) {
      category = 'ast'
    } else if (name === 'grep' || name === 'glob') {
      category = 'search'
    } else if (name.startsWith('session_')) {
      category = 'session'
    } else if (name === 'slashcommand') {
      category = 'command'
    }
    return { name, category }
  })
}

export function buildKeyTriggersSection(
  agents: AvailableAgent[],
  skills: AvailableSkill[] = [],
): string {
  const keyTriggers = agents
    .filter((a) => a.metadata.keyTrigger)
    .map((a) => `- ${a.metadata.keyTrigger}`)

  const skillTriggers = skills
    .filter((s) => s.description)
    .map((s) => `- **Skill \`${s.name}\`**: ${extractTriggerFromDescription(s.description)}`)

  const allTriggers = [...keyTriggers, ...skillTriggers]

  if (allTriggers.length === 0) return ''

  return `### Key Triggers (Check BEFORE Classification)

**Priority: Skills → Tools → Agents**

${allTriggers.join('\n')}
- **GitHub mention** → Work request: investigate → implement → create PR`
}

function extractTriggerFromDescription(description: string): string {
  const triggerMatch = description.match(/Trigger[s]?[:\s]+([^.]+)/i)
  if (triggerMatch) return triggerMatch[1].trim()

  const activateMatch = description.match(/Activate when[:\s]+([^.]+)/i)
  if (activateMatch) return activateMatch[1].trim()

  const useWhenMatch = description.match(/Use (?:this )?when[:\s]+([^.]+)/i)
  if (useWhenMatch) return useWhenMatch[1].trim()

  return description.split('.')[0] || description
}

export function buildToolSelectionTable(
  agents: AvailableAgent[],
  _tools: AvailableTool[] = [],
  skills: AvailableSkill[] = [],
): string {
  const rows: string[] = [
    '### Tool & Skill Selection:',
    '',
    '**Priority Order**: Skills → Direct Tools → Agents',
    '',
  ]

  if (skills.length > 0) {
    rows.push('#### Skills (Invoke First If Matching)')
    rows.push('')
    rows.push('| Skill | When to Use |')
    rows.push('|-------|-------------|')
    for (const skill of skills) {
      const shortDesc = extractTriggerFromDescription(skill.description)
      rows.push(`| \`${skill.name}\` | ${shortDesc} |`)
    }
    rows.push('')
  }

  rows.push('#### Kraken Code Tools')
  rows.push('')
  rows.push('| Resource | When to Use |')
  rows.push('|----------|-------------|')

  const toolPriority = [
    { name: 'semantic-search', desc: 'Natural language code understanding' },
    { name: 'grep', desc: 'Pattern/text search' },
    { name: 'glob', desc: 'File name patterns' },
    { name: 'read', desc: 'Read file contents' },
    { name: 'write/edit', desc: 'Create or modify files' },
    { name: 'bash', desc: 'Shell commands' },
    { name: 'lsp_*', desc: 'Language server navigation' },
    { name: 'ast_grep', desc: 'Structural code patterns' },
  ]

  for (const tool of toolPriority) {
    rows.push(`| \`${tool.name}\` | ${tool.desc} |`)
  }

  rows.push('')

  const costOrder: Record<AgentCost, number> = { FREE: 0, CHEAP: 1, EXPENSIVE: 2 }
  const sortedAgents = [...agents]
    .filter((a) => a.metadata.category !== 'utility')
    .sort((a, b) => costOrder[a.metadata.cost] - costOrder[b.metadata.cost])

  rows.push('#### Sea-Themed Agents (Delegate)')
  rows.push('')
  for (const agent of sortedAgents) {
    const shortDesc = agent.description.split('.')[0] || agent.description
    rows.push(`| \`${agent.name}\` | ${shortDesc} |`)
  }

  return rows.join('\n')
}

export function buildExploreSection(agents: AvailableAgent[]): string {
  const exploreAgent = agents.find((a) => a.metadata.category === 'exploration')
  if (!exploreAgent) return ''

  const useWhen = exploreAgent.metadata.useWhen || []
  const avoidWhen = exploreAgent.metadata.avoidWhen || []

  return `### Nautilus Agent = Codebase Search

Use for systematic pattern discovery. Fire liberally for multi-angle searches.

| Use Direct Tools | Use Nautilus Agent |
|------------------|-------------------|
${avoidWhen.map((w) => `| ${w} |  |`).join('\n')}
${useWhen.map((w) => `|  | ${w} |`).join('\n')}`
}

export function buildLibrarianSection(agents: AvailableAgent[]): string {
  const librarianAgent = agents.find((a) => a.name === 'Abyssal')
  if (!librarianAgent) return ''

  const useWhen = librarianAgent.metadata.useWhen || []

  return `### Abyssal Agent = External Research

Search external references (docs, OSS, web). Fire proactively.

| Internal Search | External Research |
|----------------------------|---------------------------|
| Search OUR codebase | Search EXTERNAL resources |
| Find patterns in THIS repo | Find examples in OTHER repos |
| How does our code work? | How does this library work? |
| Project-specific logic | Official API documentation |
| | Library best practices |
| | OSS implementation examples |

**Trigger phrases** (fire immediately):
${useWhen.map((w) => `- "${w}"`).join('\n')}`
}

export function buildDelegationTable(agents: AvailableAgent[]): string {
  const rows: string[] = [
    '### Delegation Table:',
    '',
    '| Domain | Delegate To | Trigger |',
    '|--------|-------------|---------|',
  ]

  for (const agent of agents) {
    for (const trigger of agent.metadata.triggers || []) {
      rows.push(`| ${trigger.domain} | \`${agent.name}\` | ${trigger.trigger} |`)
    }
  }

  return rows.join('\n')
}

export function buildFrontendSection(agents: AvailableAgent[]): string {
  const frontendAgent = agents.find((a) => a.name === 'Coral')
  if (!frontendAgent) return ''

  return `### Visual Changes: Delegate to Coral

Frontend files require classification before action.

#### Change Type Classification

| Change Type | Examples | Action |
|-------------|----------|--------|
| **Visual/UI/UX** | Colors, spacing, layout, typography, animation, responsive, hover states | **DELEGATE** to \`Coral\` |
| **Pure Logic** | API calls, data fetching, state management, event handlers, types | **HANDLE directly** |
| **Mixed** | Component with both visual AND logic | **SPLIT**: logic yourself, visual to Coral |

#### Decision Pattern

Before touching frontend code, ask:
> "Is this about **how it LOOKS** or **how it WORKS**?"

- **LOOKS** (colors, sizes, positions, animations) → DELEGATE
- **WORKS** (data flow, API integration, state) → Handle directly

#### Delegate Keywords (When in Doubt)
style, className, tailwind, color, background, border, shadow, margin, padding, width, height, flex, grid, animation, transition, hover, responsive, font-size, icon, svg`
}

export function buildOracleSection(agents: AvailableAgent[]): string {
  const oracleAgent = agents.find((a) => a.name === 'Maelstrom')
  if (!oracleAgent) return ''

  const useWhen = oracleAgent.metadata.useWhen || []
  const avoidWhen = oracleAgent.metadata.avoidWhen || []

  return `### Maelstrom = Read-Only Strategic Advisor

High-quality reasoning for complex decisions. Consultation only - no implementation.

#### When to Consult

| Trigger | Action |
|---------|--------|
${useWhen.map((w) => `| ${w} | Maelstrom FIRST, then implement |`).join('\n')}

#### When NOT to Consult

${avoidWhen.map((w) => `- ${w}`).join('\n')}

#### Usage Pattern

Briefly announce "Consulting Maelstrom for [reason]" before invocation. This is the ONLY case where you announce before acting.`
}

export function buildHardBlocksSection(): string {
  return `## Hard Blocks (Never Violate)

| Constraint | No Exceptions |
|------------|---------------|
| Type error suppression (\`as any\`, \`@ts-ignore\`) | Never |
| Commit without explicit request | Never |
| Speculate about unread code | Never |
| Leave code in broken state | Never |
| Visual frontend changes without Coral | Never`
}

export function buildAntiPatternsSection(): string {
  return `## Anti-Patterns (Blocking Violations)

| Category | Forbidden |
|----------|-----------|
| **Type Safety** | \`as any\`, \`@ts-ignore\`, \`@ts-expect-error\` |
| **Error Handling** | Empty catch blocks (catch(e) {}) |
| **Testing** | Deleting failing tests |
| **Search** | Agents for obvious typos/syntax |
| **Debugging** | Shotgun debugging, random changes |
| **Frontend** | Direct visual/styling edits (delegate to Coral)`
}

export function buildAgentPrioritySection(agents: AvailableAgent[]): string {
  if (agents.length === 0) return ''

  const priorityOrder = [
    'Nautilus',
    'Abyssal',
    'Poseidon',
    'Scylla',
    'Maelstrom',
    'Leviathan',
    'Kraken',
  ]
  const sortedAgents = [...agents].sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.name)
    const bIdx = priorityOrder.indexOf(b.name)
    if (aIdx === -1 && bIdx === -1) return 0
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })

  const lines: string[] = []
  for (const agent of sortedAgents) {
    const shortDesc = agent.description.split('.')[0] || agent.description
    lines.push(`- **${agent.name}**: ${shortDesc}`)
  }

  return lines.join('\n')
}
