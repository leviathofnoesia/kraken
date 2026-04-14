/**
 * Effort Router — Core Types
 * Defines all shared types for the effort routing system.
 */

// ── Effort State ──────────────────────────────────────────────

export const EFFORT_STATES = ['TRIVIAL', 'STANDARD', 'ELEVATED', 'INTENSIVE', 'DEEP_WORK'] as const
export type EffortState = (typeof EFFORT_STATES)[number]

export const EFFORT_STATE_INDEX: Record<EffortState, number> = {
  TRIVIAL: 0,
  STANDARD: 1,
  ELEVATED: 2,
  INTENSIVE: 3,
  DEEP_WORK: 4,
}

export const INDEX_TO_EFFORT_STATE: Record<number, EffortState> = {
  0: 'TRIVIAL',
  1: 'STANDARD',
  2: 'ELEVATED',
  3: 'INTENSIVE',
  4: 'DEEP_WORK',
}

// ── Signals ───────────────────────────────────────────────────

export const SIGNAL_NAMES = [
  'messageLength',
  'toolCallCount',
  'editFileCount',
  'agentDelegationDepth',
  'errorRate',
  'contextPressure',
  'taskNovelty',
  'domainComplexity',
  'conversationDepth',
  'userUrgencySignal',
  'compactionRisk',
  'stallRate',
] as const

export type SignalName = (typeof SIGNAL_NAMES)[number]

export interface SignalValue {
  name: SignalName
  value: number // [0, 1]
  confidence: number // [0, 1]
}

export type SignalVector = Record<SignalName, SignalValue>

// ── Signal Context ────────────────────────────────────────────

export interface ToolCallRecord {
  toolName: string
  timestamp: number
  success: boolean
  estimatedTokens: number
}

export interface EditRecord {
  filePath: string
  timestamp: number
  editType: 'create' | 'modify' | 'delete'
}

export interface AgentCallRecord {
  agentName: string
  timestamp: number
  subCalls: AgentCallRecord[]
  estimatedTokens: number
}

export interface ErrorRecord {
  toolName: string
  errorType: string
  timestamp: number
}

export interface SignalContext {
  sessionID: string
  messageIndex: number
  messageText: string
  recentToolCalls: ToolCallRecord[]
  recentEdits: EditRecord[]
  recentAgentCalls: AgentCallRecord[]
  contextEstimate: number
  contextLimit: number
  previousSignals: SignalVector | null
  errorHistory: ErrorRecord[]
  stateCompactionTrigger: number
}

export type SignalExtractor = (ctx: SignalContext) => SignalValue

// ── State Profile ─────────────────────────────────────────────

export interface BudgetAllocation {
  thinking: number
  tools: number
  agents: number
  context: number
}

export interface StateProfile {
  state: EffortState
  reasoningEffort: 'low' | 'medium' | 'high'
  textVerbosity: 'low' | 'medium' | 'high'
  thinkingBudget: number
  allowedAgentTiers: string[]
  maxConcurrentAgents: number
  toolOutputLimit: number
  contextReservation: number
  compactionTrigger: number
  tokenBudgetCeiling: number
  budgetAllocation: BudgetAllocation
}

// ── Budget ────────────────────────────────────────────────────

export interface Budget {
  thinking: number
  tools: number
  agents: number
  context: number
  total: number
}

export interface BudgetSpend {
  thinking: number
  tools: number
  agents: number
  total: number
}

// ── Thermocline ───────────────────────────────────────────────

export interface ThermoclineResult {
  detected: boolean
  direction: 'ascending' | 'descending' | null
  magnitude: number
}

// ── Pattern Crystallization ───────────────────────────────────

export interface TransitionRecord {
  fromState: EffortState
  toState: EffortState
  signalSnapshot: number[]
  messageIndex: number
  timestamp: number
}

export interface CrystallizedPattern {
  fromState: EffortState
  toState: EffortState
  signalSignature: number[]
  confidence: number
  occurrences: number
  lastSeenMessageIndex: number
  lastSeen: number
}

// ── Micro-Directives ──────────────────────────────────────────

export interface MicroDirective {
  name: string
  description: string
  ttl: number
  priority: number
  remainingTtl: number
}

// ── Serialized State (compaction survival) ────────────────────

export interface EffortRouterSerializedState {
  version: 1
  currentState: EffortState
  messageIndex: number
  transitionHistory: TransitionRecord[]
  crystallizedPatterns: CrystallizedPattern[]
  markovMatrix: number[][]
  markovCounts: number[][]
  sessionSpend: BudgetSpend
  signalWeights: Record<string, number>
  activeDirectives: MicroDirective[]
}

// ── Config ────────────────────────────────────────────────────

export type RolloutPhase = 'shadow' | 'conservative' | 'full'

export interface EffortRouterLoggingConfig {
  logDecisions: boolean
  logSignals: boolean
  logTransitions: boolean
}

export interface EffortRouterConfig {
  enabled: boolean
  defaultState: EffortState
  rolloutPhase: RolloutPhase
  thermoclineSensitivity: number
  thermoclineWindowSize: number
  crystallizationThreshold: number
  maxCrystallizedPatterns: number
  patternDecayMessages: number
  signalWeights?: Record<string, number>
  disabledMicroDirectives: string[]
  logging?: EffortRouterLoggingConfig
}

// ── Session State ─────────────────────────────────────────────

export interface EffortRouterSessionState {
  sessionID: string
  currentState: EffortState
  messageIndex: number
  dwellMessages: number
  signalHistory: SignalVector[]
  markovCounts: number[][]
  thermoclineWindow: number[]
  transitionHistory: TransitionRecord[]
  crystallizedPatterns: CrystallizedPattern[]
  budgetSpend: BudgetSpend
  activeDirectives: MicroDirective[]
  signalWeights: Record<string, number>
  disabled: boolean
  lastClassificationScore: number
  accumulatedTokens: number
  createdAt: number
}

// ── Helpers ───────────────────────────────────────────────────

export function isEscalation(from: EffortState, to: EffortState): boolean {
  return EFFORT_STATE_INDEX[to] > EFFORT_STATE_INDEX[from]
}

export function clampState(state: EffortState, offset: number): EffortState {
  const idx = Math.max(0, Math.min(4, EFFORT_STATE_INDEX[state] + offset))
  return INDEX_TO_EFFORT_STATE[idx]
}

export function emptySignalVector(): SignalVector {
  const vec = {} as SignalVector
  for (const name of SIGNAL_NAMES) {
    vec[name] = { name, value: 0, confidence: 0 }
  }
  return vec
}

export function emptyBudgetSpend(): BudgetSpend {
  return { thinking: 0, tools: 0, agents: 0, total: 0 }
}
