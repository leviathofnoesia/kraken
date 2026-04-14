import { describe, it, expect, beforeEach } from 'bun:test'
import { AgentBus } from '../../src/agents/bus'

describe('AgentBus', () => {
  beforeEach(() => {
    AgentBus.reset()
  })

  describe('getInstance', () => {
    it('should return a singleton', () => {
      const a = AgentBus.getInstance()
      const b = AgentBus.getInstance()
      expect(a).toBe(b)
    })

    it('should return a new instance after reset', () => {
      const a = AgentBus.getInstance()
      AgentBus.reset()
      const b = AgentBus.getInstance()
      expect(a).not.toBe(b)
    })
  })

  describe('publish/subscribe', () => {
    it('should deliver messages to subscribers', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      bus.subscribe('test:channel', (data) => received.push(data))

      bus.publish('test:channel', { msg: 'hello' })
      expect(received).toHaveLength(1)
      expect(received[0].msg).toBe('hello')
    })

    it('should not deliver to wrong channel', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      bus.subscribe('test:a', (data) => received.push(data))

      bus.publish('test:b', { msg: 'wrong' })
      expect(received).toHaveLength(0)
    })

    it('should deliver to multiple subscribers', () => {
      const bus = AgentBus.getInstance()
      const a: any[] = []
      const b: any[] = []
      bus.subscribe('test:multi', (data) => a.push(data))
      bus.subscribe('test:multi', (data) => b.push(data))

      bus.publish('test:multi', 42)
      expect(a).toHaveLength(1)
      expect(b).toHaveLength(1)
    })

    it('should pass channel name and source', () => {
      const bus = AgentBus.getInstance()
      let capturedChannel = ''
      let capturedSource = ''
      bus.subscribe('test:meta', (_data, channel, source) => {
        capturedChannel = channel
        capturedSource = source ?? ''
      })

      bus.publish('test:meta', {}, 'TestAgent')
      expect(capturedChannel).toBe('test:meta')
      expect(capturedSource).toBe('TestAgent')
    })
  })

  describe('unsubscribe', () => {
    it('should remove subscriber', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      const subId = bus.subscribe('test:unsub', (data) => received.push(data))

      bus.publish('test:unsub', 1)
      expect(received).toHaveLength(1)

      const removed = bus.unsubscribe(subId)
      expect(removed).toBe(true)

      bus.publish('test:unsub', 2)
      expect(received).toHaveLength(1)
    })

    it('should return false for unknown subscription', () => {
      const bus = AgentBus.getInstance()
      expect(bus.unsubscribe('nonexistent')).toBe(false)
    })
  })

  describe('state management', () => {
    it('should set and get state', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'key1', { x: 42 }, 'TestAgent')
      const val = bus.getState<{ x: number }>('sess1', 'key1')
      expect(val).toBeDefined()
      expect(val!.x).toBe(42)
    })

    it('should return undefined for missing keys', () => {
      const bus = AgentBus.getInstance()
      expect(bus.getState('missing', 'key')).toBeUndefined()
    })

    it('should isolate state by session', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'key', 'value1')
      bus.setState('sess2', 'key', 'value2')
      expect(bus.getState('sess1', 'key')).toBe('value1')
      expect(bus.getState('sess2', 'key')).toBe('value2')
    })

    it('should publish state:updated on setState', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      bus.subscribe('state:key', (data) => received.push(data))

      bus.setState('sess1', 'key', 123, 'Agent')
      expect(received).toHaveLength(1)
      expect(received[0].value).toBe(123)
      expect(received[0].previous).toBeUndefined()
    })

    it('should track previous value on overwrite', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      bus.subscribe('state:key', (data) => received.push(data))

      bus.setState('sess1', 'key', 'first')
      bus.setState('sess1', 'key', 'second')
      expect(received).toHaveLength(2)
      expect(received[1].previous).toBe('first')
      expect(received[1].value).toBe('second')
    })

    it('should return state metadata', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'key', 'val', 'Agent')
      const meta = bus.getStateMeta('sess1', 'key')
      expect(meta).toBeDefined()
      expect(meta!.updatedBy).toBe('Agent')
      expect(meta!.updatedAt).toBeGreaterThan(0)
    })

    it('should getAllState for session', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'a', 1)
      bus.setState('sess1', 'b', 2)
      const state = bus.getAllState('sess1')
      expect(state).toEqual({ a: 1, b: 2 })
    })

    it('should deleteState', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'key', 'val')
      expect(bus.deleteState('sess1', 'key')).toBe(true)
      expect(bus.getState('sess1', 'key')).toBeUndefined()
    })

    it('should clearSession', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'a', 1)
      bus.setState('sess1', 'b', 2)
      bus.clearSession('sess1')
      expect(bus.getAllState('sess1')).toEqual({})
    })

    it('should getSessionKeys', () => {
      const bus = AgentBus.getInstance()
      bus.setState('sess1', 'x', 1)
      bus.setState('sess1', 'y', 2)
      const keys = bus.getSessionKeys('sess1')
      expect(keys.sort()).toEqual(['x', 'y'])
    })
  })

  describe('getChannelSubscribers', () => {
    it('should return subscriber count', () => {
      const bus = AgentBus.getInstance()
      expect(bus.getChannelSubscribers('test:count')).toBe(0)
      bus.subscribe('test:count', () => {})
      expect(bus.getChannelSubscribers('test:count')).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should catch errors in subscriber callbacks', () => {
      const bus = AgentBus.getInstance()
      const received: any[] = []
      bus.subscribe('test:err', () => {
        throw new Error('boom')
      })
      bus.subscribe('test:err', (data) => received.push(data))

      bus.publish('test:err', 'ok')
      expect(received).toHaveLength(1)
    })
  })
})
