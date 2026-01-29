/**
 * Layer 3: Pattern Recognition
 * 
 * Detect recurring behaviors, wins, and losses.
 * Automatic detection based on frequency and sequences.
 */

import * as fs from "fs"
import * as path from "path"
import type { Experience } from "./types-unified"
import type { PatternDetection, PatternDetectionResult } from "./types-unified"

export class PatternDetector {
  private patternsPath: string
  private patterns: Map<string, PatternDetection>
  private minFrequency: number
  private minConfidence: number

  constructor(storagePath: string, config?: { minFrequency?: number; minConfidence?: number }) {
    const patternsDir = path.join(storagePath, "patterns")
    this.patternsPath = path.join(patternsDir, "detection_patterns.json")
    this.minFrequency = config?.minFrequency || 3
    this.minConfidence = config?.minConfidence || 0.7
    this.patterns = new Map()

    this.ensureStorage()
    this.loadPatterns()
  }

  private ensureStorage() {
    const dir = path.dirname(this.patternsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  private loadPatterns() {
    if (fs.existsSync(this.patternsPath)) {
      try {
        const data = fs.readFileSync(this.patternsPath, "utf-8")
        const patternsArray = JSON.parse(data) as PatternDetection[]

        for (const pattern of patternsArray) {
          this.patterns.set(pattern.id, pattern)
        }

        console.log(`[PatternDetector] Loaded ${this.patterns.size} patterns`)
      } catch (error: any) {
        console.error(`[PatternDetector] Failed to load patterns from ${this.patternsPath}:`, error)

        // Archive corrupted file and start fresh
        const archivePath = `${this.patternsPath}.corrupted-${Date.now()}`
        try {
          fs.renameSync(this.patternsPath, archivePath)
          console.log(`[PatternDetector] Archived corrupted file to ${archivePath}`)
        } catch (renameError: any) {
          console.error(`[PatternDetector] Failed to archive corrupted file:`, renameError)
        }

        // Start with empty patterns
        this.patterns = new Map()
        console.log(`[PatternDetector] Starting with empty patterns map`)
      }
    }
  }

  private savePatterns() {
    const patternsArray = Array.from(this.patterns.values())
    fs.writeFileSync(this.patternsPath, JSON.stringify(patternsArray, null, 2), "utf-8")
  }

  /**
   * Analyze recent experiences for patterns
   */
  async analyzeExperiences(experiences: Experience[]): Promise<PatternDetectionResult> {
    const detectedPatterns: PatternDetection[] = []

    // Detect positive patterns (wins)
    const positivePatterns = this.detectPatternsByOutcome(experiences, "positive")
    detectedPatterns.push(...positivePatterns)

    // Detect negative patterns (losses)
    const negativePatterns = this.detectPatternsByOutcome(experiences, "negative")
    detectedPatterns.push(...negativePatterns)

    // Update or create patterns
    for (const pattern of detectedPatterns) {
      await this.updatePattern(pattern)
    }

    // Calculate overall confidence
    const avgConfidence = detectedPatterns.length > 0
      ? detectedPatterns.reduce((sum, p) => sum + p.confidence, 0) / detectedPatterns.length
      : 0

    // Generate suggested behavior
    const suggestedBehavior = this.generateSuggestedBehavior(detectedPatterns)

    return {
      patterns: detectedPatterns,
      confidence: avgConfidence,
      suggestedBehavior,
      contextMatches: {
        similarExperiences: this.findSimilarExperiences(experiences, detectedPatterns),
        relatedPatterns: this.findRelatedPatterns(detectedPatterns)
      }
    }
  }

  /**
   * Detect patterns by outcome type (positive/negative)
   */
  private detectPatternsByOutcome(
    experiences: Experience[],
    type: "positive" | "negative"
  ): PatternDetection[] {
    const patterns: PatternDetection[] = []

    // Filter by outcome
    const filteredExperiences = experiences.filter(exp => {
      if (type === "positive") {
        return exp.outcome === "success" && exp.reward > 0.5
      } else {
        return exp.outcome === "failure" || exp.reward < -0.3
      }
    })

    if (filteredExperiences.length < this.minFrequency) {
      return patterns
    }

    // Group by state
    const byState = new Map<string, Experience[]>()
    for (const exp of filteredExperiences) {
      if (!byState.has(exp.state)) {
        byState.set(exp.state, [])
      }
      byState.get(exp.state)!.push(exp)
    }

    // Detect patterns in each state group
    for (const [state, stateExps] of byState.entries()) {
      if (stateExps.length < this.minFrequency) continue

      // Check for action consistency
      const actions = stateExps.map(e => e.action)
      const actionCounts = new Map<string, number>()
      
      for (const action of actions) {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1)
      }

      // Find dominant actions
      for (const [action, count] of actionCounts.entries()) {
        if (count >= this.minFrequency) {
          const pattern: PatternDetection = {
            id: `pattern-${type}-${state}-${action}-${Date.now()}`,
            type,
            category: this.categorizePattern(state),
            description: this.generatePatternDescription(type, state, action),
            examples: stateExps.slice(0, 3).map(e => `${e.action}: ${e.outcome}`),
            frequency: count,
            firstSeen: new Date(Math.min(...stateExps.map(e => new Date(e.timestamp).getTime()))).toISOString(),
            lastSeen: new Date(Math.max(...stateExps.map(e => new Date(e.timestamp).getTime()))).toISOString(),
            confidence: Math.min(1, count / stateExps.length),
            triggers: [state, action],
            consequences: type === "positive" ? ["High success rate"] : ["Frequent failures"],
            suggestedActions: this.generateSuggestedActions(type, state, action),
            impact: this.assessImpact(count, type),
            status: "active"
          }

          patterns.push(pattern)
        }
      }
    }

    return patterns
  }

  /**
   * Update or create a pattern
   */
  async updatePattern(pattern: PatternDetection): Promise<void> {
    const existingId = this.findSimilarPattern(pattern)

    if (existingId) {
      // Update existing pattern
      const existing = this.patterns.get(existingId)!
      existing.frequency += pattern.frequency
      existing.lastSeen = pattern.lastSeen
      existing.examples = [...existing.examples, ...pattern.examples].slice(0, 10)
      existing.confidence = (existing.confidence + pattern.confidence) / 2
      
      this.patterns.set(existingId, existing)
    } else {
      // Create new pattern
      this.patterns.set(pattern.id, pattern)
    }

    this.savePatterns()
  }

  /**
   * Find a similar existing pattern
   */
  private findSimilarPattern(pattern: PatternDetection): string | null {
    for (const [id, existing] of this.patterns.entries()) {
      if (
        existing.type === pattern.type &&
        existing.category === pattern.category &&
        existing.description === pattern.description
      ) {
        return id
      }
    }
    return null
  }

  /**
   * Categorize a pattern
   */
  private categorizePattern(state: string): string {
    const lowerState = state.toLowerCase()

    if (lowerState.includes("debug") || lowerState.includes("error") || lowerState.includes("fix")) {
      return "debugging"
    } else if (lowerState.includes("code") || lowerState.includes("implement") || lowerState.includes("build")) {
      return "coding"
    } else if (lowerState.includes("review") || lowerState.includes("test") || lowerState.includes("check")) {
      return "testing"
    } else if (lowerState.includes("design") || lowerState.includes("architect") || lowerState.includes("plan")) {
      return "design"
    } else {
      return "general"
    }
  }

  /**
   * Generate pattern description
   */
  private generatePatternDescription(type: "positive" | "negative", state: string, action: string): string {
    if (type === "positive") {
      return `When ${state}, using ${action} tends to succeed`
    } else {
      return `When ${state}, using ${action} often fails`
    }
  }

  /**
   * Generate suggested actions for a pattern
   */
  private generateSuggestedActions(type: "positive" | "negative", state: string, action: string): string[] {
    if (type === "positive") {
      return [
        `Continue using ${action} when ${state}`,
        `Consider refining ${action} for even better results`
      ]
    } else {
      return [
        `Avoid ${action} when ${state}`,
        `Try alternative approaches for ${state}`,
        `Research better methods for ${state} scenarios`
      ]
    }
  }

  /**
   * Assess pattern impact
   */
  private assessImpact(frequency: number, type: "positive" | "negative"): PatternDetection["impact"] {
    if (frequency < 5) return "low"
    if (frequency < 15) return type === "negative" ? "high" : "medium"
    if (frequency < 30) return "high"
    return "critical"
  }

  /**
   * Generate suggested behavior based on detected patterns
   */
  private generateSuggestedBehavior(patterns: PatternDetection[]): string {
    if (patterns.length === 0) {
      return "No clear patterns detected. Continue working normally."
    }

    const positives = patterns.filter(p => p.type === "positive")
    const negatives = patterns.filter(p => p.type === "negative")

    if (negatives.length > positives.length) {
      // More negative patterns - suggest caution
      const topNegative = negatives[0]
      return `Warning: Detected negative pattern "${topNegative.description}". Consider alternative approaches.`
    } else if (positives.length > 0) {
      // Positive patterns - reinforce
      const topPositive = positives[0]
      return `Good pattern detected: "${topPositive.description}". Consider continuing this approach.`
    } else {
      return "Mixed patterns detected. Evaluate context before proceeding."
    }
  }

  /**
   * Find experiences similar to detected patterns
   */
  private findSimilarExperiences(experiences: Experience[], patterns: PatternDetection[]): string[] {
    const similar: string[] = []

    for (const pattern of patterns) {
      for (const exp of experiences) {
        if (
          exp.state === pattern.triggers[0] &&
          exp.action === pattern.triggers[1]
        ) {
          similar.push(exp.id)
        }
      }
    }

    return [...new Set(similar)].slice(0, 5)
  }

  /**
   * Find related patterns
   */
  private findRelatedPatterns(patterns: PatternDetection[]): string[] {
    return patterns.map(p => p.id)
  }

  /**
   * Get all patterns
   */
  async listPatterns(filters?: {
    type?: PatternDetection["type"]
    status?: PatternDetection["status"]
    impact?: PatternDetection["impact"]
  }): Promise<PatternDetection[]> {
    let patterns = Array.from(this.patterns.values())

    if (filters?.type) {
      patterns = patterns.filter(p => p.type === filters.type)
    }

    if (filters?.status) {
      patterns = patterns.filter(p => p.status === filters.status)
    }

    if (filters?.impact) {
      patterns = patterns.filter(p => p.impact === filters.impact)
    }

    // Sort by frequency and impact
    patterns.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact]
      if (impactDiff !== 0) return impactDiff
      return b.frequency - a.frequency
    })

    return patterns
  }

  /**
   * Update pattern status
   */
  async updatePatternStatus(id: string, status: PatternDetection["status"]): Promise<void> {
    const pattern = this.patterns.get(id)
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`)
    }

    pattern.status = status
    this.savePatterns()
  }

  /**
   * Get pattern statistics
   */
  getStats(): {
    totalPatterns: number
    positive: number
    negative: number
    active: number
    byCategory: Record<string, number>
    byImpact: Record<string, number>
  } {
    const patterns = Array.from(this.patterns.values())

    const byCategory: Record<string, number> = {}
    const byImpact: Record<string, number> = {}

    for (const pattern of patterns) {
      byCategory[pattern.category] = (byCategory[pattern.category] || 0) + 1
      byImpact[pattern.impact] = (byImpact[pattern.impact] || 0) + 1
    }

    return {
      totalPatterns: patterns.length,
      positive: patterns.filter(p => p.type === "positive").length,
      negative: patterns.filter(p => p.type === "negative").length,
      active: patterns.filter(p => p.status === "active").length,
      byCategory,
      byImpact
    }
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): PatternDetection[] {
    return Array.from(this.patterns.values())
  }
}
