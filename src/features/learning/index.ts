/**
 * Learning System - Unified AI Memory
 *
 * Four-layer architecture for self-improving AI:
 * - Layer 1: Experience Store (episodic memory with rewards)
 * - Layer 2: Knowledge Graph (semantic memory with entities)
 * - Layer 3: Pattern Recognition (behavioral memory)
 * - Layer 4: State Machine (behavioral control)
 *
 * Storage: ~/.clawd/learning/
 */

// Core components
export { ExperienceStore } from './experience-store'
export { KnowledgeGraphStore } from './knowledge-graph'
export { PatternDetector } from './pattern-detection'
export { StateMachineEngine } from './state-machine'
export { FSRScheduler } from './fsrs-scheduler'

// Integration
export { initializeLearningSystem, getLearningSystem, shutdownLearningSystem } from './integration'
export type { LearningSystemConfig, LearningSystem } from './integration'

// Types
export * from './types-unified'
