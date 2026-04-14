import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { KrakenMemory } from '../src'
import type { KnowledgeNode } from '../src'

describe('KrakenMemory', () => {
  let mem: KrakenMemory

  beforeAll(async () => {
    mem = new KrakenMemory()
    await mem.init()
  })

  afterAll(() => {
    mem.close()
  })

  describe('Knowledge Graph', () => {
    it('should add and retrieve a node', () => {
      const node = mem.addNode({
        id: 'test-1',
        title: 'Test Node',
        content: 'This is test content',
        type: 'concept',
        tags: ['test', 'unit'],
        sources: [],
        metadata: {},
      })

      expect(node.id).toBe('test-1')
      expect(node.title).toBe('Test Node')
      expect(node.createdAt).toBeGreaterThan(0)

      const retrieved = mem.getNode('test-1')
      expect(retrieved).toBeDefined()
      expect(retrieved!.title).toBe('Test Node')
    })

    it('should update a node', () => {
      mem.addNode({
        id: 'test-2',
        title: 'Original',
        content: 'Original content',
        type: 'fact',
        tags: [],
        sources: [],
        metadata: {},
      })

      const updated = mem.graph.updateNode('test-2', { title: 'Updated' })
      expect(updated).toBeDefined()
      expect(updated!.title).toBe('Updated')
    })

    it('should delete a node', () => {
      mem.addNode({
        id: 'test-3',
        title: 'To Delete',
        content: 'Will be deleted',
        type: 'fact',
        tags: [],
        sources: [],
        metadata: {},
      })

      expect(mem.getNode('test-3')).toBeDefined()
      const deleted = mem.graph.deleteNode('test-3')
      expect(deleted).toBe(true)
      expect(mem.getNode('test-3')).toBeNull()
    })

    it('should link two nodes', () => {
      mem.addNode({
        id: 'link-a',
        title: 'Node A',
        content: 'A',
        type: 'concept',
        tags: [],
        sources: [],
        metadata: {},
      })

      mem.addNode({
        id: 'link-b',
        title: 'Node B',
        content: 'B',
        type: 'concept',
        tags: [],
        sources: [],
        metadata: {},
      })

      const edge = mem.linkNodes('link-a', 'link-b', 'related_to', 0.8)
      expect(edge).toBeDefined()
      expect(edge!.relation).toBe('related_to')
      expect(edge!.strength).toBe(0.8)
    })

    it('should get connected nodes', () => {
      const connections = mem.graph.getConnectedNodes('link-a')
      expect(connections.length).toBe(1)
      expect(connections[0].node.id).toBe('link-b')
    })

    it('should search nodes by text', () => {
      mem.addNode({
        id: 'search-1',
        title: 'React Hooks',
        content: 'useState and useEffect patterns',
        type: 'concept',
        tags: ['react', 'hooks'],
        sources: [],
        metadata: {},
      })

      const results = mem.searchNodes({ text: 'React' })
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].node.title).toContain('React')
    })

    it('should return graph stats', () => {
      const stats = mem.graph.getStats()
      expect(stats.nodeCount).toBeGreaterThan(0)
      expect(stats.edgeCount).toBeGreaterThan(0)
      expect(typeof stats.nodesByType.concept).toBe('number')
    })
  })

  describe('Palace Spatial Hierarchy', () => {
    it('should create a wing', () => {
      const wing = mem.storeWing('Architecture')
      expect(wing.level).toBe('wing')
      expect(wing.name).toBe('Architecture')
      expect(wing.parentId).toBeNull()
    })

    it('should create a room inside a wing', () => {
      const wing = mem.storeWing('Testing')
      const room = mem.storeRoom('Unit Tests', wing.id)
      expect(room.level).toBe('room')
      expect(room.parentId).toBe(wing.id)
    })

    it('should place a node in a location', () => {
      const wing = mem.storeWing('Storage')
      mem.addNode({
        id: 'palace-node-1',
        title: 'Stored Knowledge',
        content: 'Important stuff',
        type: 'fact',
        tags: [],
        sources: [],
        metadata: {},
      })

      const placed = mem.placeNode(wing.id, 'palace-node-1')
      expect(placed).toBe(true)

      const loc = mem.palace.findLocationForNode('palace-node-1')
      expect(loc).toBeDefined()
      expect(loc!.id).toBe(wing.id)
    })

    it('should traverse from drawer to wing', () => {
      const wing = mem.storeWing('Traversal')
      const room = mem.storeRoom('Deep', wing.id)
      const hall = mem.storeHall('Inner', room.id)

      const traversal = mem.palace.traverse(hall.id, (id) => mem.getNode(id))
      expect(traversal.path.length).toBe(3)
      expect(traversal.path[0].level).toBe('wing')
      expect(traversal.path[2].level).toBe('hall')
    })
  })

  describe('Vector Store', () => {
    it('should store and search vectors', () => {
      const vec1 = new Float32Array([1, 0, 0, 0])
      const vec2 = new Float32Array([0.9, 0.1, 0, 0])
      const vec3 = new Float32Array([0, 0, 0, 1])

      mem.indexVector('vec-1', vec1)
      mem.indexVector('vec-2', vec2)
      mem.indexVector('vec-3', vec3)

      const query = new Float32Array([1, 0, 0, 0])
      const results = mem.findSimilar(query, 2)

      expect(results.length).toBe(2)
      expect(results[0].nodeId).toBe('vec-1')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })
  })

  describe('AAAK Compression', () => {
    it('should compress and decompress text', () => {
      const original = 'function calculateSum(a, b) { return a + b }'
      const result = mem.compressText(original)

      expect(result.compressed).toBeDefined()
      expect(result.ratio).toBeLessThanOrEqual(1)
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize)

      const decompressed = mem.decompressText(result.compressed, result.dictionary)
      expect(decompressed).toBe(original)
    })
  })

  describe('Persistence', () => {
    it('should save and reload database', async () => {
      const path = await import('os').then((m) =>
        import('path').then((p) => p.join(m.tmpdir(), `kraken-test-${Date.now()}.db`)),
      )

      const mem1 = new KrakenMemory()
      await mem1.init()
      mem1.addNode({
        id: 'persist-1',
        title: 'Persistent',
        content: 'Survives restart',
        type: 'fact',
        tags: [],
        sources: [],
        metadata: {},
      })
      await mem1.save(path)
      mem1.close()

      const mem2 = new KrakenMemory()
      await mem2.init({ dbPath: path })
      const node = mem2.getNode('persist-1')
      expect(node).toBeDefined()
      expect(node!.title).toBe('Persistent')
      mem2.close()

      const fs = await import('fs/promises')
      await fs.unlink(path).catch(() => {})
    })
  })
})
