import * as os from 'os'
import * as path from 'path'

export interface StoragePaths {
  todoPath: string
  transcriptPath: string
  customTodoPath?: string
  customTranscriptPath?: string
}

export interface StorageConfig {
  todoPath?: string
  transcriptPath?: string
  format?: 'jsonl' | 'json'
  autoCleanup?: boolean
}

export function getDefaultPaths(): StoragePaths {
  const homeDir = os.homedir()

  return {
    todoPath: path.join(homeDir, '.claude', 'todos'),
    transcriptPath: path.join(homeDir, '.claude', 'transcripts'),
  }
}

export function getPaths(config: StorageConfig): StoragePaths {
  const defaults = getDefaultPaths()

  return {
    todoPath: config.todoPath || defaults.todoPath,
    transcriptPath: config.transcriptPath || defaults.transcriptPath,
    customTodoPath: config.todoPath,
    customTranscriptPath: config.transcriptPath,
  }
}

export function resolveSessionId(sessionId: string): string {
  if (!sessionId) {
    return 'unknown'
  }

  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function ensureDirectories(paths: StoragePaths): void {
  const dirs = [path.dirname(paths.todoPath), path.dirname(paths.transcriptPath)]

  for (const dir of dirs) {
    try {
      require('node:fs').mkdirSync(dir, { recursive: true })
    } catch {
      // Directory creation failed silently
    }
  }
}

export function validatePath(filePath: string): boolean {
  if (!filePath) {
    return false
  }

  const resolved = path.resolve(filePath)

  if (resolved.startsWith(path.resolve(os.homedir()))) {
    return true
  }

  return false
}

export function getRelativePath(filePath: string, basePath: string = process.cwd()): string {
  return path.relative(basePath, filePath)
}
