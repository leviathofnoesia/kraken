/**
 * Unified Learning System Types
 *
 * Shared context types used across all learning hooks and tools.
 */

import type { ExperienceStore } from "../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../features/learning/knowledge-graph"
import type { PatternDetector } from "../features/learning/pattern-detection"
import type { StateMachineEngine } from "../features/learning/state-machine"
import type { FSRScheduler } from "../features/learning/fsrs-scheduler"

/**
 * Unified context for all learning system components
 */
export interface LearningSystemContext {
  experienceStore: ExperienceStore
  knowledgeGraph: KnowledgeGraphStore
  patternDetector: PatternDetector
  stateMachine: StateMachineEngine
  fsrsScheduler?: FSRScheduler | undefined
}
