# Effort Router — Architecture Specification

## Overview

The Effort Router is a signal-driven behavioral state machine that sits between raw conversation events and Kraken's configuration parameters. It reads signals, classifies effort state, and emits parameter adjustments.

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Conversation │────▶│    Signal     │────▶│    State         │────▶│   Parameter  │
│   Events      │     │  Extractors   │     │   Classifier     │     │   Overrides  │
│               │     │   (12 sigs)   │     │ (Markov+Rules)   │     │              │
└──────────────┘     └───────────────┘     └──────────────────┘     └──────────────┘
                            │                      │                        │
                            ▼                      ▼                        ▼
                     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
                     │  Thermocline │     │    Pattern       │     │    Budget    │
                     │  Detector    │     │  Crystallizer    │     │  Allocator   │
                     └──────────────┘     └──────────────────┘     └──────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │   Micro-         │
                                          │   Directives     │
                                          └──────────────────┘
```

---

## Signal Specifications

### Signal Types

Each signal is a pure function: `(context: SignalContext) → SignalValue` where `SignalValue ∈ [0, 1]`.

```typescript
interface SignalContext {
  sessionID: string
  messageIndex: number
  messageText: string
  messageParts: Part[] // from OpenCode SDK
  recentToolCalls: ToolCallRecord[] // last N tool calls
  recentEdits: EditRecord[] // recent file edits
  recentAgentCalls: AgentCallRecord[] // recent agent delegations
  contextEstimate: number // estimated tokens used
  contextLimit: number // model context window
  previousSignals: SignalVector // signals from last message
  errorHistory: ErrorRecord[] // recent tool errors
}

interface SignalValue {
  name: string
  value: number // [0, 1]
  confidence: number // [0, 1]
  source: string // which extractor produced this
}

type SignalVector = Record<SignalName, SignalValue>
type SignalName = string
```

### Signal Definitions

#### 1. `messageLength`

Measures user message complexity by character count.

```
raw = messageText.length
value = sigmoid((raw - 500) / 300)

Where sigmoid(x) = 1 / (1 + e^(-x))

Interpretation:
  <50 chars  → ~0.12 (short command)
  ~500 chars → 0.50  (typical request)
  >1500 chars → ~0.95 (detailed spec)
```

#### 2. `toolCallCount`

Counts tool invocations in the last N messages (N=5 by default).

```
raw = count(toolCalls in last N messages)
value = min(raw / 10, 1.0)

Interpretation:
  0 calls  → 0.0 (no tool usage)
  5 calls  → 0.5 (moderate)
  10+ calls → 1.0 (heavy tool usage)
```

#### 3. `editFileCount`

Counts distinct files edited in the last N messages.

```
raw = |unique(recentEdits.map(e => e.filePath))|
value = min(raw / 8, 1.0)

Interpretation:
  0 files → 0.0 (no edits, exploratory)
  4 files → 0.5 (multi-file change)
  8+ files → 1.0 (cross-cutting change)
```

#### 4. `agentDelegationDepth`

Counts agent delegations and their nesting depth.

```
raw = Σ(agentCalls.map(a => 1 + a.subCalls.length * 0.5))
value = min(raw / 6, 1.0)

Interpretation:
  0 delegations → 0.0 (no agents needed)
  3 delegations → 0.5 (moderate consultation)
  6+ delegations → 1.0 (heavy multi-agent work)
```

#### 5. `errorRate`

Ratio of failed tool calls to total tool calls.

```
failed = count(recentToolCalls where outcome = "error")
total  = count(recentToolCalls)
value  = total > 0 ? failed / total : 0

Interpretation:
  0% errors → 0.0 (smooth execution)
  25% errors → 0.25 (some difficulty)
  50%+ errors → 0.5+ (struggling, needs more effort)
```

#### 6. `contextPressure`

How close the conversation is to the context window limit.

```
value = contextEstimate / contextLimit

Interpretation:
  <30% → 0.3 (plenty of room)
  ~50% → 0.5 (budget awareness)
  >70% → 0.7+ (pressure, need frugality)
