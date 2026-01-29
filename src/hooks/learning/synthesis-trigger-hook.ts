/**
 * Synthesis Trigger Hook
 *
 * Triggers synthesis and FSRS updates at session end.
 * Consolidates learnings and schedules reviews.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { Hooks } from "@opencode-ai/plugin"
import type { LearningSystemContext } from "../../types/learning-context"

/**
 * Create the synthesis trigger hook
 */
export function createSynthesisTriggerHook(
  input: PluginInput,
  learningContext: LearningSystemContext
): Hooks {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine, fsrsScheduler } = learningContext

  return {
    /**
     * Trigger synthesis at session end
     */
    "session.end": async (hookInput: any, hookOutput: any) => {
      try {
        const { sessionID, messages, duration } = hookInput

        console.log(`[SynthesisTrigger] Starting synthesis for session ${sessionID}`)

        // 1. Analyze session to extract entities and relationships
        const entities = extractEntities(messages)
        const relationships = extractRelationships(messages)

        // 2. Update knowledge graph with new entities and relationships
        for (const entity of entities) {
          await knowledgeGraph.addNode(entity.id, {
            name: entity.name,
            type: entity.type,
            description: entity.description,
            importance: entity.importance || 5,
            data: entity.data || {}
          })
        }

        for (const rel of relationships) {
          await knowledgeGraph.addEdge(
            rel.from,
            rel.to,
            rel.type,
            rel.weight || 1
          )
        }

        console.log(
          `[SynthesisTrigger] Updated knowledge graph: ` +
          `${entities.length} entities, ${relationships.length} relationships`
        )

        // 3. Analyze patterns from recent experiences
        const recentExperiences = await experienceStore.getRecentExperiences(20)

        // Detect patterns
        for (const exp of recentExperiences) {
          if (exp.keywords && exp.keywords.length > 0) {
            const similarExps = await experienceStore.queryExperiences({
              keywords: exp.keywords.slice(0, 3),
              limit: 10
            })

            // If similar experiences exist, analyze for patterns
            if (similarExps.length >= 3) {
              const avgReward =
                similarExps.reduce((sum, e) => sum + e.reward, 0) / similarExps.length

              if (avgReward > 0.3 || avgReward < -0.3) {
                // Significant positive or negative pattern
                const patternName = `${exp.action} pattern (${avgReward > 0 ? 'positive' : 'negative'})`
                const existingPattern = await patternDetector.getPattern(patternName)

                if (existingPattern) {
                  // Update existing pattern
                  await patternDetector.updatePattern(patternName, {
                    frequency: existingPattern.frequency + 1,
                    examples: [...existingPattern.examples, exp.id].slice(0, 20)
                  })
                } else {
                  // Create new pattern
                  await patternDetector.addPattern({
                    name: patternName,
                    type: avgReward > 0 ? "positive" : "negative",
                    trigger: { tool: exp.action },
                    consequence: avgReward > 0 ? "Success" : "Failure",
                    suggestedAction: avgReward > 0 ? "Use this approach" : "Avoid this approach",
                    impact: Math.abs(avgReward) > 0.6 ? "high" : "medium",
                    confidence: 0.7,
                    frequency: 1,
                    status: "active",
                    examples: [exp.id]
                  })
                }
              }
            }
          }
        }

        console.log("[SynthesisTrigger] Pattern detection complete")

        // 4. Update FSRS scheduler for experiences
        if (fsrsScheduler) {
          const sessionExperiences = recentExperiences.filter(
            exp => exp.metadata?.sessionId === sessionID
          )

          for (const exp of sessionExperiences) {
            const recallScore = exp.reward > 0 ? 4 : 2 // High reward = easy recall

            await fsrsScheduler.updateReviewSchedule(
              exp.id,
              recallScore,
              { lastReviewedAt: Date.now() }
            )
          }

          console.log(
            `[SynthesisTrigger] Updated FSRS for ${sessionExperiences.length} experiences`
          )
        }

        // 5. Flush experience store buffer
        await experienceStore.flushBuffer()

        console.log(`[SynthesisTrigger] Synthesis complete for session ${sessionID}`)
      } catch (error) {
        // Don't fail the hook if synthesis fails
        console.error("[SynthesisTrigger] Error during synthesis:", error)
      }
    }
  }
}

/**
 * Extract entities from session messages
 */
function extractEntities(messages: any[]): Array<{
  id: string
  name: string
  type: string
  description?: string
  importance?: number
  data?: any
}> {
  const entities: any[] = []

  for (const msg of messages) {
    const content = msg.content || ""

    // Extract file paths
    const filePaths = content.match(/[\w-]+\.(ts|js|tsx|jsx|py|go|rs|java|json|md)/g) || []
    for (const path of filePaths) {
      const id = `file:${path}`
      if (!entities.find(e => e.id === id)) {
        entities.push({
          id,
          name: path,
          type: "file",
          description: `File: ${path}`,
          importance: 5
        })
      }
    }

    // Extract function/method names
    const functions = content.match(/\b(\w+)\s*\(/g) || []
    for (const fn of functions) {
      const name = fn.replace(/\s*\(/, "")
      if (name.length > 2 && name.length < 30) {
        const id = `func:${name}`
        if (!entities.find(e => e.id === id)) {
          entities.push({
            id,
            name,
            type: "function",
            description: `Function: ${name}`,
            importance: 4
          })
        }
      }
    }

    // Extract tool names
    if (msg.toolName) {
      const id = `tool:${msg.toolName}`
      if (!entities.find(e => e.id === id)) {
        entities.push({
          id,
          name: msg.toolName,
          type: "tool",
          description: `Tool: ${msg.toolName}`,
          importance: 6
        })
      }
    }
  }

  return entities
}

/**
 * Extract relationships from session messages
 */
function extractRelationships(messages: any[]): Array<{
  from: string
  to: string
  type: string
  weight?: number
}> {
  const relationships: any[] = []

  // Simple heuristic: entities mentioned together are related
  const mentions = new Map<string, Set<string>>()

  for (const msg of messages) {
    const content = msg.content || ""
    const entitiesInMessage = new Set<string>()

    // Extract file paths
    const filePaths = content.match(/[\w-]+\.(ts|js|tsx|jsx|py|go|rs|java|json|md)/g) || []
    filePaths.forEach(p => entitiesInMessage.add(`file:${p}`))

    // Extract function names
    const functions = content.match(/\b(\w+)\s*\(/g) || []
    functions.forEach(f => {
      const name = f.replace(/\s*\(/, "")
      if (name.length > 2 && name.length < 30) {
        entitiesInMessage.add(`func:${name}`)
      }
    })

    // Record co-mentions
    for (const e1 of entitiesInMessage) {
      for (const e2 of entitiesInMessage) {
        if (e1 !== e2) {
          if (!mentions.has(e1)) {
            mentions.set(e1, new Set())
          }
          mentions.get(e1)!.add(e2)
        }
      }
    }
  }

  // Convert mentions to relationships
  for (const [from, toSet] of mentions.entries()) {
    for (const to of toSet) {
      relationships.push({
        from,
        to,
        type: "relatedTo",
        weight: 1
      })
    }
  }

  return relationships
}
