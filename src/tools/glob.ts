/**
 * Glob Tool
 *
 * Advanced file pattern matching with project rules.
 * Uses the glob package for flexible file searching.
 */

import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { glob } from 'glob'
import * as path from 'node:path'
import * as fs from 'node:fs'

const GlobOptionsSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files (e.g., "**/*.ts", "src/**/*.js")'),
  cwd: z.string().optional().describe('Working directory to search in'),
  absolute: z.boolean().optional().describe('Return absolute paths'),
  onlyFiles: z.boolean().optional().default(true).describe('Match files only'),
  onlyDirectories: z.boolean().optional().describe('Match directories only'),
  ignore: z.array(z.string()).optional().describe('Patterns to ignore'),
  dot: z.boolean().optional().describe('Include dotfiles'),
  mark: z.boolean().optional().describe('Add trailing slash to directories'),
  nodir: z.boolean().optional().describe("Don't match directories"),
  positive: z.array(z.string()).optional().describe('Positive patterns (must match)'),
  negative: z.array(z.string()).optional().describe('Negative patterns (must not match)'),
  follow: z.boolean().optional().describe('Follow symlinks'),
  cwdOption: z.string().optional().describe('Change working directory'),
  root: z.string().optional().describe('Root directory'),
  basename: z.string().optional().describe('Match basename only'),
  brace: z.boolean().optional().describe('Enable brace expansion'),
  caseRootMatch: z.boolean().optional().describe('Match case when root has case'),
  debug: z.boolean().optional().describe('Debug mode'),
  done: z.boolean().optional().describe('Return done callback'),
  expandDirectories: z.boolean().optional().describe('Expand directories'),
  extglob: z.boolean().optional().describe('Enable extended glob'),
  globstar: z.boolean().optional().describe('Enable ** matching'),
 agos: z.number().optional().describe('Modified after timestamp'),
  mtime: z.number().optional().describe('Modified time'),
  older: z.number().optional().describe('Modified older than timestamp'),
  newer: z.number().optional().describe('Modified newer than timestamp'),
  stat: z.boolean().optional().describe('Include stat info'),
  statOption: z.boolean().optional().describe('Stat option'),
  realpath: z.boolean().optional().describe('Resolve real paths'),
  rel: z.boolean().optional().describe('Return relative paths'),
  silent: z.boolean().optional().describe('Silent mode'),
  stripTrailingSlash: z.boolean().optional().describe('Strip trailing slashes'),
  type: z.string().optional().describe('File type filter (f, d, l)'),
  unique: z.boolean().optional().describe('Return unique results'),
  onMatch: z.boolean().optional().describe('On match callback'),
  onError: z.boolean().optional().describe('On error callback'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort results'),
})

const FileInfoSchema = z.object({
  path: z.string(),
  name: z.string().optional(),
  size: z.number().optional(),
  isFile: z.boolean().optional(),
  isDirectory: z.boolean().optional(),
  isSymbolicLink: z.boolean().optional(),
  modified: z.string().optional(),
  accessed: z.string().optional(),
  created: z.string().optional(),
})

export const glob_tool = tool({
  description: 'Find files matching a glob pattern. Supports advanced pattern matching with ignore patterns, brace expansion, and more.',
  args: {
    options: GlobOptionsSchema,
  },
  async execute({ options }) {
    const globOptions: glob.IOptions = {
      cwd: options.cwd || process.cwd(),
      absolute: options.absolute || false,
      onlyFiles: options.onlyFiles ?? true,
      onlyDirectories: options.onlyDirectories || false,
      dot: options.dot || false,
      mark: options.mark || false,
      nodir: options.nodir || false,
      follow: options.follow || false,
      ignore: options.ignore || [],
      brace: options.brace ?? true,
      extglob: options.extglob ?? true,
      globstar: options.globstar ?? true,
      unique: options.unique ?? true,
      silent: options.silent || false,
      stripTrailingSlash: options.stripTrailingSlash || false,
    }

    if (options.positive && options.positive.length > 0) {
      globOptions.positive = options.positive
    }
    if (options.negative && options.negative.length > 0) {
      globOptions.negative = options.negative
    }
    if (options.sort) {
      globOptions.sort = options.sort
    }

    try {
      const matches = await glob(options.pattern, globOptions)

      let results = matches
      if (options.stat) {
        const statsPromises = matches.map(async (matchPath) => {
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
        })
        results = await Promise.all(statsPromises)
      } else if (options.absolute) {
        results = matches
      }

      return JSON.stringify({
        status: 'success',
        pattern: options.pattern,
        count: results.length,
        results: results,
      })
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        pattern: options.pattern,
        error: error.message,
      })
    }
  },
})

export const find_files = tool({
  description: 'Find files by name pattern. A simpler interface for common file searches.',
  args: {
    name: z.string().describe('File name or pattern to search for (e.g., "*.ts", "*.test.js")'),
    cwd: z.string().optional().describe('Working directory to search in'),
    recursive: z.boolean().optional().default(true).describe('Search recursively'),
    type: z.enum(['f', 'd', 'l']).optional().describe('Type: f=file, d=directory, l=link'),
  },
  async execute({ name, cwd, recursive, type }) {
    const pattern = recursive ? `**/${name}` : name
    const globOptions: glob.IOptions = {
      cwd: cwd || process.cwd(),
      onlyFiles: type !== 'd',
      onlyDirectories: type === 'd',
      nodir: type === 'f',
    }

    try {
      const matches = await glob(pattern, globOptions)
      return JSON.stringify({
        status: 'success',
        name,
        count: matches.length,
        files: matches,
      })
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        name,
        error: error.message,
      })
    }
  },
})

export const find_in_files = tool({
  description: 'Search for text content within files matching a glob pattern.',
  args: {
    pattern: z.string().describe('Text pattern to search for'),
    glob: z.string().describe('Glob pattern for files to search (e.g., "**/*.ts")'),
    cwd: z.string().optional().describe('Working directory'),
    ignoreCase: z.boolean().optional().describe('Case insensitive search'),
  },
  async execute({ pattern, glob: globPattern, cwd, ignoreCase }) {
    const searchDir = cwd || process.cwd()
    const matches: Array<{ file: string; line: number; content: string }> = []

    try {
      const files = await glob(globPattern, {
        cwd: searchDir,
        onlyFiles: true,
      })

      const regex = ignoreCase ? new RegExp(pattern, 'gi') : new RegExp(pattern, 'g')

      for (const file of files) {
        const filePath = path.join(searchDir, file)
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8')
          const lines = content.split('\n')
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              matches.push({
                file: file,
                line: index + 1,
                content: line.trim(),
              })
              regex.lastIndex = 0
            }
          })
        } catch {
          // Skip files that can't be read
        }
      }

      return JSON.stringify({
        status: 'success',
        pattern,
        filesSearched: files.length,
        matches: matches,
      })
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        pattern,
        error: error.message,
      })
    }
  },
})
