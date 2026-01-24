import type { SoundEvent } from "./sound-player"
import { getNotificationCommand } from "./platform-detector"
import { playSound, type SoundConfig } from "./sound-player"

export type { SoundEvent }

export interface NotificationConfig {
  enabled?: boolean
  batchSize?: number
  batchDelay?: number
  maxRetries?: number
  soundConfig?: SoundConfig
}

interface QueuedNotification {
  id: string
  title: string
  message: string
  soundEvent?: SoundEvent
  timestamp: number
  retryCount: number
}

const DEFAULT_CONFIG: Required<NotificationConfig> = {
  enabled: true,
  batchSize: 5,
  batchDelay: 100,
  maxRetries: 3,
  soundConfig: { enabled: true, volume: 1.0 },
}

class NotificationManager {
  private queue: QueuedNotification[] = []
  private processing: boolean = false
  private sentNotifications = new Set<string>()
  private config: Required<NotificationConfig>

  constructor(config: NotificationConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  enqueue(
    title: string,
    message: string,
    soundEvent?: SoundEvent,
    id?: string,
  ): string {
    const notificationId = id || this.generateId()
    
    this.queue.push({
      id: notificationId,
      title,
      message,
      soundEvent,
      timestamp: Date.now(),
      retryCount: 0,
    })
    
    console.log(`[notification-manager] Enqueued: ${notificationId} - ${title}`)
    
    this.processQueue()
    
    return notificationId
  }

  private generateId(): string {
    return `notify-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    try {
      const batch = this.queue.splice(0, this.config.batchSize)
      const dedupedBatch = batch.filter(n => !this.sentNotifications.has(n.id))

      if (dedupedBatch.length === 0) {
        this.processing = false
        return
      }

      for (const notification of dedupedBatch) {
        await this.sendNotification(notification)
        this.sentNotifications.add(notification.id)
      }

      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay))
        this.processQueue()
      }
    } finally {
      this.processing = false
    }
  }

  private async sendNotification(
    notification: QueuedNotification,
  ): Promise<boolean> {
    const commandResult = await getNotificationCommand()
    
    if (!commandResult) {
      console.log(`[notification-manager] No notification command available for ${notification.id}`)
      return false
    }

    try {
      let success = false
      
      if (commandResult.platform === "linux") {
        success = await this.sendLinuxNotification(notification, commandResult)
      } else if (commandResult.platform === "darwin") {
        success = await this.sendDarwinNotification(notification, commandResult)
      } else if (commandResult.platform === "win32") {
        success = await this.sendWindowsNotification(notification, commandResult)
      }

      if (success && notification.soundEvent) {
        await playSound(notification.soundEvent, this.config.soundConfig)
      }

      return success
    } catch (error) {
      console.error(`[notification-manager] Error sending notification ${notification.id}:`, error)
      
      if (notification.retryCount < this.config.maxRetries) {
        notification.retryCount++
        this.queue.push(notification)
        setTimeout(() => this.processQueue(), 1000 * (notification.retryCount + 1))
      }
      
      return false
    }
  }

  private async sendLinuxNotification(
    notification: QueuedNotification,
    command: { command: string; args: string[]; platform: string },
  ): Promise<boolean> {
    try {
      const { spawn } = await import("node:child_process")
      
      const args = [
        ...command.args,
        `--app-name=Kraken-Code`,
        `--icon=kraken-code`,
        notification.id,
        notification.title,
        notification.message,
      ]

      const result = spawn(command.command, args, {
        detached: true,
        stdio: "ignore",
      })

      result.unref()
      return true
    } catch {
      return false
    }
  }

  private async sendDarwinNotification(
    notification: QueuedNotification,
    command: { command: string; args: string[]; platform: string },
  ): Promise<boolean> {
    try {
      const { execFile } = await import("node:child_process")
      
      const script = `
        display notification with title "${notification.title}" \
          subtitle "Kraken-Code" \
          message "${notification.message}" \
          sound name "${notification.soundEvent || "notification"}"
      `

      await new Promise<void>((resolve, reject) => {
        execFile(command.command, [...command.args, '-e', script], (error) => {
          if (error) reject(error)
          else resolve()
        })
      })

      return true
    } catch {
      return false
    }
  }

  private async sendWindowsNotification(
    notification: QueuedNotification,
    command: { command: string; args: string[]; platform: string },
  ): Promise<boolean> {
    try {
      const { spawn } = await import("node:child_process")
      
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing

        $balloon = New-Object System.Windows.Forms.NotifyIcon
        $balloon.Visible = $false
        $balloon.BalloonTipIcon = [System.Drawing.ToolTipIcon]::Info
        $balloon.BalloonTipTitle = "${notification.title}"
        $balloon.BalloonTipText = "${notification.message}"
        $balloon.Icon = [System.Drawing.Icon]::Information
        $balloon.Text = "Kraken-Code"
        $balloon.ShowBalloonTip(5000)
        $balloon.Dispose()
      `

      const result = spawn(command.command, [...command.args, script], {
        detached: true,
        stdio: "ignore",
      })

      result.unref()
      return true
    } catch {
      return false
    }
  }

  clearQueue(): void {
    this.queue = []
    this.sentNotifications.clear()
    console.log("[notification-manager] Queue cleared")
  }

  getQueueLength(): number {
    return this.queue.length
  }

  isProcessing(): boolean {
    return this.processing
  }

  clearSentHistory(): void {
    this.sentNotifications.clear()
  }
}

let globalManager: NotificationManager | null = null

export function createNotificationManager(config?: NotificationConfig): NotificationManager {
  if (!globalManager) {
    globalManager = new NotificationManager(config)
  }
  return globalManager
}

export function sendNotification(
  title: string,
  message: string,
  soundEvent?: SoundEvent,
  config?: NotificationConfig,
): string {
  const manager = createNotificationManager(config)
  return manager.enqueue(title, message, soundEvent)
}

export function getNotificationManager(): NotificationManager | null {
  return globalManager
}
