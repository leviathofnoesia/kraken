# Effort Router — Product Requirements Document

## Problem Statement

Kraken operates at roughly uniform effort regardless of task complexity. A "fix typo" request receives the same agent delegation, context budget, and thinking tokens as "design a distributed caching layer." This wastes tokens on easy tasks and under-invests in hard ones.

Concretely:

- **Trivial tasks over-spend**: A 2-line fix consumes the same thinking budget and agent consultation overhead as a cross-module refactor.
- **Complex tasks under-invest**: Architecture decisions get standard reasoning depth when they need extended thinking and multi-agent consultation.
- **Context exhaustion is reactive**: The context window monitor warns at 70%, but nothing proactively adjusts behavior to prevent hitting that threshold.
- **Mode system is binary**: You're either in a named mode (blitzkrieg, think, analyze) or you're not. There's no gradual, automatic calibration.

## Vision

An **Effort Router** — a real-time behavioral orchestrator that reads signals from the conversation, classifies the current effort state, and dynamically adjusts:

1. **Model selection** — Which tier of model to use for delegation
2. **Thinking budget** — How many reasoning tokens to allocate
3. **Agent delegation depth** — Which agents are available and how many can run concurrently
4. **Tool access** — Output truncation thresholds, context allocation
5. **Compaction timing** — When to trigger compaction based on budget pressure

The router layers on top of the existing mode system, model switcher, and context window monitor — using them as inputs and sinks rather than replacing them.

## Behavioral State Model

Five effort states, each defining a complete behavioral profile:

| State         | Description                         | Typical Tasks                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------------ |
| **TRIVIAL**   | Single-step, no ambiguity           | Fix typo, rename variable, add comment                       |
| **STANDARD**  | Multi-step, clear path              | Add function, update config, small refactor                  |
| **ELEVATED**  | Multi-file, requires judgment       | Feature addition, API design, cross-module change            |
| **INTENSIVE** | High complexity, multiple unknowns  | Architecture decision, performance optimization, integration |
| **DEEP_WORK** | Maximum effort, sustained reasoning | System redesign, distributed systems design, security audit  |

States transition based on **signal accumulation**, not single triggers. The classifier uses a Markov transition model with rules-based fallback.

### Transition Properties

- **Inertia**: State changes require crossing a threshold + hysteresis buffer (0.05) to prevent thrashing
- **Monotonic escalation**: During a single task, effort tends to escalate (TRIVIAL → STANDARD → ELEVATED). De-escalation requires explicit completion signals.
- **Session scope**: Each session starts fresh. No cross-session state leakage.

## Decision Surface

The router controls the following parameters per state:

| Parameter                  | TRIVIAL   | STANDARD     | ELEVATED | INTENSIVE | DEEP_WORK |
| -------------------------- | --------- | ------------ | -------- | --------- | --------- |
| `reasoningEffort`          | `low`     | `medium`     | `medium` | `high`    | `high`    |
| `textVerbosity`            | `low`     | `medium`     | `high`   | `high`    | `high`    |
| `thinking.budgetTokens`    | 0         | 8000         | 16000    | 24000     | 32000     |
| Allowed agent tiers        | FREE only | FREE + CHEAP | All      | All       | All       |
| Max concurrent agents      | 0         | 1            | 2        | 3         | 4         |
| Tool output limit (tokens) | 5K        | 15K          | 30K      | 50K       | 80K       |
| Context reservation (%)    | 10%       | 15%          | 20%      | 25%       | 30%       |
| Compaction trigger         | 85%       | 80%          | 75%      | 70%       | 65%       |

## Thermocline Detection

In oceanography, a thermocline is a layer where temperature changes rapidly with depth. The Effort Router adapts this concept: a **complexity thermocline** is a point in a conversation where task complexity shifts rapidly.

### How It Works

