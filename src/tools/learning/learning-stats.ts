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

interface StatsConfig {
  experienceStore: ExperienceStore
  knowledgeGraph: KnowledgeGraphStore
  patternDetector: PatternDetector
  stateMachine: StateMachineEngine
}

export function createStatsTool(config: StatsConfig) {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine } = config

  return tool({
    description:
      "Get comprehensive statistics across the learning system. " +
      "Shows experience metrics, knowledge graph stats, patterns, and state machine status.",
    args: {
      section: z.enum(["all", "experience", "knowledge", "patterns", "fsm"]).describe(
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

        if (section === "all" || section === "experience") {
          const allExperiences = await experienceStore.loadExperiences()
          const total = allExperiences.length
          const rewards = allExperiences.map(e => e.reward)
          const avgReward = rewards.length > 0 ? rewards.reduce((a, b) => a + b, 0) / rewards.length : 0
          const successRate = total > 0 ? allExperiences.filter(e => e.outcome === "success").length / total : 0

          result.sections.push({
            name: "Experience Store",
            stats: {
              totalExperiences: total,
              averageReward: Number(avgReward.toFixed(3)),
              successRate: Number((successRate * 100).toFixed(1)) + "%"
            }
          })
        }

        if (section === "all" || section === "knowledge") {
          const nodes = await knowledgeGraph.getImportantNodes(100000)
          const byType = new Map<string, number>()
          const highImportance = nodes.filter((n: any) => n.importance >= 7).length
          const totalImportance = nodes.reduce((sum: number, n: any) => sum + n.importance, 0)

          nodes.forEach((node: any) => {
            byType.set(node.type, (byType.get(node.type) || 0) + 1)
          })

          result.sections.push({
            name: "Knowledge Graph",
            stats: {
              totalNodes: nodes.length,
              totalEdges: 0,
              highImportanceNodes: highImportance,
              averageImportance: nodes.length > 0 ? Number((totalImportance / nodes.length).toFixed(2)) : 0,
              topTypes: Array.from(byType.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => `${type}: ${count}`)
            }
          })
        }

        if (section === "all" || section === "patterns") {
          const patterns = patternDetector.getAllPatterns()
          const positive = patterns.filter(p => p.type === "positive").length
          const negative = patterns.filter(p => p.type === "negative").length
          const active = patterns.filter(p => p.status === "active").length
          const highImpact = patterns.filter(p => p.impact === "high" || p.impact === "critical").length
          const avgConfidence = patterns.length > 0
            ? Number((patterns.reduce((sum: number, p: any) => sum + p.confidence, 0) / patterns.length).toFixed(3))
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
                .sort((a: any, b: any) => b.frequency - a.frequency)
                .slice(0, 3)
                .map((p: any) => ({ name: p.category, frequency: p.frequency }))
            }
          })
        }

        if (section === "all" || section === "fsm") {
          const machines = stateMachine.getAllMachines()
          const totalStates = machines.reduce((sum: number, m: any) => sum + Object.keys(m.states).length, 0)

          result.sections.push({
            name: "State Machines",
            stats: {
              totalMachines: machines.length,
              totalStates,
              machines: machines.map((m: any) => ({
                id: m.id,
                description: m.name,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
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
