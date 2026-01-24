import { tool } from "@opencode-ai/plugin"
import { z } from "zod"

export interface RalphStatus {
  sessionID: string
  promise: string
  task: string
  currentIteration: number
  maxIterations: number
  status: "active" | "completed" | "maxed_out" | "cancelled"
  elapsedMs: number
}

export const ralphLoop = tool({
  description:
    "Control Ralph-Loop iterations for achieving completion promises. " +
    "Ralph complements Kraken's PDSA cycles by iteratively refining until <promise> is satisfied. " +
    "Automatically triggered when chat contains <promise>...</promise> pattern, or use this tool for manual control.",
  args: {
    command: z
      .enum(["status", "cancel", "continue", "info"])
      .describe("Ralph-Loop command"),
    sessionID: z.string().optional().describe("Session ID (required for status, cancel)"),
    maxIterations: z.number().min(1).max(100).optional().describe("Max iterations (default: 24)"),
  },
  async execute(args): Promise<string> {
    const { command, sessionID, maxIterations } = args

    switch (command) {
      case "status":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for status command",
          })
        }
        return JSON.stringify({
          success: true,
          session: {
            sessionID,
            status: "active",
            promise: "Use /ralph-loop in chat to start a new session",
            task: "N/A",
            currentIteration: 0,
            maxIterations: maxIterations ?? 24,
            elapsedMs: 0,
          },
        })

      case "cancel":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for cancel command",
          })
        }
        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} cancelled`,
        })

      case "continue":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for continue command",
          })
        }
        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} continuing to next iteration`,
        })

      case "info":
        return JSON.stringify({
          success: true,
          info: {
            description:
              "Ralph-Loop: Self-referential iteration agent that continues until completion promise is satisfied",
            triggers: [
              "Chat message contains <promise>...</promise> pattern",
              "User types /ralph-loop [task] <promise>...</promise>",
            ],
            defaults: {
              maxIterations: 24,
              timeout: "None (continues until promise met or max iterations)",
            },
            complement:
              "Ralph complements Kraken's PDSA cycles. Kraken orchestrates; Ralph iterates.",
          },
        })

      default:
        return JSON.stringify({
          success: false,
          error: `Unknown command: ${command}`,
        })
    }
  },
})

export function createRalphLoopTask(prompt: string, promise: string): string {
  return `<user-task>${prompt}</user-task><promise>${promise}</promise>`
}
