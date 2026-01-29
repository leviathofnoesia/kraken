/**
 * Synthesis Trigger Hook
 *
 * Triggers synthesis and review generation when session compacts (approximates session end).
 * Updates FSRS schedule based on recall performance.
 *
 * Triggers on `experimental.session.compacting`.
 */

import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { ExperienceStore } from "../../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { StateMachineEngine } from "../../features/learning/state-machine"
import type { FSRScheduler } from "../../features/learning/fsrs-scheduler"
import type { LearningSystemContext } from "../../types/learning-context"

export interface SynthesisTriggerHookOptions {
  enabled?: boolean
  autoSynthesis?: boolean
  minSessionLength?: number // Minimum number of messages to trigger synthesis
  updateFSRS?: boolean
}

/**
 * Create the synthesis trigger hook
 */
export function createSynthesisTriggerHook(
  input: PluginInput,
  context: LearningSystemContext,
  options?: SynthesisTriggerHookOptions
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
    stateMachine,
    fsrsScheduler
  } = context

  const minSessionLength = options?.minSessionLength || 5

  return {
    "experimental.session.compacting": async (hookInput: any) => {
      try {
        const sessionID = hookInput.sessionID
        const messageCount = hookInput.messageCount || 0

        console.log(`[SynthesisTrigger] Session compacting: ${sessionID} (${messageCount} messages)`)

        // Skip if session was too short
        if (messageCount < minSessionLength) {
          console.log(`[SynthesisTrigger] Session too short (${messageCount} < ${minSessionLength}), skipping synthesis`)
          return
        }

        // Run synthesis if enabled
        if (options?.autoSynthesis !== false && learningConfig.fsrs?.enabled !== false) {
          const synthesisResult = await runSynthesis(
            sessionID,
            { experienceStore, knowledgeGraph, patternDetector, stateMachine }
          )

          console.log(
            `[SynthesisTrigger] Synthesis complete: ` +
            `${synthesisResult.newInsights} insights, ` +
            `${synthesisResult.patternsUpdated} patterns updated`
          )

          // Update FSRS schedule if enabled
          if (options?.updateFSRS !== false && fsrsScheduler) {
            await updateFsrSchedule(fsrsScheduler, synthesisResult)

            console.log(`[SynthesisTrigger] FSRS schedule updated`)
          }
        }

        // Flush any buffered experiences
        await experienceStore.flushBuffer()

        console.log(`[SynthesisTrigger] Cleanup complete for session ${sessionID}`)

      } catch (error: any) {
        console.error(`[SynthesisTrigger] Error during synthesis:`, error)
        // Don't throw - hooks shouldn't break the system
      }
    },
  }
}

/**
 * Run synthesis on session data
 */
async function runSynthesis(
  sessionID: string,
  systems: {
    experienceStore: ExperienceStore
    knowledgeGraph: KnowledgeGraphStore
    patternDetector: PatternDetector
    stateMachine: StateMachineEngine
  }
): Promise<{
  newInsights: number
  patternsUpdated: number
  knowledgeNodesCreated: number
  stateTransitions: number
  reviewedItems: Array<{ id: string; recalled: boolean }>
}> {
  const {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine
  } = systems

  let newInsights = 0
  let patternsUpdated = 0
  let knowledgeNodesCreated = 0
  let stateTransitions = 0
  const reviewedItems: Array<{ id: string; recalled: boolean }> = []

  // 1. Analyze recent experiences for patterns
  console.log(`[Synthesis] Analyzing experiences for patterns...`)
  const experiences = await experienceStore.loadExperiences()

  if (experiences.length > 0) {
    const patternResult = await patternDetector.analyzeExperiences(
      experiences.slice(-100) // Analyze last 100 experiences
    )

    patternsUpdated = patternResult.patterns.length

    if (patternResult.patterns.length > 0) {
      console.log(`[Synthesis] Detected ${patternsUpdated} patterns`)

      // Create knowledge nodes for new patterns
      for (const pattern of patternResult.patterns) {
        const existingNode = knowledgeGraph.getNode(`pattern:${pattern.id}`)

        if (!existingNode) {
          await knowledgeGraph.addNode(
            `pattern:${pattern.id}`,
            "pattern",
            {
              description: pattern.description,
              type: pattern.type,
              category: pattern.category,
              confidence: pattern.confidence,
              impact: pattern.impact,
              suggestedActions: pattern.suggestedActions
            },
            "inference"
          )

          knowledgeNodesCreated++
          newInsights++
        }
      }
    }
  }

  // 2. Extract entities from experiences and create knowledge nodes
  console.log(`[Synthesis] Extracting entities from experiences...`)

  for (const exp of experiences.slice(-50)) { // Last 50 experiences
    const entities = extractEntitiesFromExperience(exp)

    for (const entity of entities) {
      const existingNode = knowledgeGraph.getNode(entity.id)

      if (!existingNode) {
        await knowledgeGraph.addNode(
          entity.id,
          entity.type,
          entity.data,
          "experience"
        )

        knowledgeNodesCreated++

        // Add relationships
        if (entity.relations) {
          for (const relation of entity.relations) {
            await knowledgeGraph.addEdge(
              entity.id,
              relation.to,
              relation.type,
              relation.weight
            )
          }
        }
      }
    }
  }

  // 3. Check for state machine transitions
  console.log(`[Synthesis] Checking state transitions...`)

  const machine = stateMachine.getMachine("default")
  if (machine) {
    const history = machine.history.slice(-10) // Last 10 transitions

    // Analyze transitions for insights
    for (const transition of history) {
      if (transition.reward !== undefined && transition.reward > 0.5) {
        // Successful transition - could be a pattern
        const transitionKey = `${transition.fromState}->${transition.toState}`

        // Mark as reviewed (assuming successful transitions are "recalled")
        reviewedItems.push({
          id: `transition:${transitionKey}`,
          recalled: true
        })

        stateTransitions++
        newInsights++
      }
    }
  }

  // 4. Review knowledge nodes for potential FSRS updates
  console.log(`[Synthesis] Reviewing knowledge nodes...`)

  const recentlyAccessedNodes = await getRecentlyAccessedNodes(knowledgeGraph, 20)

  for (const node of recentlyAccessedNodes) {
    // Check if node was referenced in recent experiences
    const wasReferenced = experiences.some(exp =>
      exp.context.prompt?.toLowerCase().includes(node.id.toLowerCase()) ||
      exp.metadata?.tags?.includes(node.id)
    )

    reviewedItems.push({
      id: `node:${node.id}`,
      recalled: wasReferenced
    })

    if (wasReferenced) {
      newInsights++
    }
  }

  console.log(`[Synthesis] Complete: ${newInsights} insights generated`)

  return {
    newInsights,
    patternsUpdated,
    knowledgeNodesCreated,
    stateTransitions,
    reviewedItems
  }
}

