import { tool } from '@opencode-ai/plugin'
import { glob, type GlobOptions } from 'glob'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { z } from 'zod'

const GlobOptionsSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files (for example, "**/*.ts")'),
  cwd: z.string().optional().describe('Working directory to search in'),
  absolute: z.boolean().optional().describe('Return absolute paths'),
  onlyFiles: z.boolean().optional().default(true).describe('Match files only'),
  onlyDirectories: z.boolean().optional().describe('Match directories only'),
  ignore: z.array(z.string()).optional().describe('Patterns to ignore'),
  dot: z.boolean().optional().describe('Include dotfiles'),
  mark: z.boolean().optional().describe('Add trailing slash to directories'),
  nodir: z.boolean().optional().describe("Don't match directories"),
  follow: z.boolean().optional().describe('Follow symlinks'),
  root: z.string().optional().describe('Root directory'),
  stat: z.boolean().optional().describe('Include stat info'),
  realpath: z.boolean().optional().describe('Resolve real paths'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort results'),
})

type FileInfo = {
  path: string
  name: string
  size?: number
  isFile?: boolean
  isDirectory?: boolean
  isSymbolicLink?: boolean
  modified?: string
  accessed?: string
  created?: string
}

function sortPaths(values: string[], order?: 'asc' | 'desc'): string[] {
  if (!order) return values
  const sorted = [...values].sort((a, b) => a.localeCompare(b))
  return order === 'asc' ? sorted : sorted.reverse()
}

function normalizeMatches(values: Array<string | object>): string[] {
  return values.map((value) => (typeof value === 'string' ? value : String(value)))
}

async function filterByType(
  paths: string[],
  type: 'files' | 'directories',
): Promise<string[]> {
  const checks = await Promise.all(
    paths.map(async (p) => {
      try {
        const stats = await fs.promises.stat(p)
        if (type === 'files') return stats.isFile() ? p : null
        return stats.isDirectory() ? p : null
      } catch {
        return null
      }
    }),
  )
  return checks.filter((item): item is string => item !== null)
}

export const glob_tool = tool({
  description:
    'Find files matching a glob pattern. Supports ignore patterns, dotfiles, and optional file metadata.',
  args: {
    options: GlobOptionsSchema,
  },
  async execute({ options }) {
    const cwd = options.cwd || process.cwd()
    const globOptions: GlobOptions = {
      cwd,
      absolute: options.absolute ?? false,
      dot: options.dot ?? false,
      mark: options.mark ?? false,
      nodir: options.nodir ?? false,
      follow: options.follow ?? false,
      ignore: options.ignore,
      root: options.root,
      realpath: options.realpath ?? false,
    }

    try {
      let matches = normalizeMatches(await glob(options.pattern, globOptions))
      matches = sortPaths(matches, options.sort)

      if (options.onlyDirectories) {
        matches = await filterByType(matches, 'directories')
      } else if (options.onlyFiles ?? true) {
        matches = await filterByType(matches, 'files')
      }

      if (!options.stat) {
        return JSON.stringify({
          status: 'success',
          pattern: options.pattern,
          count: matches.length,
          results: matches,
        })
      }

      const details: FileInfo[] = await Promise.all(
        matches.map(async (matchPath) => {
          try {
            const stats = await fs.promises.stat(matchPath)
            return {
              path: matchPath,
              name: path.basename(matchPath),
              size: stats.size,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              isSymbolicLink: stats.isSymbolicLink(),
              modified: stats.mtime.toISOString(),
              accessed: stats.atime.toISOString(),
              created: stats.birthtime.toISOString(),
            }
          } catch {
            return { path: matchPath, name: path.basename(matchPath) }
          }
        }),
      )

      return JSON.stringify({
        status: 'success',
        pattern: options.pattern,
        count: details.length,
        results: details,
      })
    } catch (error: unknown) {
      return JSON.stringify({
        status: 'error',
        pattern: options.pattern,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const find_files = tool({
  description: 'Find files by name pattern using glob.',
  args: {
    name: z.string().describe('File name or pattern to search for (for example, "*.ts")'),
    cwd: z.string().optional().describe('Working directory to search in'),
    recursive: z.boolean().optional().default(true).describe('Search recursively'),
    type: z.enum(['f', 'd', 'l']).optional().describe('Type: f=file, d=directory, l=link'),
  },
  async execute({ name, cwd, recursive, type }) {
    const pattern = recursive ? `**/${name}` : name
    const searchDir = cwd || process.cwd()

    try {
      let matches = normalizeMatches(await glob(pattern, { cwd: searchDir }))

      if (type === 'd') {
        matches = await filterByType(matches, 'directories')
      } else if (type === 'f' || !type) {
        matches = await filterByType(matches, 'files')
      }

      return JSON.stringify({
        status: 'success',
        name,
        count: matches.length,
        files: matches,
      })
    } catch (error: unknown) {
      return JSON.stringify({
        status: 'error',
        name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const find_in_files = tool({
  description: 'Search for text content within files matching a glob pattern.',
  args: {
    pattern: z.string().describe('Text pattern to search for'),
    glob: z.string().describe('Glob pattern for files to search (for example, "**/*.ts")'),
    cwd: z.string().optional().describe('Working directory'),
    ignoreCase: z.boolean().optional().describe('Case-insensitive search'),
  },
  async execute({ pattern, glob: globPattern, cwd, ignoreCase }) {
    const searchDir = cwd || process.cwd()
    const matches: Array<{ file: string; line: number; content: string }> = []

    try {
      const files = normalizeMatches(await glob(globPattern, { cwd: searchDir }))
      const filePaths = await filterByType(files.map((file) => path.join(searchDir, file)), 'files')
      const regex = ignoreCase ? new RegExp(pattern, 'i') : new RegExp(pattern)

      for (const absoluteFilePath of filePaths) {
        try {
          const content = await fs.promises.readFile(absoluteFilePath, 'utf-8')
          const lines = content.split('\n')
          for (let i = 0; i < lines.length; i += 1) {
            if (regex.test(lines[i])) {
              matches.push({
                file: path.relative(searchDir, absoluteFilePath),
                line: i + 1,
                content: lines[i].trim(),
              })
            }
          }
        } catch {
          // Skip unreadable files.
        }
      }

      return JSON.stringify({
        status: 'success',
        pattern,
        filesSearched: filePaths.length,
        matches,
      })
    } catch (error: unknown) {
      return JSON.stringify({
        status: 'error',
        pattern,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})
