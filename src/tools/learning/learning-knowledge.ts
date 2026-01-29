/**
 * Learning Knowledge Tool
 *
 * Tool for interacting with knowledge graph.
 * Supports adding nodes, creating relationships, and querying graph.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"

export function createKnowledgeTool(knowledgeGraph: KnowledgeGraphStore) {
  return tool({
    description:
      "Manage knowledge graph of entities and relationships. " +
      "Use this tool to store important concepts, their properties, and how they relate to each other.",
    args: {
      action: z.enum(["addNode", "addEdge", "getNode", "search", "list"]).describe(
        "Action to perform: 'addNode', 'addEdge', 'getNode', 'search', 'list'"
      ),
      nodeId: z
        .string()
        .optional()
        .describe("Node ID (for addNode, getNode)"),
      name: z
        .string()
        .optional()
        .describe("Human-readable name (for addNode)"),
      type: z
        .string()
        .optional()
        .describe("Node type: person, company, project, concept, skill, mistake, pattern (for addNode)"),
      description: z
        .string()
        .optional()
        .describe("Description of this entity (for addNode)"),
      importance: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Importance level:1-10 (for addNode)"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags for categorization (for addNode)"),
      data: z
        .record(z.any())
        .optional()
        .describe("Additional data to store (for addNode)"),
      fromNodeId: z
        .string()
        .optional()
        .describe("Source node ID (for addEdge)"),
      toNodeId: z
        .string()
        .optional()
        .describe("Target node ID (for addEdge)"),
      edgeType: z
        .enum(["relates_to", "causes", "depends_on", "conflicts_with"])
        .optional()
        .describe("Relationship type (for addEdge)"),
      weight: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Relationship strength: 0-1 (for addEdge)"),
      query: z
        .string()
        .optional()
        .describe("Query text (for search action)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum results (for search/list, default: 10)"),
      byType: z
        .string()
        .optional()
        .describe("Filter by node type (for list action)"),
      byImportance: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Filter by minimum importance (for list action)")
    },
    async execute(args) {
      const {
        action,
        nodeId,
        name,
        type,
        description,
        importance,
        tags,
        data,
        fromNodeId,
        toNodeId,
        edgeType,
        weight,
        query,
        limit,
        byType,
        byImportance
      } = args

      try {
        switch (action) {
          case "addNode": {
            if (!nodeId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: nodeId"
              }, null, 2)
            }

            await knowledgeGraph.addNode(
              nodeId,
              name || nodeId,
              type || "concept",
              description,
              importance || 5,
              tags || [],
              data || {}
            )

            return JSON.stringify({
              success: true,
              message: "Node added successfully",
              nodeId,
              name
            }, null, 2)
          }

          case "addEdge": {
            if (!fromNodeId || !toNodeId || !edgeType) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: fromNodeId, toNodeId, and edgeType are required"
              }, null, 2)
            }

            await knowledgeGraph.addEdge(
              fromNodeId,
              toNodeId,
              edgeType,
              weight || 1
            )

            return JSON.stringify({
              success: true,
              message: "Edge added successfully",
              fromNodeId,
              toNodeId,
              edgeType,
              weight: weight || 1
            }, null, 2)
          }

          case "getNode": {
            if (!nodeId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: nodeId"
              }, null, 2)
            }

            const node = await knowledgeGraph.getNode(nodeId)

            if (!node) {
              return JSON.stringify({
                success: false,
                error: `Node not found: ${nodeId}`
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              node: {
                id: node.id,
                type: node.type,
                importance: node.importance,
                strength: node.strength,
                lastAccessed: node.lastAccessed,
                accessCount: node.accessCount,
                tags: node.metadata?.tags || []
              }
            }, null, 2)
          }

          case "search": {
            const result = await knowledgeGraph.getRelevantContext(query || "")
            const nodes = result.nodes.slice(0, limit || 10)

            return JSON.stringify({
              success: true,
              count: nodes.length,
              nodes: nodes.map(n => ({
                id: n.id,
                type: n.type,
                importance: n.importance
              }))
            }, null, 2)
          }

          case "list": {
            let nodes = await knowledgeGraph.getImportantNodes(limit || 50)

            if (byType) {
              nodes = nodes.filter(n => n.type === byType)
            }

            if (byImportance) {
              nodes = nodes.filter(n => n.importance >= byImportance)
            }

            return JSON.stringify({
              success: true,
              count: nodes.length,
              nodes: nodes.map(n => ({
                id: n.id,
                type: n.type,
                importance: n.importance
              }))
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: addNode, addEdge, getNode, search, list`
            }, null, 2)
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2)
      }
    }
  })
}
