/**
 * Learning Pattern Tool
 *
 * Tool for detecting and managing behavioral patterns.
 * Supports pattern detection, query, and management.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { PatternDetector } from "../../features/learning/pattern-detection"
import type { Pattern } from "../../features/learning/types-unified"

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
      action: z.enum(["add", "get", "list", "update", "detect", "remove"]).describe(
        "Action to perform: 'add', 'get', 'list', 'update', 'detect', 'remove'"
      ),
      patternName: z
        .string()
        .optional()
        .describe("Pattern name (for add, get, update, remove actions)"),
      type: z
        .enum(["positive", "negative", "neutral"])
        .optional()
        .describe("Pattern type: 'positive' (win), 'negative' (loss), 'neutral' (for add action)"),
      trigger: z
        .record(z.any())
        .optional()
        .describe("Trigger conditions (for add action)"),
      consequence: z
        .string()
        .optional()
        .describe("What happens when pattern triggers (for add action)"),
      suggestedAction: z
        .string()
        .optional()
        .describe("Recommended action (for add action)"),
      impact: z
        .enum(["low", "medium", "high", "critical"])
        .optional()
        .describe("Impact level (for add action)"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Confidence level: 0-1 (for add action)"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords for pattern detection (for add, detect actions)"),
      status: z
        .enum(["active", "resolved", "superseded"])
        .optional()
        .describe("Pattern status (for add, update actions)"),
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
        type,
        trigger,
        consequence,
        suggestedAction,
        impact,
        confidence,
        keywords,
        status,
        minFrequency,
        minConfidence,
        limit
      } = args

      try {
        switch (action) {
          case "add": {
            if (!patternName || !type || !trigger) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: patternName, type, and trigger are required for 'add' action"
              }, null, 2)
            }

            const pattern: Pattern = {
              name: patternName,
              type,
              trigger,
              consequence: consequence || "",
              suggestedAction: suggestedAction || "",
              impact: impact || "medium",
              confidence: confidence ?? 0.5,
              frequency: 1,
              status: status || "active",
              examples: [],
              keywords: keywords || [],
              lastDetected: Date.now()
            }

            await patternDetector.addPattern(pattern)

            return JSON.stringify({
              success: true,
              message: "Pattern added successfully",
              patternName,
              type,
              impact
            }, null, 2)
          }

          case "get": {
            if (!patternName) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternName is required for 'get' action"
              }, null, 2)
            }

            const pattern = await patternDetector.getPattern(patternName)

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
                exampleCount: pattern.examples.length
              }
            }, null, 2)
          }

          case "list": {
            const patterns = await patternDetector.getPatterns({
              minFrequency: minFrequency,
              minConfidence: minConfidence,
              limit: limit || 20
            })

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

            const updateData: Partial<Pattern> = {}
            if (type !== undefined) updateData.type = type
            if (status !== undefined) updateData.status = status
            if (confidence !== undefined) updateData.confidence = confidence
            if (impact !== undefined) updateData.impact = impact
            if (suggestedAction !== undefined) updateData.suggestedAction = suggestedAction
            if (consequence !== undefined) updateData.consequence = consequence

            await patternDetector.updatePattern(patternName, updateData)

            return JSON.stringify({
              success: true,
              message: "Pattern updated successfully",
              patternName
            }, null, 2)
          }

          case "detect": {
            const patterns = await patternDetector.detectPatterns({
              keywords: keywords || [],
              limit: limit || 10
            })

            return JSON.stringify({
              success: true,
              count: patterns.length,
              patterns: patterns.map(p => ({
                name: p.name,
                type: p.type,
                confidence: p.confidence,
                suggestedAction: p.suggestedAction
              }))
            }, null, 2)
          }

          case "remove": {
            if (!patternName) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternName is required for 'remove' action"
              }, null, 2)
            }

            await patternDetector.removePattern(patternName)

            return JSON.stringify({
              success: true,
              message: "Pattern removed successfully",
              patternName
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: add, get, list, update, detect, remove`
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
