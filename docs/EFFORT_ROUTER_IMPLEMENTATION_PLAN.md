# Effort Router — Implementation Plan

## Build Phases

7 phases, each producing a testable increment. Phases 1-4 are foundational modules with no hook integration. Phase 5 wires everything into the OpenCode hook lifecycle. Phase 6 adds config and micro-directives. Phase 7 handles rollout.

---

## Phase 1: Signal Extractors

**Goal**: 12 pure signal functions + shared types.

### Files to Create

```
src/features/effort-router/
├── index.ts                    # Barrel exports
├── types.ts                    # All shared types
├── signals/
│   ├── index.ts                # Signal registry + extractAll()
│   ├── message-length.ts       # Signal 1
│   ├── tool-call-count.ts      # Signal 2
│   ├── edit-file-count.ts      # Signal 3
│   ├── agent-delegation.ts     # Signal 4
│   ├── error-rate.ts           # Signal 5
│   ├── context-pressure.ts     # Signal 6
│   ├── task-novelty.ts         # Signal 7
│   ├── domain-complexity.ts    # Signal 8
│   ├── conversation-depth.ts   # Signal 9
│   ├── user-urgency.ts         # Signal 10
│   ├── compaction-risk.ts      # Signal 11
│   └── stall-rate.ts           # Signal 12
```

### Dependencies

- Reuses `context-window-monitor` token estimation formula (`chars / 4`)
- No external dependencies

### Key Interfaces

```typescript
// types.ts
export type EffortState = 'TRIVIAL' | 'STANDARD' | 'ELEVATED' | 'INTENSIVE' | 'DEEP_WORK'

export interface SignalContext {
  /* see architecture doc */
}
export interface SignalValue {
  name: string
  value: number
  confidence: number
  source: string
}
export type SignalVector = Record<string, SignalValue>
export type SignalExtractor = (ctx: SignalContext) => SignalValue
```

### Verification

- Each signal returns value in [0, 1]
- `extractAll()` returns exactly 12 signals
- Pure functions — no side effects, no I/O

---

## Phase 2: State Classifier

**Goal**: Markov transition matrix + rules-based classifier with hysteresis.

### Files to Create

```
src/features/effort-router/
├── classifier/
│   ├── index.ts                # classify() main function
│   ├── markov-matrix.ts        # 5×5 transition matrix
│   ├── rules-fallback.ts       # Deterministic threshold rules
│   └── state-profiles.ts       # Default state profiles + profile lookup
```

### Dependencies

- Phase 1 (signal types, `EffortState`)

### Key Interfaces

```typescript
// classifier/markov-matrix.ts
export class MarkovMatrix {
  private matrix: number[][] // 5×5
  private counts: number[][] // 5×5
  observe(from: EffortState, to: EffortState): void
  predict(current: EffortState): { state: EffortState; confidence: number }
  serialize(): number[][]
  deserialize(data: number[][]): void
}

// classifier/rules-fallback.ts
export function classifyByScore(score: number): EffortState

// classifier/index.ts
export function classify(
  currentState: EffortState,
  score: number,
  markovPrediction: EffortState,
  markovConfidence: number,
  dwellMessages: number,
  thermocline: ThermoclineResult | null,
): EffortState
```

### Verification

- Markov matrix starts uniform, learns from observations
- Hysteresis prevents oscillation at thresholds
- Rules fallback activates when confidence < 0.6
- Minimum dwell time (3 messages) on de-escalation

---

## Phase 3: Budget Calculator

**Goal**: Per-message token budget allocation based on state profile and remaining context.

### Files to Create

```
src/features/effort-router/
├── budget/
│   ├── index.ts                # allocateBudget() + trackSpend()
│   └── types.ts                # Budget, BudgetSpend types
```

### Dependencies

- Phase 2 (state profiles)

### Key Interfaces

```typescript
// budget/types.ts
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

// budget/index.ts
export function allocateBudget(
  profile: StateProfile,
  contextEstimate: number,
  contextLimit: number,
): Budget
export function trackSpend(
  spend: BudgetSpend,
  category: keyof BudgetSpend,
  amount: number,
): BudgetSpend
export function calculateBudgetPressure(spend: BudgetSpend, contextLimit: number): number
```

### Verification