- Maintains a sliding window of the last 5 effort scores
- Calculates rolling mean (μ) and standard deviation (σ) of score deltas
- A thermocline is detected when `|Δscore| > 2σ` within a 3-message window
- **Ascending thermocline**: "Fix this typo" → "Now redesign the auth system" — triggers immediate escalation
- **Descending thermocline**: Complex architecture discussion → "Great, now update the README" — triggers de-escalation with shorter lag

### Why This Matters

Without thermocline detection, state transitions lag behind reality by 2-3 messages. The thermocline detector catches sudden pivots and triggers immediate reclassification, preventing the router from applying TRIVIAL effort to a DEEP_WORK task.

## Pattern Crystallization

Over a session, the router observes recurring transition patterns:

### Mechanism

1. Records every `(from_state, to_state, trigger_signals)` transition
2. After **3+ identical transitions** with similar signal profiles (cosine similarity > 0.8), crystallizes the pattern
3. Crystallized patterns get priority in classification — they're treated as "known behaviors"

### Example Patterns

| Pattern      | Description                                          | Crystallized Behavior                       |
| ------------ | ---------------------------------------------------- | ------------------------------------------- |
| "Explorer"   | Always starts TRIVIAL, rapidly escalates to ELEVATED | Pre-emptively set STANDARD on first message |
| "Deep Diver" | Starts INTENSIVE, stays there for entire session     | Lock INTENSIVE state, disable de-escalation |
| "Scanner"    | Rapid oscillation between TRIVIAL and STANDARD       | Apply smoothing, bias toward STANDARD       |

### Lifecycle

- Patterns are **session-scoped** — no cross-session persistence
- Patterns **decay** if not reinforced within 20 messages
- Maximum **5 crystallized patterns** per session (FIFO eviction)

## Token Economy

Each state has a **per-message token budget ceiling**:

| State     | Budget Ceiling | Thinking | Tools | Agents | Context |
| --------- | -------------- | -------- | ----- | ------ | ------- |
| TRIVIAL   | 2,000          | 0%       | 70%   | 0%     | 30%     |
| STANDARD  | 8,000          | 30%      | 35%   | 25%    | 10%     |
| ELEVATED  | 20,000         | 35%      | 25%   | 30%    | 10%     |
| INTENSIVE | 40,000         | 40%      | 20%   | 30%    | 10%     |
| DEEP_WORK | 80,000         | 40%      | 15%   | 35%    | 10%     |

### Budget Pressure

The router tracks cumulative token spend per session. When spend exceeds **80% of estimated session budget** (based on model context window), it triggers a "budget pressure" micro-directive that:

1. Downgrades the effort state by one level
2. Reduces tool output limits by 50%
3. Increases compaction trigger sensitivity

## Micro-Directives

Small, composable behavioral overlays that don't warrant a full state change:

| Directive                | Trigger                        | Effect                                 |
| ------------------------ | ------------------------------ | -------------------------------------- |
| `prefer-grep-over-agent` | TRIVIAL state + search task    | Skip agent delegation, use direct grep |
| `compact-early`          | Budget pressure > 80%          | Lower compaction threshold by 15%      |
| `stall-recovery`         | 3+ messages with no file edits | Suggest state reclassification         |
| `suppress-thinking`      | TRIVIAL state confirmed        | Set thinking budget to 0               |
| `agent-escalation`       | Thermocline ascending          | Allow EXPENSIVE agents for 3 messages  |
| `context-frugality`      | Context window > 50%           | Reduce tool output limits by 30%       |

Directives have a TTL (time-to-live) measured in messages, typically 3-5 messages. They stack — multiple directives can be active simultaneously.

## Config Spec

New `effortRouter` section in `~/.config/opencode/kraken-code.json`:

