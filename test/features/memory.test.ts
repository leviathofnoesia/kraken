import { describe, it, expect } from 'bun:test'
import {
  memoryAddNode,
  memoryGetNode,
  memorySearchNodes,
  memoryLinkNodes,
  memoryGetConnected,
  memoryDeleteNode,
  memoryStats,
  memoryCompress,
  memoryDecompress,
} from '../../src/features/memory'

describe('Memory Feature', () => {
  it('should export all memory tools', () => {
    expect(memoryAddNode).toBeDefined()
    expect(memoryGetNode).toBeDefined()
    expect(memorySearchNodes).toBeDefined()
    expect(memoryLinkNodes).toBeDefined()
    expect(memoryGetConnected).toBeDefined()
    expect(memoryDeleteNode).toBeDefined()
    expect(memoryStats).toBeDefined()
    expect(memoryCompress).toBeDefined()
    expect(memoryDecompress).toBeDefined()
  })
})