- Budget totals are consistent with allocation percentages
- Budget scales down when remainingRatio < 0.3
- Budget pressure correctly triggers at 80%

---

## Phase 4: Thermocline Detector + Pattern Crystallizer

**Goal**: Detect rapid complexity shifts and learn recurring patterns.

### Files to Create

```
src/features/effort-router/
├── thermocline/
│   ├── index.ts                # ThermoclineDetector class
│   └── types.ts                # ThermoclineResult
├── patterns/
│   ├── index.ts                # PatternCrystallizer class
│   ├── store.ts                # In-memory pattern store
│   └── similarity.ts           # Cosine similarity + Jaccard
```

### Dependencies

- Phase 1 (signal types, `EffortState`)

### Key Interfaces

```typescript
// thermocline/types.ts
export interface ThermoclineResult {
  detected: boolean
  direction: 'ascending' | 'descending' | null
  magnitude: number
}

// thermocline/index.ts
export class ThermoclineDetector {
  private window: number[]
  update(score: number): void
  detect(): ThermoclineResult
}

// patterns/index.ts
export class PatternCrystallizer {
  private history: TransitionRecord[]
  private patterns: CrystallizedPattern[]
  record(transition: TransitionRecord): void
  crystallize(): CrystallizedPattern | null
  match(signals: number[], state: EffortState): CrystallizedPattern | null
  decay(currentMessageIndex: number): void
  serialize(): CrystallizedPattern[]
  deserialize(data: CrystallizedPattern[]): void
}
```

### Verification

- Thermocline detects 2σ deltas within sliding window
- Crystallizer requires 3+ similar transitions
- Pattern decay removes stale patterns after 20 messages
- Max 5 crystallized patterns enforced

---

## Phase 5: Hook Integration

**Goal**: Wire the effort router into the OpenCode hook lifecycle.

### Files to Create

```
src/hooks/effort-router/
├── index.ts                    # createEffortRouterHook() - main factory
├── signal-hook.ts              # chat.message handler - extract signals
├── params-hook.ts              # chat.params handler - apply state profile
├── feedback-hook.ts            # tool.execute.after handler - collect outcomes
├── compaction-hook.ts          # experimental.session.compacting handler
└── session-state.ts            # Per-session state management
```

### Dependencies

- Phases 1-4 (all)
- Existing hooks pattern (`createXxxHook(input)` factory)

### Hook Lifecycle

```
chat.message (priority 60)
  → signal-hook: extract signals, classify state, detect thermocline, match patterns
  → session-state: update current state, record transition

chat.params (priority 10)
  → params-hook: apply state profile to reasoningEffort, textVerbosity, thinkingBudget
  → respects explicit think-mode and mode activations

tool.execute.after (priority 30)
  → feedback-hook: record tool outcomes, update error history, track budget spend

experimental.session.compacting (priority 50)
  → compaction-hook: serialize router state into compaction context

experimental.chat.system.transform (priority 40)
  → inject active micro-directives into system prompt
```

### Session State

```typescript
interface EffortRouterSessionState {
  currentState: EffortState
  messageIndex: number
  dwellMessages: number // messages since last state change
  signalHistory: SignalVector[] // last 10 signal vectors
  markovMatrix: MarkovMatrix
  thermoclineDetector: ThermoclineDetector
  patternCrystallizer: PatternCrystallizer
  budgetSpend: BudgetSpend
  activeDirectives: MicroDirective[]
  disabled: boolean // if explicit mode is active
}
```

### Integration Points

Must coexist with:

- **Think mode**: If think mode active for session, skip `thinkingBudget` override
- **Mode hooks**: If blitzkrieg/search/analyze/ultrathink detected, set `disabled = true` until mode deactivates
- **Context window monitor**: Read its estimates as input to `contextPressure` signal
- **Tool output truncator**: Router's `toolOutputLimit` feeds as a ceiling to existing truncation

### Verification

- Hooks register and fire correctly
- State persists across messages within a session
- No conflicts with existing hooks
- Shadow mode logs decisions without applying them

---

## Phase 6: Config Schema + Micro-Directives

**Goal**: Add Zod config schema, micro-directive registry.

### Files to Create

```
src/features/effort-router/
├── directives/
│   ├── index.ts                # Directive registry
│   ├── types.ts                # MicroDirective interface
│   └── builtin.ts              # 6 built-in directives
```