```json
{
  "effortRouter": {
    "enabled": true,
    "defaultState": "STANDARD",
    "rolloutPhase": "shadow",
    "stateProfiles": {
      "TRIVIAL": { "thinkingBudget": 0, "maxConcurrentAgents": 0 },
      "STANDARD": { "thinkingBudget": 8000, "maxConcurrentAgents": 1 }
    },
    "thermoclineSensitivity": 2.0,
    "thermoclineWindowSize": 5,
    "crystallizationThreshold": 3,
    "maxCrystallizedPatterns": 5,
    "patternDecayMessages": 20,
    "signalWeights": {
      "messageLength": 0.08,
      "toolCallCount": 0.1,
      "editFileCount": 0.12,
      "agentDelegationDepth": 0.12,
      "errorRate": 0.08,
      "contextPressure": 0.1,
      "taskNovelty": 0.08,
      "domainComplexity": 0.12,
      "conversationDepth": 0.05,
      "userUrgencySignal": 0.05,
      "compactionRisk": 0.05,
      "stallRate": 0.05
    },
    "disabledMicroDirectives": [],
    "logging": {
      "logDecisions": true,
      "logSignals": false,
      "logTransitions": true
    }
  }
}
```

### Config Fields

| Field                      | Type     | Default     | Description                                 |
| -------------------------- | -------- | ----------- | ------------------------------------------- |
| `enabled`                  | boolean  | true        | Master toggle                               |
| `defaultState`             | enum     | "STANDARD"  | Starting state for new sessions             |
| `rolloutPhase`             | enum     | "shadow"    | "shadow" \| "conservative" \| "full"        |
| `stateProfiles`            | object   | (see table) | Override individual state profiles          |
| `thermoclineSensitivity`   | number   | 2.0         | Standard deviations for thermocline trigger |
| `thermoclineWindowSize`    | number   | 5           | Messages in sliding window                  |
| `crystallizationThreshold` | number   | 3           | Transitions before pattern crystallizes     |
| `maxCrystallizedPatterns`  | number   | 5           | Maximum crystallized patterns per session   |
| `patternDecayMessages`     | number   | 20          | Messages before unused pattern decays       |
| `signalWeights`            | object   | (see above) | Weight per signal (must sum to 1.0)         |
| `disabledMicroDirectives`  | string[] | []          | Micro-directives to disable                 |
| `logging.logDecisions`     | boolean  | true        | Log state classification decisions          |
| `logging.logSignals`       | boolean  | false       | Log raw signal values                       |
| `logging.logTransitions`   | boolean  | true        | Log state transitions                       |

## Expected Outcomes

| Metric                               | Target | Measurement                                                          |
| ------------------------------------ | ------ | -------------------------------------------------------------------- |
| Token reduction on trivial tasks     | 30-50% | Compare token usage with/without router on known-trivial tasks       |
| Quality improvement on complex tasks | 15-25% | Measure by: fewer follow-up corrections, fewer error recovery cycles |
| Context window exhaustion incidents  | -60%   | Count sessions hitting 70% threshold before router vs after          |
| State classification accuracy        | >85%   | Manual review of classification decisions in shadow mode             |
| Per-message overhead                 | <2ms   | Time signal extraction + classification per message                  |
| False thermocline triggers           | <5%    | Rate of thermocline detections followed by immediate reversion       |

## Risks

| Risk                                     | Impact                                  | Likelihood | Mitigation                                                                            |
| ---------------------------------------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| Over-classification (false thermoclines) | Wasted tokens on unnecessary escalation | Medium     | Hysteresis buffer + 3-message confirmation window                                     |
| State thrashing on ambiguous tasks       | Fluctuating behavior confuses user      | Medium     | Minimum dwell time (3 messages) before de-escalation                                  |
| Latency from signal computation          | Slower response times                   | Low        | All signals are O(1), total overhead <2ms                                             |
| Config complexity explosion              | Users misconfigure and get bad behavior | Medium     | Sensible defaults, shadow mode for safe rollout                                       |
| Interaction with existing modes          | Blitzkrieg + Effort Router conflicts    | Medium     | Effort Router respects explicit mode activations, only applies when no mode is active |
| Markov cold start                        | No transition data early in session     | High       | Rules fallback when Markov confidence < 0.6                                           |
