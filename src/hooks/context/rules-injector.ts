import * as fs from 'fs'
import * as path from 'path'
import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import { z } from 'zod'

const RULE_EXTENSION = '.md'
const RULE_EXTENSIONS = ['.md', '.mdc']

export interface RuleFile {
  path: string
  content: string
  frontmatter: RuleFrontmatter
  rules: string[]
}

export interface RuleFrontmatter {
  globs?: string[]
  description?: string
  alwaysApply?: boolean
  distance?: number
}

export interface RuleMatch {
  ruleFile: RuleFile
  matchedPattern: string
  priority: number
}

export interface ContextInjectorConfig {
  enabled?: boolean
  rulesDirectory?: string
  maxRules?: number
}

function parseRuleFrontmatter(content: string): RuleFrontmatter {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)

  if (!frontmatterMatch) {
    return {}
  }

  const frontmatter = frontmatterMatch[1]
  const result: RuleFrontmatter = {}

  const lines = frontmatter.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    if (key === 'alwaysApply' && value === 'true') {
      result.alwaysApply = true
    } else if (key === 'alwaysApply' && value === 'false') {
      result.alwaysApply = false
    } else if (key && !isNaN(Number(value))) {
      ;(result as any)[key] = Number(value)
    } else if (key) {
      ;(result as any)[key] = value
    }
  }

  return result
}

function extractRules(content: string): string[] {
  const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/)

  if (!frontmatterMatch) {
    return [content]
  }

  const body = content.slice(frontmatterMatch[0].length)
  const rules: string[] = []

  const sections = body.split(/(?:\n\s*---|\n\s*\n#{3,}\s+)/)

  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.length > 0) {
      rules.push(trimmed)
    }
  }

  return rules
}

function matchGlob(pattern: string, filePath: string): boolean {
  const relativePath = path.relative(process.cwd(), filePath)

  const globPattern = pattern.replace(/\*\*/g, '*').replace(/\?/g, '?')

  const parts = globPattern.split('/')

  const pathParts = relativePath.split(path.sep)

  let matchCount = 0

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const pathPart = pathParts[i]

    if (part === '**') {
      matchCount++
    } else if (part === '*') {
      matchCount++
    } else if (part === pathPart) {
      matchCount++
    }
  }

  return matchCount === parts.length
}

function loadRuleFiles(directory: string): RuleFile[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  const ruleFiles: RuleFile[] = []

  function walk(dir: string, baseDir: string = dir): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath, baseDir)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()

        if (RULE_EXTENSIONS.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const frontmatter = parseRuleFrontmatter(content)
            const rules = extractRules(content)

            ruleFiles.push({
              path: fullPath,
              content,
              frontmatter,
              rules,
            })
          } catch (error) {
            console.error(`[rules-injector] Error loading rule file ${fullPath}:`, error)
          }
        }
      }
    }
  }

  walk(directory)
  return ruleFiles
}

function calculateDistance(rulePath: string, targetPath: string): number {
  const relativePath = path.relative(path.dirname(rulePath), targetPath)
  const parts = relativePath.split(path.sep)

  let distance = 0

  for (const part of parts) {
    if (part.startsWith('.')) {
      distance++
    } else if (part.includes(path.sep)) {
      distance += part.split(path.sep).length
    } else {
      distance++
    }
  }

  return distance
}

export function createRulesInjector(
  _input: PluginInput,
  options?: { config?: ContextInjectorConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
  }

  const rulesCache = new Map<string, RuleFile[]>()

  function loadRulesForPath(targetPath: string): RuleFile[] {
    const cacheKey = targetPath

    if (rulesCache.has(cacheKey)) {
      return rulesCache.get(cacheKey) || []
    }

    const ruleDirectories = [
      path.join(process.cwd(), 'rules'),
      path.join(process.cwd(), '.opencode', 'rules'),
      path.join(path.dirname(targetPath), 'rules'),
      path.join(path.dirname(targetPath), '.opencode', 'rules'),
    ]

    const allRules: RuleFile[] = []

    for (const dir of ruleDirectories) {
      const rules = loadRuleFiles(dir)
      allRules.push(...rules)
    }

    rulesCache.set(cacheKey, allRules)
    return allRules
  }

  function findMatchingRules(targetPath: string): RuleMatch[] {
    if (!config.enabled) {
      return []
    }

    const ruleFiles = loadRulesForPath(targetPath)
    const matches: RuleMatch[] = []

    for (const ruleFile of ruleFiles) {
      const { frontmatter } = ruleFile

      if (frontmatter.alwaysApply) {
        matches.push({
          ruleFile,
          matchedPattern: 'always_apply',
          priority: 0,
        })
        continue
      }

      if (frontmatter.globs && frontmatter.globs.length > 0) {
        for (const glob of frontmatter.globs) {
          if (matchGlob(glob, targetPath)) {
            let priority = 100

            if (typeof frontmatter.distance === 'number') {
              priority = frontmatter.distance
            } else {
              priority = calculateDistance(ruleFile.path, targetPath)
            }

            matches.push({
              ruleFile,
              matchedPattern: glob,
              priority,
            })
            break
          }
        }
      }
    }

    matches.sort((a, b) => a.priority - b.priority)

    return matches
  }

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

      const workingDir = process.cwd()

      const matches = findMatchingRules(workingDir)

      if (matches.length === 0) return

      const selectedMatch = matches[0]
      const maxRules = config.maxRules || 10
      const rulesToInject = matches.slice(0, maxRules)

      const rulesText = rulesToInject
        .map((m) => {
          const rules = m.ruleFile.rules.slice(0, 5).join('\n  ')
          return `<rule source="${m.ruleFile.path}">
${rules}
</rule>`
        })
        .join('\n\n')

      const existingText = text
      const newText = `${rulesText}\n\n${existingText}`

      output.parts = [
        {
          type: 'text' as const,
          text: newText,
          id: `rule-${Date.now()}`,
          sessionID: '',
          messageID: '',
        },
      ]
    },
  }
}
