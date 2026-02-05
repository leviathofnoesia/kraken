/**
 * Unified Learning System
 *
 * Provides a persistent learning architecture with experience storage, knowledge
 * graph management, pattern detection, and spaced repetition scheduling.
 */

import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { getLearningConfig, getMemoryConfig } from '../../config/manager'

export interface ExperienceEntryInput {
  summary: string
  details: string
  tags?: string[]
  outcome?: string
  confidence?: number
  relatedNodeIds?: string[]
}

export interface ExperienceEntry extends ExperienceEntryInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeNodeInput {
  title: string
  content: string
  type?: string
  tags?: string[]
  sources?: string[]
  metadata?: Record<string, unknown>
}

export interface KnowledgeNode extends KnowledgeNodeInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeEdge {
  id: string
  sourceId: string
  targetId: string
  relation: string
  strength: number
  createdAt: string
}

export interface PatternInput {
  name: string
  description: string
  triggers?: string[]
  confidence?: number
  evidence?: string[]
}

export interface PatternEntry extends PatternInput {
  id: string
  confidence: number
  triggers: string[]
  evidence: string[]
  occurrences: number
  lastSeen: string
  createdAt: string
  updatedAt: string
}

export interface SpacedRepetitionSchedule {
  nodeId: string
  intervalDays: number
  easeFactor: number
  nextReview: string
  lastReviewed?: string
  reviewCount: number
}

export interface StateMachineInput {
  name: string
  states: string[]
  transitions: Array<{ from: string; to: string; event: string; description?: string }>
  initialState: string
  metadata?: Record<string, unknown>
}

export interface StateMachine extends StateMachineInput {
  id: string
  currentState: string
  createdAt: string
  updatedAt: string
}

export interface LearningState {
  experiences: ExperienceEntry[]
  knowledgeNodes: KnowledgeNode[]
  knowledgeEdges: KnowledgeEdge[]
  patterns: PatternEntry[]
  schedules: SpacedRepetitionSchedule[]
  stateMachines: StateMachine[]
}

export interface LearningConfig {
  enabled?: boolean
  autoSave?: boolean
  storagePath?: string
  experienceStore?: {
    enabled?: boolean
    maxEntries?: number
  }
  knowledgeGraph?: {
    enabled?: boolean
    maxNodes?: number
  }
  patternDetection?: {
    enabled?: boolean
    minConfidence?: number
    maxPatterns?: number
  }
  spacedRepetition?: {
    enabled?: boolean
    initialIntervalDays?: number
    easeFactor?: number
    maxIntervalDays?: number
  }
  stateMachines?: {
    enabled?: boolean
  }
}

const DEFAULT_STORAGE_PATH = path.join(os.homedir(), '.kraken', 'learning')
const STATE_FILE = 'learning-state.json'
let learningState: LearningState = {
  experiences: [],
  knowledgeNodes: [],
  knowledgeEdges: [],
  patterns: [],
  schedules: [],
  stateMachines: [],
}
let isInitialized = false

export async function initializeLearning(): Promise<{ ready: boolean; loaded: number }> {
  const config = getResolvedLearningConfig()
  if (config.enabled === false) {
    return { ready: false, loaded: 0 }
  }

  const storageDir = resolveStoragePath(config.storagePath)
  await ensureDirectory(storageDir)
  learningState = await loadStateFromDisk(storageDir)
  isInitialized = true
  const totalLoaded =
    learningState.experiences.length +
    learningState.knowledgeNodes.length +
    learningState.patterns.length
  return { ready: true, loaded: totalLoaded }
}

export async function addExperience(input: ExperienceEntryInput): Promise<ExperienceEntry> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const now = new Date().toISOString()
  const entry: ExperienceEntry = {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    summary: input.summary,
    details: input.details,
    tags: input.tags ?? [],
    outcome: input.outcome,
    confidence: input.confidence,
    relatedNodeIds: input.relatedNodeIds ?? [],
  }

  if (config.experienceStore?.enabled === false || config.enabled === false) {
    return entry
  }

  learningState.experiences.unshift(entry)
  const maxEntries = config.experienceStore?.maxEntries ?? 2000
  if (learningState.experiences.length > maxEntries) {
    learningState.experiences = learningState.experiences.slice(0, maxEntries)
  }

  if (config.patternDetection?.enabled !== false) {
    updatePatternsFromExperience(entry, config)
  }

  await persistStateIfNeeded(config)
  return entry
}

