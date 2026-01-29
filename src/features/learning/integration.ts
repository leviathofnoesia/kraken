/**
 * Learning System Integration
 *
 * Initializes and manages all learning system components.
 * Entry point for the unified AI memory system.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import * as path from "path"
import * as os from "os"

// Import learning system components
import { ExperienceStore } from "../experience-store"
import { KnowledgeGraphStore } from "../knowledge-graph"
import { PatternDetector } from "../pattern-detection"
import { StateMachineEngine } from "../state-machine"
import { FSRScheduler } from "../fsrs-scheduler"

// Import unified context type
import type { LearningSystemContext, LearningHooksConfig } from "../../types/learning-context"

// Import hooks
import { createLearningHooks } from "../../hooks/learning"
import type { Hooks } from "@opencode-ai/plugin"

// Import tools
import { initializeLearningTools } from "../../tools/learning"

export interface LearningSystemConfig {
  enabled: boolean
  storagePath?: string
  experienceStore?: {
    enabled: boolean
    bufferSize: number
    maxAgeDays: number
  }
  knowledgeGraph?: {
    enabled: boolean
    maxNodes: number
  }
  patternDetection?: {
    enabled: boolean
    minFrequency: number
    minConfidence: number
  }
  stateMachine?: {
    enabled: boolean
    initialState: string
  }
  fsrs?: {
    enabled: boolean
    initialIntervals: number[]
  }
  hooks?: {
    recordOnToolExecute: boolean
    recordOnSessionEnd: boolean
    injectOnSessionStart: boolean
  }
}

export interface LearningSystem {
  hooks: Hooks
  tools: Record<string, any>
  shutdown: () => Promise<void>
}

let learningSystemInstance: LearningSystem | null = null

/**
 * Initialize the learning system
 */
