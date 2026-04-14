/**
 * Effort Router — Barrel Exports
 */

// Types
export type {
  EffortState,
  SignalValue,
  SignalVector,
  SignalContext,
  StateProfile,
  Budget,
  BudgetSpend,
  ThermoclineResult,
  TransitionRecord,
  CrystallizedPattern,
  MicroDirective,
  EffortRouterSerializedState,
  EffortRouterConfig,
  RolloutPhase,
  EffortRouterSessionState,
  ToolCallRecord,
  EditRecord,
  AgentCallRecord,
  ErrorRecord,
  BudgetAllocation,
} from './types'

export {
  EFFORT_STATES,
  EFFORT_STATE_INDEX,
  INDEX_TO_EFFORT_STATE,
  SIGNAL_NAMES,
  emptySignalVector,
  emptyBudgetSpend,
  isEscalation,
  clampState,
} from './types'

// Signals
export { extractAllSignals, computeCompositeScore, signalVectorToArray } from './signals'

// Classifier
export { classify } from './classifier'
export { MarkovMatrix } from './classifier/markov-matrix'
export {
  classifyByScore,
  shouldTransition,
  applyThermoclineOverride,
  applyPatternOverride,
  DEFAULT_THRESHOLDS,
  HYSTERESIS,
  MIN_DWELL_MESSAGES,
} from './classifier/rules-fallback'
export { DEFAULT_STATE_PROFILES, getStateProfile } from './classifier/state-profiles'

// Budget
export { allocateBudget, trackSpend, calculateBudgetPressure, isBudgetPressureHigh } from './budget'

// Thermocline
export { ThermoclineDetector } from './thermocline'

// Patterns
export { PatternCrystallizer } from './patterns'
export { cosineSimilarity, vectorMean } from './patterns/similarity'

// Directives
export { evaluateDirectives, getBuiltinDirectiveDefinitions } from './directives/builtin'