export function listExperiences(): ExperienceEntry[] {
  return [...learningState.experiences]
}

export function searchExperiences(query: string): ExperienceEntry[] {
  const normalizedQuery = query.toLowerCase()
  return learningState.experiences.filter((entry) => {
    const tags = entry.tags?.join(' ').toLowerCase() ?? ''
    return (
      entry.summary.toLowerCase().includes(normalizedQuery) ||
      entry.details.toLowerCase().includes(normalizedQuery) ||
      tags.includes(normalizedQuery)
    )
  })
}

export async function addKnowledgeNode(input: KnowledgeNodeInput): Promise<KnowledgeNode> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const now = new Date().toISOString()
  const node: KnowledgeNode = {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    title: input.title,
    content: input.content,
    type: input.type ?? 'concept',
    tags: input.tags ?? [],
    sources: input.sources ?? [],
    metadata: input.metadata ?? {},
  }

  if (config.knowledgeGraph?.enabled === false || config.enabled === false) {
    return node
  }

  learningState.knowledgeNodes.unshift(node)
  const maxNodes = config.knowledgeGraph?.maxNodes ?? 5000
  if (learningState.knowledgeNodes.length > maxNodes) {
    learningState.knowledgeNodes = learningState.knowledgeNodes.slice(0, maxNodes)
  }

  if (config.spacedRepetition?.enabled !== false) {
    initializeSchedule(node.id, config)
  }

  await persistStateIfNeeded(config)
  return node
}

export function listKnowledgeNodes(): KnowledgeNode[] {
  return [...learningState.knowledgeNodes]
}

export function searchKnowledgeNodes(query: string): KnowledgeNode[] {
  const normalizedQuery = query.toLowerCase()
  return learningState.knowledgeNodes.filter((node) => {
    const tags = node.tags?.join(' ').toLowerCase() ?? ''
    return (
      node.title.toLowerCase().includes(normalizedQuery) ||
      node.content.toLowerCase().includes(normalizedQuery) ||
      tags.includes(normalizedQuery)
    )
  })
}

export async function linkKnowledgeNodes(
  sourceId: string,
  targetId: string,
  relation: string,
  strength = 0.5,
): Promise<KnowledgeEdge> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const edge: KnowledgeEdge = {
    id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceId,
    targetId,
    relation,
    strength,
    createdAt: new Date().toISOString(),
  }

  if (config.knowledgeGraph?.enabled === false || config.enabled === false) {
    return edge
  }

  learningState.knowledgeEdges.push(edge)
  await persistStateIfNeeded(config)
  return edge
}

export async function recordPattern(input: PatternInput): Promise<PatternEntry> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const now = new Date().toISOString()
  const existing = learningState.patterns.find((pattern) => pattern.name === input.name)
  if (existing) {
    existing.description = input.description
    existing.triggers = input.triggers ?? existing.triggers
    existing.confidence = input.confidence ?? existing.confidence
    existing.evidence = input.evidence ?? existing.evidence
    existing.occurrences += 1
    existing.lastSeen = now
    existing.updatedAt = now
    await persistStateIfNeeded(config)
    return existing
  }

  const entry: PatternEntry = {
    id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    description: input.description,
    triggers: input.triggers ?? [],
    confidence: input.confidence ?? 0.5,
    evidence: input.evidence ?? [],
    occurrences: 1,
    lastSeen: now,
    createdAt: now,
    updatedAt: now,
  }

  if (config.patternDetection?.enabled === false || config.enabled === false) {
    return entry
  }

  learningState.patterns.unshift(entry)
  const maxPatterns = config.patternDetection?.maxPatterns ?? 500
  if (learningState.patterns.length > maxPatterns) {
    learningState.patterns = learningState.patterns.slice(0, maxPatterns)
  }

  await persistStateIfNeeded(config)
  return entry
}

