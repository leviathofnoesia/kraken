/**
 * Learning Experience Tool
 *
 * Tool for adding and querying experiences in the experience store.
 * Supports manual experience recording, querying by similarity, and replay.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { ExperienceStore } from "../../features/learning/experience-store"
import type { Experience } from "../../features/learning/types-unified"

/**
 * Create the learning-experience tool
 */
export function createExperienceTool(experienceStore: ExperienceStore) {
  return tool({
    description:
      "Add or query experiences from the learning system. " +
      "Use this tool to record successful or unsuccessful actions for future reference, " +
      "or to query past experiences to find similar situations and their outcomes.",
    args: {
      action: z.enum(["add", "query", "replay", "recent"]).describe(
        "Action to perform: 'add' to record an experience, 'query' to find similar experiences, " +
        "'replay' to get best action for a situation, 'recent' to get recent experiences"
      ),
      state: z
        .record(z.any())
        .optional()
        .describe("Current state/context (for query/replay actions)"),
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
      context: z
        .record(z.any())
        .optional()
        .describe("Additional context information (for add action)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of results (for query/recent actions, default: 10)")
    },
    async execute(args) {
      const { action, state, actionName, reward, confidence, keywords, context, limit } = args

      try {
        switch (action) {
          case "add": {
            if (!actionName || typeof reward === "undefined") {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: actionName and reward are required for 'add' action"
              }, null, 2)
            }

            const experience: Experience = {
              id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: Date.now(),
              state: state || {},
              action: actionName,
              reward,
              confidence: confidence ?? 0.5,
              context: context || {},
              keywords: keywords || [],
              metadata: {
                source: "manual"
              }
            }

            await experienceStore.recordExperience(experience)

            return JSON.stringify({
              success: true,
              message: "Experience recorded successfully",
              experienceId: experience.id,
              reward,
              confidence
            }, null, 2)
          }

          case "query": {
            const results = await experienceStore.queryExperiences({
              state: state || {},
              keywords: keywords || [],
              limit: limit || 10
            })

            return JSON.stringify({
              success: true,
              count: results.length,
              experiences: results.map(exp => ({
                id: exp.id,
                action: exp.action,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp,
                keywords: exp.keywords
              }))
            }, null, 2)
          }

          case "replay": {
            if (!state) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: state is required for 'replay' action"
              }, null, 2)
            }

            const bestAction = await experienceStore.getBestAction(state, keywords || [])

            if (!bestAction) {
              return JSON.stringify({
                success: true,
                message: "No similar experiences found",
                bestAction: null
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              bestAction: bestAction.action,
              confidence: bestAction.confidence,
              reward: bestAction.reward,
              experienceId: bestAction.id
            }, null, 2)
          }

          case "recent": {
            const experiences = await experienceStore.getRecentExperiences(limit || 10)

            return JSON.stringify({
              success: true,
              count: experiences.length,
              experiences: experiences.map(exp => ({
                id: exp.id,
                action: exp.action,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp,
                keywords: exp.keywords
              }))
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: add, query, replay, recent`
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
