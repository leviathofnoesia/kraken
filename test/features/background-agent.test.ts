import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test'
import { BackgroundManager } from '../../src/features/background-agent/manager'

describe('Background Agent Manager', () => {
  let manager: BackgroundManager

  beforeEach(() => {
    manager = new BackgroundManager()
  })

  afterEach(() => {
    // Clean up any remaining tasks
    const tasks = manager.listTasks()
    for (const task of tasks) {
      manager.cancelTask(task.id)
    }
  })

  describe('BackgroundManager', () => {
    it('should create a task', () => {
      const task = manager.createTask('Nautilus', 'Test task', 'test context')
      expect(task).toBeDefined()
      expect(task.id).toBeDefined()
      expect(task.agent).toBe('Nautilus')
      expect(task.status).toBe('pending')
      expect(task.createdAt).toBeDefined()
    })

    it('should list all tasks', () => {
      manager.createTask('Nautilus', 'Task 1')
      manager.createTask('Abyssal', 'Task 2')
      
      const tasks = manager.listTasks()
      expect(tasks.length).toBe(2)
    })

    it('should get a specific task', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      const retrieved = manager.getTask(task.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(task.id)
    })

    it('should return undefined for non-existent task', () => {
      const task = manager.getTask('non-existent-id')
      expect(task).toBeUndefined()
    })

    it('should start a task', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      manager.startTask(task.id)
      
      const updated = manager.getTask(task.id)
      expect(updated?.status).toBe('running')
      expect(updated?.startedAt).toBeDefined()
    })

    it('should complete a task', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      manager.startTask(task.id)
      manager.completeTask(task.id, 'test result')
      
      const updated = manager.getTask(task.id)
      expect(updated?.status).toBe('completed')
      expect(updated?.result).toBe('test result')
      expect(updated?.completedAt).toBeDefined()
    })

    it('should fail a task', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      manager.startTask(task.id)
      manager.failTask(task.id, 'test error')
      
      const updated = manager.getTask(task.id)
      expect(updated?.status).toBe('failed')
      expect(updated?.error).toBe('test error')
      expect(updated?.completedAt).toBeDefined()
    })

    it('should cancel a task', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      manager.startTask(task.id)
      const cancelled = manager.cancelTask(task.id)
      
      expect(cancelled).toBe(true)
      const updated = manager.getTask(task.id)
      // Note: cancelled tasks are marked as 'failed' with error message
      expect(updated?.status).toBe('failed')
      expect(updated?.error).toBe('Task cancelled by user')
    })
    
    it('should not cancel completed tasks', () => {
      const task = manager.createTask('Nautilus', 'Test task')
      manager.startTask(task.id)
      manager.completeTask(task.id, 'result')
      
      const cancelled = manager.cancelTask(task.id)
      expect(cancelled).toBe(false)
    })

    it('should filter tasks by status', () => {
      const task1 = manager.createTask('Nautilus', 'Task 1')
      manager.startTask(task1.id)
      
      manager.createTask('Nautilus', 'Task 2') // pending
      
      const task3 = manager.createTask('Nautilus', 'Task 3')
      manager.startTask(task3.id)
      manager.completeTask(task3.id, 'result')
      
      const running = manager.listTasks().filter(t => t.status === 'running')
      const completed = manager.listTasks().filter(t => t.status === 'completed')
      const pending = manager.listTasks().filter(t => t.status === 'pending')
      
      expect(running.length).toBe(1)
      expect(completed.length).toBe(1)
      expect(pending.length).toBe(1)
    })

    it('should handle concurrent task creation', () => {
      const tasks = []
      for (let i = 0; i < 10; i++) {
        tasks.push(manager.createTask('Nautilus', `Task ${i}`))
      }
      
      const allTasks = manager.listTasks()
      expect(allTasks.length).toBe(10)
    })
  })
})
