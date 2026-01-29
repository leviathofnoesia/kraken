/**
 * Learning Experience Tool
 *
 * Tool for adding and querying experiences in the experience store.
 * Supports manual experience recording, querying by similarity, and replay.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { ExperienceStore } from "../../features/learning/experience-store"

export function createExperienceTool(experienceStore: ExperienceStore) {
  return tool({
    description:
      "Add or query experiences from the learning system. " +
      "Use this tool to record successful or unsuccessful actions for future reference, " +
      "or to query past experiences to find similar situations and their outcomes.",
    args: {
      action: z.enum(["add", "query", "recent"]).describe(
        "Action to perform: 'add' to record an experience, 'query' to find similar experiences, " +
        "'recent' to get recent experiences"
      ),
      actionName: z
        .string()
        .optional()
        .describe("Action taken (for add action)"),
      reward: z
        .number()
        .min(-1)
        .max(1)
        .optional()
        .describe("Reward: -1 (failure) to 1 (success), 0 for neutral (for add action)"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Confidence in this experience: 0 (low) to 1 (high) (for add action)"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords describing this experience (for add/query actions)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of results (for query/recent actions, default: 10)")
    },
    async execute(args) {
      const { action, actionName, reward, confidence, keywords, limit } = args

      try {
        switch (action) {
          case "add": {
            if (!actionName || typeof reward === "undefined") {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: actionName and reward are required for 'add' action"
              }, null, 2)
            }

            const outcome = reward > 0.3 ? "success" as const : reward < -0.3 ? "failure" as const : "partial" as const

            const experience = await experienceStore.addExperience({
              state: JSON.stringify({ source: "manual" }),
              action: actionName,
              outcome,
              reward,
              confidence: confidence ?? 0.5,
              context: {
                sessionId: "manual"
              },
              metadata: {
                keywords: keywords || []
              }
            })

            return JSON.stringify({
              success: true,
              message: "Experience recorded successfully",
              experienceId: experience.id,
              reward,
              confidence
            }, null, 2)
          }

          case "query": {
            const allExperiences = await experienceStore.loadExperiences()
            let filtered = allExperiences

            if (keywords && keywords.length > 0) {
              const keywordLower = keywords.map(k => k.toLowerCase())
              filtered = filtered.filter(exp =>
                exp.metadata?.keywords &&
                (exp.metadata.keywords as string[]).some(kw => keywordLower.includes(kw.toLowerCase()))
              )
            }

            const results = filtered.slice(0, limit || 10)

            return JSON.stringify({
              success: true,
              count: results.length,
              experiences: results.map(exp => ({
                id: exp.id,
                action: exp.action,
                outcome: exp.outcome,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp
              }))
            }, null, 2)
          }

          case "recent": {
            const allExperiences = await experienceStore.loadExperiences()
            const recent = allExperiences.slice(-(limit || 10))

            return JSON.stringify({
              success: true,
              count: recent.length,
              experiences: recent.map(exp => ({
                id: exp.id,
                action: exp.action,
                outcome: exp.outcome,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp
              }))
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: add, query, recent`
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
