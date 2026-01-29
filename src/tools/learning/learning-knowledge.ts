/**
 * Learning Knowledge Tool
 *
 * Query and manage knowledge graph.
 * Part of the unified AI memory system (Layer 2).
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { MCPTool } from "../../features/mcp/types"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"

// Global knowledge graph instance
let knowledgeGraph: KnowledgeGraphStore | null = null

/**
 * Set knowledge graph instance
 */
export function setKnowledgeGraph(kg: KnowledgeGraphStore) {
  knowledgeGraph = kg
  console.log("[LearningKnowledgeTool] Knowledge graph set")
}

/**
 * Get knowledge graph instance
 */
export function getKnowledgeGraph(): KnowledgeGraphStore | null {
  return knowledgeGraph
}

/**
 * Tool: learning_knowledge
 *
 * Query knowledge graph for entities, relationships, and patterns.
 */
const learningKnowledgeToolImpl = tool({
  description: "Query the knowledge graph for entities, relationships, and patterns. Use this to discover connected concepts, find related information, and explore the semantic memory network. The knowledge graph stores entities (people, projects, concepts, skills, mistakes, patterns) with explicit relationships.",
  args: {
    action: z.enum(["search", "get", "neighbors", "path", "add", "stats"]).describe("Action to perform"),
    // Search args
    query: z.string().optional().describe("Search query (keyword or phrase). Required for 'search'."),
    type: z.string().optional().describe("Filter by node type (e.g., 'person', 'project', 'concept'). Optional."),
    // Get args
    nodeId: z.string().optional().describe("Node ID to retrieve. Required for 'get'."),
    // Neighbors args
    nodeIdNeighbors: z.string().optional().describe("Node ID to find neighbors for. Required for 'neighbors'."),
    relationType: z.string().optional().describe("Filter by relation type (e.g., 'relates_to', 'causes'). Optional."),
    // Path args
    fromId: z.string().optional().describe("Start node ID. Required for 'path'."),
    toId: z.string().optional().describe("End node ID. Required for 'path'."),
    maxDepth: z.number().min(1).max(5).default(3).optional().describe("Maximum path depth. Default: 3."),
    // Add args
    newNodeId: z.string().optional().describe("ID for new node. Required for 'add'."),
    newNodeType: z.enum(["person", "company", "project", "concept", "skill", "mistake", "pattern"]).optional().describe("Type for new node. Required for 'add'."),
    newData: z.record(z.any()).optional().describe("Data for new node (key-value pairs). Required for 'add'."),
    tags: z.array(z.string()).optional().describe("Tags for new node. Optional."),
  },
  async execute(args, context) {
    if (!knowledgeGraph) {
      throw new Error("Knowledge graph not initialized. Call setKnowledgeGraph() first.")
    }

    try {
      switch (args.action) {
        case "search":
          return await searchKnowledge(args as any)
        case "get":
          return await getNode(args as any)
        case "neighbors":
          return await getNeighbors(args as any)
        case "path":
          return await findPath(args as any)
        case "add":
          return await addNode(args as any)
        case "stats":
          return await getStats()
        default:
          throw new Error(`Unknown action: ${args.action}`)
      }
    } catch (error: any) {
      console.error("[LearningKnowledgeTool] Error:", error)
      throw new Error(`Failed to ${args.action}: ${error.message}`)
    }
  }
})

/**
 * Search knowledge graph
 */
async function searchKnowledge(args: {
  query: string
  type?: string
}): Promise<string> {
  if (!args.query) {
    throw new Error("Missing required field for 'search': query")
  }

  const results = knowledgeGraph!.search(args.query, args.type)

  if (results.length === 0) {
    return `No results found for query: ${args.query}`
  }

  let output = `Found ${results.length} results for: ${args.query}\n\n`

  for (let i = 0; i < results.length; i++) {
    const node = results[i]
    output += `${i + 1}. **${node.id}** (${node.type})\n`
    output += `   Importance: ${node.importance}/10 | Strength: ${(node.strength * 100).toFixed(0)}%\n`
    output += `   Last accessed: ${new Date(node.lastAccessed).toLocaleDateString()}\n`

    // Show key data
    const dataKeys = Object.keys(node.data).slice(0, 3)
    if (dataKeys.length > 0) {
      output += `   Data: ${dataKeys.map(k => `${k}=${JSON.stringify(node.data[k])}`).join(", ")}\n`
    }

    // Show tags
    if (node.metadata.tags.length > 0) {
      output += `   Tags: ${node.metadata.tags.join(", ")}\n`
    }

    output += "\n"
  }

  return output
}

/**
 * Get specific node
 */
