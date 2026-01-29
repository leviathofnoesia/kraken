/**
 * Learning Pattern Tool
 *
 * Detect, add, and manage patterns.
 * Part of the unified AI memory system (Layer 3).
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { MCPTool } from "../../features/mcp/types"
import type { PatternDetector } from "../../features/learning/pattern-detection"

// Global pattern detector instance
let patternDetector: PatternDetector | null = null

export function setPatternDetector(detector: PatternDetector) {
  patternDetector = detector
  console.log("[LearningPatternTool] Pattern detector set")
}

export function getPatternDetector(): PatternDetector | null {
  return patternDetector
}

const learningPatternToolImpl = tool({
  description: "Detect, add, and manage patterns in your behavior. Patterns are recurring behaviors (positive/negative) that the learning system identifies automatically. Use this to manually add patterns or query existing ones.",
  args: {
    action: z.enum(["detect", "add", "list", "get", "update"]).describe("Action to perform"),
    // Detect args
    experienceIds: z.array(z.string()).optional().describe("Experience IDs to analyze. Optional, uses recent if not provided."),
    // Add args
    type: z.enum(["positive", "negative", "neutral"]).optional().describe("Pattern type. Required for 'add'."),
    category: z.string().optional().describe("Pattern category (e.g., 'coding', 'debugging'). Required for 'add'."),
    description: z.string().optional().describe("Pattern description. Required for 'add'."),
    triggers: z.array(z.string()).optional().describe("Keywords/situations that trigger this pattern. Required for 'add'."),
    consequences: z.array(z.string()).optional().describe("What happens when pattern occurs. Required for 'add'."),
    suggestedActions: z.array(z.string()).optional().describe("What to do (or avoid). Required for 'add'."),
    impact: z.enum(["low", "medium", "high", "critical"]).optional().describe("Impact level. Required for 'add'."),
    // Get/List args
    patternId: z.string().optional().describe("Pattern ID. Required for 'get' and 'update'."),
    typeFilter: z.string().optional().describe("Filter by type. Optional for 'list'."),
    statusFilter: z.string().optional().describe("Filter by status. Optional for 'list'."),
    // Update args
    newStatus: z.enum(["active", "resolved", "superseded"]).optional().describe("New status. Required for 'update'."),
  },
  async execute(args, context) {
    if (!patternDetector) {
      throw new Error("Pattern detector not initialized. Call setPatternDetector() first.")
    }

    try {
      switch (args.action) {
        case "detect":
          return await detectPatterns(args as any)
        case "add":
          return await addPattern(args as any)
        case "list":
          return await listPatterns(args as any)
        case "get":
          return await getPattern(args as any)
        case "update":
          return await updatePattern(args as any)
        default:
          throw new Error(`Unknown action: ${args.action}`)
      }
    } catch (error: any) {
      console.error("[LearningPatternTool] Error:", error)
      throw new Error(`Failed to ${args.action}: ${error.message}`)
    }
  }
})

async function detectPatterns(args: { experienceIds?: string[] }): Promise<string> {
  // For now, just return message - pattern detection is automatic
  return "Pattern detection runs automatically via hooks. Use 'learning_pattern' with action='list' to see detected patterns."
}

async function addPattern(args: any): Promise<string> {
  const { type, category, description, triggers, consequences, suggestedActions, impact } = args

  if (!type || !category || !description || !triggers || !consequences || !suggestedActions || !impact) {
    throw new Error("Missing required fields for 'add'")
  }

  const patternId = `pattern-${Date.now()}`
  const now = new Date().toISOString()

  // Create pattern object
  const pattern: any = {
    id: patternId,
    type,
    category,
    description,
    examples: [],
    frequency: 1,
    firstSeen: now,
    lastSeen: now,
    confidence: 0.8,
    triggers,
    consequences,
    suggestedActions,
    impact,
    status: "active"
  }

  // Actually persist the pattern using patternDetector
  try {
    await patternDetector!.updatePattern(pattern)
    console.log(`[LearningPatternTool] Pattern ${patternId} persisted`)
  } catch (error: any) {
    console.error(`[LearningPatternTool] Failed to persist pattern:`, error)
    throw new Error(`Failed to add pattern: ${error.message}`)
  }

  return `✅ Pattern added\n\nID: ${patternId}\nType: ${type}\nDescription: ${description}`
}

async function listPatterns(args: { typeFilter?: string; statusFilter?: string }): Promise<string> {
  const patterns = patternDetector!.getAllPatterns()

  let filtered = patterns
  if (args.typeFilter) {
    filtered = filtered.filter(p => p.type === args.typeFilter)
  }
  if (args.statusFilter) {
    filtered = filtered.filter(p => p.status === args.statusFilter)
  }

  if (filtered.length === 0) {
    return "No patterns found"
  }

  let output = `Found ${filtered.length} patterns:\n\n`

  for (let i = 0; i < filtered.length; i++) {
    const p = filtered[i]
    const emoji = p.type === "positive" ? "✅" : p.type === "negative" ? "❌" : "⚪"
    const impactEmoji = p.impact === "critical" ? "🚨" : p.impact === "high" ? "🔴" : p.impact === "medium" ? "⚠️" : "💚"

    output += `${i + 1}. ${emoji} ${impactEmoji} **${p.description}**\n`
    output += `   ID: ${p.id} | ${p.type} | ${p.category}\n`
    output += `   Confidence: ${(p.confidence * 100).toFixed(0)}% | Frequency: ${p.frequency} | Status: ${p.status}\n\n`
  }

  return output
}

async function getPattern(args: { patternId: string }): Promise<string> {
  const patterns = patternDetector!.getAllPatterns()
  const pattern = patterns.find(p => p.id === args.patternId)

  if (!pattern) {
    return `Pattern not found: ${args.patternId}`
  }

  const emoji = pattern.type === "positive" ? "✅" : pattern.type === "negative" ? "❌" : "⚪"

  let output = `${emoji} **${pattern.description}**\n\n`
  output += `**Metadata:**\n`
  output += `- ID: ${pattern.id}\n`
  output += `- Type: ${pattern.type}\n`
  output += `- Category: ${pattern.category}\n`
  output += `- Impact: ${pattern.impact}\n`
  output += `- Status: ${pattern.status}\n`
  output += `- Confidence: ${(pattern.confidence * 100).toFixed(0)}%\n`
  output += `- Frequency: ${pattern.frequency}\n\n`

  output += `**Triggers:**\n${pattern.triggers.map(t => `- ${t}`).join("\n")}\n\n`

  output += `**Consequences:**\n${pattern.consequences.map(c => `- ${c}`).join("\n")}\n\n`

  output += `**Suggested Actions:**\n${pattern.suggestedActions.map(a => `- ${a}`).join("\n")}\n\n`

  if (pattern.examples.length > 0) {
    output += `**Examples:**\n${pattern.examples.map((e, i) => `${i + 1}. ${e}`).join("\n")}\n\n`
  }

  return output
}

async function updatePattern(args: { patternId: string; newStatus: string }): Promise<string> {
  if (!args.patternId || !args.newStatus) {
    throw new Error("Missing required fields for 'update': patternId, newStatus")
  }

  // Validate status
  const validStatuses = ["active", "resolved", "superseded"]
  if (!validStatuses.includes(args.newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
  }

  // Actually update the pattern status
  try {
    await patternDetector!.updatePatternStatus(args.patternId, args.newStatus as any)
    console.log(`[LearningPatternTool] Pattern ${args.patternId} updated to ${args.newStatus}`)
  } catch (error: any) {
    console.error(`[LearningPatternTool] Failed to update pattern:`, error)
    throw new Error(`Failed to update pattern: ${error.message}`)
  }

  return `✅ Pattern ${args.patternId} updated to status: ${args.newStatus}`
}

export const learningPatternTool: MCPTool = {
  ...learningPatternToolImpl,
  serverName: 'learning',
  category: 'learning'
}
