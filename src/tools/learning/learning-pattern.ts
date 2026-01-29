/**
 * Learning Pattern Tool
 *
 * Tool for detecting and managing behavioral patterns.
 * Supports pattern detection, query, and management.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { PatternDetector } from "../../features/learning/pattern-detection"

export function createPatternTool(patternDetector: PatternDetector) {
  return tool({
    description:
      "Detect and manage behavioral patterns. " +
      "Use this tool to identify recurring wins and losses, " +
      "find successful strategies, and avoid mistakes.",
    args: {
      action: z.enum(["get", "list", "update"]).describe(
        "Action to perform: 'get', 'list', 'update'"
      ),
      patternId: z
        .string()
        .optional()
        .describe("Pattern ID (for get, update actions)"),
      status: z
        .enum(["active", "resolved", "superseded"])
        .optional()
        .describe("Pattern status (for update action)"),
      minFrequency: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Minimum frequency threshold (for list action)"),
      minConfidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Minimum confidence threshold (for list action)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum results (for list action, default: 20)")
    },
    async execute(args) {
      const {
        action,
        patternId,
        status,
        minFrequency,
        minConfidence,
        limit
      } = args

      try {
        switch (action) {
          case "get": {
            if (!patternId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternId is required for 'get' action"
              }, null, 2)
            }

            const allPatterns = patternDetector.getAllPatterns()
            const pattern = allPatterns.find(p => p.id === patternId)

            if (!pattern) {
              return JSON.stringify({
                success: false,
                error: `Pattern not found: ${patternId}`
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              pattern: {
                id: pattern.id,
                name: pattern.category,
                type: pattern.type,
                triggers: pattern.triggers,
                consequences: pattern.consequences,
                suggestedActions: pattern.suggestedActions,
                impact: pattern.impact,
                confidence: pattern.confidence,
                frequency: pattern.frequency,
                status: pattern.status,
                description: pattern.description,
                exampleCount: pattern.examples?.length || 0
              }
            }, null, 2)
          }

          case "list": {
            const filters: any = {}
            if (minFrequency) filters.minFrequency = minFrequency
            if (minConfidence) filters.minConfidence = minConfidence

            const patterns = await patternDetector.listPatterns(filters)

            return JSON.stringify({
              success: true,
              count: patterns.length,
              patterns: patterns.map(p => ({
                id: p.id,
                name: p.category,
                type: p.type,
                impact: p.impact,
                confidence: p.confidence,
                frequency: p.frequency,
                status: p.status,
                description: p.description
              }))
            }, null, 2)
          }

          case "update": {
            if (!patternId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternId is required for 'update' action"
              }, null, 2)
            }

            await patternDetector.updatePatternStatus(patternId, status || "active")

            return JSON.stringify({
              success: true,
              message: "Pattern status updated successfully",
              patternId,
              status: status || "active"
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: get, list, update`
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
