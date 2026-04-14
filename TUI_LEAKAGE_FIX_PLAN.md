# TUI LEAKAGE ELIMINATION PLAN

## Executive Summary

**Comprehensive solution to eliminate ALL TUI leakage in OpenCode + kraken-code**

This plan addresses **THREE distinct sources** of TUI leakage:

1. **Kraken-code hooks** - 130+ unguarded console statements (our code, fixable)
2. **OpenCode core** - Agent lookup errors showing through TUI (external, requires reporting)
3. **Agent name mismatch** - causing OpenCode crashes that output errors (just fixed)

---

## Root Cause Analysis

### Issue 0: Dead Fake Tool (MUST DELETE) 🔴

**Problem**: Confusing duplicate/unused tool that does nothing

**Evidence**:

```typescript
// src/tools/agent-call.ts - FAKE TOOL
export const call_kraken_agent = tool({
  async execute(args): Promise<string> {
    const { agent, task } = args
    const response = `Calling @${agent.toLowerCase()} for task: ${task || defaultTask}`
    return response // ← Just returns a string! Does nothing!
  },
})

// src/index.ts:188 - Registered as builtin tool
builtinTools = {
  // ... other tools ...
  'call-kraken-agent': call_kraken_agent, // ← Dead code!
}
```

**Why This is Bad**:

1. ❌ Does nothing - just returns a formatted string, never actually calls an agent
2. ❌ Confusing - exists alongside REAL `call_agent` tool from background-agent feature
3. ❌ Dead code - not used by any system, just wastes memory/complexity
4. ❌ Creates confusion for users - "Which one should I use?"

**Real Tool**:

```typescript
// src/features/background-agent/tool.ts - REAL TOOL
// Actually calls OpenCode API to create sessions
await context.client.session.prompt({
  body: { agent, parts: [{ type: 'text', text: prompt }] },
})
```

**Fix**: Delete `src/tools/agent-call.ts` and remove from `src/index.ts`

---

### Issue 1: Agent Name Mismatch (FIXED ✅)

**Problem**: `call_agent` tool was passing agent names that didn't match config

- Tool enum: `"Poseidon (Plan Consultant)"`, `"Scylla (Plan Reviewer)"`
- Config keys: `"Poseidon"`, `"Scylla"`
- Result: `Agent.get()` returned `undefined` → `undefined.model` crashed OpenCode core
- Error output showed through TUI

**Fix**: Removed parenthetical suffixes from enum values (done)

### Issue 2: Kraken-code Hooks Output Leakage (REMAINING)

**Problem**: 130+ unguarded console statements across 25+ hook files

```typescript
// BAD - Outputs directly to console, shows through TUI
console.log(`[hook-name] Message`)

// GOOD - Uses logger with gating
logger.debug(`Message`) // Only shows when DEBUG=1
```

**Historical Context**:

- Commit e82da86 (Feb 6, 2026): Added SHOULD_LOG guard, fixed 14 files
- Commit fbcb9af (Feb 6, 2026): Removed guards for some critical errors
- Current state: SHOULD_LOG removed from logger.ts, but hooks still have unguarded statements

**Files with Most Violations**:

- session-recovery: 18 statements
- edit-error-recovery: 17 statements
- memory-guard: 14 statements
- session-lifecycle: 13 statements
- thinking-block-validator: 7 statements
- empty-message-sanitizer: 6 statements

### Issue 3: OpenCode Core Output Leakage (EXTERNAL)

**Problem**: OpenCode core outputs error messages to console without gating

- File: `srs/session/prompt.ts:830:34` (note: "srs" not "src" - compiled code)
- Error: `TypeError: undefined is not an object (evaluating 'agent.model')`
- Shows through TUI even when not from kraken-code

**Impact**: We cannot fix OpenCode core directly, but can:

1. Prevent the crash by passing correct agent names (Issue 1 - FIXED ✅)
2. Report the issue to OpenCode maintainers
3. Mitigate by gating our own error handling

---

## Architectural Solution

### Enhanced Logger Design

```typescript
// src/utils/logger.ts

/**
 * Centralized output gating to prevent TUI leakage
 *
 * Output Categories:
 * - DEBUG: Always gated (only when DEBUG=1, ANTIGRAVITY_DEBUG=1, KRAKEN_LOG=1)
 * - INFO: Always gated in production (operational messages)
 * - WARN: Gated unless critical user-facing warnings
 * - ERROR: Never gated (critical errors must be visible)
 */

export const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === '1' ||
  process.env.DEBUG === '1' ||
  process.env.KRAKEN_LOG === '1'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private isDebug: boolean

  constructor(private module: string) {
    this.isDebug = SHOULD_LOG
  }

  debug(...args: any[]): void {
    // Always gated - only for development
    if (this.isDebug) {
      console.log(this.format(LogLevel.DEBUG, ...args))
    }
  }

  info(...args: any[]): void {
    // Gated in production - normal operational messages
    if (this.isDebug) {
      console.log(this.format(LogLevel.INFO, ...args))
    }
  }

  warn(...args: any[]): void {
    // Gated unless critical
    if (this.isDebug) {
      console.warn(this.format(LogLevel.WARN, ...args))
    }
  }

  error(...args: any[]): void {
    // Never gated - critical errors always visible
    console.error(this.format(LogLevel.ERROR, ...args))
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module)
}
```

### Hook Refactoring Pattern

**BEFORE (Causes TUI Leakage)**:

