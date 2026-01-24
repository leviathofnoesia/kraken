export interface OpenCodeTodo {
  content: string
  status: string
  priority: string
  id: string
}

export interface TodoFile {
  version: string
  todos: OpenCodeTodo[]
}
