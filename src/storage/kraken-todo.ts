import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const KRAKEN_DIR = path.join(os.homedir(), ".kraken")
const TODO_DIR = path.join(KRAKEN_DIR, "todos")

export interface KrakenTodo {
  content: string
  status: string
  priority: string
  id: string
}

export function ensureDirectories(): void {
  if (!fs.existsSync(KRAKEN_DIR)) {
    fs.mkdirSync(KRAKEN_DIR, { recursive: true })
  }
  if (!fs.existsSync(TODO_DIR)) {
    fs.mkdirSync(TODO_DIR, { recursive: true })
  }
}

export function getTodoPath(sessionId: string): string {
  ensureDirectories()
  return path.join(TODO_DIR, `${sessionId}.jsonl`)
}

export function loadKrakenTodos(sessionId: string): KrakenTodo[] {
  try {
    ensureDirectories()
    const filePath = getTodoPath(sessionId)
    if (!fs.existsSync(filePath)) {
      return []
    }

    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.trim().split("\n")

    return lines
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter((entry): entry is KrakenTodo => entry !== null)
  } catch (error) {
    console.error(`[kraken-todo] Error loading todos for session ${sessionId}:`, error)
    return []
  }
}

export function saveKrakenTodos(sessionId: string, todos: KrakenTodo[]): void {
  try {
    ensureDirectories()
    const filePath = getTodoPath(sessionId)
    const lines = todos.map(todo => JSON.stringify({ ...todo, timestamp: Date.now() }))
    fs.writeFileSync(filePath, lines.join("\n"))
    console.log(`[kraken-todo] Saved ${todos.length} todos for session ${sessionId}`)
  } catch (error) {
    console.error(`[kraken-todo] Error saving todos for session ${sessionId}:`, error)
  }
}

export function deleteKrakenTodos(sessionId: string): void {
  try {
    const filePath = getTodoPath(sessionId)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`[kraken-todo] Deleted todos for session ${sessionId}`)
    }
  } catch (error) {
    console.error(`[kraken-todo] Error deleting todos for session ${sessionId}:`, error)
  }
}

export function cleanupOldTodos(maxAgeDays: number = 30): void {
  try {
    ensureDirectories()
    const now = Date.now()
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000

    const files = fs.readdirSync(TODO_DIR)
    for (const file of files) {
      const filePath = path.join(TODO_DIR, file)
      const stats = fs.statSync(filePath)

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath)
        console.log(`[kraken-todo] Cleaned up old todo file: ${file}`)
      }
    }
  } catch (error) {
    console.error("[kraken-todo] Error cleaning up old todos:", error)
  }
}
