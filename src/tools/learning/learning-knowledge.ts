/**
 * Learning Knowledge Tool
 *
 * Tool for interacting with the knowledge graph.
 * Supports adding nodes, creating relationships, and querying the graph.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { KnowledgeGraphStore } from "../../features/learning/knowledge-graph"

/**
 * Create the learning-knowledge tool
 */
export function createKnowledgeTool(knowledgeGraph: KnowledgeGraphStore) {
  return tool({
    description:
      "Manage the knowledge graph of entities and relationships. " +
      "Use this tool to store important concepts, their properties, and how they relate to each other.",
    args: {
      action: z.enum(["addNode", "addEdge", "getNode", "search", "removeNode", "removeEdge", "list"]).describe(
        "Action to perform: 'addNode', 'addEdge', 'getNode', 'search', 'removeNode', 'removeEdge', 'list'"
      ),
      nodeId: z
        .string()
        .optional()
        .describe("Node ID (for addNode, getNode, removeNode)"),
      name: z
        .string()
        .optional()
        .describe("Human-readable name (for addNode)"),
      type: z
        .string()
        .optional()
        .describe("Node type: file, function, class, concept, etc. (for addNode)"),
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
        .describe("Importance level: 1-10 (for addNode)"),
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
        .describe("Source node ID (for addEdge, removeEdge)"),
      toNodeId: z
        .string()
        .optional()
        .describe("Target node ID (for addEdge, removeEdge)"),
      edgeType: z
        .string()
        .optional()
        .describe("Relationship type: relatedTo, dependsOn, conflictsWith, etc. (for addEdge)"),
      weight: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Relationship strength: 0-1 (for addEdge)"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords to search for (for search action)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum results (for search, default: 10)"),
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
        keywords,
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

            await knowledgeGraph.addNode(nodeId, {
              name: name || nodeId,
              type: type || "generic",
              description,
              importance: importance || 5,
              tags: tags || [],
              data: data || {}
            })

            return JSON.stringify({
              success: true,
              message: "Node added successfully",
              nodeId,
              name,
              type
            }, null, 2)
          }

          case "addEdge": {
            if (!fromNodeId || !toNodeId || !edgeType) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: fromNodeId, toNodeId, and edgeType are required"
              }, null, 2)
            }

            await knowledgeGraph.addEdge(fromNodeId, toNodeId, edgeType, weight || 1)

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
                name: node.name,
                type: node.type,
                description: node.description,
                importance: node.importance,
                tags: node.tags,
                createdAt: node.createdAt,
                lastAccessed: node.lastAccessed,
                accessCount: node.accessCount
              }
            }, null, 2)
          }

          case "search": {
            const nodes = await knowledgeGraph.searchNodes({
              keywords: keywords || [],
              limit: limit || 10
            })

            return JSON.stringify({
              success: true,
              count: nodes.length,
              nodes: nodes.map(n => ({
                id: n.id,
                name: n.name,
                type: n.type,
                description: n.description,
                importance: n.importance
              }))
            }, null, 2)
          }

          case "removeNode": {
            if (!nodeId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: nodeId"
              }, null, 2)
            }

            await knowledgeGraph.removeNode(nodeId)

            return JSON.stringify({
              success: true,
              message: "Node removed successfully",
              nodeId
            }, null, 2)
          }

          case "removeEdge": {
            if (!fromNodeId || !toNodeId) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: fromNodeId and toNodeId are required"
              }, null, 2)
            }

            await knowledgeGraph.removeEdge(fromNodeId, toNodeId, edgeType)

            return JSON.stringify({
              success: true,
              message: "Edge removed successfully",
              fromNodeId,
              toNodeId,
              edgeType
            }, null, 2)
          }

          case "list": {
            const nodes = await knowledgeGraph.listNodes({
              byType,
              minImportance: byImportance,
              limit: limit || 50
            })

            return JSON.stringify({
              success: true,
              count: nodes.length,
              nodes: nodes.map(n => ({
                id: n.id,
                name: n.name,
                type: n.type,
                description: n.description,
                importance: n.importance
              }))
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: addNode, addEdge, getNode, search, removeNode, removeEdge, list`
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
