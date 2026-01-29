/**
 * Learning System Context
 *
 * Shared context object passed to learning hooks and tools.
 * Contains references to all four layers of the unified AI memory system.
 */

import type { ExperienceStore } from "../features/learning/experience-store"
import type { KnowledgeGraphStore } from "../features/learning/knowledge-graph"
import type { PatternDetector } from "../features/learning/pattern-detection"
import type { StateMachineEngine } from "../features/learning/state-machine"
import type { FSRScheduler } from "../features/learning/fsrs-scheduler"

/**
 * Learning System Context
 *
 * Aggregates all learning system components for easy access.
 * This context is passed to hooks and tools that need access to learning data.
 */
export interface LearningSystemContext {
  /** Layer 1: Experience Store - Episodic memory with rewards */
  experienceStore: ExperienceStore

  /** Layer 2: Knowledge Graph - Semantic memory with entities */
  knowledgeGraph: KnowledgeGraphStore

  /** Layer 3: Pattern Detector - Behavioral memory */
  patternDetector: PatternDetector

  /** Layer 4: State Machine - Behavioral control */
  stateMachine: StateMachineEngine

  /** FSRS Scheduler - Review scheduling (optional) */
  fsrsScheduler?: FSRScheduler
}

/**
 * Learning Hooks Configuration
 *
 * Configuration for each learning hook.
 */
export interface LearningHooksConfig {
  /** Experience Recorder Hook Configuration */
  experienceRecorder: {
    enabled: boolean
  }

  /** Context Injector Hook Configuration */
  contextInjector: {
    enabled: boolean
  }

  /** Synthesis Trigger Hook Configuration */
  synthesisTrigger: {
    enabled: boolean
  }
}

/**
 * Learning Tool Configuration
 *
 * Configuration passed to learning tools.
 */
export interface LearningToolsConfig {
  experienceStore: ExperienceStore
  knowledgeGraph: KnowledgeGraphStore
  patternDetector: PatternDetector
  stateMachine: StateMachineEngine
  fsrsScheduler?: FSRScheduler
}
