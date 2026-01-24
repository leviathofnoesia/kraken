/**
 * Prompt Manifest Constants
 * Provides hash keys for looking up compressed prompts.
 * Implementation note: The actual prompt manifest loader
 * will be provided by the plugin system at runtime.
 * These constants reference the 16-bit hash keys.
 */

/**
 * ORACLE - Strategic technical advisor
 * Hash: 247d
 * Original: 598 tokens
 * Upgraded: ~420 tokens (30% reduction)
 */
export const ORACLE_PROMPT = '247d'

/**
 * METIS - Pre-planning consultant
 * Hash: 03f3
 * Original: 286 tokens
 * Upgraded: ~350 tokens (decision-tree logic)
 */
export const METIS_PROMPT = '03f3'

/**
 * MOMUS - Work plan reviewer
 * Hash: b2fc
 * Original: 69 tokens
 * Upgraded: ~280 tokens (SOLID principles framework)
 */
export const MOMUS_PROMPT = 'b2fc'

/**
 * PROMETHEUS - Strategic planner
 * Hash: 5432
 * Original: 359 tokens
 * Upgraded: ~280 tokens (constraint satisfaction theory)
 */
export const PROMETHEUS_PROMPT = '5432'

/**
 * BUILD_SYSTEM - Build mode reminder
 * Hash: f97d
 * Original: 255 tokens
 * Upgraded: ~220 tokens (error recovery focus)
 */
export const BUILD_SYSTEM_PROMPT = 'f97d'

/**
 * PLAN_SYSTEM - Plan mode reminder
 * Hash: f9a5
 * Original: 282 tokens
 * Upgraded: ~240 tokens (constraint satisfaction)
 */
export const PLAN_SYSTEM_PROMPT = 'f9a5'

/**
 * KRAKEN_JUNIOR - Focused executor
 * Hash: 3cbb
 * Original: 348 tokens
 * Upgraded: ~260 tokens (reduced instructions)
 */
export const KRAKEN_JUNIOR_PROMPT = '3cbb'

/**
 * CONTINUATION - Ralph loop iteration
 * Hash: 32ad
 * Original: 68 tokens
 * Upgraded: ~55 tokens (state persistence framework)
 */
export const CONTINUATION_PROMPT = '32ad'

/**
 * SUMMARIZE_CONTEXT - Compaction context injection
 * Hash: e01b
 * Original: 191 tokens
 * Upgraded: ~160 tokens (relevance scoring)
 */
export const SUMMARIZE_CONTEXT_PROMPT = 'e01b'

/**
 * KRAKEN_CONTINUATION - Kraken orchestrator continuation
 * Hash: 33dd
 * Original: 83 tokens
 * Upgraded: ~70 tokens (deadlock resolution framework)
 */
export const KRAKEN_CONTINUATION_PROMPT = '33dd'

/**
 * ANTIGRAVITY - Antigravity system prompt
 * Hash: 319d
 * Original: 326 tokens
 * Upgraded: ~280 tokens (slightly reworded)
 */
export const ANTIGRAVITY_PROMPT = '319d'

/**
 * MAELSTROM - Strategic advisor (Oracle variant)
 * Hash: 0cc1
 * Original: 598 tokens
 * Upgraded: Same as Oracle (~420 tokens)
 */
export const MAELSTROM_PROMPT = '0cc1'

/**
 * LEVIATHAN - Sea architect
 * Hash: 2151
 * Original: 268 tokens
 * Same as original (no changes needed)
 */
export const LEVIATHAN_PROMPT = '2151'

/**
 * POSEIDON - Pre-planning consultant (Metis variant)
 * Hash: 071c
 * Original: 217 tokens
 * Same as Metis (~350 tokens)
 */
export const POSEIDON_PROMPT = '071c'

/**
 * SCYLLA - Plan reviewer (Momus variant)
 * Hash: 594a
 * Original: 887 tokens
 * Same as Momus (~280 tokens)
 */
export const SCYLLA_PROMPT = '594a'

/**
 * KRAKEN - Orchestrator
 * Hash: a899
 * Original: 538 tokens
 * Upgraded: ~380 tokens
 */
export const KRAKEN_PROMPT = 'a899'