/**
 * Update FSRS schedule based on recall performance
 */
async function updateFsrSchedule(
  fsrsScheduler: FSRScheduler,
  synthesisResult: {
    reviewedItems: Array<{ id: string; recalled: boolean }>
  }
): Promise<void> {
  if (!fsrsScheduler) {
    return
  }

  console.log(`[FSRS] Updating schedule for ${synthesisResult.reviewedItems.length} items...`)

  for (const item of synthesisResult.reviewedItems) {
    try {
      // Update ease factor based on recall performance
      await fsrsScheduler.updateEase(item.id, item.recalled)
    } catch (error) {
      console.error(`[FSRS] Failed to update item ${item.id}:`, error)
    }
  }
}

/**
 * Extract entities from an experience
 */
function extractEntitiesFromExperience(exp: any): Array<{
  id: string
  type: any
  data: any
  relations?: Array<{ to: string; type: string; weight: number }>
}> {
  const entities: Array<{
    id: string
    type: any
    data: any
    relations?: Array<{ to: string; type: string; weight: number }>
  }> = []

  // Extract tool usage as skill entity
  if (exp.context.tool) {
    entities.push({
      id: `tool:${exp.context.tool}`,
      type: "skill",
      data: {
        name: exp.context.tool,
        lastUsed: exp.timestamp,
        successRate: exp.outcome === "success" ? 1 : 0
      },
      relations: [
        { to: `state:${exp.state}`, type: "relates_to", weight: 1 }
      ]
    })
  }

  // Extract state as concept entity
  entities.push({
    id: `state:${exp.state}`,
    type: "concept",
    data: {
      name: exp.state,
      lastEncountered: exp.timestamp
    }
  })

  // Extract mistakes
  if (exp.outcome === "failure") {
    const mistakeId = `mistake:${exp.action}-${exp.state}-${Date.now()}`

    entities.push({
      id: mistakeId,
      type: "mistake",
      data: {
        action: exp.action,
        state: exp.state,
        timestamp: exp.timestamp,
        lesson: "Avoid using " + exp.action + " in " + exp.state + " context"
      },
      relations: [
        { to: `tool:${exp.context.tool}`, type: "causes", weight: 1 }
      ]
    })
  }

  // Extract patterns from tags
  if (exp.metadata?.tags) {
    for (const tag of exp.metadata.tags) {
      entities.push({
        id: `tag:${tag}`,
        type: "concept",
        data: {
          name: tag,
          count: 1
        }
      })
    }
  }

  return entities
}

/**
 * Get recently accessed knowledge nodes
 */
async function getRecentlyAccessedNodes(
  knowledgeGraph: KnowledgeGraphStore,
  limit: number
): Promise<any[]> {
  // For now, just return nodes sorted by accessCount
  // In a real implementation, we'd have a "recently accessed" index

  const allNodes = knowledgeGraph.getAllNodes()

  // Sort by access count and importance
  const sorted = allNodes.sort((a, b) => {
    const scoreA = a.accessCount * 10 + a.importance
    const scoreB = b.accessCount * 10 + b.importance
    return scoreB - scoreA
  })

  return sorted.slice(0, limit)
}
