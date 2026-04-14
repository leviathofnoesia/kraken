import type { Hooks } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import { createNotificationManager, sendNotification, type NotificationConfig, type SoundEvent } from "../../notifications/manager"
import type { SoundConfig } from "../../notifications/sound-player"

export interface NotificationsHookConfig extends NotificationConfig {
  enabled?: boolean
}

export function createNotificationsHook(
  input: PluginInput,
  options?: { config?: NotificationsHookConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }
  
  if (!config.enabled) {
    return {}
  }
  
  const notificationConfig: NotificationConfig = {
    enabled: config.enabled,
    soundConfig: config.soundConfig,
    batchSize: config.batchSize,
    batchDelay: config.batchDelay,
    maxRetries: config.maxRetries,
  }
  
  const manager = createNotificationManager(notificationConfig)
  
  return {
    "tool.execute.after": async (toolInput: any, toolOutput: any) => {
      if (!config.enabled) return
      
      const { tool } = toolInput
      
      if (!toolOutput?.output) return
      
      let soundEvent: SoundEvent | undefined
      let message = ""
      let title = "Kraken-Code"
      
      if (tool === "session_list") {
        title = "Sessions Listed"
        message = "Session list retrieved successfully"
      } else if (tool === "session_create") {
        title = "Session Created"
        message = "New session started"
        soundEvent = { type: "task_complete" }
      } else if (tool === "session_close") {
        title = "Session Closed"
        message = "Session closed"
        soundEvent = { type: "task_complete" }
      } else if (tool === "write" || tool === "edit" || tool === "multiEdit") {
        title = "File Modified"
        message = "File operation completed"
        soundEvent = { type: "task_complete" }
      } else if (tool === "ast_grep_replace") {
        title = "Code Refactored"
        message = "AST grep replace completed"
        soundEvent = { type: "task_complete" }
      } else if (tool.startsWith("lsp_")) {
        title = "LSP Operation"
        message = `${tool} completed`
      }
      
      if (message) {
        sendNotification(title, message, soundEvent, config)
      }
    },
  }
}

export const metadata = {
  name: "notifications",
  priority: 30,
  description: "Provides desktop notifications for task completion and important events",
} as const
