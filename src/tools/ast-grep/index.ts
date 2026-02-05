import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface ASTGrepMatch {
  file: string
  line: number
  column: number
  matchedContent: string
}

export interface ASTGrepResult {
  success: boolean
  matches?: ASTGrepMatch[]
  count?: number
  error?: string
}

async function runAstGrep(
  pattern: string,
  language: string,
  options?: { replace?: string; path?: string; glob?: string },
): Promise<ASTGrepResult> {
  const args = ['--json', '--pattern', pattern, '--lang', language]

  if (options?.replace) {
    args.push('--replace', options.replace)
  }
  if (options?.path) {
    args.push('--path', options.path)
  }
  if (options?.glob) {
    args.push('--glob', options.glob)
  }

  try {
    const { stdout, stderr } = await execFileAsync('sg', args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    })

    if (stderr && !stdout) {
      return { success: false, error: stderr }
    }

    try {
      const result = JSON.parse(stdout)
      return {
        success: true,
        matches: result.matches || [],
        count: result.count || 0,
      }
    } catch {
      return { success: true, matches: [], count: 0 }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return {
        success: false,
        error: 'ast-grep CLI not installed. Install with: npm install -g @ast-grep/cli',
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export const ast_grep_search = tool({
  description:
    'Search code using AST patterns. More powerful than regex as it understands code structure. ' +
    "Example patterns: 'function $_$ { $body$ }' to find all functions, '$A = $B' to find assignments.",
  args: {
    pattern: z.string().describe('AST pattern to search for (use $VAR for variables)'),
    language: z
      .string()
      .describe('Programming language (typescript, javascript, python, rust, go, java, cpp, etc.)'),
    path: z
      .string()
      .optional()
      .describe('Directory or file to search in (default: current directory)'),
    glob: z.string().optional().describe("File glob pattern (e.g., '*.ts', 'src/**/*.ts')"),
  },
  async execute(args) {
    const { pattern, language, path: searchPath, glob } = args
    const result = await runAstGrep(pattern, language, { path: searchPath, glob })

    return JSON.stringify(result, null, 2)
  },
})

export const ast_grep_replace = tool({
  description:
    'Search and replace code using AST patterns. Safer than regex replacement as it respects code structure. ' +
    'Use the same variable names in replacement to preserve matched content.',
  args: {
    pattern: z.string().describe('AST pattern to search for'),
    replacement: z
      .string()
      .describe('AST pattern to replace with (use $VAR to reference matched variables)'),
    language: z.string().describe('Programming language'),
    path: z
      .string()
      .optional()
      .describe('Directory or file to search in (default: current directory)'),
    glob: z.string().optional().describe('File glob pattern'),
  },
  async execute(args) {
    const { pattern, replacement, language, path: searchPath, glob } = args
    const result = await runAstGrep(pattern, language, {
      replace: replacement,
      path: searchPath,
      glob,
    })

    return JSON.stringify(result, null, 2)
  },
})
