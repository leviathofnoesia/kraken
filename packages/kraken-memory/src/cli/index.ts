import { Command } from 'commander'
import { KrakenMemory } from '../kraken-memory'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const DEFAULT_DB = path.join(os.homedir(), '.kraken-memory', 'memory.db')

function getMem(dbPath?: string): KrakenMemory {
  const mem = new KrakenMemory()
  const resolved = dbPath || DEFAULT_DB
  const dir = path.dirname(resolved)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return mem
}

async function withMem<T>(
  dbPath: string | undefined,
  fn: (mem: KrakenMemory) => Promise<T>,
): Promise<T> {
  const mem = getMem(dbPath)
  const resolved = dbPath || DEFAULT_DB
  await mem.init({ dbPath: fs.existsSync(resolved) ? resolved : undefined })
  try {
    return await fn(mem)
  } finally {
    mem.close()
  }
}

export function createCLI(): Command {
  const program = new Command()
    .name('kraken-memory')
    .description('Kraken Memory System CLI - Spatial knowledge graph with vector compression')
    .version('0.1.0')
    .option('-d, --db <path>', 'Database path', DEFAULT_DB)

  program
    .command('add')
    .description('Add a knowledge node')
    .requiredOption('-i, --id <id>', 'Node ID')
    .requiredOption('-t, --title <title>', 'Node title')
    .option('-c, --content <content>', 'Node content', '')
    .option('--type <type>', 'Node type', 'concept')
    .option('--tags <tags>', 'Comma-separated tags', '')
    .action(async (opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const node = mem.addNode({
          id: opts.id,
          title: opts.title,
          content: opts.content,
          type: opts.type,
          tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : [],
          sources: [],
          metadata: {},
        })
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(JSON.stringify(node, null, 2))
      })
    })

  program
    .command('get')
    .description('Get a node by ID')
    .argument('<id>', 'Node ID')
    .action(async (id, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const node = mem.getNode(id)
        if (!node) {
          console.error(`Node not found: ${id}`)
          process.exit(1)
        }
        console.log(JSON.stringify(node, null, 2))
      })
    })

  program
    .command('search')
    .description('Search nodes')
    .argument('<query>', 'Search text')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--type <type>', 'Filter by node type')
    .action(async (query, opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const results = mem.searchNodes({
          text: query,
          limit: parseInt(opts.limit, 10),
          types: opts.type ? [opts.type] : undefined,
        })
        if (results.length === 0) {
          console.log('No results found')
          return
        }
        for (const r of results) {
          console.log(`[${r.score.toFixed(1)}] ${r.node.id}: ${r.node.title} (${r.node.type})`)
          if (r.matchedFields.length > 0) {
            console.log(`  matched: ${r.matchedFields.join(', ')}`)
          }
        }
      })
    })

  program
    .command('link')
    .description('Link two nodes')
    .argument('<source>', 'Source node ID')
    .argument('<target>', 'Target node ID')
    .option('-r, --relation <rel>', 'Relation type', 'related_to')
    .option('-s, --strength <n>', 'Edge strength (0-1)', '1.0')
    .action(async (source, target, opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const edge = mem.linkNodes(source, target, opts.relation, parseFloat(opts.strength))
        if (!edge) {
          console.error('Failed to create edge — check both node IDs exist')
          process.exit(1)
        }
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(JSON.stringify(edge, null, 2))
      })
    })

  program
    .command('delete')
    .description('Delete a node by ID')
    .argument('<id>', 'Node ID')
    .action(async (id, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const deleted = mem.graph.deleteNode(id)
        if (!deleted) {
          console.error(`Node not found: ${id}`)
          process.exit(1)
        }
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(`Deleted node: ${id}`)
      })
    })

  program
    .command('stats')
    .description('Show graph statistics')
    .action(async (_opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const stats = mem.graph.getStats()
        console.log(JSON.stringify(stats, null, 2))
      })
    })

  program
    .command('list')
    .description('List all nodes')
    .option('-l, --limit <n>', 'Max results', '50')
    .option('--offset <n>', 'Offset', '0')
    .action(async (opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const nodes = mem.graph.getAllNodes(parseInt(opts.limit, 10), parseInt(opts.offset, 10))
        for (const n of nodes) {
          console.log(`${n.id}\t${n.type}\t${n.title}`)
        }
        console.log(`\n${nodes.length} nodes shown`)
      })
    })

  program
    .command('compress')
    .description('Compress text using AAAK')
    .argument('<text>', 'Text to compress')
    .action(async (text, _opts, cmd) => {
      const dbPath = cmd.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const result = mem.compressText(text)
        console.log(`Original: ${result.originalSize} chars`)
        console.log(`Compressed: ${result.compressedSize} chars`)
        console.log(`Ratio: ${(result.ratio * 100).toFixed(1)}%`)
        console.log(`Output: ${result.compressed}`)
      })
    })

  const palace = program.command('palace').description('Memory palace spatial hierarchy')

  palace
    .command('wing')
    .description('Create a wing')
    .argument('<name>', 'Wing name')
    .action(async (name, _opts, cmd) => {
      const dbPath = cmd.parent?.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const loc = mem.storeWing(name)
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(JSON.stringify(loc, null, 2))
      })
    })

  palace
    .command('room')
    .description('Create a room inside a wing')
    .argument('<name>', 'Room name')
    .argument('<wingId>', 'Parent wing ID')
    .action(async (name, wingId, _opts, cmd) => {
      const dbPath = cmd.parent?.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const loc = mem.storeRoom(name, wingId)
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(JSON.stringify(loc, null, 2))
      })
    })

  palace
    .command('place')
    .description('Place a node in a location')
    .argument('<locationId>', 'Location ID')
    .argument('<nodeId>', 'Node ID')
    .action(async (locationId, nodeId, _opts, cmd) => {
      const dbPath = cmd.parent?.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const placed = mem.placeNode(locationId, nodeId)
        if (!placed) {
          console.error('Failed to place node — check location and node IDs')
          process.exit(1)
        }
        const p = dbPath || DEFAULT_DB
        await mem.save(p)
        console.log(`Placed ${nodeId} in ${locationId}`)
      })
    })

  palace
    .command('locate')
    .description('Find where a node is stored')
    .argument('<nodeId>', 'Node ID')
    .action(async (nodeId, _opts, cmd) => {
      const dbPath = cmd.parent?.parent?.opts().db
      await withMem(dbPath, async (mem) => {
        const loc = mem.palace.findLocationForNode(nodeId)
        if (!loc) {
          console.log('Node not found in any location')
          return
        }
        console.log(JSON.stringify(loc, null, 2))
      })
    })

  return program
}

if (import.meta.main) {
  const cli = createCLI()
  cli.parse()
}
