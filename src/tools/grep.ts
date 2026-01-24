import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export interface GrepMatch {
  file: string
  line: number
  column: number
  lineContent: string
}

async function runGrep(
  pattern: string,
  options?: { path?: string; type?: string; context?: number; invert?: boolean }
): Promise<{ success: boolean; matches?: GrepMatch[]; count?: number; error?: string }> {
  const args = ["--line-number", "--color=never"]

  if (options?.context) {
    args.push("-C", String(options.context))
  }
  if (options?.invert) {
    args.push("-v")
  }
  if (options?.type) {
    args.push(`--type=${options.type}`)
  }

  args.push(pattern)
  if (options?.path) {
    args.push(options.path)
  }

  try {
    const { stdout, stderr } = await execFileAsync("rg", args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    })

    const matches: GrepMatch[] = []
    const lines = stdout.split("\n")

    for (const line of lines) {
      if (!line.trim()) continue
      const match = line.match(/^([^:]+):(\d+):(\d+):(.+)$/)
      if (match) {
        matches.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          lineContent: match[4],
        })
      }
    }

    return { success: true, matches, count: matches.length }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return {
        success: false,
        error: "ripgrep (rg) not installed. Install with: apt install ripgrep or brew install ripgrep",
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export const grep = tool({
  description:
    "Search for text patterns in files using ripgrep. Supports regex and file type filtering. " +
    "Example: grep({pattern: 'function \\w+', type: 'ts', context: 2})",
  args: {
    pattern: z.string().describe("Regex pattern to search for"),
    path: z.string().optional().describe("Directory or file to search in (default: current directory)"),
    type: z.string().optional().describe("Filter by file type (ts, js, py, rust, go, java, etc.)"),
    context: z.number().optional().describe("Number of context lines around each match (default: 0)"),
    invert: z.boolean().optional().describe("Show lines that do NOT match the pattern"),
  },
  async execute(args) {
    const { pattern, path: searchPath, type, context, invert } = args
    const result = await runGrep(pattern, { path: searchPath, type, context, invert })

    if (!result.success) {
      return JSON.stringify(result, null, 2)
    }

    return JSON.stringify(
      {
        success: true,
        matches: result.matches?.slice(0, 100),
        count: result.count,
        message: result.count && result.count > 100 ? `Showing 100 of ${result.count} matches` : undefined,
      },
      null,
      2
    )
  },
})
