import * as fs from 'fs'
import * as path from 'path'
import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'

export interface ContextConfig {
  enabled?: boolean
  maxTokens?: number
  priorityFiles?: string[]
  maxFileSize?: number
}

const DEFAULT_MAX_FILE_SIZE = 50000
const PRIORITY_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'tsconfig.json',
  'cargo.toml',
  'pyproject.toml',
]

const injectedFiles = new Set<string>()

function getTextFromParts(parts: Part[]): string {
  return parts
    .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
    .trim()
}

function readFileContent(filePath: string, maxSize: number): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    if (stat.size > maxSize) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function findRelevantFiles(messageText: string, directory: string): string[] {
  const filePattern = /(?:^|\s|["'`])([\w/.-]+\.\w{1,10})(?:\s|["'`]|$)/g
  const matches = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = filePattern.exec(messageText)) !== null) {
    const filePath = match[1]
    if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
      const fullPath = path.resolve(directory, filePath)
      if (fs.existsSync(fullPath)) {
        matches.add(fullPath)
      }
    }
  }

  return Array.from(matches).slice(0, 10)
}

function buildContextString(
  directory: string,
  relevantFiles: string[],
  config: ContextConfig,
): string {
  const parts: string[] = []
  const maxSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE

  const priorityFiles = (config.priorityFiles ?? PRIORITY_FILES)
    .map((f) => path.resolve(directory, f))
    .filter((f) => !injectedFiles.has(f))

  for (const filePath of priorityFiles) {
    const content = readFileContent(filePath, maxSize)
    if (content) {
      const basename = path.basename(filePath)
      parts.push(`--- ${basename} ---\n${content.slice(0, maxSize)}`)
      injectedFiles.add(filePath)
    }
  }

  for (const filePath of relevantFiles) {
    if (injectedFiles.has(filePath)) continue
    const content = readFileContent(filePath, maxSize)
    if (content) {
      const relPath = path.relative(directory, filePath)
      parts.push(`--- ${relPath} ---\n${content.slice(0, maxSize)}`)
      injectedFiles.add(filePath)
    }
  }

  return parts.join('\n\n')
}

export function createContextInjector(
  input: PluginInput,
  options?: { config?: ContextConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }
  const directory = input.directory

  return {
    'chat.message': async (_input, output) => {
      if (!config.enabled) return
      const promptText = getTextFromParts(output.parts)
      if (!promptText) return
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      if (!config.enabled) return
    },

    'experimental.chat.system.transform': async (_input, output) => {
      if (!config.enabled) return

      try {
        const priorityFiles = (config.priorityFiles ?? PRIORITY_FILES)
          .map((f) => path.resolve(directory, f))
          .filter((f) => !injectedFiles.has(f))

        if (priorityFiles.length === 0) return

        const maxSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
        const contextParts: string[] = []

        for (const filePath of priorityFiles) {
          const content = readFileContent(filePath, maxSize)
          if (content) {
            const basename = path.basename(filePath)
            contextParts.push(`--- ${basename} ---\n${content.slice(0, maxSize)}`)
            injectedFiles.add(filePath)
          }
        }

        if (contextParts.length > 0) {
          output.system.push(
            `\n<kraken-project-context>\n${contextParts.join('\n\n')}\n</kraken-project-context>`,
          )
        }
      } catch (error) {
        console.error('[context-injector] Error injecting context:', error)
      }
    },
  }
}

export function resetInjectedFiles(): void {
  injectedFiles.clear()
}
