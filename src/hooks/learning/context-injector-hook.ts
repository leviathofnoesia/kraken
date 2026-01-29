/**
 * Context Injector Hook
 *
 * Injects relevant context from the learning system at session start.
 * Provides the AI with past experiences, knowledge, and patterns.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"

/**
 * Format context injection message
 *
 * Creates a human-readable message containing relevant learning data.
 */
function formatContextInjection(
  experiences: any[],
  knowledgeNodes: any[],
  patterns: any[],
  currentState?: string
): string {
  const parts: string[] = []

  parts.push("# Learning System Context")
  parts.push("")

  // Add current state if available
  if (currentState) {
    parts.push(`## Current State: ${currentState}`)
    parts.push("")
  }

  // Add relevant experiences
  if (experiences.length > 0) {
    parts.push("## Relevant Past Experiences")
    parts.push("")
    experiences.slice(0, 3).forEach((exp, i) => {
      const tool = exp.action
      const reward = exp.reward > 0 ? "✓" : exp.reward < 0 ? "✗" : "○"
      parts.push(`${i + 1}. ${reward} ${tool} (confidence: ${exp.confidence.toFixed(2)})`)
      if (exp.context?.errorMessage) {
        parts.push(`   Error: ${exp.context.errorMessage}`)
      }
    })
    parts.push("")
  }

  // Add relevant knowledge
  if (knowledgeNodes.length > 0) {
    parts.push("## Relevant Knowledge")
    parts.push("")
    knowledgeNodes.slice(0, 3).forEach((node, i) => {
      parts.push(`${i + 1}. ${node.name || node.id}`)
      if (node.description) {
        parts.push(`   ${node.description}`)
      }
      if (node.importance > 7) {
        parts.push(`   [High Importance: ${node.importance}/10]`)
      }
    })
    parts.push("")
  }

  // Add relevant patterns
  if (patterns.length > 0) {
    parts.push("## Relevant Patterns")
    parts.push("")
    patterns.slice(0, 3).forEach((pattern, i) => {
      const type = pattern.type === "positive" ? "✓ Win" : "✗ Loss"
      parts.push(`${i + 1}. ${type}: ${pattern.name}`)
      parts.push(`   Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence.toFixed(2)}`)
      if (pattern.suggestedAction) {
        parts.push(`   Suggested: ${pattern.suggestedAction}`)
      }
    })
    parts.push("")
  }

  return parts.join("\n")
}

/**
 * Extract keywords from session prompt
 *
 * Gets keywords from the initial user prompt for context search.
 */
function extractKeywordsFromPrompt(prompt: string): string[] {
  const words = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && w.length < 30)

  // Remove common words
  const stopWords = [
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
    "was", "one", "our", "out", "has", "have", "been", "will", "with", "this",
    "that", "from", "they", "would", "there", "their", "what", "which", "when",
    "make", "like", "into", "year", "your", "just", "over", "also", "such",
    "because", "these", "first", "being", "most", "some", "those", "through"
  ]

  return words.filter(w => !stopWords.includes(w)).slice(0, 10)
}

/**
 * Create the context injector hook
 */
export function createContextInjectorHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine } = learningContext

  return {
    /**
     * Inject relevant context at session start
     */
    "session.start": async (hookInput: any, hookOutput: any) => {
      try {
        const { prompt, sessionID } = hookInput

        console.log(`[ContextInjector] Injecting context for session ${sessionID}`)

        // Extract keywords from prompt
        const keywords = extractKeywordsFromPrompt(prompt || "")

        // Query relevant experiences
        const experiences = await experienceStore.queryExperiences({
          keywords,
          state: { tool: undefined }, // Match all tools
          limit: 5
        })

        // Query relevant knowledge
        const knowledgeNodes = await knowledgeGraph.searchNodes({
          keywords,
          limit: 5
        })

        // Query relevant patterns
        const patterns = await patternDetector.getPatterns({
          keywords,
          limit: 5
        })

        // Get current state (if available)
        const defaultMachine = stateMachine.getMachine("default")
        const currentState = defaultMachine?.currentState

        // Format and inject context
        if (
          experiences.length > 0 ||
          knowledgeNodes.length > 0 ||
          patterns.length > 0 ||
          currentState
        ) {
          const contextMessage = formatContextInjection(
            experiences,
            knowledgeNodes,
            patterns,
            currentState
          )

          // Inject context as a system message
          hookOutput.messages = hookOutput.messages || []
          hookOutput.messages.unshift({
            role: "system",
            content: contextMessage
          })

          console.log(
            `[ContextInjector] Injected ${experiences.length} experiences, ` +
            `${knowledgeNodes.length} knowledge nodes, ` +
            `${patterns.length} patterns`
          )
        } else {
          console.log("[ContextInjector] No relevant context to inject")
        }
      } catch (error) {
        // Don't fail the hook if context injection fails
        console.error("[ContextInjector] Error injecting context:", error)
      }
    }
  }
}