```

#### 7. `taskNovelty`

How different the current message is from recent messages. Uses Jaccard similarity on word sets.

```
currentWords = wordSet(messageText)
recentWords  = union(wordSet(last 3 messages))
jaccard = |currentWords ∩ recentWords| / |currentWords ∪ recentWords|
value   = 1 - jaccard

Interpretation:
  Repeated topic  → ~0.1 (continuation)
  New topic       → ~0.7 (pivot)
  Completely new  → ~0.9 (fresh direction)
```

#### 8. `domainComplexity`

Keyword-weighted complexity score based on domain-specific language.

```
COMPLEXITY_KEYWORDS = {
  "design|architect|redesign|refactor|optimize|distributed": 3,
  "implement|integrate|migrate|security|performance": 2,
  "fix|update|add|change|configure": 1,
  "rename|typo|comment|format|lint": 0
}

raw = Σ(keyword_matches × weight) / max_possible
value = min(raw, 1.0)

Interpretation:
  Low keywords  → ~0.1 (simple task)
  Mixed         → ~0.5 (moderate)
  High keywords → ~0.9 (complex domain)
```

#### 9. `conversationDepth`

How deep into the session we are.

```
value = min(messageIndex / 50, 1.0)

Interpretation:
  Message 5/50  → 0.10 (early, may escalate)
  Message 25/50 → 0.50 (mid-session)
  Message 50+   → 1.0 (deep session, fatigue risk)
```

#### 10. `userUrgencySignal`

Keyword detection for urgency markers.

```
URGENCY_HIGH   = ["asap", "urgent", "critical", "emergency", "now", "immediately"]
URGENCY_LOW    = ["carefully", "think about", "consider", "thoroughly", "properly"]
URGENCY_SKIP   = ["quick", "fast", "simple", "just", "only"]

if matches(URGENCY_HIGH)  → value = 0.9
if matches(URGENCY_LOW)   → value = 0.3
if matches(URGENCY_SKIP)  → value = 0.1
else                      → value = 0.5 (neutral)
```

#### 11. `compactionRisk`

Proximity to compaction trigger threshold.

```
compactionThreshold = stateProfile.compactionTrigger (e.g., 0.75)
currentPressure = contextEstimate / contextLimit
value = max(0, (currentPressure - (compactionThreshold - 0.15)) / 0.15)

Interpretation:
  Well below threshold → 0.0
  Approaching          → 0.5
  At threshold         → 1.0 (compaction imminent)
```

#### 12. `stallRate`

Messages with no productive output (no file edits, no agent completions).

```
stalledMessages = count(last N messages where no edits AND no agent calls)
value = min(stalledMessages / 4, 1.0)

Interpretation:
  0 stalled → 0.0 (productive)
  2 stalled → 0.5 (slowing down)
  4+ stalled → 1.0 (stuck, needs intervention)
```

---

## State Classifier

### Weighted Signal Aggregation

```
score = Σ(weight_i × value_i)  for i ∈ [1..12]

Where weights sum to 1.0:
  editFileCount:       0.12
  domainComplexity:    0.12
  agentDelegationDepth: 0.12
  toolCallCount:       0.10
  contextPressure:     0.10
  messageLength:       0.08
  taskNovelty:         0.08
  errorRate:           0.08
  conversationDepth:   0.05
  userUrgencySignal:   0.05
  compactionRisk:      0.05
  stallRate:           0.05
```

### Classification Thresholds

```
TRIVIAL   : score < 0.20
STANDARD  : 0.20 ≤ score < 0.40
ELEVATED  : 0.40 ≤ score < 0.60
INTENSIVE : 0.60 ≤ score < 0.80
DEEP_WORK : score ≥ 0.80
```

### Hysteresis Buffer

To prevent state thrashing, transitions require crossing the threshold by an additional buffer:

```
For UPWARD transitions (e.g., STANDARD → ELEVATED):
  new_score must exceed upper_threshold + HYSTERESIS

For DOWNWARD transitions (e.g., ELEVATED → STANDARD):
  new_score must fall below lower_threshold - HYSTERESIS

HYSTERESIS = 0.05
```

Additionally, a **minimum dwell time** of 3 messages is enforced before any downward transition. Upward transitions have no dwell requirement (escalate quickly, de-escalate slowly).

### Markov Transition Model

Session-scoped 5×5 transition probability matrix. Starts uniform, learns from observed transitions.

#### Initialization

```
P[i][j] = 1/5 for all i, j ∈ {TRIVIAL, STANDARD, ELEVATED, INTENSIVE, DEEP_WORK}

