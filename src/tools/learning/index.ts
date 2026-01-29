/**
 * Learning System Tools
 *
 * OpenCode tools for interacting with the unified AI memory system.
 * Provides direct access to experience store, knowledge graph, pattern detection,
 * state machines, and learning statistics.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { LearningToolsConfig } from "../../types/learning-context"

// Import individual tools
import { createExperienceTool } from "./learning-experience"
import { createKnowledgeTool } from "./learning-knowledge"
import { createPatternTool } from "./learning-pattern"
import { createFsmTool } from "./learning-fsm"
import { createStatsTool } from "./learning-stats"

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
    stateMachine,
    fsrsScheduler
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
      stateMachine,
      fsrsScheduler
    })
  }
}
