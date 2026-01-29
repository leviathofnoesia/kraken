/**
 * Context Injector Hook
 *
 * Injects relevant context from knowledge graph, patterns, and experiences
 * when processing messages. Note: Currently logs context to console for debugging.
 * In future versions, may use experimental.session.compacting to inject.
 */

import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { ExperienceStore } from "../../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { StateMachineEngine } from "../../features/learning/state-machine"
import type { LearningSystemContext } from "../../types/learning-context"

export interface ContextInjectorHookOptions {
  enabled?: boolean
  maxExperiences?: number
  maxPatterns?: number
  maxKnowledgeNodes?: number
  injectState?: boolean
}

/**
 * Create context injector hook
 */
export function createContextInjectorHook(
  input: PluginInput,
  context: LearningSystemContext,
  options?: ContextInjectorHookOptions
): Hooks {
  const config = (input as any).config || {}
  const learningConfig = config.learning || {}

  if (learningConfig.enabled === false || options?.enabled === false) {
    return {}
  }

  const {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine
  } = context

  const maxExperiences = options?.maxExperiences || 5
  const maxPatterns = options?.maxPatterns || 3
  const maxKnowledgeNodes = options?.maxKnowledgeNodes || 3

  return {
    "chat.message": async (input: any, output: any) => {
      try {
        const sessionID = input.sessionID
        const message = input.message || ""

        // Only inject on first message of a session (simplified check)
        if (!message || message.length < 10) {
          return
        }

        console.log(`[ContextInjector] Analyzing context for session ${sessionID}`)

        // Gather relevant context from all four layers
        const contextData = await gatherRelevantContext(
          message,
          { experienceStore, knowledgeGraph, patternDetector, stateMachine },
          { maxExperiences, maxPatterns, maxKnowledgeNodes }
        )

        // Log relevant context for debugging
        if (contextData.experiences.length > 0) {
          console.log(
            `[ContextInjector] Found ${contextData.experiences.length} relevant experiences`
          )
        }
        if (contextData.patterns.length > 0) {
          console.log(
            `[ContextInjector] Found ${contextData.patterns.length} relevant patterns`
          )
        }
        if (contextData.knowledgeNodes.length > 0) {
          console.log(
            `[ContextInjector] Found ${contextData.knowledgeNodes.length} relevant knowledge nodes`
          )
        }

      } catch (error: any) {
        console.error(`[ContextInjector] Error:`, error)
      }
    },
  }
}

/**
 * Gather relevant context from all learning system layers
 */
async function gatherRelevantContext(
  message: string,
  systems: {
    experienceStore: ExperienceStore
    knowledgeGraph: KnowledgeGraphStore
    patternDetector: PatternDetector
    stateMachine: StateMachineEngine
  },
  limits: {
    maxExperiences: number
    maxPatterns: number
    maxKnowledgeNodes: number
  }
): Promise<{
  experiences: any[]
  patterns: any[]
  knowledgeNodes: any[]
  currentState: string | null
}> {
  // Determine current state from message
  const currentState = determineStateFromMessage(message)

  // Parallel queries for performance
  const [experiences, knowledgeNodes, currentStateInfo] = await Promise.all([
    // Get relevant experiences
    getRelevantExperiences(
      systems.experienceStore,
      currentState,
      message,
      limits.maxExperiences
    ),
    // Get relevant knowledge nodes
    getRelevantKnowledgeNodes(
      systems.knowledgeGraph,
      message,
      limits.maxKnowledgeNodes
    ),
    // Get current state from state machine
    getCurrentState(systems.stateMachine)
  ])

  // Get patterns (depends on experiences)
  const patterns = await getRelevantPatterns(
    systems.patternDetector,
    message,
    limits.maxPatterns
  )

  return {
    experiences,
    patterns,
    knowledgeNodes,
    currentState: currentStateInfo
  }
}

/**
 * Get relevant experiences based on state and context
 */
async function getRelevantExperiences(
  experienceStore: ExperienceStore,
  state: string,
  context: string,
  limit: number
): Promise<any[]> {
  // Find similar experiences
  const experiences = await experienceStore.findRelevant(
    state,
    context,
    limit * 2 // Get more, then filter
  )

  // Sort by score (highest first)
  experiences.sort((a, b) => {
    const scoreA = experienceScore(a)
    const scoreB = experienceScore(b)
    return scoreB - scoreA
  })

  // Return top N
  return experiences.slice(0, limit)
}