Prior count (Laplace smoothing): α = 1
Transition counts: N[i][j] = 0 initially
```

#### Learning

After each observed transition from state `i` to state `j`:

```
N[i][j] += 1
P[i][j] = (N[i][j] + α) / (Σ_k N[i][k] + K×α)

Where K = 5 (number of states), α = 1 (Laplace prior)
```

#### Prediction

Given current state `i`, predict most likely next state:

```
predicted_state = argmax_j P[i][j]
confidence = max_j P[i][j]
```

#### Rules Fallback

When Markov confidence < 0.6 (insufficient data), fall back to deterministic rules:

```
if thermocline_detected:
    if ascending_thermocline: state = min(current_state + 2, DEEP_WORK)
    if descending_thermocline: state = max(current_state - 1, TRIVIAL)
elif crystallized_pattern_matches:
    state = pattern.target_state
else:
    state = classify_by_score(composite_score)  // threshold rules above
```

### Classification Decision

```
function classify(current_state, composite_score, markov_prediction, markov_confidence):
    rule_based_state = classify_by_score(composite_score)

    if markov_confidence >= 0.6:
        candidate = markov_prediction
    else:
        candidate = rule_based_state

    // Apply hysteresis
    if candidate != current_state:
        if is_escalation(candidate, current_state):
            if composite_score >= threshold(candidate) + HYSTERESIS:
                return candidate  // escalate immediately
            else:
                return current_state  // not enough signal
        else:  // de-escalation
            if dwell_time >= 3 AND composite_score <= threshold(candidate) - HYSTERESIS:
                return candidate  // de-escalate after dwell
            else:
                return current_state  // maintain

    return current_state
```

---

## State Profiles

### Full Behavioral Configuration Per State

```typescript
interface StateProfile {
  state: EffortState
  reasoningEffort: 'low' | 'medium' | 'high'
  textVerbosity: 'low' | 'medium' | 'high'
  thinkingBudget: number // tokens
  allowedAgentTiers: AgentCost[] // which agent tiers can be delegated to
  maxConcurrentAgents: number
  toolOutputLimit: number // max tokens for tool output
  contextReservation: number // percentage to reserve
  compactionTrigger: number // percentage to trigger compaction
  tokenBudgetCeiling: number // max tokens to spend per message
  budgetAllocation: {
    thinking: number // percentage of budget
    tools: number
    agents: number
    context: number
  }
}
```

### Default Profiles

| Field                       | TRIVIAL | STANDARD      | ELEVATED                 | INTENSIVE                | DEEP_WORK                |
| --------------------------- | ------- | ------------- | ------------------------ | ------------------------ | ------------------------ |
| `reasoningEffort`           | low     | medium        | medium                   | high                     | high                     |
| `textVerbosity`             | low     | medium        | high                     | high                     | high                     |
| `thinkingBudget`            | 0       | 8000          | 16000                    | 24000                    | 32000                    |
| `allowedAgentTiers`         | [FREE]  | [FREE, CHEAP] | [FREE, CHEAP, EXPENSIVE] | [FREE, CHEAP, EXPENSIVE] | [FREE, CHEAP, EXPENSIVE] |
| `maxConcurrentAgents`       | 0       | 1             | 2                        | 3                        | 4                        |
| `toolOutputLimit`           | 5000    | 15000         | 30000                    | 50000                    | 80000                    |
| `contextReservation`        | 0.10    | 0.15          | 0.20                     | 0.25                     | 0.30                     |
| `compactionTrigger`         | 0.85    | 0.80          | 0.75                     | 0.70                     | 0.65                     |
| `tokenBudgetCeiling`        | 2000    | 8000          | 20000                    | 40000                    | 80000                    |
| `budgetAllocation.thinking` | 0.00    | 0.30          | 0.35                     | 0.40                     | 0.40                     |
| `budgetAllocation.tools`    | 0.70    | 0.35          | 0.25                     | 0.20                     | 0.15                     |
| `budgetAllocation.agents`   | 0.00    | 0.25          | 0.30                     | 0.30                     | 0.35                     |
| `budgetAllocation.context`  | 0.30    | 0.10          | 0.10                     | 0.10                     | 0.10                     |

---

## Budget Calculator

### Per-Message Budget Allocation

```
function allocateBudget(
  stateProfile: StateProfile,
  contextEstimate: number,
  contextLimit: number
): Budget {
  remainingRatio = 1 - (contextEstimate / contextLimit)
  totalBudget = stateProfile.tokenBudgetCeiling * remainingRatio

  // Scale down if context is getting tight
  if remainingRatio < 0.3:
    totalBudget *= remainingRatio  // aggressive scaling

  return {
    thinking: floor(totalBudget * stateProfile.budgetAllocation.thinking)
    tools:    floor(totalBudget * stateProfile.budgetAllocation.tools)
    agents:   floor(totalBudget * stateProfile.budgetAllocation.agents)
    context:  floor(totalBudget * stateProfile.budgetAllocation.context)
    total:    totalBudget
  }
}
```

### Session Budget Tracking

```
sessionSpend = {
  thinking: 0,
  tools: 0,
  agents: 0,
  total: 0
}

