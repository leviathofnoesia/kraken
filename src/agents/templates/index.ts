/**
 * Prompt Template System
 *
 * Provides lazy-loading of agent prompt sections based on task type.
 * This reduces token usage by only loading relevant prompt components.
 */

import { promises as fs } from 'node:fs'
import * as path from 'node:path'

// Template sections with metadata
export interface PromptSection {
  id: string
  name: string
  tokens: number // Estimated token count
  content: string
  keywords: string[] // Triggers for auto-loading
  alwaysLoad?: boolean // Always include regardless of context
}

// Template cache
const templateCache = new Map<string, PromptSection>()
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates')

/**
 * Default prompt sections for Kraken
 */
export const DEFAULT_SECTIONS: PromptSection[] = [
  {
    id: 'core',
    name: 'Core Principles',
    tokens: 350,
    content: `## Core Principles

**Think before you act.** Every non-trivial task deserves a moment of planning. Not because you're slow, but because you respect code and people who'll maintain it.

**Use the right tool for the job.** Kraken Code provides specialized agents and skills. Use them deliberately.

**Be thorough but not pedantic.** Your goal is working code, not bureaucratic perfection.

**Admit uncertainty.** If you don't know, say so.`,
    keywords: [],
    alwaysLoad: true,
  },
  {
    id: 'intent_classification',
    name: 'Intent Classification',
    tokens: 450,
    content: `## Intent Classification (Phase 1)

Before ANY analysis or delegation, classify the work intent:

| Intent Type | Indicators | Primary Focus |
|-------------|------------|---------------|
| **Refactoring** | "refactor", "restructure", "clean up" | Safety constraints |
| **Greenfield** | "create new", "add feature" | Discovery constraints |
| **Enhancement** | "improve", "optimize", "extend" | Performance, scope |
| **Integration** | "connect", "integrate", "interface" | API constraints |
| **Investigation** | "understand", "why does", "how does" | Evidence requirements |`,
    keywords: ['refactor', 'create', 'improve', 'optimize', 'integrate', 'understand', 'analyze'],
  },
  {
    id: 'constraint_extraction',
    name: 'Constraint Extraction',
    tokens: 500,
    content: `## Constraint Extraction (Phase 2)

For complex tasks, systematically extract constraint categories:

1. **Functional Constraints** - What MUST the solution accomplish?
2. **Non-Functional Constraints** - Performance, quality, security
3. **Boundary Constraints** - What's OUT OF SCOPE?
4. **Resource Constraints** - Dependencies, patterns, team capabilities`,
    keywords: ['complex', 'architecture', 'system', 'design', 'performance'],
  },
  {
    id: 'pdsa_framework',
    name: 'PDSA Framework',
    tokens: 600,
    content: `## Orchestration Framework (PDSA)

### Plan
1. Identify subtasks and dependencies
2. Assign to right agent or tool
3. Map parallelizable work
4. Define what "done" looks like

### Do
- Provide complete context when delegating
- Make parallel calls where independent
- Track progress visibly

### Study
- Run code, don't just read it
- Check changes don't break functionality

### Act
- Fix issues discovered
- Refine approach for next iteration`,
    keywords: ['plan', 'execute', 'delegate', 'workflow'],
  },
  {
    id: 'agent_routing',
    name: 'Agent Routing',
    tokens: 400,
    content: `## Agent Routing Guide

| Task Type | Agent | Why |
|-----------|-------|-----|
| Codebase exploration | Nautilus | Pattern recognition |
| External docs/OSS | Abyssal | External expertise |
| Visual/UI/UX | Coral | Design sensibility |
| Architecture | Atlas | First-principles reasoning |
| Documentation | Siren | Technical writing |
| Code review | Scylla | Quality gate |`,
    keywords: ['search', 'research', 'design', 'review', 'document', 'explore'],
  },
  {
    id: 'tool_priority',
    name: 'Tool Priority',
    tokens: 300,
    content: `## Tool Priority

1. **Skills first** - Matched skills before anything else
2. **Direct tools next** - @grep, @glob, @read, @write, @lsp_*
3. **Sea-themed agents last** - Only when task warrants specialist`,
    keywords: ['grep', 'glob', 'read', 'write', 'edit', 'bash'],
  },
  {
    id: 'hard_constraints',
    name: 'Hard Constraints',
    tokens: 200,
    content: `## Hard Constraints (Never Violate)

- Never suppress type errors (\`no as any\`, \`@ts-ignore\`)
- Never commit without explicit request
- Never leave code in broken state
- Never speculate about unread code
- Never delegate frontend without Coral`,
    keywords: [],
    alwaysLoad: true,
  },
  {
    id: 'response_structure',
    name: 'Response Structure',
    tokens: 250,
    content: `## Response Structure

Keep responses clean and scannable:
1. **Status** - What stage you're in
2. **Action** - What you're doing
3. **Finding** - What you discovered
4. **Next** - Where you're going`,
    keywords: [],
  },
]

/**
 * Load all templates
 */
async function loadTemplates(): Promise<void> {
  if (templateCache.size > 0) return

  for (const section of DEFAULT_SECTIONS) {
    templateCache.set(section.id, section)
  }
}

/**
 * Get sections to load based on task context
 */
export function getRelevantSections(context: string): PromptSection[] {
  const normalized = context.toLowerCase()
  const relevant: PromptSection[] = []

  for (const section of DEFAULT_SECTIONS) {
    // Always load required sections
    if (section.alwaysLoad) {
      relevant.push(section)
      continue
    }

    // Check if any keywords match
    const hasKeyword = section.keywords.some((kw) => normalized.includes(kw))
    if (hasKeyword) {
      relevant.push(section)
    }
  }

  return relevant
}

/**
 * Build prompt from relevant sections
 */
export function buildPrompt(context: string): string {
  const sections = getRelevantSections(context)

  // Calculate total tokens
  const totalTokens = sections.reduce((sum, s) => sum + s.tokens, 0)

  // Build the prompt
  const prompt = sections.map((s) => s.content).join('\n\n')

  return prompt
}

/**
 * Get token count for a prompt
 */
export function estimatePromptTokens(context: string): number {
  const sections = getRelevantSections(context)
  return sections.reduce((sum, s) => sum + s.tokens, 0)
}

/**
 * Get all available sections
 */
export function getAllSections(): PromptSection[] {
  return [...DEFAULT_SECTIONS]
}

/**
 * Get section by ID
 */
export function getSection(id: string): PromptSection | undefined {
  return templateCache.get(id)
}

/**
 * Initialize template system
 */
export async function initializeTemplates(): Promise<void> {
  await loadTemplates()
}
