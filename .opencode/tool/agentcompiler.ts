/// <reference path="../env.d.ts" />
import { tool } from '@opencode-ai/plugin'
import DESCRIPTION from './agentcompiler.txt'

interface ToolResult {
  ok: boolean
  exitCode: number
  stdout: string
  stderr: string
}

async function runSkillCompiler(args: string[]): Promise<ToolResult> {
  const command = 'npx'
  const proc = Bun.spawn([command, 'skill-compiler', ...args], {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0' },
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr] = await Promise.all([proc.stdout.text(), proc.stderr.text()])

  const exitCode = await proc.exited

  return {
    ok: exitCode === 0,
    exitCode,
    stdout,
    stderr,
  }
}

export default tool({
  description: DESCRIPTION,
  args: {
    command: tool.schema
      .enum(['compile', 'watch', 'sync', 'suggest'])
      .describe('Command to run: compile (default), watch, sync, or suggest'),
    check: tool.schema
      .boolean()
      .describe('Check if AGENTS.md is up to date without modifying it')
      .default(false),
    refresh: tool.schema
      .boolean()
      .describe('Force refresh of cached documentation indexes')
      .default(false),
    only: tool.schema
      .string()
      .describe('Comma-separated list of frameworks to include (overrides config)')
      .optional(),
    quiet: tool.schema.boolean().describe('Suppress output (overrides config)').default(false),
  },
  async execute(args) {
    const command = args.command || 'compile'

    let result: ToolResult

    switch (command) {
      case 'compile': {
        result = await runSkillCompiler([
          'compile',
          ...(args.check ? ['--check'] : []),
          ...(args.refresh ? ['--refresh'] : []),
          ...(args.only ? [`--only=${args.only}`] : []),
          ...(args.quiet ? ['--quiet'] : []),
        ])
        break
      }
      case 'watch': {
        result = await runSkillCompiler(['watch'])
        break
      }
      case 'sync': {
        result = await runSkillCompiler(['sync'])
        break
      }
      case 'suggest': {
        result = await runSkillCompiler(['suggest'])
        break
      }
      default: {
        return `Unknown command: ${command}`
      }
    }

    if (result.exitCode !== 0) {
      return `Error running skill-compiler (exit code ${result.exitCode}):\n\n${result.stderr || result.stdout}`
    }

    return `skill-compiler ${command} completed successfully.\n\n${result.stdout}`
  },
})