// After each message:
sessionSpend.thinking += estimatedThinkingTokens
sessionSpend.tools    += estimatedToolOutputTokens
sessionSpend.agents   += estimatedAgentTokens
sessionSpend.total     = sum of above

budgetPressure = sessionSpend.total / (contextLimit * 0.8)
// 0.8 because we want to trigger pressure before hitting actual limit

if budgetPressure > 0.8:
    activate micro-directive: "compact-early"
    activate micro-directive: "context-frugality"
```

---

## Thermocline Detector

### Sliding Window

Maintains a window of the last W effort scores (W=5 by default):

```
window: number[] = []  // length ≤ W

function updateWindow(score: number):
    window.push(score)
    if window.length > W:
        window.shift()
```

### Detection Algorithm

```
function detectThermocline(): ThermoclineResult {
    if window.length < 3:
        return { detected: false, direction: null, magnitude: 0 }

    // Calculate deltas between consecutive scores
    deltas = []
    for i in [1, window.length):
        deltas.push(window[i] - window[i-1])

    mu    = mean(deltas)
    sigma = stddev(deltas)

    // Check recent deltas for large shifts
    recentDelta = deltas[deltas.length - 1]

    if sigma < 0.01:
        return { detected: false, direction: null, magnitude: 0 }

    // Detect if any delta in last 3 messages exceeds 2σ
    for i in [max(0, deltas.length - 3), deltas.length):
        if |deltas[i]| > SENSITIVITY * sigma:
            direction = deltas[i] > 0 ? "ascending" : "descending"
            magnitude = |deltas[i]| / sigma
            return { detected: true, direction, magnitude }

    return { detected: false, direction: null, magnitude: 0 }
}
```

### Thermocline Response

```
if thermocline.detected:
    if thermocline.direction == "ascending":
        // Escalate aggressively — skip intermediate states
        targetState = min(currentState.index + clamp(thermocline.magnitude, 1, 2), 4)
        overrideDwellTime = true  // allow immediate escalation
    elif thermocline.direction == "descending":
        // De-escalate cautiously — one step at a time
        targetState = max(currentState.index - 1, 0)
        // Still requires minimum dwell time
