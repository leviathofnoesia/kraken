/**
 * Effort Router Hook — Session State Management
 * Per-session state for the effort router.
 */

import type {
  EffortState,
  EffortRouterSessionState,
  SignalVector,
  BudgetSpend,
  MicroDirective,
  TransitionRecord,
  CrystallizedPattern,
} from '../../features/effort-router/types'
import { emptyBudgetSpend } from '../../features/effort-router/types'

const MAX_SIGNAL_HISTORY = 10
const MAX_TRANSITION_HISTORY = 20

/**
 * Create a fresh session state.
 */
export function createSessionState(
  sessionID: string,
  defaultState: EffortState,
): EffortRouterSessionState {
  return {
    sessionID,
    currentState: defaultState,
    messageIndex: 0,
    dwellMessages: 0,
    signalHistory: [],
    markovCounts: Array.from({ length: 5 }, () => Array(5).fill(0)),
    thermoclineWindow: [],
    transitionHistory: [],
    crystallizedPatterns: [],
    budgetSpend: emptyBudgetSpend(),
    activeDirectives: [],
    signalWeights: getDefaultSignalWeights(),
    disabled: false,
    lastClassificationScore: 0,
    accumulatedTokens: 0,
    createdAt: Date.now(),
  }
}

/**
 * Update session state after a classification decision.
 */
export function updateSessionState(
  state: EffortRouterSessionState,
  newState: EffortState,
  score: number,
  signalVector: SignalVector,
  transition?: TransitionRecord,
): EffortRouterSessionState {
  const changed = newState !== state.currentState

  // Update signal history
  const signalHistory = [...state.signalHistory, signalVector]
  if (signalHistory.length > MAX_SIGNAL_HISTORY) {
    signalHistory.shift()
  }

  // Update transition history
  const transitionHistory = [...state.transitionHistory]
  if (transition) {
    transitionHistory.push(transition)
    if (transitionHistory.length > MAX_TRANSITION_HISTORY) {
      transitionHistory.shift()
    }
  }

  return {
    ...state,
    currentState: newState,
    messageIndex: state.messageIndex + 1,
    dwellMessages: changed ? 0 : state.dwellMessages + 1,
    signalHistory,
    transitionHistory,
    lastClassificationScore: score,
  }
}

/**
 * Rehydrate session state from serialized compaction data.
 */
export function rehydrateSessionState(
  sessionID: string,
  data: {
    currentState: EffortState
    messageIndex: number
    transitionHistory: TransitionRecord[]
    crystallizedPatterns: CrystallizedPattern[]
    markovCounts: number[][]
    thermoclineWindow: number[]
    sessionSpend: BudgetSpend
    signalWeights: Record<string, number>
    activeDirectives: MicroDirective[]
  },
): EffortRouterSessionState {
  return {
    sessionID,
    currentState: data.currentState,
    messageIndex: data.messageIndex,
    dwellMessages: 0,
    signalHistory: [],
    markovCounts: data.markovCounts,
    thermoclineWindow: data.thermoclineWindow ?? [],
    transitionHistory: data.transitionHistory,
    crystallizedPatterns: data.crystallizedPatterns,
    budgetSpend: data.sessionSpend,
    activeDirectives: data.activeDirectives ?? [],
    signalWeights: data.signalWeights ?? getDefaultSignalWeights(),
    disabled: false,
    lastClassificationScore: 0,
    accumulatedTokens: data.sessionSpend?.total ?? 0,
    createdAt: Date.now(),
  }
}

/**
 * Default signal weights (must sum to 1.0).
 */
export function getDefaultSignalWeights(): Record<string, number> {
  return {
    messageLength: 0.08,
    toolCallCount: 0.1,
    editFileCount: 0.12,
    agentDelegationDepth: 0.12,
    errorRate: 0.08,
    contextPressure: 0.1,
    taskNovelty: 0.08,
    domainComplexity: 0.12,
    conversationDepth: 0.05,
    userUrgencySignal: 0.05,
    compactionRisk: 0.05,
    stallRate: 0.05,
  }
}

/**
 * Session store — Map with convenience methods.
 */
export class SessionStore {
  private sessions = new Map<string, EffortRouterSessionState>()

  get(sessionID: string): EffortRouterSessionState | undefined {
    return this.sessions.get(sessionID)
  }

  getOrCreate(sessionID: string, defaultState: EffortState): EffortRouterSessionState {
    let state = this.sessions.get(sessionID)
    if (!state) {
      state = createSessionState(sessionID, defaultState)
      this.sessions.set(sessionID, state)
    }
    return state
  }

  set(sessionID: string, state: EffortRouterSessionState): void {
    this.sessions.set(sessionID, state)
  }

  delete(sessionID: string): void {
    this.sessions.delete(sessionID)
  }

  clear(): void {
    this.sessions.clear()
  }
}
