/**
 * Learning System Tools
 *
 * OpenCode tools for interacting with the unified AI memory system.
 * Provides direct access to experience store, knowledge graph, pattern detection,
 * state machines, and learning statistics.
 */

import type { ExperienceStore } from "../../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { StateMachineEngine } from "../../features/learning/state-machine"

import { createExperienceTool } from "./learning-experience"
import { createKnowledgeTool } from "./learning-knowledge"
import { createPatternTool } from "./learning-pattern"
import { createFsmTool } from "./learning-fsm"
import { createStatsTool } from "./learning-stats"

interface LearningToolsConfig {
  experienceStore: ExperienceStore
  knowledgeGraph: KnowledgeGraphStore
  patternDetector: PatternDetector
  stateMachine: StateMachineEngine
}

/**
 * Initialize all learning tools
 *
 * Returns an object containing all learning tool implementations.
 */
export function initializeLearningTools(config: LearningToolsConfig) {
  const {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine
  } = config

  return {
    experienceTool: createExperienceTool(experienceStore),
    knowledgeTool: createKnowledgeTool(knowledgeGraph),
    patternTool: createPatternTool(patternDetector),
    fsmTool: createFsmTool(stateMachine),
    statsTool: createStatsTool({
      experienceStore,
      knowledgeGraph,
      patternDetector,
      stateMachine
    })
  }
}
