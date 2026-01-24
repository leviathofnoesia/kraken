import * as path from "path"
import * as os from "os"

export function getKrakenDir(): string {
  return path.join(os.homedir(), ".kraken")
}

export function getKrakenTodoDir(): string {
  return path.join(getKrakenDir(), "todos")
}

export function getKrakenTranscriptDir(): string {
  return path.join(getKrakenDir(), "transcripts")
}

export function getKrakenTodoPath(sessionId: string): string {
  return path.join(getKrakenTodoDir(), `${sessionId}.jsonl`)
}

export function getKrakenTranscriptPath(sessionId: string): string {
  return path.join(getKrakenTranscriptDir(), `${sessionId}.jsonl`)
}

export function getTempTranscriptPath(): string {
  return path.join(getKrakenTranscriptDir(), "temp.jsonl")
}
