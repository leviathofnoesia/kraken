/**
 * Effort Router Hook — Main Integration
 *
 * Wires the effort router into the OpenCode hook lifecycle:
 * - chat.message: Extract signals, classify state
 * - chat.params: Apply state profile to model parameters
 * - tool.execute.after: Collect feedback for signal extraction
 * - experimental.session.compacting: Serialize state for compaction survival
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'

import { SessionStore, rehydrateSessionState } from './session-state'
import {
  extractAllSignals,
  computeCompositeScore,
  signalVectorToArray,
} from '../../features/effort-router/signals'
import { classify } from '../../features/effort-router/classifier'
import { MarkovMatrix } from '../../features/effort-router/classifier/markov-matrix'
import { getStateProfile } from '../../features/effort-router/classifier/state-profiles'
import { trackSpend, isBudgetPressureHigh } from '../../features/effort-router/budget'
import { ThermoclineDetector } from '../../features/effort-router/thermocline'
import { PatternCrystallizer } from '../../features/effort-router/patterns'
import { updateSessionState } from './session-state'
import type {
  EffortState,
  EffortRouterSessionState,
  RolloutPhase,
  SignalContext,
  TransitionRecord,
  ToolCallRecord,
  EditRecord,
  AgentCallRecord,
  ErrorRecord,
  EffortRouterSerializedState,
  EffortRouterConfig,
} from '../../features/effort-router/types'
import { EFFORT_STATE_INDEX } from '../../features/effort-router/types'
import { getEffortRouterConfig } from '../../config/manager'

const LOG_PREFIX = '[effort-router]'

// ── Per-session detector/crystallizer instances ────────────────
// These can't be serialized directly, so we store them alongside session state

interface SessionHelpers {
  markov: MarkovMatrix
  thermoclineDetector: ThermoclineDetector
  patternCrystallizer: PatternCrystallizer
}

const helperStore = new Map<string, SessionHelpers>()
const sessionStore = new SessionStore()

// ── Config (lazy-loaded) ──────────────────────────────────────

const DEFAULT_CONFIG: EffortRouterConfig = {
  enabled: true,
  defaultState: 'STANDARD',
  rolloutPhase: 'shadow',
  thermoclineSensitivity: 2.0,
  thermoclineWindowSize: 5,
  crystallizationThreshold: 3,
  maxCrystallizedPatterns: 5,
  patternDecayMessages: 20,
  disabledMicroDirectives: [],
}

let cachedConfig: EffortRouterConfig | null = null

function getConfig(): EffortRouterConfig {
  if (cachedConfig) return cachedConfig
  try {
    const schemaConfig = getEffortRouterConfig()
    if (schemaConfig) {
      cachedConfig = {
        enabled: schemaConfig.enabled ?? true,
        defaultState: (schemaConfig.defaultState as EffortState) ?? 'STANDARD',
        rolloutPhase: (schemaConfig.rolloutPhase as RolloutPhase) ?? 'shadow',
        thermoclineSensitivity: schemaConfig.thermoclineSensitivity ?? 2.0,
        thermoclineWindowSize: schemaConfig.thermoclineWindowSize ?? 5,
        crystallizationThreshold: schemaConfig.crystallizationThreshold ?? 3,
        maxCrystallizedPatterns: schemaConfig.maxCrystallizedPatterns ?? 5,
        patternDecayMessages: schemaConfig.patternDecayMessages ?? 20,
        signalWeights: schemaConfig.signalWeights,
        disabledMicroDirectives: schemaConfig.disabledMicroDirectives ?? [],
        logging: schemaConfig.logging as any,
      }
      return cachedConfig
    }
  } catch {
    // Config not available, use defaults
  }
  cachedConfig = DEFAULT_CONFIG
  return cachedConfig
}

// ── Helper Management ─────────────────────────────────────────

function getOrCreateHelpers(sessionID: string, config: EffortRouterConfig): SessionHelpers {
  let helpers = helperStore.get(sessionID)
  if (!helpers) {
    const markov = new MarkovMatrix()
    const thermoclineDetector = new ThermoclineDetector(
      config.thermoclineWindowSize,
      config.thermoclineSensitivity,
    )
    const patternCrystallizer = new PatternCrystallizer(
      config.crystallizationThreshold,
      config.maxCrystallizedPatterns,
      config.patternDecayMessages,
    )

    helpers = { markov, thermoclineDetector, patternCrystallizer }
    helperStore.set(sessionID, helpers)
  }
  return helpers
}

function cleanupSession(sessionID: string): void {
  helperStore.delete(sessionID)
  sessionStore.delete(sessionID)
}

// ── Text extraction from parts ────────────────────────────────
function getTextFromParts(parts: any[]): string {
  if (!parts || !Array.isArray(parts)) return ''
  return parts
    .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
    .map((p: any) => p.text)
    .join(' ')
}

// ── Build SignalContext from session state ─────────────────────

function buildSignalContext(
  session: EffortRouterSessionState,
  messageText: string,
  contextEstimate: number,
  contextLimit: number,
): SignalContext {
  const profile = getStateProfile(session.currentState)

  // Gather recent tool calls, edits, agent calls from signal history
  // In a full implementation, these would be accumulated from feedback hooks
  const recentToolCalls: ToolCallRecord[] = []
  const recentEdits: EditRecord[] = []
  const recentAgentCalls: AgentCallRecord[] = []
  const errorHistory: ErrorRecord[] = []

  const previousSignals =
    session.signalHistory.length > 0
      ? session.signalHistory[session.signalHistory.length - 1]
      : null

  return {
    sessionID: session.sessionID,
    messageIndex: session.messageIndex,
    messageText,
    recentToolCalls,
    recentEdits,
    recentAgentCalls,
    contextEstimate,
    contextLimit,
    previousSignals,
    errorHistory,
    stateCompactionTrigger: profile.compactionTrigger,
  }
}

// ── Rollout Phase Logic ───────────────────────────────────────

function shouldApplyState(state: EffortState, phase: RolloutPhase): boolean {
  if (phase === 'full') return true
  if (phase === 'shadow') return false
  // conservative: only apply TRIVIAL and STANDARD
  const idx = EFFORT_STATE_INDEX[state]
  return idx <= 1 // TRIVIAL or STANDARD
}

// ── Apply State Profile to Chat Params ────────────────────────

function applyProfileToParams(
  params: any,
  session: EffortRouterSessionState,
  config: EffortRouterConfig,
): any {
  if (!shouldApplyState(session.currentState, config.rolloutPhase)) {
    return params
  }

  const profile = getStateProfile(session.currentState)

  // Apply reasoning effort (for GPT models)
  if (params.variant !== 'max') {
    // Don't override explicit think mode
    params.reasoningEffort = profile.reasoningEffort
    params.textVerbosity = profile.textVerbosity
  }

  // Apply thinking budget (for Anthropic models)
  if (!params.thinking || params.thinking?.type !== 'enabled') {
    if (profile.thinkingBudget > 0) {
      params.thinking = {
        type: 'auto',
        budget_tokens: profile.thinkingBudget,
      }
    }
  }

  return params
}

// ── Serialize for Compaction ──────────────────────────────────

function serializeState(
  session: EffortRouterSessionState,
  helpers: SessionHelpers,
): EffortRouterSerializedState {
  const markovData = helpers.markov.serialize()

  return {
    version: 1,
    currentState: session.currentState,
    messageIndex: session.messageIndex,
    transitionHistory: session.transitionHistory.slice(-10),
    crystallizedPatterns: helpers.patternCrystallizer.serialize(),
    markovMatrix: markovData.matrix,
    markovCounts: markovData.counts,
    sessionSpend: { ...session.budgetSpend },
    signalWeights: { ...session.signalWeights },
    activeDirectives: session.activeDirectives.map((d) => ({ ...d })),
  }
}

function deserializeAndRestore(
  sessionID: string,
  data: EffortRouterSerializedState,
  config: EffortRouterConfig,
): { session: EffortRouterSessionState; helpers: SessionHelpers } {
  const session = rehydrateSessionState(sessionID, {
    currentState: data.currentState,
    messageIndex: data.messageIndex,
    transitionHistory: data.transitionHistory,
    crystallizedPatterns: data.crystallizedPatterns,
    markovCounts: data.markovCounts,
    thermoclineWindow: [],
    sessionSpend: data.sessionSpend,
    signalWeights: data.signalWeights,
    activeDirectives: data.activeDirectives,
  })

  const helpers = getOrCreateHelpers(sessionID, config)
  helpers.markov.deserialize({ matrix: data.markovMatrix, counts: data.markovCounts })
  helpers.patternCrystallizer.deserialize(data.crystallizedPatterns)

  return { session, helpers }
}

// ── Parse Compaction Context ──────────────────────────────────

function parseCompactionContext(context: string): EffortRouterSerializedState | null {
  const match = context.match(/\[EFFORT_ROUTER_STATE\]([\s\S]*?)\[\/EFFORT_ROUTER_STATE\]/)
  if (!match) return null

  try {
    const data = JSON.parse(match[1].trim())
    if (data.version !== 1) return null
    return data as EffortRouterSerializedState
  } catch {
    return null
  }
}

// ══════════════════════════════════════════════════════════════
// Main Hook Factory
// ══════════════════════════════════════════════════════════════
export function createEffortRouterHook(input: PluginInput): Hooks {
  const config = getConfig()
  const logging = config.logging

  return {
    // ── chat.message: Signal extraction + classification ──────
    'chat.message': async (message: any) => {
      if (!config.enabled) return

      try {
        const sessionID = message?.sessionID ?? 'default'
        const parts = message?.parts ?? message?.content ?? []
        const text = getTextFromParts(parts)

        if (!text || text.trim().length === 0) return

        // Get or create session state
        const session = sessionStore.getOrCreate(sessionID, config.defaultState as EffortState)
        const helpers = getOrCreateHelpers(sessionID, config)

        // Build signal context
        // Use rough token estimate: chars / 4
        const contextEstimate = session.accumulatedTokens + Math.ceil(text.length / 4)
        const contextLimit = 100000 // Default; ideally from model detection
        const signalCtx = buildSignalContext(session, text, contextEstimate, contextLimit)

        // Extract all signals
        const signalVector = extractAllSignals(signalCtx)
        const compositeScore = computeCompositeScore(signalVector, session.signalWeights)

        // Update thermocline detector
        helpers.thermoclineDetector.update(compositeScore)
        const thermoclineResult = helpers.thermoclineDetector.detect()

        // Check for pattern match
        const signalArray = signalVectorToArray(signalVector)
        const matchedPattern = helpers.patternCrystallizer.match(signalArray, session.currentState)

        // Run classification
        const result = classify({
          currentState: session.currentState,
          compositeScore,
          dwellMessages: session.dwellMessages,
          thermocline: thermoclineResult,
          matchedPattern,
          markov: helpers.markov,
        })

        // Record transition if state changed
        const transition: TransitionRecord | undefined =
          result.state !== session.currentState
            ? {
                fromState: session.currentState,
                toState: result.state,
                signalSnapshot: signalArray,
                messageIndex: session.messageIndex,
                timestamp: Date.now(),
              }
            : undefined

        // Update Markov matrix
        if (transition) {
          helpers.markov.observe(transition.fromState, transition.toState)
          helpers.patternCrystallizer.record(transition)
          helpers.patternCrystallizer.crystallize()
          helpers.patternCrystallizer.decay(session.messageIndex)
        }

        // Update session state
        const messageTokens = Math.ceil(text.length / 4)
        const updatedSession = updateSessionState(
          session,
          result.state,
          compositeScore,
          signalVector,
          transition,
        )
        sessionStore.set(sessionID, {
          ...updatedSession,
          accumulatedTokens: updatedSession.accumulatedTokens + messageTokens,
        })

        // Update thermocline window in session
        updatedSession.thermoclineWindow = helpers.thermoclineDetector.getWindow()

        // Logging
        if (logging?.logTransitions && transition) {
          console.log(
            `${LOG_PREFIX} [${sessionID}] ${transition.fromState} → ${transition.toState} ` +
              `(score=${compositeScore.toFixed(3)}, source=${result.source}, confidence=${result.confidence.toFixed(3)})`,
          )
        }

        if (logging?.logDecisions && !transition) {
          console.log(
            `${LOG_PREFIX} [${sessionID}] state=${result.state} ` +
              `(score=${compositeScore.toFixed(3)}, source=${result.source})`,
          )
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error in chat.message hook:`, error)
      }
    },

    // ── chat.params: Apply state profile ──────────────────────
    'chat.params': async (params: any) => {
      if (!config.enabled) return params

      try {
        const sessionID = params?.sessionID ?? 'default'
        const session = sessionStore.get(sessionID)
        if (!session || session.disabled) return params

        return applyProfileToParams(params, session, config)
      } catch (error) {
        console.error(`${LOG_PREFIX} Error in chat.params hook:`, error)
        return params
      }
    },

    // ── tool.execute.after: Collect feedback ──────────────────
    'tool.execute.after': async (toolInput: any, output: any) => {
      if (!config.enabled) return

      try {
        const sessionID = toolInput?.sessionID ?? 'default'
        const session = sessionStore.get(sessionID)
        if (!session) return

        const toolName = toolInput?.tool ?? 'unknown'
        const success = output?.output?.success !== false

        // Rough token estimate for tool output
        const outputStr =
          typeof output?.output === 'string' ? output.output : JSON.stringify(output?.output ?? '')
        const estimatedTokens = Math.ceil(outputStr.length / 4)

        // Track budget spend
        const category =
          toolName.includes('agent') || toolName.includes('call')
            ? ('agents' as const)
            : ('tools' as const)
        const updatedSpend = trackSpend(session.budgetSpend, category, estimatedTokens)
        session.budgetSpend = updatedSpend

        // Check budget pressure
        if (isBudgetPressureHigh(updatedSpend, 100000, 0.8)) {
          console.log(
            `${LOG_PREFIX} [${sessionID}] Budget pressure HIGH: ${((updatedSpend.total / 80000) * 100).toFixed(1)}%`,
          )
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error in tool.execute.after hook:`, error)
      }
    },

    // ── experimental.session.compacting: Serialize state ──────
    'experimental.session.compacting': async (event: any) => {
      if (!config.enabled) return

      try {
        const sessionID = event?.sessionID ?? 'default'
        const session = sessionStore.get(sessionID)
        const helpers = helperStore.get(sessionID)
        if (!session || !helpers) return

        const serialized = serializeState(session, helpers)
        const json = JSON.stringify(serialized, null, 2)

        // Inject into compaction context
        if (event.context) {
          event.context += `\n\n[EFFORT_ROUTER_STATE]\n${json}\n[/EFFORT_ROUTER_STATE]`
        }

        if (logging?.logDecisions) {
          console.log(
            `${LOG_PREFIX} [${sessionID}] Serialized state for compaction (state=${session.currentState})`,
          )
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error in session.compacting hook:`, error)
      }
    },
  }
}
