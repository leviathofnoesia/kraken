import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

export interface AutoSlashCommandConfig {
  enabled?: boolean
  commands?: Record<string, string>
}

export function createAutoSlashCommand(
  _input: PluginInput,
  options?: { config?: AutoSlashCommandConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    commands: {
      "/build": "build",
      "/plan": "plan",
      "/research": "research",
      "/docs": "docs",
      "/review": "review",
      "/test": "test",
      "/fix": "fix",
      "/explain": "explain",
    },
  }

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p): p is Extract<Part, { type: "text" }> => p.type === "text")
      .map(p => p.text)
      .join("\n")
      .trim()
  }

  return {
    "chat.message": async (input, output) => {
      if (!config.enabled) return

      const text = getTextFromParts(output.parts)
      if (!text) return

      for (const [command, action] of Object.entries(config.commands || {})) {
        if (text.startsWith(command)) {
          console.log(`[auto-slash-command] Detected ${command}, triggering: ${action}`)
        }
      }
    },
  }
}
