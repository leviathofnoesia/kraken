import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import * as os from 'os'
import type { OpenCodeTodo, TodoFile } from './types'
import { createLogger } from '../utils/logger'

const logger = createLogger('todo-manager')
const TODO_VERSION = '1.0'
const TODO_ENCODING = 'utf-8'

export function getTodoPath(sessionId: string, customPath?: string): string {
  if (customPath) {
    return join(customPath, `${sessionId}.json`)
  }

  const basePath = join(os.homedir(), '.claude', 'todos')
  return join(basePath, `${sessionId}.json`)
}

export async function loadTodoFile(
  sessionId: string,
  customPath?: string,
): Promise<OpenCodeTodo[] | null> {
  const todoPath = getTodoPath(sessionId, customPath)

  try {
    await fs.mkdir(dirname(todoPath), { recursive: true })

    const content = await fs.readFile(todoPath, TODO_ENCODING)
    const todoFile: TodoFile = JSON.parse(content)

    if (todoFile.version !== TODO_VERSION) {
      logger.warn(`Todo file version mismatch: ${todoFile.version} (expected ${TODO_VERSION})`)
      return null
    }

    return todoFile.todos || []
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return []
    }

    logger.error(`Error loading todo file from ${todoPath}:`, error)
    return null
  }
}

export async function saveTodoFile(
  sessionId: string,
  todos: OpenCodeTodo[],
  customPath?: string,
): Promise<boolean> {
  const todoPath = getTodoPath(sessionId, customPath)

  try {
    await fs.mkdir(dirname(todoPath), { recursive: true })

    const todoFile: TodoFile = {
      version: TODO_VERSION,
      todos,
    }

    await fs.writeFile(todoPath, JSON.stringify(todoFile, null, 2), TODO_ENCODING)

    logger.debug(`Saved ${todos.length} todos to ${todoPath}`)
    return true
  } catch (error) {
    logger.error(`Error saving todo file to ${todoPath}:`, error)
    return false
  }
}

export async function deleteTodoFile(sessionId: string, customPath?: string): Promise<boolean> {
  const todoPath = getTodoPath(sessionId, customPath)

  try {
    await fs.unlink(todoPath)
    logger.debug(`Deleted todo file: ${todoPath}`)
    return true
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return true
    }

    logger.error(`Error deleting todo file ${todoPath}:`, error)
    return false
  }
}

export async function saveOpenCodeTodos(
  client: any,
  sessionId: string,
  todos: OpenCodeTodo[],
): Promise<boolean> {
  try {
    const todoDir = join(os.homedir(), '.claude', 'todos')
    await fs.mkdir(todoDir, { recursive: true })

    const todoFile: TodoFile = {
      version: TODO_VERSION,
      todos,
    }

    const todoPath = join(todoDir, `${sessionId}.json`)
    await fs.writeFile(todoPath, JSON.stringify(todoFile, null, 2), TODO_ENCODING)

    logger.debug(`Saved ${todos.length} todos to OpenCode API`)
    return true
  } catch (error) {
    logger.error(`Error saving todos to OpenCode API:`, error)
    return false
  }
}

export async function loadOpenCodeTodos(sessionId: string): Promise<OpenCodeTodo[] | null> {
  try {
    const todoPath = join(os.homedir(), '.claude', 'todos', `${sessionId}.json`)

    const content = await fs.readFile(todoPath, TODO_ENCODING)
    const todoFile: TodoFile = JSON.parse(content)

    if (todoFile.version !== TODO_VERSION) {
      logger.warn(`Todo file version mismatch: ${todoFile.version}`)
      return null
    }

    return todoFile.todos || []
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return []
    }

    logger.error(`Error loading todos from OpenCode API:`, error)
    return null
  }
}

export function validateTodo(todo: OpenCodeTodo): boolean {
  const requiredFields = ['id', 'content', 'status', 'priority']

  for (const field of requiredFields) {
    if (!(todo as any)[field]) {
      logger.warn(`Invalid todo: missing field "${field}"`)
      return false
    }
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
  if (!validStatuses.includes(todo.status)) {
    logger.warn(`Invalid todo status: ${todo.status}`)
    return false
  }

  const validPriorities = ['high', 'medium', 'low']
  if (!validPriorities.includes(todo.priority)) {
    logger.warn(`Invalid todo priority: ${todo.priority}`)
    return false
  }

  return true
}
