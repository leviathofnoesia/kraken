/**
 * Learning Pattern Tool
 *
 * Tool for detecting and managing behavioral patterns.
 * Supports pattern detection, query, and management.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { PatternDetector } from "../../features/learning/pattern-detection"

/**
 * Create learning-pattern tool
 */
export function createPatternTool(patternDetector: PatternDetector) {
  return tool({
    description:
      "Detect and manage behavioral patterns. " +
      "Use this tool to identify recurring wins and losses, " +
      "find successful strategies, and avoid mistakes.",
    args: {
      action: z.enum(["get", "list", "update", "detect"]).describe(
        "Action to perform: 'get', 'list', 'update', 'detect'"
      ),
      patternName: z
        .string()
        .optional()
        .describe("Pattern name (for get, update actions)"),
      status: z
        .enum(["active", "resolved", "superseded"])
        .optional()
        .describe("Pattern status (for update action)"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords for pattern detection (for detect action)"),
      minFrequency: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Minimum frequency threshold (for list, detect actions)"),
      minConfidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Minimum confidence threshold (for list, detect actions)"),
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
        patternName,
        status,
        keywords,
        minFrequency,
        minConfidence,
        limit
      } = args

      try {
        switch (action) {
          case "get": {
            if (!patternName) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternName is required for 'get' action"
              }, null, 2)
            }

            const allPatterns = patternDetector.getAllPatterns()
            const pattern = allPatterns.find(p => p.name === patternName)

            if (!pattern) {
              return JSON.stringify({
                success: false,
                error: `Pattern not found: ${patternName}`
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              pattern: {
                name: pattern.name,
                type: pattern.type,
                trigger: pattern.trigger,
                consequence: pattern.consequence,
                suggestedAction: pattern.suggestedAction,
                impact: pattern.impact,
                confidence: pattern.confidence,
                frequency: pattern.frequency,
                status: pattern.status,
                keywords: pattern.keywords,
                lastDetected: pattern.lastDetected,
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
                name: p.name,
                type: p.type,
                impact: p.impact,
                confidence: p.confidence,
                frequency: p.frequency,
                status: p.status,
                lastDetected: p.lastDetected
              }))
            }, null, 2)
          }

          case "update": {
            if (!patternName) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternName is required for 'update' action"
              }, null, 2)
            }

            if (status) {
              await patternDetector.updatePatternStatus(patternName, status)
            }

            return JSON.stringify({
              success: true,
              message: "Pattern status updated successfully",
              patternName,
              updatedFields: status ? ["status"] : []
            }, null, 2)
          }

          case "detect": {
            const allPatterns = patternDetector.getAllPatterns()
            let patterns = allPatterns

            if (keywords && keywords.length > 0) {
              patterns = patterns.filter(p =>
                p.keywords?.some(kw => keywords.includes(kw.toLowerCase()))
              )
            }

            const results = patterns.slice(0, limit || 10)

            return JSON.stringify({
              success: true,
              count: results.length,
              patterns: results.map(p => ({
                name: p.name,
                type: p.type,
                confidence: p.confidence,
                suggestedAction: p.suggestedAction
              }))
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: get, list, update, detect`
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