export function listPatterns(minConfidence = 0): PatternEntry[] {
  return learningState.patterns.filter((pattern) => pattern.confidence >= minConfidence)
}

export function getReviewQueue(dueBefore?: string): SpacedRepetitionSchedule[] {
  const cutoff = dueBefore ? new Date(dueBefore).getTime() : Date.now()
  return learningState.schedules.filter((schedule) => {
    return new Date(schedule.nextReview).getTime() <= cutoff
  })
}

export async function reviewKnowledgeNode(
  nodeId: string,
  quality: number,
): Promise<SpacedRepetitionSchedule> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const normalizedQuality = Math.min(5, Math.max(0, quality))
  const schedule = ensureSchedule(nodeId, config)
  const now = new Date()

  if (normalizedQuality < 3) {
    schedule.intervalDays = config.spacedRepetition?.initialIntervalDays ?? 1
    schedule.reviewCount = 0
  } else {
    schedule.reviewCount += 1
    if (schedule.reviewCount === 1) {
      schedule.intervalDays = config.spacedRepetition?.initialIntervalDays ?? 1
    } else {
      schedule.intervalDays = Math.round(schedule.intervalDays * schedule.easeFactor)
    }
  }

  const easeFactor =
    schedule.easeFactor + (0.1 - (5 - normalizedQuality) * (0.08 + (5 - normalizedQuality) * 0.02))
  schedule.easeFactor = Math.max(1.3, easeFactor)
  const maxInterval = config.spacedRepetition?.maxIntervalDays ?? 365
  schedule.intervalDays = Math.min(schedule.intervalDays, maxInterval)
  schedule.lastReviewed = now.toISOString()
  schedule.nextReview = new Date(
    now.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  await persistStateIfNeeded(config)
  return schedule
}

export async function createStateMachine(input: StateMachineInput): Promise<StateMachine> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const now = new Date().toISOString()
  const machine: StateMachine = {
    id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    states: input.states,
    transitions: input.transitions,
    initialState: input.initialState,
    currentState: input.initialState,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  }

  if (config.stateMachines?.enabled === false || config.enabled === false) {
    return machine
  }

  learningState.stateMachines.unshift(machine)
  await persistStateIfNeeded(config)
  return machine
}

export function listStateMachines(): StateMachine[] {
  return [...learningState.stateMachines]
}

export async function transitionStateMachine(
  machineId: string,
  event: string,
): Promise<StateMachine | null> {
  const config = getResolvedLearningConfig()
  await ensureInitialized()

  const machine = learningState.stateMachines.find((item) => item.id === machineId)
  if (!machine) {
    return null
  }

  const transition = machine.transitions.find(
    (item) => item.from === machine.currentState && item.event === event,
  )
  if (!transition) {
    return machine
  }

  machine.currentState = transition.to
  machine.updatedAt = new Date().toISOString()
  await persistStateIfNeeded(config)
  return machine
}

function getResolvedLearningConfig(): LearningConfig {
  const learningConfig = getLearningConfig()
  const memoryConfig = getMemoryConfig()

  return {
    enabled: learningConfig?.enabled ?? memoryConfig?.enabled ?? true,
    autoSave: learningConfig?.autoSave ?? memoryConfig?.autoSave ?? true,
    storagePath: learningConfig?.storagePath ?? memoryConfig?.storagePath ?? DEFAULT_STORAGE_PATH,
    experienceStore: {
      enabled: learningConfig?.experienceStore?.enabled ?? true,
      maxEntries: learningConfig?.experienceStore?.maxEntries ?? 2000,
    },
    knowledgeGraph: {
      enabled: learningConfig?.knowledgeGraph?.enabled ?? true,
      maxNodes: learningConfig?.knowledgeGraph?.maxNodes ?? 5000,
    },
    patternDetection: {
      enabled: learningConfig?.patternDetection?.enabled ?? true,
      minConfidence: learningConfig?.patternDetection?.minConfidence ?? 0.6,
      maxPatterns: learningConfig?.patternDetection?.maxPatterns ?? 500,
    },
    spacedRepetition: {
      enabled: learningConfig?.spacedRepetition?.enabled ?? true,
      initialIntervalDays: learningConfig?.spacedRepetition?.initialIntervalDays ?? 1,
      easeFactor: learningConfig?.spacedRepetition?.easeFactor ?? 2.5,
      maxIntervalDays: learningConfig?.spacedRepetition?.maxIntervalDays ?? 365,
    },
    stateMachines: {
      enabled: learningConfig?.stateMachines?.enabled ?? true,
    },
  }
}