async function getNode(args: { nodeId: string }): Promise<string> {
  if (!args.nodeId) {
    throw new Error("Missing required field for 'get': nodeId")
  }

  const node = knowledgeGraph!.getNode(args.nodeId)

  if (!node) {
    return `Node not found: ${args.nodeId}`
  }

  let output = `**${node.id}** (${node.type})\n\n`
  output += `**Metadata:**\n`
  output += `- Importance: ${node.importance}/10\n`
  output += `- Strength: ${(node.strength * 100).toFixed(0)}%\n`
  output += `- Access count: ${node.accessCount}\n`
  output += `- Created: ${new Date(node.metadata.created).toLocaleString()}\n`
  output += `- Updated: ${new Date(node.metadata.updated).toLocaleString()}\n\n`

  output += `**Data:**\n\`\`\`\n${JSON.stringify(node.data, null, 2)}\n\`\`\`\n\n`

  output += `**Relationships:**\n`
  if (node.relations.relatedTo.length > 0) {
    output += `- Related to: ${node.relations.relatedTo.join(", ")}\n`
  }
  if (node.relations.conflictsWith.length > 0) {
    output += `- Conflicts with: ${node.relations.conflictsWith.join(", ")}\n`
  }
  if (node.relations.dependsOn.length > 0) {
    output += `- Depends on: ${node.relations.dependsOn.join(", ")}\n`
  }

  if (node.metadata.tags.length > 0) {
    output += `\n**Tags:** ${node.metadata.tags.join(", ")}\n`
  }

  return output
}

/**
 * Get neighbors of a node
 */
async function getNeighbors(args: {
  nodeIdNeighbors: string
  relationType?: string
}): Promise<string> {
  if (!args.nodeIdNeighbors) {
    throw new Error("Missing required field for 'neighbors': nodeIdNeighbors")
  }

  const neighbors = knowledgeGraph!.getNeighbors(args.nodeIdNeighbors, args.relationType)

  if (neighbors.length === 0) {
    return `No neighbors found for node: ${args.nodeIdNeighbors}`
  }

  let output = `Neighbors of **${args.nodeIdNeighbors}**:\n\n`

  for (const neighbor of neighbors) {
    output += `- **${neighbor.id}** (${neighbor.type})\n`
    if (args.relationType) {
      output += `  Relation: ${args.relationType}\n`
    }
  }

  return output
}

/**
 * Find path between two nodes
 */
async function findPath(args: {
  fromId: string
  toId: string
  maxDepth?: number
}): Promise<string> {
  if (!args.fromId || !args.toId) {
    throw new Error("Missing required fields for 'path': fromId, toId")
  }

  const path = knowledgeGraph!.findPath(args.fromId, args.toId)

  if (!path) {
    return `No path found between ${args.fromId} and ${args.toId}`
  }

  let output = `**Path found** (${path.length} hops):\n\n`
  output += path.map((node, i) => {
    const arrow = i < path.length - 1 ? " → " : ""
    return `${i + 1}. **${node.id}**${arrow}`
  }).join("\n")

  return output
}

/**
 * Add a new node
 */
async function addNode(args: {
  newNodeId: string
  newNodeType: any
  newData: Record<string, any>
  tags?: string[]
}): Promise<string> {
  if (!args.newNodeId || !args.newNodeType || !args.newData) {
    throw new Error("Missing required fields for 'add': newNodeId, newNodeType, newData")
  }

  const node = await knowledgeGraph!.addNode(
    args.newNodeId,
    args.newNodeType,
    args.newData,
    "manual"
  )

  return `✅ Node created\n\n` +
         `ID: ${node.id}\n` +
         `Type: ${node.type}\n` +
         `Created: ${new Date(node.metadata.created).toLocaleString()}\n\n` +
         `*Use 'learning_knowledge' with action='get' to view full details.*`
}

/**
 * Get knowledge graph statistics
 */
async function getStats(): Promise<string> {
  const allNodes = knowledgeGraph!.getAllNodes()
  const allEdges = knowledgeGraph!.getAllEdges()

  // Count by type
  const byType: Record<string, number> = {}
  for (const node of allNodes) {
    byType[node.type] = (byType[node.type] || 0) + 1
  }

  let output = `📊 **Knowledge Graph Statistics**\n\n`
  output += `Total nodes: ${allNodes.length}\n`
  output += `Total edges: ${allEdges.length}\n\n`

  output += `**Nodes by Type:**\n`
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    output += `- ${type}: ${count}\n`
  }

  output += `\n**Top 10 Nodes by Access Count:**\n`
  const topNodes = [...allNodes].sort((a, b) => b.accessCount - a.accessCount).slice(0, 10)
  for (let i = 0; i < topNodes.length; i++) {
    const node = topNodes[i]
    output += `${i + 1}. **${node.id}** (${node.type}) - ${node.accessCount} accesses\n`
  }

  return output
}

export const learningKnowledgeTool: MCPTool = {
  ...learningKnowledgeToolImpl,
  serverName: 'learning',
  category: 'learning'
}
