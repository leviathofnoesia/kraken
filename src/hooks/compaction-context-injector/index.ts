import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

export interface CompactionContextInjectorConfig {
  enabled?: boolean
}

function getTextFromParts(parts: Part[]): string {
  return parts
    .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
    .map(p => p.text)
    .join("\n")
    .trim()
}

export function createCompactionContextInjector(
  _input: PluginInput,
  options?: { config?: CompactionContextInjectorConfig }
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    // Use experimental.session.compacting for context injection
    "experimental.session.compacting": async (input: any, output: any) => {
      if (!config.enabled) return
      
      console.log("[compaction-context-injector] Adding context for session compaction")
      
      // Add custom context for compaction
      output.context = output.context || []
      output.context.push("Include important decisions and learnings in the summary.")
    },
  }
}
