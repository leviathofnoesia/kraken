/**
 * Thinking Budget Optimizer Hook
 *
 * Optimizes thinking budgets based on task complexity classification.
 * Simple tasks get smaller budgets, complex tasks get larger budgets.
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import { SHOULD_LOG, createLogger } from '../../utils/logger'

const logger = createLogger('thinking-budget-optimizer')

export interface ThinkingBudgetOptimizerConfig {
  enabled?: boolean
  model?: string // Model to use for thinking
  budgets?: {
    simple?: number      // Simple edits, searches (default: 4000)
    medium?: number     // Medium complexity (default: 8000)
    complex?: number    // Complex planning, refactoring (default: 16000)
    full?: number       // Maximum thinking (default: 32000)
  }
  autoClassify?: boolean // Use keyword classification
}

// Keywords for task complexity classification
const SIMPLE_KEYWORDS = [
  'fix', 'bug', 'typo', 'rename', 'format', 'lint',
  'update', 'add', 'remove', 'delete', 'create simple',
  'write test', 'add test', 'check', 'find',
]

const MEDIUM_KEYWORDS = [
  'implement', 'feature', 'add functionality', 'modify',
  'refactor small', 'improve', 'optimize', 'add support',
  'integrate', 'migrate', 'update multiple',
]

const COMPLEX_KEYWORDS = [
  'refactor', 'redesign', 'rebuild', 'architect',
  'design system', 'complex', 'comprehensive',
  'multi-module', 'cross-cutting', 'security audit',
  'performance optimization', 'scalability',
]

const DEFAULT_CONFIG: ThinkingBudgetOptimizerConfig = {
  enabled: true,
  model: undefined,
  budgets: {
    simple: 4000,
    medium: 8000,
    complex: 16000,
    full: 32000,
  },
  autoClassify: true,
}

/**
 * Classify task complexity based on keywords
 */
function classifyTaskComplexity(userMessage: string): 'simple' | 'medium' | 'complex' | 'full' {
  const normalized = userMessage.toLowerCase()

  // Check for explicit thinking mode keywords
  if (normalized.includes('ultrathink') || normalized.includes('deep think')) {
    return 'full'
  }

  // Count matches for each complexity level
  let simpleCount = 0
  let mediumCount = 0
  let complexCount = 0

  for (const keyword of SIMPLE_KEYWORDS) {
    if (normalized.includes(keyword)) simpleCount++
  }

  for (const keyword of MEDIUM_KEYWORDS) {
    if (normalized.includes(keyword)) mediumCount++
  }

  for (const keyword of COMPLEX_KEYWORDS) {
    if (normalized.includes(keyword)) complexCount++
  }

  // Determine complexity based on highest match count
  if (complexCount > mediumCount && complexCount > simpleCount) {
    return 'complex'
  } else if (mediumCount > simpleCount) {
    return 'medium'
  } else if (simpleCount > 0) {
    return 'simple'
  }

  // Default to medium if no keywords match
  return 'medium'
}

/**
 * Get thinking budget for complexity level
 */
function getBudgetForComplexity(
  complexity: 'simple' | 'medium' | 'complex' | 'full',
  config: ThinkingBudgetOptimizerConfig,
): number {
  const budgets = config.budgets
  const defaultBudgets = DEFAULT_CONFIG.budgets!
  const resolved = budgets || defaultBudgets
  return (resolved[complexity] ?? resolved.medium ?? 8000) as number
}

/**
 * Process chat params to optimize thinking budget
 */
async function processChatParams(
  input: any,
  config: typeof DEFAULT_CONFIG,
): Promise<any> {
  if (!config.enabled || !config.autoClassify) {
    return input
  }

  try {
    // Get the user message
    const messages = input.messages || []
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage || lastMessage.role !== 'user') {
      return input
    }

    // Extract text content
    let promptText = ''
    if (typeof lastMessage.content === 'string') {
      promptText = lastMessage.content
    } else if (Array.isArray(lastMessage.content)) {
      promptText = lastMessage.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n')
    }

    if (!promptText) {
      return input
    }

    // Classify task complexity
    const complexity = classifyTaskComplexity(promptText)
    const budget = getBudgetForComplexity(complexity, config)

    // Get current thinking config
    const currentThinking = input.thinking?.budgetTokens ?? input.thinking?.budget ?? 32000

    // Only modify if current budget is higher than recommended
    // This allows explicit user requests to override automatic optimization
    if (currentThinking > budget) {
      // Set optimized thinking budget
      if (!input.thinking) {
        input.thinking = {}
      }
      input.thinking.budgetTokens = budget
      input.thinking.type = 'enabled'

      // Add metadata
      if (!input.metadata) {
        input.metadata = {}
      }
      input.metadata.thinkingOptimized = true
      input.metadata.thinkingComplexity = complexity
      input.metadata.thinkingBudgetOriginal = currentThinking
      input.metadata.thinkingBudgetOptimized = budget

      if (SHOULD_LOG) {
        logger.debug(`Thinking budget optimized: ${currentThinking} → ${budget} (${complexity})`)
      }
    }
  } catch (error) {
    logger.error('Error in thinking budget optimization:', error)
  }

  return input
}

/**
 * Create thinking budget optimizer hook
 */
export function createThinkingBudgetOptimizerHook(
  _input: PluginInput,
  options?: { config?: ThinkingBudgetOptimizerConfig },
): Hooks {
  const config = { ...DEFAULT_CONFIG, ...options?.config }

  return {
    'chat.params': async (input: any, output: any) => {
      if (!config.enabled) return

      // Process and optimize thinking budget
      await processChatParams(input, config)

      return
    },
  }
}

/**
 * Create base hook using standard pattern
 */
export function createHook(input: PluginInput, options?: { config?: ThinkingBudgetOptimizerConfig }): Hooks {
  return createThinkingBudgetOptimizerHook(input, options)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'thinking-budget-optimizer',
  priority: 45, // Run before prompt compression
  description: 'Optimizes thinking budgets based on task complexity',
}

/**
 * Classify task complexity (exported for testing)
 */
export function classifyTask(message: string): 'simple' | 'medium' | 'complex' | 'full' {
  return classifyTaskComplexity(message)
}
