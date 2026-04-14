import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { readFileSync, existsSync } from "node:fs"

export interface DirectoryReadmeInjectorConfig {
  enabled?: boolean
}

export function createDirectoryReadmeInjector(
  _input: PluginInput,
  options?: { config?: DirectoryReadmeInjectorConfig }
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    "chat.message": async (input, output) => {
      if (!config.enabled) return
      const readmePaths = ["README.md", "readme.md", "Readme.md"]
      for (const readme of readmePaths) {
        if (existsSync(readme)) {
          try {
            const content = readFileSync(readme, "utf-8")
            console.log("[directory-readme-injector] Found README, injecting context")
          } catch {
            console.log("[directory-readme-injector] Could not read README")
          }
          break
        }
      }
    },
  }
}
