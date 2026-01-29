/**
 * Context Injector Hook
 *
 * Injects relevant context from the learning system at session start.
 * Provides the AI with past experiences, knowledge, and patterns.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"

function formatContextInjection(
  experiences: any[],
  knowledgeNodes: any[],
  patterns: any[],
  currentState?: string
): string {
  const parts: string[] = []

  parts.push("# Learning System Context")
  parts.push("")

  if (currentState) {
    parts.push(`## Current State: ${currentState}`)
    parts.push("")
  }

  if (experiences.length > 0) {
    parts.push("## Relevant Past Experiences")
    parts.push("")
    experiences.slice(0, 3).forEach((exp, i) => {
      const tool = exp.action
      const reward = exp.reward > 0 ? "✓" : exp.reward < 0 ? "✗" : "○"
      parts.push(`${i + 1}. ${reward} ${tool} (confidence: ${exp.confidence.toFixed(2)})`)
      if (exp.metadata?.keywords?.length > 0) {
        parts.push(`   Keywords: ${exp.metadata.keywords.join(", ")}`)
      }
    })
    parts.push("")
  }

  if (knowledgeNodes.length > 0) {
    parts.push("## Relevant Knowledge")
    parts.push("")
    knowledgeNodes.slice(0, 3).forEach((node, i) => {
      parts.push(`${i + 1}. ${node.type}: ${node.id}`)
      if (node.importance > 7) {
        parts.push(`   [High Importance: ${node.importance}/10]`)
      }
    })
    parts.push("")
  }

  if (patterns.length > 0) {
    parts.push("## Relevant Patterns")
    parts.push("")
    patterns.slice(0, 3).forEach((pattern, i) => {
      const type = pattern.type === "positive" ? "✓ Win" : "✗ Loss"
      parts.push(`${i + 1}. ${type}: ${pattern.category}`)
      parts.push(`   Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence.toFixed(2)}`)
      if (pattern.suggestedActions?.length > 0) {
        parts.push(`   Suggested: ${pattern.suggestedActions[0]}`)
      }
    })
    parts.push("")
  }

  return parts.join("\n")
}

function extractKeywordsFromPrompt(prompt: string): string[] {
  const words = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && w.length < 30)

  const stopWords = [
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
    "was", "one", "our", "out", "has", "have", "been", "will", "with", "this",
    "that", "from", "they", "would", "there", "their", "what", "which", "when",
    "make", "like", "into", "year", "your", "just", "over", "also", "such",
    "because", "these", "first", "being", "most", "some", "those", "through"
  ]

  return words.filter(w => !stopWords.includes(w)).slice(0, 10)
}

export function createContextInjectorHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine } = learningContext

  return {
    "chat.message": async (hookInput: any, hookOutput: any) => {
      try {
        const { sessionID, parts } = hookInput

        const messageText = parts?.[0]?.text || ""
        if (!messageText || messageText.length < 10) {
          return
        }

        console.log(`[ContextInjector] Injecting context for session ${sessionID}`)

        const keywords = extractKeywordsFromPrompt(messageText)

        const allExperiences = await experienceStore.loadExperiences()
        const experiences = allExperiences
          .filter(exp => {
            if (keywords.length === 0) return true
            return exp.metadata?.keywords &&
              (exp.metadata.keywords as string[]).some(kw => keywords.includes(kw.toLowerCase()))
          })
          .slice(0, 5)

        const knowledgeResult = await knowledgeGraph.getRelevantContext(messageText)
        const knowledgeNodes = knowledgeResult.nodes.slice(0, 5)

        const allPatterns = patternDetector.getAllPatterns()
        const patterns = allPatterns
          .filter(p => {
            if (keywords.length === 0) return true
            return p.triggers?.some((t: string) => keywords.includes(t.toLowerCase()))
          })
          .slice(0, 5)

        const currentState = stateMachine.getCurrentState()

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

          hookOutput.parts = hookOutput.parts || []
          hookOutput.parts.push({
            type: "text",
            text: contextMessage,
            id: `context-${Date.now()}`
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
        console.error("[ContextInjector] Error injecting context:", error)
      }
    }
  }
}
