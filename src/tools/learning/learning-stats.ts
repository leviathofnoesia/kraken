/**
 * Learning Stats Tool
 *
 * Tool for getting comprehensive statistics across all learning system layers.
 * Provides insights into experience store, knowledge graph, patterns, and state machines.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { ExperienceStore } from "../../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { StateMachineEngine } from "../../features/learning/state-machine"
import type { FSRScheduler } from "../../features/learning/fsrs-scheduler"

interface StatsConfig {
  experienceStore: ExperienceStore
  knowledgeGraph: KnowledgeGraphStore
  patternDetector: PatternDetector
  stateMachine: StateMachineEngine
  fsrsScheduler?: FSRScheduler
}

/**
 * Create learning-stats tool
 */
export function createStatsTool(config: StatsConfig) {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine, fsrsScheduler } = config

  return tool({
    description:
      "Get comprehensive statistics across the learning system. " +
      "Shows experience metrics, knowledge graph stats, patterns, state machine status, and review schedules.",
    args: {
      section: z.enum(["all", "experience", "knowledge", "patterns", "fsm", "fsrs"]).describe(
        "Which section to show: 'all' for everything, or specific section"
      )
    },
    async execute(args) {
      const { section } = args

      try {
        const result: any = {
          success: true,
          timestamp: Date.now(),
          sections: []
        }

        // Experience Store Statistics
        if (section === "all" || section === "experience") {
          const expStats = await experienceStore.getStatistics()

          result.sections.push({
            name: "Experience Store",
            stats: {
              totalExperiences: expStats.totalExperiences,
              averageReward: Number(expStats.averageReward.toFixed(3)),
              successRate: Number((expStats.successRate * 100).toFixed(1)) + "%",
              recentExperiences: expStats.recentExperiences?.length || 0,
              bufferSize: expStats.bufferSize || 0,
              lastCompaction: expStats.lastCompaction ? new Date(expStats.lastCompaction).toISOString() : "Never"
            }
          })
        }

        // Knowledge Graph Statistics
        if (section === "all" || section === "knowledge") {
          const nodes = await knowledgeGraph.listNodes({ limit: 100000 })
          const byType = new Map<string, number>()
          const highImportance = nodes.filter(n => n.importance >= 7).length
          const totalImportance = nodes.reduce((sum, n) => sum + n.importance, 0)

          nodes.forEach(node => {
            byType.set(node.type, (byType.get(node.type) || 0) + 1)
          })

          result.sections.push({
            name: "Knowledge Graph",
            stats: {
              totalNodes: nodes.length,
              totalEdges: nodes.reduce((sum, n) => sum + (n.edges?.length || 0), 0),
              highImportanceNodes: highImportance,
              averageImportance: nodes.length > 0 ? Number((totalImportance / nodes.length).toFixed(2)) : 0,
              topTypes: Array.from(byType.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => `${type}: ${count}`)
            }
          })
        }

        // Pattern Detection Statistics
        if (section === "all" || section === "patterns") {
          const patterns = await patternDetector.getPatterns({ limit: 1000 })
          const positive = patterns.filter(p => p.type === "positive").length
          const negative = patterns.filter(p => p.type === "negative").length
          const active = patterns.filter(p => p.status === "active").length
          const highImpact = patterns.filter(p => p.impact === "high" || p.impact === "critical").length
          const avgConfidence = patterns.length > 0
            ? Number((patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length).toFixed(3))
            : 0

          result.sections.push({
            name: "Pattern Detection",
            stats: {
              totalPatterns: patterns.length,
              positivePatterns: positive,
              negativePatterns: negative,
              activePatterns: active,
              highImpactPatterns: highImpact,
              averageConfidence: avgConfidence,
              mostFrequent: patterns
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 3)
                .map(p => ({ name: p.name, frequency: p.frequency }))
            }
          })
        }

        // State Machine Statistics
        if (section === "all" || section === "fsm") {
          const machines = stateMachine.listMachines()
          const totalStates = machines.reduce((sum, m) => sum + Object.keys(m.states).length, 0)
          const totalTransitions = machines.reduce((sum, m) => {
            return sum + Object.values(m.states).reduce((s, state) => s + state.transitions.length, 0)
          }, 0)

          result.sections.push({
            name: "State Machines",
            stats: {
              totalMachines: machines.length,
              totalStates,
              totalTransitions,
              machines: machines.map(m => ({
                id: m.id,
                description: m.description,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
            }
          })
        }

        // FSRS Statistics
        if (fsrsScheduler && (section === "all" || section === "fsrs")) {
          // Note: FSRS doesn't have a getStatistics method, so we'll provide basic info
          result.sections.push({
            name: "FSRS Scheduler",
            stats: {
              enabled: true,
              description: "Spaced repetition scheduling for experience review",
              // Additional stats would need to be implemented in FSRScheduler
            }
          })
        }

        return JSON.stringify(result, null, 2)
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2)
      }
    }
  })
}