/**
 * Get relevant knowledge nodes based on context
 */
async function getRelevantKnowledgeNodes(
  knowledgeGraph: KnowledgeGraphStore,
  context: string,
  limit: number
): Promise<any[]> {
  // Extract keywords from context
  const keywords = extractKeywords(context)

  // Search for nodes matching keywords
  const nodes: any[] = []

  for (const keyword of keywords) {
    const searchResults = knowledgeGraph.search(keyword)
    nodes.push(...searchResults)
  }

  // Deduplicate by ID
  const uniqueNodes = Array.from(
    new Map(nodes.map(n => [n.id, n])).values()
  )

  // Sort by importance and access count
  uniqueNodes.sort((a, b) => {
    const scoreA = a.importance * 10 + a.accessCount
    const scoreB = b.importance * 10 + b.accessCount
    return scoreB - scoreA
  })

  // Return top N
  return uniqueNodes.slice(0, limit)
}

/**
 * Get relevant patterns based on context
 */
async function getRelevantPatterns(
  patternDetector: PatternDetector,
  context: string,
  limit: number
): Promise<any[]> {
  // For now, return all active patterns (will be filtered by relevance)
  const allPatterns = patternDetector.getAllPatterns()

  // Filter by relevance to context
  const relevantPatterns = allPatterns.filter(pattern => {
    // Check if pattern triggers match context
    const contextLower = context.toLowerCase()
    return pattern.triggers.some(trigger =>
      contextLower.includes(trigger.toLowerCase())
    )
  })

  // Sort by confidence and impact
  relevantPatterns.sort((a, b) => {
    const scoreA = a.confidence * 10 + impactScore(a.impact)
    const scoreB = b.confidence * 10 + impactScore(b.impact)
    return scoreB - scoreA
  })

  // Return top N
  return relevantPatterns.slice(0, limit)
}

/**
 * Get current state from state machine
 */
async function getCurrentState(
  stateMachine: StateMachineEngine
): Promise<string | null> {
  // Get the default machine's current state
  const machine = stateMachine.getMachine("default")
  if (!machine) {
    return null
  }

  return machine.currentState
}

/**
 * Determine state from message content
 */
function determineStateFromMessage(message: string): string {
  const messageLower = message.toLowerCase()

  const stateKeywords: Record<string, string[]> = {
    "analyzing": ["analyze", "understand", "explore", "investigate", "review", "read"],
    "implementing": ["implement", "write", "create", "build", "add", "code"],
    "debugging": ["debug", "fix", "error", "bug", "issue", "problem", "broken"],
    "testing": ["test", "verify", "check", "validate", "assert", "assertion"],
    "refactoring": ["refactor", "clean", "optimize", "improve", "restructure"],
    "documenting": ["document", "explain", "describe", "write doc", "comment"],
    "planning": ["plan", "design", "architect", "break down", "outline", "structure"]
  }

  for (const [state, keywords] of Object.entries(stateKeywords)) {
    if (keywords.some(k => messageLower.includes(k))) {
      return state
    }
  }

  return "unknown"
}

/**
 * Calculate experience score for ranking
 */
function experienceScore(exp: any): number {
  let score = 0

  // Reward is most important
  score += exp.reward * 2

  // Confidence matters
  score += exp.confidence * 0.5

  // Recency (more recent is better)
  const ageDays = (Date.now() - new Date(exp.timestamp).getTime()) / (24 * 60 * 60 * 1000)
  const recencyScore = Math.exp(-ageDays / 30) // 30-day half-life
  score += recencyScore * 0.5

  return score
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "should",
    "can", "could", "may", "might", "must", "to", "of", "in", "for",
    "on", "at", "by", "with", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again"
  ])

  return words
    .filter(w => w.length > 3 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i) // Unique
}

/**
 * Convert impact level to numeric score
 */
function impactScore(impact: string): number {
  switch (impact) {
    case "critical": return 4
    case "high": return 3
    case "medium": return 2
    case "low": return 1
    default: return 1
  }
}
