import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'
import {
  getStateFilePath,
  readState,
  writeState,
  clearState,
  incrementIteration,
  RalphLoopState,
} from '../../storage'

export * from './detector'

export interface RalphConfig {
  maxIterations?: number
  enabled?: boolean
}

const RALPH_SYSTEM_PROMPT = `You are Ralph, a specialized iteration agent focused on achieving completion promises.

Your methodology:
1. Analyze current state against promise criteria
2. Identify gaps between current state and promised outcome
3. Execute targeted improvements to close those gaps
4. Re-evaluate against promise
5. Continue iterating until satisfaction

Remember: You complement Kraken's orchestration. Kraken plans the overall approach; you ensure that specific promise is satisfied.
Don't re-plan—just iterate toward the specific promise criteria.
`

const DEFAULT_MAX_ITERATIONS = 24

export function createRalphLoopHook(
  _input: PluginInput,
  options?: { config?: RalphConfig },
): Hooks {
  const config = options?.config ?? {
    enabled: true,
  }

  const sessions = new Map<string, RalphLoopState>()

  function extractPromise(text: string): { promise: string; task: string } | null {
    const promiseMatch = text.match(/<promise>\s*([\s\S]*?)\s*<\/promise>/i)
    if (!promiseMatch) return null

    const promise = promiseMatch[1].trim()

    const taskMatch = text.match(/<user-task>\s*([\s\S]*?)\s*<\/user-task>/i)
    const task = taskMatch ? taskMatch[1].trim() : text.split('<promise>')[0].trim()

    return { promise, task }
  }

  function createSession(
    sessionID: string,
    promise: string,
    task: string,
    maxIterations: number = DEFAULT_MAX_ITERATIONS,
  ): RalphLoopState {
    const session: RalphLoopState = {
      sessionID,
      promise,
      task,
      maxIterations,
      currentIteration: 0,
      status: 'active',
      transcript: [],
      startTime: Date.now(),
    }
    sessions.set(sessionID, session)
    return session
  }

  function formatIterations(session: RalphLoopState): string {
    if (session.currentIteration === 0) {
      return 'No previous iterations.'
    }

    const iterations = session.transcript.slice(-session.currentIteration * 2).join('\n---\n')

    return iterations || `Iteration ${session.currentIteration} completed.`
  }

  function generateIterationPrompt(session: RalphLoopState): string {
    return RALPH_SYSTEM_PROMPT.replace('{prompt}', session.task)
      .replace('{promise}', session.promise)
      .replace('{iterations}', formatIterations(session))
  }

  function getTextFromParts(parts: Part[]): string {
    return parts
      .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
      .map((p) => ('text' in p ? p.text : ''))
      .join('\n')
      .trim()
  }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return

      const { sessionID } = input
      const promptText = getTextFromParts(output.parts)

      const promiseMatch = extractPromise(promptText)

      if (!promiseMatch) return

      const { promise, task } = promiseMatch

      const existingSession = readState(sessionID)

      if (existingSession && existingSession.status === 'active') {
        existingSession.currentIteration++
        existingSession.transcript.push(
          `Iteration ${existingSession.currentIteration}:\n${promptText}\n`,
        )

        if (existingSession.currentIteration >= existingSession.maxIterations) {
          existingSession.status = 'maxed_out'
          console.log(
            `[ralph-loop] Session ${sessionID} reached max iterations (${existingSession.maxIterations})`,
          )
        }

        writeState(sessionID, existingSession)

        console.log(
          `[ralph-loop] Continuing iteration ${existingSession.currentIteration}/${existingSession.maxIterations} for session ${sessionID}`,
        )
        console.log(
          `[ralph-loop] Next prompt: ${generateIterationPrompt(existingSession).substring(0, 100)}...`,
        )
      } else {
        const maxIterations = config.maxIterations ?? DEFAULT_MAX_ITERATIONS
        const newSession = createSession(sessionID, promise, task, maxIterations)

        console.log(
          `[ralph-loop] Starting new session ${sessionID} with promise: "${promise.substring(0, 50)}..."`,
        )
        writeState(sessionID, newSession)
        sessions.set(sessionID, newSession)
      }
    },
  }
}
