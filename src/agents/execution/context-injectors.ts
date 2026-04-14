import * as fs from 'fs'
import * as path from 'path'
import type { PipelineMiddleware } from './types'
import type { AgentName } from '../index'
import { getBus } from '../bus'
import { createLogger } from '../../utils/logger'

const logger = createLogger('context-injectors')

function appendToPrompt(existing: string, section: string): string {
  return `${existing}\n\n${section}`
}

function buildFileTreeSummary(): string {
  try {
    const cwd = process.cwd()
    const srcDir = path.join(cwd, 'src')
    if (!fs.existsSync(srcDir)) return ''

    const entries: string[] = []
    const maxDepth = 2

    function walk(dir: string, depth: number, prefix: string) {
      if (depth > maxDepth) return
      let items: string[]
      try {
        items = fs.readdirSync(dir).filter((f) => !f.startsWith('.') && f !== 'node_modules')
      } catch {
        return
      }
      for (const item of items.slice(0, 30)) {
        const fullPath = path.join(dir, item)
        const rel = path.relative(cwd, fullPath).replace(/\\/g, '/')
        try {
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory()) {
            entries.push(`${prefix}${rel}/`)
            walk(fullPath, depth + 1, prefix + '  ')
          } else {
            entries.push(`${prefix}${rel}`)
          }
        } catch {
          // skip
        }
      }
    }

    walk(srcDir, 0, '')

    if (entries.length === 0) return ''
    return `## Project File Tree\n\`\`\`\n${entries.join('\n')}\n\`\`\``
  } catch (err) {
    logger.debug('Failed to build file tree summary:', err)
    return ''
  }
}

function buildDependencySummary(): string {
  try {
    const cwd = process.cwd()
    const pkgPath = path.join(cwd, 'package.json')
    if (!fs.existsSync(pkgPath)) return ''

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const deps = Object.keys(pkg.dependencies ?? {})
    const devDeps = Object.keys(pkg.devDependencies ?? {})
    if (deps.length === 0 && devDeps.length === 0) return ''

    const parts: string[] = ['## Project Dependencies']
    if (deps.length > 0) parts.push(`**Dependencies**: ${deps.join(', ')}`)
    if (devDeps.length > 0) parts.push(`**DevDependencies**: ${devDeps.join(', ')}`)
    return parts.join('\n')
  } catch {
    return ''
  }
}

function buildLanguageSummary(): string {
  try {
    const cwd = process.cwd()
    const srcDir = path.join(cwd, 'src')
    if (!fs.existsSync(srcDir)) return ''

    const counts: Record<string, number> = {}
    function countLangs(dir: string) {
      let items: string[]
      try {
        items = fs.readdirSync(dir)
      } catch {
        return
      }
      for (const item of items) {
        const full = path.join(dir, item)
        try {
          const stat = fs.statSync(full)
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            countLangs(full)
          } else if (stat.isFile()) {
            const ext = path.extname(item)
            counts[ext] = (counts[ext] || 0) + 1
          }
        } catch {
          // skip
        }
      }
    }
    countLangs(srcDir)

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    if (sorted.length === 0) return ''
    return `## Language Breakdown\n${sorted.map(([ext, n]) => `- ${ext || '(none)'}: ${n} files`).join('\n')}`
  } catch {
    return ''
  }
}

const INJECTORS: Record<string, (ctx: any) => string> = {
  Nautilus: () => {
    const parts = [buildFileTreeSummary(), buildLanguageSummary()].filter(Boolean)
    return parts.length > 0 ? parts.join('\n\n') : ''
  },

  Abyssal: () => {
    return '## Available Research Tools\nYou have access to: websearch (Exa AI), webfetch (URL content), context7 (documentation search), grep-search (GitHub code search). Use these tools to find current, evidence-based information.'
  },

  Atlas: () => {
    const parts = [buildDependencySummary(), buildFileTreeSummary()].filter(Boolean)
    return parts.length > 0 ? parts.join('\n\n') : ''
  },

  Scylla: (_ctx) => {
    const cwd = process.cwd()
    const parts: string[] = []
    try {
      const pkgPath = path.join(cwd, 'package.json')
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (pkg.scripts) {
          parts.push('## Available Scripts')
          for (const [name, cmd] of Object.entries(pkg.scripts)) {
            parts.push(`- \`npm run ${name}\`: ${cmd}`)
          }
        }
      }
    } catch {
      // skip
    }
    parts.push(
      '## Review Instructions\nApply your SOLID framework. Focus on concrete findings with file:line references. Rate each issue Critical/Important/Minor.',
    )
    return parts.join('\n\n')
  },

  Pearl: () => {
    return '## Media Analysis Instructions\nUse the Read tool to access files. Report structured findings: type classification, content extraction, confidence level. Preserve all extracted data.'
  },

  Maelstrom: () => {
    const parts = [buildDependencySummary()].filter(Boolean)
    return parts.length > 0
      ? parts.join('\n\n') +
          '\n\n## Advisory Instructions\nApply first-principles reasoning. Construct trade-off matrices for competing solutions. Provide explicit confidence levels.'
      : '## Advisory Instructions\nApply first-principles reasoning. Construct trade-off matrices for competing solutions. Provide explicit confidence levels.'
  },

  Leviathan: () => {
    const parts = [buildFileTreeSummary()].filter(Boolean)
    return parts.length > 0
      ? parts.join('\n\n') +
          '\n\n## Architecture Analysis Instructions\nMap component boundaries, identify patterns and anti-patterns, assess coupling/cohesion.'
      : '## Architecture Analysis Instructions\nMap component boundaries, identify patterns and anti-patterns, assess coupling/cohesion.'
  },

  Poseidon: () => {
    return '## Pre-Planning Instructions\nClassify the work intent first (Refactoring/Greenfield/Enhancement/Integration/Investigation). Extract functional, non-functional, boundary, and resource constraints. Surface ambiguities explicitly.'
  },

  Siren: () => {
    return '## Documentation Instructions\nAnalyze existing code before writing. Match project documentation conventions. Use active voice, short sentences, concrete examples.'
  },

  Coral: () => {
    return '## Design Instructions\nRead existing design tokens/component patterns before making changes. Ensure accessibility compliance. Optimize animations for 60fps.'
  },
}

export function createContextInjectorMiddleware(): PipelineMiddleware {
  return {
    name: 'context-injector',
    before(ctx) {
      const injector = INJECTORS[ctx.agent]
      if (!injector) return ctx

      const injected = injector(ctx)
      if (!injected) return ctx

      return {
        ...ctx,
        enrichedPrompt: appendToPrompt(ctx.enrichedPrompt, injected),
      }
    },
  }
}

export function createStatePublishingMiddleware(): PipelineMiddleware {
  return {
    name: 'state-publisher',
    after(ctx, result) {
      if (ctx.parentSessionID) {
        getBus().setState(
          ctx.parentSessionID,
          `result_${ctx.agent.toLowerCase()}_${Date.now()}`,
          {
            agent: ctx.agent,
            success: result.success,
            output: result.output?.slice(0, 500),
            duration: result.duration,
          },
          ctx.agent,
        )
      }
      return result
    },
  }
}

export function createDefaultMiddleware(): PipelineMiddleware[] {
  return [createContextInjectorMiddleware(), createStatePublishingMiddleware()]
}
