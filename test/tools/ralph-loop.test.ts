import { describe, it, expect, afterEach } from 'bun:test'
import { ralphLoop, createRalphLoopTask } from '../../src/tools/ralph-loop'
import { writeState, clearState } from '../../src/storage'

describe('Ralph Loop Tool', () => {
  afterEach(() => {
    clearState('test-session-123')
    clearState('test-session')
  })

  describe('tool export', () => {
    it('should export ralphLoop tool', () => {
      expect(ralphLoop).toBeDefined()
    })

    it('should have required properties', () => {
      expect(ralphLoop.description).toBeDefined()
      expect(ralphLoop.args).toBeDefined()
      expect(ralphLoop.execute).toBeDefined()
    })
  })

  describe('status command', () => {
    it('should return none status for session with no state', async () => {
      const result = await ralphLoop.execute({
        command: 'status',
        sessionID: 'test-session-123',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.session.sessionID).toBe('test-session-123')
      expect(parsed.session.status).toBe('none')
    })

    it('should return active status for session with state', async () => {
      writeState('test-session-123', {
        sessionID: 'test-session-123',
        status: 'active',
        promise: 'test promise',
        task: 'test task',
        currentIteration: 0,
        maxIterations: 24,
        startTime: Date.now(),
      })

      const result = await ralphLoop.execute({
        command: 'status',
        sessionID: 'test-session-123',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.session.status).toBe('active')
    })

    it('should require sessionID for status command', async () => {
      const result = await ralphLoop.execute({
        command: 'status',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toContain('sessionID required')
    })
  })

  describe('cancel command', () => {
    it('should cancel session with valid sessionID', async () => {
      writeState('test-session-123', {
        sessionID: 'test-session-123',
        status: 'active',
        promise: 'test promise',
        task: 'test task',
        currentIteration: 1,
        maxIterations: 24,
        startTime: Date.now(),
      })

      const result = await ralphLoop.execute({
        command: 'cancel',
        sessionID: 'test-session-123',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.message).toContain('cancelled')
    })

    it('should require sessionID for cancel command', async () => {
      const result = await ralphLoop.execute({
        command: 'cancel',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toContain('sessionID required')
    })
  })

  describe('continue command', () => {
    it('should continue session with valid sessionID', async () => {
      writeState('test-session-123', {
        sessionID: 'test-session-123',
        status: 'active',
        promise: 'test promise',
        task: 'test task',
        currentIteration: 1,
        maxIterations: 24,
        startTime: Date.now(),
      })

      const result = await ralphLoop.execute({
        command: 'continue',
        sessionID: 'test-session-123',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.message).toContain('continuing')
    })

    it('should require sessionID for continue command', async () => {
      const result = await ralphLoop.execute({
        command: 'continue',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toContain('sessionID required')
    })
  })

  describe('info command', () => {
    it('should return Ralph-Loop info', async () => {
      const result = await ralphLoop.execute({
        command: 'info',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.info.description).toBeDefined()
      expect(parsed.info.triggers).toBeDefined()
      expect(parsed.info.defaults).toBeDefined()
    })

    it('should not require sessionID for info command', async () => {
      const result = await ralphLoop.execute({
        command: 'info',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
    })
  })

  describe('maxIterations parameter', () => {
    it('should accept custom maxIterations', async () => {
      const result = await ralphLoop.execute({
        command: 'status',
        sessionID: 'test-session',
        maxIterations: 50,
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.session.maxIterations).toBe(50)
    })

    it('should use default maxIterations when not provided', async () => {
      const result = await ralphLoop.execute({
        command: 'status',
        sessionID: 'test-session',
      })
      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.session.maxIterations).toBe(24)
    })
  })

  describe('createRalphLoopTask', () => {
    it('should create valid task format', () => {
      const task = createRalphLoopTask('Build a feature', 'Feature must be complete')
      expect(task).toContain('<user-task>')
      expect(task).toContain('</user-task>')
      expect(task).toContain('<promise>')
      expect(task).toContain('</promise>')
    })

    it('should include prompt in user-task tags', () => {
      const task = createRalphLoopTask('Test prompt', 'Test promise')
      expect(task).toContain('<user-task>Test prompt</user-task>')
    })

    it('should include promise in promise tags', () => {
      const task = createRalphLoopTask('Test prompt', 'Test promise')
      expect(task).toContain('<promise>Test promise</promise>')
    })
  })
})