### Files to Modify

```
src/config/schema.ts            # Add EffortRouterConfigSchema
src/config/manager.ts           # Add getEffortRouterConfig()
```

### Dependencies

- Phase 5 (session state management)

### Config Schema Addition

```typescript
// Added to schema.ts
export const EffortRouterConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultState: z
    .enum(['TRIVIAL', 'STANDARD', 'ELEVATED', 'INTENSIVE', 'DEEP_WORK'])
    .default('STANDARD'),
  rolloutPhase: z.enum(['shadow', 'conservative', 'full']).default('shadow'),
  thermoclineSensitivity: z.number().min(1.0).max(4.0).default(2.0),
  thermoclineWindowSize: z.number().int().min(3).max(10).default(5),
  crystallizationThreshold: z.number().int().min(2).max(10).default(3),
  maxCrystallizedPatterns: z.number().int().min(1).max(10).default(5),
  patternDecayMessages: z.number().int().min(5).max(100).default(20),
  signalWeights: z.record(z.string(), z.number()).optional(),
  disabledMicroDirectives: z.array(z.string()).default([]),
  logging: z
    .object({
      logDecisions: z.boolean().default(true),
      logSignals: z.boolean().default(false),
      logTransitions: z.boolean().default(true),
    })
    .optional(),
})
```

### Micro-Directive Types

```typescript
interface MicroDirective {
  name: string
  trigger: (state: EffortRouterSessionState) => boolean
  apply: (params: ChatParams) => ChatParams
  ttl: number // messages until expiry
  priority: number // higher = applied last (overrides)
}
```

### Built-in Directives

| Name                     | Trigger               | Effect                         | TTL |
| ------------------------ | --------------------- | ------------------------------ | --- |
| `prefer-grep-over-agent` | TRIVIAL + search task | Suppress agent delegation      | 3   |
| `compact-early`          | Budget pressure > 80% | Lower compaction trigger 15%   | 5   |
| `stall-recovery`         | 3+ messages no edits  | Suggest state reclassification | 1   |
| `suppress-thinking`      | TRIVIAL confirmed     | Set thinking budget to 0       | 3   |
| `agent-escalation`       | Ascending thermocline | Allow EXPENSIVE agents         | 3   |
| `context-frugality`      | Context > 50%         | Reduce tool output 30%         | 5   |

### Verification

- Config schema validates correctly
- Missing fields get defaults
- Micro-directives trigger and expire correctly
- Disabled directives are skipped

---

## Phase 7: Rollout + Barrel Exports

**Goal**: Wire into main plugin, add barrel exports, implement rollout phases.

### Files to Create

```
src/features/effort-router/
├── rollout.ts                  # Rollout phase logic
```

### Files to Modify

```
src/features/effort-router/index.ts    # Add all barrel exports
src/hooks/effort-router/index.ts       # Finalize hook factory
src/index.ts                           # Register effort-router hook in plugin
src/config/schema.ts                   # Add to OpenCodeXConfigSchema
src/config/manager.ts                  # Add convenience getter
```

### Rollout Phases

```typescript
type RolloutPhase = 'shadow' | 'conservative' | 'full'

// shadow: Log decisions, don't apply overrides
// conservative: Apply only TRIVIAL and STANDARD state changes
// full: Apply all state changes
```

### Registration in Main Plugin

The effort router hook gets registered alongside existing hooks:

```typescript
// In src/index.ts createOpenCodeXPlugin():
const effortRouterHook = createEffortRouterHook(input)
// ... add to mergeHooks() call
```

### Verification

- `bun run typecheck` passes
- `bun run build` succeeds
- `bun test` passes (all existing + new tests)
- Shadow mode logs without breaking anything

---

## Existing Code Reuse Map

