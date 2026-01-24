import * as fs from "fs"
import * as path from "path"
import {
  getStateFilePath,
  RalphLoopState,
} from "../../storage"

const COMPLETION_PROMISE_REGEX = /<promise>\s*DONE\s*<\/promise>/gi
const PROGRESS_PATTERN_REGEX = /<promise>\s*(PROGRESS:\d+%)\s*<\/promise>/gi

export interface CompletionDetectionResult {
  completed: boolean
  progress?: number
  confidence: number
}

export async function detectCompletionPromise(
  sessionID: string,
  promise: string
): Promise<boolean> {
  const stateFilePath = getStateFilePath(sessionID)

  if (!fs.existsSync(stateFilePath)) {
    return false
  }

  try {
    const content = await fs.promises.readFile(stateFilePath, "utf-8")
    const state = JSON.parse(content) as RalphLoopState

    return state.status === "completed"
  } catch (error) {
    console.error(
      `[ralph-detector] Error detecting completion for session ${sessionID}:`,
      error
    )
    return false
  }
}

export async function detectCompletionInSessionMessages(
  sessionID: string,
  promise: string
): Promise<boolean> {
  try {
    const stateFilePath = getStateFilePath(sessionID)

    if (!fs.existsSync(stateFilePath)) {
      return false
    }

    const content = await fs.promises.readFile(stateFilePath, "utf-8")
    const state = JSON.parse(content) as RalphLoopState

    if (state.status !== "active") {
      return state.status === "completed"
    }

    const fullTranscript = state.transcript.join("\n")
    const completionMatch = COMPLETION_PROMISE_REGEX.test(fullTranscript)

    if (completionMatch) {
      console.log(
        `[ralph-detector] Detected completion promise in session ${sessionID}`
      )
      return true
    }

    const progressMatch = fullTranscript.match(PROGRESS_PATTERN_REGEX)
    if (progressMatch) {
      const progressMatchContent = progressMatch[0]
      const progressValue = progressMatchContent.match(/PROGRESS:(\d+)/)
      if (progressValue) {
        const progress = parseInt(progressValue[1], 10)
        console.log(
          `[ralph-detector] Detected progress ${progress}% in session ${sessionID}`
        )
        if (progress >= 100) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error(
      `[ralph-detector] Error detecting completion in session ${sessionID}:`,
      error
    )
    return false
  }
}

export function detectCompletionInText(
  text: string,
  promise: string
): CompletionDetectionResult {
  const completionMatch = text.match(COMPLETION_PROMISE_REGEX)

  if (completionMatch) {
    console.log("[ralph-detector] Detected completion promise in text")
    return {
      completed: true,
      confidence: 1.0,
    }
  }

  const progressMatch = text.match(PROGRESS_PATTERN_REGEX)
  if (progressMatch) {
    const progressValue = progressMatch[0].match(/PROGRESS:(\d+)/)
    if (progressValue) {
      const progress = parseInt(progressValue[1], 10)
      return {
        completed: progress >= 100,
        progress,
        confidence: progress >= 100 ? 1.0 : 0.7,
      }
    }
  }

  return {
    completed: false,
    confidence: 0.0,
  }
}

export function extractPromiseFromText(text: string): string | null {
  const promiseMatch = text.match(/<promise>\s*([\s\S]*?)\s*<\/promise>/i)
  if (!promiseMatch) {
    return null
  }

  return promiseMatch[1].trim()
}

export function shouldContinueRalphLoop(
  state: RalphLoopState
): {
  shouldContinue: boolean
  reason?: string
} {
  if (state.status !== "active") {
    return {
      shouldContinue: false,
      reason: `Loop is not active (status: ${state.status})`,
    }
  }

  if (state.currentIteration >= state.maxIterations) {
    return {
      shouldContinue: false,
      reason: `Reached max iterations (${state.maxIterations})`,
    }
  }

  const elapsedTime = Date.now() - state.startTime
  const maxDuration = 60 * 60 * 1000

  if (elapsedTime > maxDuration) {
    return {
      shouldContinue: false,
      reason: `Exceeded maximum duration (${Math.floor(elapsedTime / 1000 / 60)} minutes)`,
    }
  }

  return {
    shouldContinue: true,
  }
}
