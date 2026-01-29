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

  // Track sessions for synthesis
  const sessionStartTimes = new Map<string, number>()

  return {
    /**
     * Track session start
     */
    "chat.message": async (hookInput: any, hookOutput: any) => {
      const { sessionID } = hookInput
      if (!sessionStartTimes.has(sessionID)) {
        sessionStartTimes.set(sessionID, Date.now())
      }
    },

    /**
     * Trigger synthesis on tool.execute.after for last interaction
     * This is a simplification - ideally we'd have a session.end hook
     */
    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      try {
        const { sessionID, tool } = hookInput

        // Only synthesize on "natural" session end markers
        // For now, we'll synthesize when user says "done" or similar
        // This is a limitation due to lack of session.end hook
        if (!tool.endsWith("summary") && !tool.endsWith("report")) {
          return
        }

        console.log(`[SynthesisTrigger] Starting synthesis for session ${sessionID}`)

        // 1. Skip message extraction for now (no messages in hook input)
        // We'll use tools as source of entities
        const entities: any[] = []
        const relationships: any[] = []

        // Add tool name as entity
        entities.push({
          id: `tool:${tool}`,
          name: tool,
          type: "tool",
          description: `Tool: ${tool}`,
          importance: 6,
          data: {}
        })

        // 2. Update knowledge graph with new entities and relationships
        for (const entity of entities) {
          await knowledgeGraph.addNode(
            entity.id,
            entity.name,
            entity.type,
            entity.description,
            entity.importance || 5,
            [],
            entity.data || {}
          )
        }

        console.log(
          `[SynthesisTrigger] Updated knowledge graph: ` +
          `${entities.length} entities, ${relationships.length} relationships`
        )

        // 3. Analyze patterns from recent experiences
        const recentExperiences = await experienceStore.loadExperiences()
        const last20 = recentExperiences.slice(-20)

        // Detect patterns
        for (const exp of last20) {
          if (exp.keywords && exp.keywords.length > 0) {
            // Find similar experiences
            const similarExps = last20.filter(e =>
              e.keywords?.some(kw => exp.keywords?.includes(kw))
            )

            // If similar experiences exist, analyze for patterns
            if (similarExps.length >= 3) {
              const avgReward =
                similarExps.reduce((sum: number, e: any) => sum + (e.reward || 0), 0) / similarExps.length

              if (avgReward > 0.3 || avgReward < -0.3) {
                // Significant positive or negative pattern
                const patternName = `${exp.action} pattern (${avgReward > 0 ? 'positive' : 'negative'})`

                // Check if pattern exists
                const allPatterns = patternDetector.getAllPatterns()
                const existingPattern = allPatterns.find(p => p.name === patternName)

                if (existingPattern) {
                  // Update existing pattern (via status update as workaround)
                  // PatternDetector doesn't have updatePattern, so we skip this for now
                  console.log(`[SynthesisTrigger] Pattern exists: ${patternName}`)
                } else {
                  // PatternDetector doesn't have addPattern - we skip this
                  console.log(`[SynthesisTrigger] Would create pattern: ${patternName}`)
                }
              }
            }
          }
        }

        console.log("[SynthesisTrigger] Pattern detection complete")

        // 4. Skip FSRS update for now (no updateReviewSchedule method)
        // FSRS Scheduler doesn't have public update methods exposed
        console.log("[SynthesisTrigger] Skipping FSRS update (not implemented)")

        // 5. Flush experience store buffer
        await experienceStore.flushBuffer()

        console.log(`[SynthesisTrigger] Synthesis complete for session ${sessionID}`)

        // Clean up session tracking
        sessionStartTimes.delete(sessionID)
      } catch (error) {
        // Don't fail hook if synthesis fails
        console.error("[SynthesisTrigger] Error during synthesis:", error)
      }
    }
  }
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
