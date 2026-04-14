import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { readState, writeState, clearState, type RalphLoopState } from '../storage'

export const ralphLoop = tool({
  description:
    'Control Ralph-Loop iterations for achieving completion promises. ' +
    "Ralph complements Kraken's PDSA cycles by iteratively refining until <promise> is satisfied. " +
    'Automatically triggered when chat contains <promise>...</promise> pattern, or use this tool for manual control.',
  args: {
    command: z.enum(['status', 'cancel', 'continue', 'info']).describe('Ralph-Loop command'),
    sessionID: z.string().optional().describe('Session ID (required for status, cancel, continue)'),
    maxIterations: z.number().min(1).max(100).optional().describe('Max iterations (default: 24)'),
  },
  async execute(args): Promise<string> {
    const { command, sessionID, maxIterations } = args

    switch (command) {
      case 'status': {
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: 'sessionID required for status command',
          })
        }

        const state = readState(sessionID)

        if (!state) {
          return JSON.stringify({
            success: true,
            session: {
              sessionID,
              status: 'none',
              promise: 'No active Ralph Loop for this session',
              task: 'N/A',
              currentIteration: 0,
              maxIterations: maxIterations ?? 24,
              elapsedMs: 0,
            },
          })
        }

        const elapsedMs = state.status === 'active' ? Date.now() - state.startTime : 0

        return JSON.stringify({
          success: true,
          session: {
            sessionID: state.sessionID,
            status: state.status,
            promise: state.promise,
            task: state.task,
            currentIteration: state.currentIteration,
            maxIterations: state.maxIterations,
            elapsedMs,
          },
        })
      }

      case 'cancel': {
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: 'sessionID required for cancel command',
          })
        }

        const state = readState(sessionID)

        if (!state) {
          return JSON.stringify({
            success: false,
            error: `No active Ralph Loop for session ${sessionID}`,
          })
        }

        state.status = 'cancelled'
        writeState(sessionID, state)

        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} cancelled`,
          sessionID,
          iterationsCompleted: state.currentIteration,
        })
      }

      case 'continue': {
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: 'sessionID required for continue command',
          })
        }

        const state = readState(sessionID)

        if (!state) {
          return JSON.stringify({
            success: false,
            error: `No Ralph Loop session found for ${sessionID}`,
          })
        }

        if (state.status !== 'active') {
          return JSON.stringify({
            success: false,
            error: `Session ${sessionID} is not active (status: ${state.status})`,
          })
        }

        state.currentIteration++
        if (state.currentIteration >= state.maxIterations) {
          state.status = 'maxed_out'
        }
        writeState(sessionID, state)

        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} continuing to iteration ${state.currentIteration}/${state.maxIterations}`,
          sessionID,
          currentIteration: state.currentIteration,
          maxIterations: state.maxIterations,
          status: state.status,
        })
      }

      case 'info': {
        return JSON.stringify({
          success: true,
          info: {
            description:
              'Ralph-Loop: Self-referential iteration agent that continues until completion promise is satisfied',
            triggers: [
              'Chat message contains <promise>...</promise> pattern',
              'User types /ralph-loop [task] <promise>...</promise>',
            ],
            defaults: {
              maxIterations: maxIterations ?? 24,
              timeout: 'None (continues until promise met or max iterations)',
            },
            complement:
              "Ralph complements Kraken's PDSA cycles. Kraken orchestrates; Ralph iterates.",
          },
        })
      }

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

export type { RalphLoopState }
