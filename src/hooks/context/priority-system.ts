import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import * as path from 'path'

export interface PrioritySystemConfig {
  enabled?: boolean
  maxDistance?: number
}

export interface RuleWithPriority {
  path: string
  priority: number
  content: string
}

function calculateDirectoryDistance(from: string, to: string): number {
  const fromPath = path.resolve(from)
  const toPath = path.resolve(to)

  if (fromPath === toPath) {
    return 0
  }

  const fromParts = fromPath.split(path.sep)
  const toParts = toPath.split(path.sep)

  let commonAncestors = 0
  while (commonAncestors < fromParts.length && commonAncestors < toParts.length) {
    if (fromParts[commonAncestors] !== toParts[commonAncestors]) {
      break
    }
    commonAncestors++
  }

  const upSteps = toParts.length - commonAncestors - 1
  const downSteps = fromParts.length - commonAncestors

  return upSteps + downSteps
}

function assignPriorities(
  rules: Array<{ path: string; content: string }>,
  maxDistance: number,
): RuleWithPriority[] {
  const rulesWithPriority: RuleWithPriority[] = []

  for (const rule of rules) {
    const distance = calculateDirectoryDistance(process.cwd(), rule.path)

    if (distance <= maxDistance) {
      rulesWithPriority.push({
        ...rule,
        priority: distance,
      })
    }
  }

  return rulesWithPriority
}

export function createPrioritySystemHook(
  _input: PluginInput,
  options?: { config?: PrioritySystemConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    maxDistance: 5,
  }

  const priorityCache = new Map<string, number>()

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('\n')
      .trim()
  }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return

      const parts = output.parts || []
      const text = getTextFromParts(parts)

      if (!text) return

      const lines = text.split('\n')
      const rulesSectionRegex = /<rule[^>]*source="([^"]+)"[^>]*>/gi
      const rules: Array<{ path: string; content: string }> = []

      for (const line of lines) {
        const match = line.match(rulesSectionRegex)
        if (match) {
          rules.push({
            path: match[1],
            content: '',
          })
        } else if (rules.length > 0) {
          const lastRule = rules[rules.length - 1]
          lastRule.content += '\n' + line
        }
      }

      if (rules.length === 0) return

      const rulesWithPriority = assignPriorities(rules, config.maxDistance || 5)

      const sortedRules = [...rulesWithPriority].sort((a, b) => a.priority - b.priority)

      if (sortedRules.length > 1) {
        const prioritizedText = sortedRules
          .map((r) => {
            const ruleLines = r.content.split('\n')
            const truncatedLines = ruleLines.slice(0, 10)

            return `<rule source="${r.path}" priority="${r.priority}">
${truncatedLines.join('\n')}
</rule>`
          })
          .join('\n\n')

        const existingText = text.replace(/<rule[^>]*>[\s\S]*?<\/rule>/gi, '')

        output.parts = [
          { type: 'text' as const, text: `${prioritizedText}\n\n${existingText}` } as any,
        ]
      }
    },
  }
}