function resolveStoragePath(storagePath?: string): string {
  if (!storagePath) {
    return DEFAULT_STORAGE_PATH
  }
  if (storagePath.startsWith('~/')) {
    return path.join(os.homedir(), storagePath.slice(2))
  }
  return storagePath
}

async function ensureDirectory(storageDir: string): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true })
}

async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await initializeLearning()
  }
}

async function loadStateFromDisk(storageDir: string): Promise<LearningState> {
  const filePath = path.join(storageDir, STATE_FILE)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as LearningState
    return {
      experiences: parsed.experiences ?? [],
      knowledgeNodes: parsed.knowledgeNodes ?? [],
      knowledgeEdges: parsed.knowledgeEdges ?? [],
      patterns: parsed.patterns ?? [],
      schedules: parsed.schedules ?? [],
      stateMachines: parsed.stateMachines ?? [],
    }
  } catch {
    return {
      experiences: [],
      knowledgeNodes: [],
      knowledgeEdges: [],
      patterns: [],
      schedules: [],
      stateMachines: [],
    }
  }
}

async function persistStateIfNeeded(config: LearningConfig): Promise<void> {
  if (config.autoSave === false || config.enabled === false) {
    return
  }
  const storageDir = resolveStoragePath(config.storagePath)
  await ensureDirectory(storageDir)
  const filePath = path.join(storageDir, STATE_FILE)
  await fs.writeFile(filePath, JSON.stringify(learningState, null, 2), 'utf-8')
}

function updatePatternsFromExperience(entry: ExperienceEntry, config: LearningConfig): void {
  const minConfidence = config.patternDetection?.minConfidence ?? 0.6
  const tags = entry.tags ?? []
  for (const tag of tags) {
    const name = `tag:${tag}`
    const description = `Recurring experience tag "${tag}".`
    const existing = learningState.patterns.find((pattern) => pattern.name === name)
    if (existing) {
      existing.occurrences += 1
      existing.lastSeen = entry.createdAt
      existing.confidence = Math.min(1, existing.confidence + 0.05)
      existing.updatedAt = new Date().toISOString()
    } else {
      learningState.patterns.unshift({
        id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        triggers: [tag],
        confidence: minConfidence,
        evidence: [entry.summary],
        occurrences: 1,
        lastSeen: entry.createdAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }
}

function initializeSchedule(nodeId: string, config: LearningConfig): void {
  const existing = learningState.schedules.find((schedule) => schedule.nodeId === nodeId)
  if (existing) {
    return
  }
  const initialInterval = config.spacedRepetition?.initialIntervalDays ?? 1
  const now = new Date()
  learningState.schedules.push({
    nodeId,
    intervalDays: initialInterval,
    easeFactor: config.spacedRepetition?.easeFactor ?? 2.5,
    nextReview: new Date(now.getTime() + initialInterval * 24 * 60 * 60 * 1000).toISOString(),
    reviewCount: 0,
  })
}

function ensureSchedule(nodeId: string, config: LearningConfig): SpacedRepetitionSchedule {
  let schedule = learningState.schedules.find((item) => item.nodeId === nodeId)
  if (!schedule) {
    initializeSchedule(nodeId, config)
    schedule = learningState.schedules.find((item) => item.nodeId === nodeId)
  }

  if (!schedule) {
    const fallback: SpacedRepetitionSchedule = {
      nodeId,
      intervalDays: config.spacedRepetition?.initialIntervalDays ?? 1,
      easeFactor: config.spacedRepetition?.easeFactor ?? 2.5,
      nextReview: new Date().toISOString(),
      reviewCount: 0,
    }
    learningState.schedules.push(fallback)
    return fallback
  }

  return schedule
}