```

---

## Pattern Crystallization Engine

### Pattern Recording

Every state transition is recorded:

```typescript
interface TransitionRecord {
  fromState: EffortState
  toState: EffortState
  signalSnapshot: number[] // 12 signal values at transition time
  messageIndex: number
  timestamp: number
}
```

### Crystallization Logic

```
function attemptCrystallization(history: TransitionRecord[]): CrystallizedPattern | null {
    // Group transitions by (fromState, toState)
    groups = groupBy(history, (t) => [t.fromState, t.toState])

    for group in groups:
        if group.length < CRYSTALLIZATION_THRESHOLD (3):
            continue

        // Check signal similarity within group
        centroids = group.map(t => t.signalSnapshot)
        avgCentroid = mean(centroids)

        similarities = centroids.map(c => cosineSimilarity(c, avgCentroid))
        avgSimilarity = mean(similarities)

        if avgSimilarity > 0.8:
            return {
                fromState: group[0].fromState,
                toState: group[0].toState,
                signalSignature: avgCentroid,
                confidence: avgSimilarity,
                occurrences: group.length,
                lastSeen: Date.now()
            }

    return null
}
```

### Pattern Matching

```
function matchCrystallizedPattern(
    currentSignals: number[],
    currentState: EffortState,
    patterns: CrystallizedPattern[]
): CrystallizedPattern | null {
    candidates = patterns.filter(p => p.fromState == currentState)
    if candidates.length == 0:
        return null

    bestMatch = null
    bestScore = 0

    for pattern in candidates:
        similarity = cosineSimilarity(currentSignals, pattern.signalSignature)
        if similarity > 0.75 AND similarity > bestScore:
            bestMatch = pattern
            bestScore = similarity

    return bestMatch
}
```

### Pattern Decay

```
function decayPatterns(patterns: CrystallizedPattern[], currentMessageIndex: number): CrystallizedPattern[] {
    return patterns.filter(p =>
        (currentMessageIndex - p.lastSeenMessageIndex) < PATTERN_DECAY_MESSAGES (20)
    )
}

// Enforce max patterns with FIFO eviction
if patterns.length > MAX_CRYSTALLIZED_PATTERNS (5):
    patterns.sort((a, b) => b.lastSeen - a.lastSeen)  // newest first
    patterns = patterns.slice(0, MAX_CRYSTALLIZED_PATTERNS)
