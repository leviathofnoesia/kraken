import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import { z } from "zod"
import type { BackgroundManager } from "./manager"

type AgentCallContext = {
  client: PluginInput["client"]
  directory: string
}

function buildAgentPrompt(task: string, context?: string): string {
  if (!context) {
    return task
  }

  return `${task}\n\nContext:\n${context}`
}

function extractTextFromParts(parts: Part[]): string {
  const textChunks = parts
    .filter((part) => part.type === "text" || part.type === "reasoning")
    .map((part) => part.text)

  return textChunks.join("\n").trim()
}

async function runAgentCall(
  context: AgentCallContext,
  agent: string,
  task: string,
  extraContext?: string
): Promise<{ sessionId: string; responseText: string }> {
  const sessionResult = await context.client.session.create({
    body: { title: `Subagent: ${agent}` },
    query: { directory: context.directory },
  })

  if (!sessionResult || sessionResult.error || !sessionResult.data) {
    const errorMessage = sessionResult?.error
      ? JSON.stringify(sessionResult.error)
      : "Failed to create session for subagent task."
    throw new Error(errorMessage)
  }

  const sessionId = sessionResult.data.id
  const prompt = buildAgentPrompt(task, extraContext)
  const promptResult = await context.client.session.prompt({
    path: { id: sessionId },
    query: { directory: context.directory },
    body: {
      agent,
      parts: [{ type: "text", text: prompt }],
    },
  })

  if (!promptResult || promptResult.error || !promptResult.data) {
    const errorMessage = promptResult?.error
      ? JSON.stringify(promptResult.error)
      : "Subagent prompt failed."
    throw new Error(errorMessage)
  }

  const responseText = extractTextFromParts(promptResult.data.parts)

  return {
    sessionId,
    responseText: responseText || JSON.stringify(promptResult.data, null, 2),
  }
}

/**
 * Creates a tool for calling subagents asynchronously
 */
export function createCallAgentTool(manager: BackgroundManager, context: AgentCallContext) {
  return tool({
    description: 
      "Delegate a task to a specialized subagent for domain expertise. " +
      "Supports both synchronous (wait=true) and asynchronous (wait=false) execution patterns. " +
      "Use this when tasks require specialized knowledge, extensive search, " +
      "or can benefit from parallel execution.",
    args: {
      agent: z
        .enum([
          "Nautilus",
          "Abyssal",
          "Maelstrom",
          "Coral",
          "Siren",
          "Leviathan",
          "Poseidon (Plan Consultant)",
          "Scylla (Plan Reviewer)",
          "Pearl",
        ])
        .describe(
          "Name of subagent to delegate to. Each agent has specialized expertise:\n" +
          "- Nautilus: Codebase search, pattern finding, symbol analysis\n" +
          "- Abyssal: External research, documentation lookup, API discovery\n" +
          "- Maelstrom: Architecture design, system analysis, trade-off evaluation\n" +
          "- Coral: Visual/UI/UX design, frontend components, styling\n" +
          "- Siren: Documentation writing, technical communication, clarity\n" +
          "- Leviathan: System design, structural analysis, large-scale architecture\n" +
          "- Poseidon: Planning, requirement analysis, test plan creation\n" +
          "- Scylla: Code review, test coverage analysis, quality assurance\n" +
          "- Pearl: Testing, test creation, test execution"
        ),
      task: z
        .string()
        .min(5)
        .describe(
          "Clear, specific description of what the agent should do. " +
          "Include relevant context, expected output format, and success criteria."
        ),
      context: z
        .string()
        .optional()
        .describe("Additional context that may help the agent complete the task"),
      wait: z
        .boolean()
        .default(false)
        .describe(
          "If true, wait for the agent to complete and return the full result. " +
          "If false (default), return immediately with a task ID for async tracking. " +
          "Use wait=false for parallel delegation to multiple agents."
        ),
    },
    async execute(args): Promise<string> {
      const { agent, task, context: taskContext, wait: shouldWait } = args as any

      try {
        const newTask = manager.createTask(agent, task, taskContext)

        const runTask = async () => {
          const result = await runAgentCall(context, agent, task, taskContext)
          newTask.sessionId = result.sessionId
          manager.completeTask(newTask.id, result.responseText)
        }

        manager.startTask(newTask.id)

        if (shouldWait) {
          try {
            await runTask()
          } catch (error) {
            manager.failTask(newTask.id, error instanceof Error ? error.message : "Unknown error")
          }
          const result = manager.getTask(newTask.id)
          return JSON.stringify(
            {
              success: true,
              taskId: result?.id ?? newTask.id,
              agent: result?.agent ?? agent,
              status: result?.status ?? "failed",
              result: result?.result,
              error: result?.error,
              duration: result?.completedAt && result?.startedAt
                ? result.completedAt - result.startedAt
                : null,
              sessionId: result?.sessionId,
            },
            null,
            2
          )
        }

        void runTask().catch((error) => {
          manager.failTask(newTask.id, error instanceof Error ? error.message : "Unknown error")
        })

        return JSON.stringify(
          {
            success: true,
            taskId: newTask.id,
            agent: newTask.agent,
            status: newTask.status,
            message: `Task delegated to ${agent}. Use background_task_status to check progress.`,
            sessionId: newTask.sessionId,
          },
          null,
            2
        )
      } catch (error) {
        return JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          null,
            2
        )
      }
    },
  })
}

