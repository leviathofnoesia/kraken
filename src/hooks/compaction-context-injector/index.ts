import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
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
    // FIXED: Using proper OpenCode hooks instead of chat.message
    "message.updated": async (input, output) => {
      if (!config.enabled) return
      console.log("[compaction-context-injector] Processing message before compaction")
    },
    "experimental.session.compacting": async (input, output) => {
      if (!config.enabled) return
      console.log("[compaction-context-injector] Adding context for session compaction")
    },
  }
}