```

### Cosine Similarity

```
function cosineSimilarity(a: number[], b: number[]): number {
    dot = Σ(a[i] * b[i])
    magA = sqrt(Σ(a[i]²))
    magB = sqrt(Σ(b[i]²))
    return magA > 0 AND magB > 0 ? dot / (magA * magB) : 0
}
```

---

## Feedback Loop

After each message, evaluate the outcome of the current state:

```
function evaluateOutcome(
    state: EffortState,
    messageResult: MessageResult
): OutcomeScore {
    // Positive signals (state was appropriate)
    good = 0
    if messageResult.taskCompleted: good += 2
    if messageResult.noErrors: good += 1
    if messageResult.messagesUsed <= expectedMessages(state): good += 1

    // Negative signals (state was wrong)
    bad = 0
    if messageResult.hadErrors: bad += 1
    if messageResult.usedExpensiveAgentForSimpleTask: bad += 2
    if messageResult.messagesUsed > expectedMessages(state) * 2: bad += 1
    if messageResult.userCorrected: bad += 3

    return { score: good - bad, good, bad }
}
```

### Weight Adjustment

```
// After evaluating outcome, adjust signal weights
function adjustWeights(
    weights: Record<SignalName, number>,
    signals: SignalVector,
    outcome: OutcomeScore
): Record<SignalName, number> {
    LEARNING_RATE = 0.01

    for signal in signals:
        if outcome.score > 0:
            // This signal contributed to a good decision — increase its weight
            weights[signal.name] += LEARNING_RATE * signal.value * outcome.score
        elif outcome.score < 0:
            // This signal contributed to a bad decision — decrease its weight
            weights[signal.name] -= LEARNING_RATE * signal.value * |outcome.score|

    // Re-normalize weights to sum to 1.0
    total = Σ(weights.values())
    for key in weights:
        weights[key] /= total

    return weights
}
```

---

## Compaction Survival

### Serialization Format

On `experimental.session.compacting`, serialize router state:

```typescript
interface EffortRouterSerializedState {
  version: 1
  currentState: EffortState
  messageIndex: number
  transitionHistory: TransitionRecord[] // last 10 transitions
  crystallizedPatterns: CrystallizedPattern[]
  markovMatrix: number[][] // 5×5 matrix
  markovCounts: number[][] // 5×5 raw counts
  sessionSpend: BudgetSpend
  signalWeights: Record<string, number>
  activeDirectives: MicroDirective[]
}
```

### Injection Strategy

The serialized state is injected as a structured block into the compaction context:

```
[EFFORT_ROUTER_STATE]
<json>
{
  "version": 1,
  "currentState": "ELEVATED",
  "messageIndex": 42,
  "crystallizedPatterns": [...],
  ...
}
</json>
[/EFFORT_ROUTER_STATE]
```

### Rehydration

On session restore, the router hook scans the compaction context for the `EFFORT_ROUTER_STATE` block and rehydrates:

```
function rehydrate(compactionContext: string): EffortRouterState | null {
    match = compactionContext.match(/\[EFFORT_ROUTER_STATE\]([\s\S]*?)\[\/EFFORT_ROUTER_STATE\]/)
    if !match: return null

    try:
        data = JSON.parse(match[1].trim())
        // Validate version
        if data.version != 1: return null
        return deserializeState(data)
    catch:
        return null
}
```

---

## Hook Integration Points

### Hook 1: Signal Extraction (`chat.message`)

```
Priority: 60 (runs early, before other hooks)
Input: message parts from chat event
Output: Populates SignalContext for the session
Side effects: Updates session signal history
```

### Hook 2: Parameter Application (`chat.params`)

```
Priority: 10 (runs late, after think-mode hook)
Input: Current chat params (variant, thinking, model options)
Output: Modified params based on current state profile
Side effects: Applies reasoningEffort, textVerbosity, thinkingBudget overrides
Note: Must coexist with think-mode hook — effort router defers to explicit think mode
```

### Hook 3: Feedback Collection (`tool.execute.after`)

```
Priority: 30
Input: Tool name, input, output, success/failure
Output: Updates session error history, tool call records, edit records
Side effects: Feeds signal extractors for next classification
```

### Hook 4: Compaction Survival (`experimental.session.compacting`)

```
Priority: 50
Input: Session compaction event
Output: Injects EFFORT_ROUTER_STATE block into compaction context
Side effects: Serializes all router state for rehydration
```

### Hook 5: System Prompt Injection (`experimental.chat.system.transform`)

```
Priority: 40
Input: System prompt
Output: Appends active micro-directives as behavioral instructions
Side effects: None — read-only on the prompt, appends directive text
```

### Coexistence with Existing Systems

| Existing System                                | Interaction                                                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Think mode**                                 | Effort router defers to explicit think mode activation. If think mode is active, router's `thinkingBudget` override is suppressed.                                        |
| **Mode detection** (blitzkrieg/search/analyze) | Explicit modes override effort router state. Router continues tracking signals but doesn't apply overrides.                                                               |
| **Context window monitor**                     | Router reads context monitor's estimates as input to `contextPressure` signal. Router's compaction trigger works alongside monitor's warnings.                            |
| **Model switcher**                             | Router's `allowedAgentTiers` respects model switcher's current configuration. Router never changes the primary model — only suggests tier restrictions.                   |
| **Tool output truncator**                      | Router's `toolOutputLimit` per state feeds into the truncator's per-tool limits. Router's limits are ceilings; truncator's per-tool limits are always ≤ router's ceiling. |

---

## Performance Characteristics

### Per-Message Overhead

| Operation                      | Time Complexity   | Space            | Notes                              |
| ------------------------------ | ----------------- | ---------------- | ---------------------------------- |
| Signal extraction (12 signals) | O(1) each         | O(1) each        | Bounded by fixed-size windows      |
| Composite score calculation    | O(12)             | O(1)             | Weighted sum                       |
| Markov prediction              | O(25)             | O(25)            | 5×5 matrix lookup                  |
| Rules fallback                 | O(1)              | O(1)             | Threshold comparison               |
| Thermocline detection          | O(W) where W=5    | O(W)             | Sliding window                     |
| Pattern matching               | O(P×12) where P≤5 | O(P)             | Cosine similarity against patterns |
| Budget allocation              | O(1)              | O(1)             | Simple arithmetic                  |
| **Total per message**          | **O(1)**          | **< 1KB growth** | **< 2ms wall time**                |

### Memory Growth

- **Per session**: ~2KB initial + ~100 bytes per message (signal history, transition records)
- **Pattern store**: ~200 bytes per crystallized pattern, max 5 = ~1KB
- **Markov matrix**: Fixed 25 floats = 100 bytes
- **Total per session after 50 messages**: ~10KB

### Compaction Survival Overhead

- Serialization: O(P + T) where P=patterns, T=transitions
- Serialized size: ~1-3KB
- Rehydration: O(P + T) parse + validate
