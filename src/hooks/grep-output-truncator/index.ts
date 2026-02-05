import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'

/**
 * Configuration for the Grep Output Truncator Hook
 */
export interface GrepOutputTruncatorConfig {
  /** Maximum number of tokens to allow in output before truncation (default: 50000) */
  maxTokens?: number
  /** Percentage of context to keep as headroom (default: 0.5 = 50%) */
  headroomRatio?: number
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<GrepOutputTruncatorConfig> = {
  maxTokens: 50000,
  headroomRatio: 0.5,
}

/**
 * Estimate token count by approximating 4 characters per token
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Truncate grep output by line count
 */
function truncateGrepOutput(output: string, maxTokens: number, headroomRatio: number): string {
  // headroomRatio is fraction of tokens to keep as headroom (reserve)
  const usableTokens = maxTokens * (1 - headroomRatio)
  const maxChars = Math.floor(usableTokens * 4)

  if (output.length <= maxChars) {
    return output
  }

  const lines = output.split('\n')
  const charCountLimit = maxChars
  let currentCount = 0
  let truncateIndex = lines.length

  for (let i = 0; i < lines.length; i++) {
    currentCount += lines[i].length + 1 // +1 for newline
    if (currentCount > charCountLimit) {
      truncateIndex = i
      break
    }
  }

  if (truncateIndex === lines.length) {
    return output
  }

  const truncated = lines.slice(0, truncateIndex).join('\n')
  const omittedLines = lines.length - truncateIndex
  const estimatedTokens = Math.ceil(output.length / 4)

  return (
    `${truncated}\n\n` +
    `[Grep output truncated: ${estimatedTokens.toLocaleString()} tokens estimated, ` +
    `${omittedLines.toLocaleString()} matches omitted]`
  )
}

/**
 * Hook implementation
 */
async function grepToolExecuteAfter(
  input: any,
  output: any,
  config: Required<GrepOutputTruncatorConfig>,
) {
  // Only process the grep tool
  if (input.tool !== 'grep') {
    return
  }

  // Process the output - check for common output structures
  if (output?.content && Array.isArray(output.content)) {
    output.content = output.content.map((content: any) => {
      if (typeof content === 'string') {
        return truncateGrepOutput(content, config.maxTokens, config.headroomRatio)
      }
      return content
    })
  } else if (output?.output && typeof output.output === 'string') {
    output.output = truncateGrepOutput(output.output, config.maxTokens, config.headroomRatio)
  }
}

/**
 * Create the Grep Output Truncator hook
 */
export function createGrepOutputTruncatorHook(
  _input: PluginInput,
  options?: { config?: GrepOutputTruncatorConfig },
): Hooks {
  const finalConfig = { ...DEFAULT_CONFIG, ...options?.config }

  return {
    'tool.execute.after': async (toolInput: any, toolOutput: any) => {
      await grepToolExecuteAfter(toolInput, toolOutput, finalConfig)
    },
  }
}

/**
 * Create base hook using standard hook pattern
 */
export function createHook(
  input: PluginInput,
  options?: { config?: GrepOutputTruncatorConfig },
): Hooks {
  return createGrepOutputTruncatorHook(input, options)
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'grep-output-truncator',
  priority: 41,
  description: 'Truncates grep tool output by line count to prevent context window overflow',
} as const