```typescript
export function createEmptyMessageSanitizer(input: PluginInput): Hooks {
  return {
    'chat.message': async (input, output) => {
      console.log(`[empty-message-sanitizer] Detected empty message`)
      console.log(`[empty-message-sanitizer] Reason: ${reason}`)
      // ...
    },
  }
}
```

**AFTER (No TUI Leakage)**:

```typescript
export function createEmptyMessageSanitizer(input: PluginInput): Hooks {
  const logger = createLogger('empty-message-sanitizer')

  return {
    'chat.message': async (input, output) => {
      logger.debug(`Detected empty message`)
      logger.debug(`Reason: ${reason}`)
      // ...
    },
  }
}
```

**CRITICAL EXCEPTIONS (Errors That Must Show)**:

```typescript
// CRITICAL: Never gate these errors
console.error(`[memory-guard] 🔴 EMERGENCY: Memory at ${rss}MB`)
console.error(`[memory-guard] Session will crash soon, start new session`)

// Use logger.debug for non-critical info
logger.debug(`[memory-guard] Current memory usage: ${rss}MB`)
```

---

## Implementation Plan

### Phase 1: Foundation (CRITICAL PATH)

| #   | Task                                         | Owner     | Est. Time | Status   |
| --- | -------------------------------------------- | --------- | --------- | -------- |
| 1.1 | Implement enhanced logger.ts with SHOULD_LOG | Leviathan | 1h        | 🔄 Ready |
| 1.2 | Create logger usage documentation            | Siren     | 1h        | 🔄 Ready |
| 1.3 | ✅ Fix agent name mismatch (DONE)            | Leviathan | 0.5h      | ✅ Done  |

### Phase 2: Hook Refactoring (PARALLELIZABLE)

| #   | Priority | Hook Files                                        | Owner     | Est. Time |
| --- | -------- | ------------------------------------------------- | --------- | --------- |
| 2.1 | HIGH     | session-recovery, edit-error-recovery             | Leviathan | 4h        |
| 2.2 | HIGH     | memory-guard, session-lifecycle                   | Leviathan | 3h        |
| 2.3 | MEDIUM   | thinking-block-validator, empty-message-sanitizer | Leviathan | 2h        |
| 2.4 | LOW      | Remaining 19 hooks                                | Nautilus  | 3h        |

### Phase 3: Prevention & QA

| #   | Task                                      | Owner  | Est. Time |
| --- | ----------------------------------------- | ------ | --------- |
| 3.1 | Create ESLint rule for console statements | Scylla | 2h        |
| 3.2 | Add pre-commit hook for enforcement       | Scylla | 1h        |
| 3.3 | Write integration tests for TUI behavior  | Pearl  | 3h        |
| 3.4 | Update AGENTS.md with logging guidelines  | Siren  | 1h        |
| 3.5 | Manual TUI testing verification           | Pearl  | 1h        |

### Phase 4: OpenCode Core Issue (EXTERNAL)

| #   | Task                                     | Owner | Est. Time |
| --- | ---------------------------------------- | ----- | --------- |
| 4.1 | Document OpenCode core TUI leakage issue | Siren | 1h        |
| 4.2 | Create reproducible bug report           | Siren | 1h        |
| 4.3 | Submit issue to OpenCode repository      | -     | 0.5h      |

---

## Risk Assessment

| Risk                            | Probability | Impact | Mitigation                          |
| ------------------------------- | ----------- | ------ | ----------------------------------- |
| Breaking existing functionality | Medium      | High   | Thorough testing, gradual rollout   |
| Missing critical errors         | High        | High   | Explicit: console.error never gated |
| Performance overhead            | Low         | Low    | Minimal boolean check per log       |
| Future violations               | Medium      | Medium | Pre-commit hook + ESLint rule       |
| OpenCode core not fixed         | High        | Medium | Report issue, provide workaround    |

---

## Verification Plan

### Automated

```bash
# Check no unguarded console statements
bun run lint:console-check

# Run tests
bun test

# Typecheck
bun run typecheck

# Build
bun run build
```

### Manual

```bash
# 1. Test normal operation (no TUI leakage)
opencode
# Trigger hooks, verify NO output in TUI

# 2. Test debug mode (logs visible)
DEBUG=1 opencode
# Trigger hooks, verify logs appear in terminal

# 3. Test critical errors (always visible)
# Force memory exhaustion, verify error shows
```

---

## Success Criteria

### Quantitative

- ✅ 0 unguarded console.log/warn in hooks
- ✅ 100% hooks using logger class
- ✅ 0 TUI leakage incidents post-deployment
- ✅ Agent names match config (no crashes)

### Qualitative

- ✅ Clean TUI experience
- ✅ Critical errors still visible
- ✅ Debug mode works (DEBUG=1)
- ✅ Future violations prevented

---

## Next Steps

**IMMEDIATE (Do Now)**:

1. **DELETE** fake `call_kraken_agent` tool (Phase 0)
2. ✅ **DONE**: Fix agent name mismatch

**CORE FIXES**: 3. Implement enhanced logger.ts (Phase 1.1) 4. Create logger documentation (Phase 1.2) 5. Refactor all hook files (Phase 2)

**PREVENTION**: 6. Add ESLint rule + pre-commit hook (Phase 3) 7. Manual TUI testing (Phase 3.5)

**EXTERNAL**: 8. Document OpenCode core TUI leakage (Phase 4)

**Total Estimated Time**: 18 hours
**Critical Path**: 2.7 hours (Phase 0 + Phase 1)