/**
 * Creates a tool for checking background task status
 */
export function createBackgroundTaskStatusTool(manager: BackgroundManager) {
  return tool({
    description: 
      "Check the status of a background agent task. Returns completion status, " +
      "results, and duration information for tasks created with call_agent(wait=false).",
    args: {
      taskId: z
        .string()
        .describe("Task ID from a previous call_agent invocation"),
    },
    async execute(args): Promise<string> {
      const { taskId } = args as any

      const task = manager.getTask(taskId)

      if (!task) {
        return JSON.stringify(
          {
            success: false,
            error: `Task ${taskId} not found`,
          },
          null,
            2
        )
      }

      return JSON.stringify(
        {
          success: true,
          taskId: task.id,
          agent: task.agent,
          status: task.status,
          result: task.result,
          error: task.error,
          duration: task.completedAt && task.startedAt
            ? task.completedAt - task.startedAt
            : null,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          sessionId: task.sessionId,
        },
        null,
            2
      )
    },
  })
}

/**
 * Creates a tool for listing all background tasks
 */
export function createBackgroundTaskListTool(manager: BackgroundManager) {
  return tool({
    description: 
      "List all background tasks for the current session. Returns both active and " +
      "recently completed tasks for tracking parallel delegation workflows.",
    args: {
      status: z
        .enum(["all", "pending", "running", "completed", "failed"])
        .default("all")
        .describe(
          "Filter by task status. Default 'all' shows all tasks."
        ),
    },
    async execute(args): Promise<string> {
      const { status: taskStatus } = args as any

      const tasks = manager.listTasks()

      const filteredTasks =
        taskStatus === "all"
          ? tasks
          : tasks.filter((t) => t.status === taskStatus)

      return JSON.stringify(
        {
          success: true,
          count: filteredTasks.length,
          tasks: filteredTasks,
        },
        null,
            2
      )
    },
  })
}

/**
 * Creates a tool for canceling a background task
 */
export function createBackgroundTaskCancelTool(manager: BackgroundManager) {
  return tool({
    description: 
      "Cancel a running or pending background task. Use this when a task is " +
      "no longer needed or when you want to free up concurrency slots.",
    args: {
      taskId: z
        .string()
        .describe("Task ID to cancel"),
    },
    async execute(args): Promise<string> {
      const { taskId } = args as any

      const cancelled = manager.cancelTask(taskId)

      if (!cancelled) {
        return JSON.stringify(
          {
            success: false,
            error: `Task ${taskId} not found or cannot be cancelled`,
          },
          null,
            2
        )
      }

      return JSON.stringify(
        {
          success: true,
          taskId,
          message: `Task ${taskId} cancelled successfully`,
        },
        null,
            2
      )
    },
  })
}
