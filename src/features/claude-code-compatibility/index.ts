import { promises as fs } from "fs"
import { join, dirname } from "path"
import * as os from "os"

export interface ClaudeCodeConfig {
  hooks?: {
    PreToolUse?: SettingsHook[]
    PostToolUse?: SettingsHook[]
    UserPromptSubmit?: SettingsHook[]
    Stop?: SettingsHook[]
  }
  mcp?: boolean
  commands?: boolean
  skills?: boolean
  agents?: boolean
  plugins?: {
    [pluginName: string]: boolean
  }
}

export interface SettingsHook {
  matcher?: string
  command?: string
  script?: string
  python?: string
  hooks?: Array<{
    type: "command" | "python" | "shell"
    command?: string
    script?: string
    python?: string
    [key: string]: unknown
  }>
}

const SETTINGS_FILES = [
  join(os.homedir(), ".claude", "settings.json"),
  join(os.homedir(), ".claude", "settings.local.json"),
  join(process.cwd(), ".claude", "settings.json"),
  join(process.cwd(), ".claude", "settings.local.json"),
]

export async function loadClaudeCodeSettings(): Promise<ClaudeCodeConfig> {
  const mergedConfig: ClaudeCodeConfig = {}

  for (const settingsFile of SETTINGS_FILES) {
    try {
      await fs.access(settingsFile)
      const content = await fs.readFile(settingsFile, "utf-8")
      const config = JSON.parse(content) as ClaudeCodeConfig

      Object.assign(mergedConfig, config)
      console.log(`[claude-code-compat] Loaded settings from ${settingsFile}`)
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.error(`[claude-code-compat] Error loading ${settingsFile}:`, error)
      }
    }
  }

  return mergedConfig
}

export async function executeSettingsHooks(
  hookType: "PreToolUse" | "PostToolUse" | "UserPromptSubmit" | "Stop",
  context: any
): Promise<void> {
  const config = await loadClaudeCodeSettings()

  if (!config.hooks?.[hookType]) {
    return
  }

  const hooks = config.hooks[hookType]

  for (const hook of hooks) {
    await executeHook(hook, context)
  }
}

async function executeHook(hook: SettingsHook, context: any): Promise<void> {
  try {
    if (hook.command) {
      const { exec } = require("child_process")
      await new Promise<void>((resolve, reject) => {
        exec(hook.command, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.error(`[claude-code-compat] Hook command error:`, error)
            reject(error)
          } else {
            console.log(`[claude-code-compat] Hook executed: ${hook.command}`)
            if (stdout) console.log(stdout)
            if (stderr) console.error(stderr)
            resolve(undefined)
          }
        })
      })
    }

    if (hook.python) {
      const { spawn } = require("child_process")
      await new Promise<void>((resolve, reject) => {
        const child = spawn("python", ["-c", hook.python])
        child.on("close", (code: number | null) => {
          if (code === 0) {
            console.log(`[claude-code-compat] Python hook executed`)
            resolve(undefined)
          } else {
            reject(new Error(`Python hook exited with code ${code}`))
          }
        })
      })
    }
  } catch (error) {
    console.error(`[claude-code-compat] Error executing hook:`, error)
  }
}

export function isFeatureEnabled(
  config: ClaudeCodeConfig,
  feature: "mcp" | "commands" | "skills" | "agents" | "hooks"
): boolean {
  const featureConfig = config[feature]

  if (typeof featureConfig === "boolean") {
    return featureConfig
  }

  return true
}

export function isPluginEnabled(
  config: ClaudeCodeConfig,
  pluginName: string
): boolean {
  const pluginConfig = config.plugins?.[pluginName]

  if (typeof pluginConfig === "boolean") {
    return pluginConfig
  }

  return true
}