| Needed              | Source                                      | What to Reuse                                    |
| ------------------- | ------------------------------------------- | ------------------------------------------------ |
| Token estimation    | `src/hooks/context-window-monitor/index.ts` | `chars / 4` heuristic, model token limits table  |
| State persistence   | `src/storage/index.ts`                      | JSON per-session file pattern                    |
| Config schema       | `src/config/schema.ts`                      | Zod pattern, `OpenCodeXConfigSchema` extension   |
| Hook factories      | All hooks in `src/hooks/`                   | `createXxxHook(input)` returning `Hooks` pattern |
| Model catalog       | `src/tools/model-switcher/catalog.ts`       | `MODEL_CATALOG` for cost tier lookups            |
| Keyword detection   | `src/hooks/think-mode/mode-detector.ts`     | Keyword database pattern                         |
| Agent cost tiers    | `src/types.ts`                              | `AgentCost` type, `AgentCategory` type           |
| Compaction inject   | `src/hooks/compaction-context-injector/`    | `experimental.session.compacting` hook pattern   |
| Session state map   | All hooks                                   | `Map<sessionID, SessionState>` pattern           |
| Exponential backoff | `src/hooks/edit-error-recovery/`            | `baseDelay * 2^retryCount` pattern               |
| Tool restrictions   | `src/shared/permission-compat.ts`           | `createAgentToolRestrictions()`                  |

---

## Dependency Graph

```
Phase 1: Signals
    ↓
Phase 2: Classifier ←── depends on Phase 1 types
    ↓
Phase 3: Budget ←── depends on Phase 2 profiles
    ↓
Phase 4: Thermocline + Patterns ←── depends on Phase 1 types (parallel with 2, 3)
    ↓
Phase 5: Hooks ←── depends on Phases 1-4
    ↓
Phase 6: Config + Directives ←── depends on Phase 5 session state
    ↓
Phase 7: Rollout + Integration ←── depends on Phase 6
```

Phases 2, 3, and 4 can be developed in parallel once Phase 1 is complete.

---

## Test Strategy

### Unit Tests (per phase)

```
test/features/effort-router/
├── signals.test.ts          # Each signal returns [0,1], edge cases
├── classifier.test.ts       # Thresholds, hysteresis, Markov learning
├── budget.test.ts           # Allocation math, pressure calculation
├── thermocline.test.ts      # 2σ detection, ascending/descending
├── patterns.test.ts         # Crystallization, decay, matching
├── directives.test.ts       # Trigger conditions, TTL expiry
└── integration.test.ts      # Full pipeline: signal → classify → budget
```

### Test Scenarios

1. **Trivial task flow**: "Fix typo in README" → classifies TRIVIAL → no thinking, no agents
2. **Escalation flow**: Starts TRIVIAL, user asks "Now redesign the auth system" → thermocline triggers → INTENSIVE
3. **Pattern learning**: User repeatedly starts simple then escalates → pattern crystallizes → pre-emptive STANDARD
4. **Budget pressure**: Long session approaching 80% budget → "compact-early" directive triggers
5. **Coexistence with think mode**: Think mode active → effort router defers thinkingBudget
6. **Compaction survival**: Session compacts → router state rehydrates correctly

---

## Open Questions

1. **Markov cold start**: Should we bootstrap the matrix with reasonable priors (e.g., higher probability of staying in same state) rather than uniform?

2. **Minimum session length**: How many messages before pattern crystallization should activate? Currently 3 transitions (~6 messages minimum).

3. **Micro-directive visibility**: Should users see when a directive is applied? Options: silent, log only, inject a comment in the response.

4. **Rollout timeline**: How long should each rollout phase last? Suggestion: shadow for 1 week, conservative for 1 week, then full.

5. **Config override precedence**: If user explicitly sets `thinkingBudget` in agent overrides AND the effort router wants to change it, which wins? Current plan: explicit user config wins.

---

## Estimated Effort

| Phase                           | Files         | Estimated Lines  | Complexity                           |
| ------------------------------- | ------------- | ---------------- | ------------------------------------ |
| Phase 1: Signals                | 14            | ~350             | Low (pure functions)                 |
| Phase 2: Classifier             | 4             | ~300             | Medium (Markov + hysteresis)         |
| Phase 3: Budget                 | 3             | ~120             | Low (arithmetic)                     |
| Phase 4: Thermocline + Patterns | 6             | ~350             | Medium (sliding window + similarity) |
| Phase 5: Hooks                  | 6             | ~500             | High (lifecycle integration)         |
| Phase 6: Config + Directives    | 4             | ~250             | Medium (schema + registry)           |
| Phase 7: Rollout + Exports      | 3             | ~100             | Low (wiring)                         |
| **Total**                       | **~40 files** | **~1,970 lines** |                                      |
