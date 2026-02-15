import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  getStateFilePath,
  readState,
  writeState,
  clearState,
  incrementIteration,
  RalphLoopState,
} from '../../src/storage'

describe('Ralph Loop Storage', () => {
  const testSessionDir = path.join(os.tmpdir(), 'kraken-test-ralph-' + Date.now())
  
  // Mock the SESSIONS_DIR before importing
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testSessionDir)) {
      fs.mkdirSync(testSessionDir, { recursive: true })
    }
  })
  
  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testSessionDir)) {
      fs.rmSync(testSessionDir, { recursive: true, force: true })
    }
  })

  describe('RalphLoopState type', () => {
    it('should have correct shape', () => {
      const state: RalphLoopState = {
        sessionID: 'test-session',
        promise: 'Complete the task',
        task: 'Build a feature',
        maxIterations: 24,
        currentIteration: 0,
        status: 'active',
        transcript: [],
        startTime: Date.now(),
      }
      
      expect(state.sessionID).toBe('test-session')
      expect(state.promise).toBe('Complete the task')
      expect(state.status).toBe('active')
      expect(state.maxIterations).toBe(24)
    })

    it('should support all status values', () => {
      const statuses: RalphLoopState['status'][] = ['active', 'maxed_out', 'cancelled', 'completed']
      
      for (const status of statuses) {
        const state: RalphLoopState = {
          sessionID: 'test',
          promise: 'test',
          task: 'test',
          maxIterations: 10,
          currentIteration: 0,
          status,
          transcript: [],
          startTime: Date.now(),
        }
        expect(state.status).toBe(status)
      }
    })
  })

  describe('readState', () => {
    it('should return null for non-existent session', () => {
      const state = readState('non-existent-session-' + Date.now())
      expect(state).toBeNull()
    })

    it('should read existing state', () => {
      const sessionID = 'test-read-' + Date.now()
      const state: RalphLoopState = {
        sessionID,
        promise: 'Test promise',
        task: 'Test task',
        maxIterations: 10,
        currentIteration: 5,
        status: 'active',
        transcript: ['iteration 1', 'iteration 2'],
        startTime: Date.now(),
      }
      
      writeState(sessionID, state)
      const read = readState(sessionID)
      
      expect(read).not.toBeNull()
      expect(read?.currentIteration).toBe(5)
      expect(read?.promise).toBe('Test promise')
      
      // Cleanup
      clearState(sessionID)
    })
  })

  describe('writeState', () => {
    it('should write state to file', () => {
      const sessionID = 'test-write-' + Date.now()
      const state: RalphLoopState = {
        sessionID,
        promise: 'Write test',
        task: 'Write task',
        maxIterations: 5,
        currentIteration: 1,
        status: 'active',
        transcript: [],
        startTime: Date.now(),
      }
      
      writeState(sessionID, state)
      const read = readState(sessionID)
      
      expect(read).not.toBeNull()
      expect(read?.sessionID).toBe(sessionID)
      
      // Cleanup
      clearState(sessionID)
    })
  })

  describe('clearState', () => {
    it('should clear existing state', () => {
      const sessionID = 'test-clear-' + Date.now()
      const state: RalphLoopState = {
        sessionID,
        promise: 'Clear test',
        task: 'Clear task',
        maxIterations: 5,
        currentIteration: 1,
        status: 'active',
        transcript: [],
        startTime: Date.now(),
      }
      
      writeState(sessionID, state)
      clearState(sessionID)
      const read = readState(sessionID)
      
      expect(read).toBeNull()
    })

    it('should handle clearing non-existent state', () => {
      expect(() => clearState('non-existent-' + Date.now())).not.toThrow()
    })
  })

  describe('incrementIteration', () => {
    it('should increment iteration count', () => {
      const sessionID = 'test-increment-' + Date.now()
      const state: RalphLoopState = {
        sessionID,
        promise: 'Increment test',
        task: 'Increment task',
        maxIterations: 10,
        currentIteration: 3,
        status: 'active',
        transcript: [],
        startTime: Date.now(),
      }
      
      writeState(sessionID, state)
      const updated = incrementIteration(sessionID)
      
      expect(updated).not.toBeNull()
      expect(updated?.currentIteration).toBe(4)
      
      // Cleanup
      clearState(sessionID)
    })

    it('should return null for non-existent session', () => {
      const result = incrementIteration('non-existent-increment-' + Date.now())
      expect(result).toBeNull()
    })
  })
})
