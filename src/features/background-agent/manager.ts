import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import {
  createCallAgentTool,
  createBackgroundTaskStatusTool,
  createBackgroundTaskListTool,
  createBackgroundTaskCancelTool,
} from "./tool"

export interface BackgroundTask {
  id: string
  agent: string
  status: "pending" | "running" | "completed" | "failed"
  createdAt: number
  startedAt?: number
  completedAt?: number
  result?: string
  error?: string
}

export interface BackgroundManagerConfig {
  modelConcurrency?: Record<string, number>
  providerConcurrency?: Record<string, number>
  defaultConcurrency?: number
}

export class BackgroundManager {
  private tasks: Map<string, BackgroundTask> = new Map()
  private config: BackgroundManagerConfig
  private queues: Map<string, Array<() => void>> = new Map()
  private counts: Map<string, number> = new Map()

  constructor(config?: BackgroundManagerConfig) {
    this.config = config || {}
  }

  getConcurrencyLimit(model: string): number {
    const modelLimit = this.config.modelConcurrency?.[model]
    if (modelLimit !== undefined) {
      return modelLimit === 0 ? Infinity : modelLimit
    }

    const provider = model.split("/")[0]
    const providerLimit = this.config.providerConcurrency?.[provider]
    if (providerLimit !== undefined) {
      return providerLimit === 0 ? Infinity : providerLimit
    }

    const defaultLimit = this.config.defaultConcurrency
    if (defaultLimit !== undefined) {
      return defaultLimit === 0 ? Infinity : defaultLimit
    }

    return 5
  }

  async acquire(model: string): Promise<void> {
    const limit = this.getConcurrencyLimit(model)
    if (limit === Infinity) {
      return
    }

    const current = this.counts.get(model) ?? 0
    if (current < limit) {
      this.counts.set(model, current + 1)
      return
    }

    return new Promise((resolve) => {
      const queue = this.queues.get(model) ?? []
      queue.push(resolve)
      this.queues.set(model, queue)
    })
  }

  release(model: string): void {
    const limit = this.getConcurrencyLimit(model)
    if (limit === Infinity) {
      return
    }

    const queue = this.queues.get(model)
    if (queue && queue.length > 0) {
      const next = queue.shift()
      this.counts.set(model, (this.counts.get(model) ?? 0) - 1)
      if (next) next()
    } else {
      const current = this.counts.get(model) ?? 0
      if (current > 0) {
        this.counts.set(model, current - 1)
      }
    }
  }

  createTask(agent: string, task?: string, context?: string): BackgroundTask {
    const newTask: BackgroundTask = {
      id: crypto.randomUUID(),
      agent,
      status: "pending",
      createdAt: Date.now(),
    }
    this.tasks.set(newTask.id, newTask)
    return newTask
  }

  waitForTask(taskId: string, timeout: number = 30000): Promise<BackgroundTask> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const task = this.tasks.get(taskId)
        if (!task) {
          clearInterval(checkInterval)
          reject(new Error(`Task ${taskId} not found`))
          return
        }
        if (task.status === "completed" || task.status === "failed") {
          clearInterval(checkInterval)
          resolve(task)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`))
      }, timeout)
    })
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || (task.status !== "pending" && task.status !== "running")) {
      return false
    }
    task.status = "failed"
    task.completedAt = Date.now()
    task.error = "Task cancelled by user"
    return true
  }

  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "pending") {
      return false
    }
    task.status = "running"
    task.startedAt = Date.now()
    return true
  }

  completeTask(taskId: string, result: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "running") {
      return false
    }
    task.status = "completed"
    task.completedAt = Date.now()
    task.result = result
    return true
  }

  failTask(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "running") {
      return false
    }
    task.status = "failed"
    task.completedAt = Date.now()
    task.error = error
    return true
  }

  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId)
  }

  listTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values())
  }

  listActiveTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "pending" || t.status === "running"
    )
  }
}

export function createBackgroundAgentFeature(_input: PluginInput): {
  manager: BackgroundManager
  tools: Record<string, ToolDefinition>
} {
  const manager = new BackgroundManager()
  
  return {
    manager,
    tools: {
      call_agent: createCallAgentTool(manager),
      background_task_status: createBackgroundTaskStatusTool(manager),
      background_task_list: createBackgroundTaskListTool(manager),
      background_task_cancel: createBackgroundTaskCancelTool(manager),
    },
  }
}