export function initializeLearningSystem(
  input: PluginInput,
  config?: LearningSystemConfig
): LearningSystem {
  const mergedConfig: LearningSystemConfig = {
    enabled: config?.enabled ?? true,
    storagePath: config?.storagePath ?? path.join(os.homedir(), ".clawd", "learning"),
    experienceStore: {
      enabled: config?.experienceStore?.enabled ?? true,
      bufferSize: config?.experienceStore?.bufferSize ?? 1000,
      maxAgeDays: config?.experienceStore?.maxAgeDays ?? 90
    },
    knowledgeGraph: {
      enabled: config?.knowledgeGraph?.enabled ?? true,
      maxNodes: config?.knowledgeGraph?.maxNodes ?? 10000
    },
    patternDetection: {
      enabled: config?.patternDetection?.enabled ?? true,
      minFrequency: config?.patternDetection?.minFrequency ?? 3,
      minConfidence: config?.patternDetection?.minConfidence ?? 0.7
    },
    stateMachine: {
      enabled: config?.stateMachine?.enabled ?? true,
      initialState: config?.stateMachine?.initialState ?? "unknown"
    },
    fsrs: {
      enabled: config?.fsrs?.enabled ?? true,
      initialIntervals: config?.fsrs?.initialIntervals ?? [1, 3, 7, 14, 30, 60, 120, 240, 480]
    },
    hooks: {
      recordOnToolExecute: config?.hooks?.recordOnToolExecute ?? true,
      recordOnSessionEnd: config?.hooks?.recordOnSessionEnd ?? true,
      injectOnSessionStart: config?.hooks?.injectOnSessionStart ?? true
    }
  }

  if (!mergedConfig.enabled) {
    console.log("[LearningSystem] Learning system disabled")
    return {
      hooks: {},
      tools: {},
      shutdown: async () => {}
    }
  }

  console.log("[LearningSystem] Initializing unified AI memory system...")
  console.log(`[LearningSystem] Storage path: ${mergedConfig.storagePath}`)

  // Initialize all four layers
  const experienceStore = new ExperienceStore(
    mergedConfig.storagePath,
    {
      maxBufferSize: mergedConfig.experienceStore?.bufferSize || 1000,
      maxAgeDays: mergedConfig.experienceStore?.maxAgeDays || 90
    }
  )

  const knowledgeGraph = new KnowledgeGraphStore(
    mergedConfig.storagePath,
    {
      maxNodes: mergedConfig.knowledgeGraph?.maxNodes || 10000
    }
  )

  const patternDetector = new PatternDetector(
    mergedConfig.storagePath,
    {
      minFrequency: mergedConfig.patternDetection?.minFrequency || 3,
      minConfidence: mergedConfig.patternDetection?.minConfidence || 0.7
    }
  )

  const stateMachine = new StateMachineEngine(
    mergedConfig.storagePath
  )

  // Create default state machine if not exists
  if (mergedConfig.stateMachine!.enabled) {
    const defaultMachine = stateMachine.getMachine("default")
    if (!defaultMachine) {
      stateMachine.createMachine(
        "default",
        "Default Workflow State Machine",
        mergedConfig.stateMachine?.initialState || "unknown",
        {
          "unknown": {
            name: "Unknown",
            description: "Initial state before any context",
            transitions: [],
            metadata: {}
          },
          "analyzing": {
            name: "Analyzing",
            description: "Exploring and understanding the problem",
            transitions: [
              { fromState: "analyzing", toState: "implementing", condition: () => true }
            ],
            metadata: {}
          },
          "implementing": {
            name: "Implementing",
            description: "Writing code and building solutions",
            transitions: [
              { fromState: "implementing", toState: "testing", condition: () => true },
              { fromState: "implementing", toState: "debugging", condition: () => true }
            ],
            metadata: {}
          },
          "testing": {
            name: "Testing",
            description: "Verifying correctness",
            transitions: [
              { fromState: "testing", toState: "documenting", condition: () => true },
              { fromState: "testing", toState: "debugging", condition: () => true }
            ],
            metadata: {}
          },
          "debugging": {
            name: "Debugging",
            description: "Finding and fixing errors",
            transitions: [
              { fromState: "debugging", toState: "testing", condition: () => true },
              { fromState: "debugging", toState: "analyzing", condition: () => true }
            ],
            metadata: {}
          },
          "documenting": {
            name: "Documenting",
            description: "Writing documentation and comments",
            transitions: [],
            metadata: {}
          }
        }
      )

      console.log("[LearningSystem] Created default state machine")
    }
  }

  // Initialize FSRS scheduler if enabled
  let fsrsScheduler: FSRScheduler | undefined
  if (mergedConfig.fsrs!.enabled) {
    fsrsScheduler = new FSRScheduler(
      mergedConfig.storagePath,
      {
        initialIntervals: mergedConfig.fsrs!.initialIntervals
      }
    )
  }

  // Create learning system context
  const learningContext: LearningSystemContext = {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine,
    fsrsScheduler
  }

  // Create hooks
  const hooks = createLearningHooks(input, learningContext, {
    experienceRecorder: {
      enabled: mergedConfig.hooks!.recordOnToolExecute
    },
    contextInjector: {
      enabled: mergedConfig.hooks!.injectOnSessionStart
    },
    synthesisTrigger: {
      enabled: mergedConfig.hooks!.recordOnSessionEnd
    }
  })

  // Initialize tools
  const tools = initializeLearningTools({
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine,
    fsrsScheduler
  })

  console.log("[LearningSystem] Initialized successfully")
  console.log(`[LearningSystem] ${Object.keys(hooks).length} hooks registered`)
  console.log(`[LearningSystem] 5 tools registered`)

  // Store instance for shutdown
  learningSystemInstance = {
    hooks,
    tools: {
      "learning-experience": tools.experienceTool,
      "learning-knowledge": tools.knowledgeTool,
      "learning-pattern": tools.patternTool,
      "learning-fsm": tools.fsmTool,
      "learning-stats": tools.statsTool
    },
    shutdown: async () => {
      console.log("[LearningSystem] Shutting down...")

      // Flush any buffered data
      await experienceStore.flushBuffer()

      // Note: KnowledgeGraph saves automatically on writes

      console.log("[LearningSystem] Shutdown complete")
    }
  }

  return learningSystemInstance
}

/**
 * Get the learning system instance
 */
export function getLearningSystem(): LearningSystem | null {
  return learningSystemInstance
}

/**
 * Shutdown learning system
 */
export async function shutdownLearningSystem(): Promise<void> {
  if (learningSystemInstance) {
    await learningSystemInstance.shutdown()
    learningSystemInstance = null
  }
}
