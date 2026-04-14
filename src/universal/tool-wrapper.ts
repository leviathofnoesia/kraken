import type { UniversalMode, UniversalTarget } from './targets'
import { canExecuteTool } from './tool-policy'

interface ToolLike {
  execute?: (...args: any[]) => Promise<unknown> | unknown
}

interface ToolRuntimeContext {
  target?: UniversalTarget
  mode?: UniversalMode
}

function resolveRuntimeContext(context?: ToolRuntimeContext): Required<ToolRuntimeContext> {
  const rawTarget = process.env.KRAKEN_TARGET as UniversalTarget | undefined
  const rawMode = process.env.KRAKEN_MODE as UniversalMode | undefined

  return {
    target: context?.target ?? rawTarget ?? 'opencode',
    mode: context?.mode ?? rawMode ?? 'standard',
  }
}

function wrapTool(name: string, tool: ToolLike, context?: ToolRuntimeContext): ToolLike {
  if (typeof tool.execute !== 'function') {
    return tool
  }

  const runtime = resolveRuntimeContext(context)
  const originalExecute = tool.execute

  return {
    ...tool,
    async execute(...args: any[]) {
      const policy = canExecuteTool(name, runtime.target, runtime.mode)
      if (!policy.allowed) {
        throw new Error(policy.reason)
      }
      return await originalExecute(...args)
    },
  }
}

export function wrapToolsWithPolicy<T extends Record<string, ToolLike>>(
  tools: T,
  context?: ToolRuntimeContext,
): T {
  const wrappedEntries = Object.entries(tools).map(([name, tool]) => [
    name,
    wrapTool(name, tool, context),
  ])

  return Object.fromEntries(wrappedEntries) as T
}
