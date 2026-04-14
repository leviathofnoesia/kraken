import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

import {
  addExperience,
  addKnowledgeNode,
  createStateMachine,
  getReviewQueue,
  linkKnowledgeNodes,
  listPatterns,
  listStateMachines,
  recordPattern,
  reviewKnowledgeNode,
  searchExperiences,
  searchKnowledgeNodes,
} from '../features/memory'

const confidenceSchema = z.number().min(0).max(1)

export const learning_add_experience = tool({
  description: 'Add a learning experience to the unified memory system.',
  args: {
    summary: z.string().min(1).describe('Short summary of the experience'),
    details: z.string().min(1).describe('Full details of the experience'),
    tags: z.array(z.string()).optional().describe('Tags describing the experience'),
    outcome: z.string().optional().describe('Outcome or result of the experience'),
    confidence: confidenceSchema.optional().describe('Confidence score (0-1)'),
    relatedNodeIds: z.array(z.string()).optional().describe('Related knowledge node IDs'),
  },
  async execute(args) {
    const experience = await addExperience(args)
    return JSON.stringify({ success: true, experience }, null, 2)
  },
})

export const learning_search_experiences = tool({
  description: 'Search stored experiences by keyword.',
  args: {
    query: z.string().min(1).describe('Search query'),
  },
  async execute(args) {
    const experiences = searchExperiences(args.query)
    return JSON.stringify({ success: true, experiences }, null, 2)
  },
})

export const learning_add_knowledge_node = tool({
  description: 'Add a knowledge node to the learning graph.',
  args: {
    title: z.string().min(1).describe('Node title'),
    content: z.string().min(1).describe('Node content'),
    type: z.string().optional().describe('Node type (concept, decision, procedure, etc.)'),
    tags: z.array(z.string()).optional().describe('Tags associated with the node'),
    sources: z.array(z.string()).optional().describe('Source references or URLs'),
    metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
  },
  async execute(args) {
    const node = await addKnowledgeNode(args)
    return JSON.stringify({ success: true, node }, null, 2)
  },
})

export const learning_search_knowledge_nodes = tool({
  description: 'Search knowledge nodes by keyword.',
  args: {
    query: z.string().min(1).describe('Search query'),
  },
  async execute(args) {
    const nodes = searchKnowledgeNodes(args.query)
    return JSON.stringify({ success: true, nodes }, null, 2)
  },
})

export const learning_link_knowledge_nodes = tool({
  description: 'Create a relationship between two knowledge nodes.',
  args: {
    sourceId: z.string().min(1).describe('Source node ID'),
    targetId: z.string().min(1).describe('Target node ID'),
    relation: z.string().min(1).describe('Relationship description'),
    strength: z.number().min(0).max(1).optional().describe('Relationship strength (0-1)'),
  },
  async execute(args) {
    const edge = await linkKnowledgeNodes(
      args.sourceId,
      args.targetId,
      args.relation,
      args.strength ?? 0.5,
    )
    return JSON.stringify({ success: true, edge }, null, 2)
  },
})

export const learning_record_pattern = tool({
  description: 'Record or update a learning pattern.',
  args: {
    name: z.string().min(1).describe('Pattern name'),
    description: z.string().min(1).describe('Pattern description'),
    triggers: z.array(z.string()).optional().describe('Trigger keywords or signals'),
    confidence: confidenceSchema.optional().describe('Confidence score (0-1)'),
    evidence: z.array(z.string()).optional().describe('Evidence notes'),
  },
  async execute(args) {
    const pattern = await recordPattern(args)
    return JSON.stringify({ success: true, pattern }, null, 2)
  },
})

export const learning_list_patterns = tool({
  description: 'List known patterns above a confidence threshold.',
  args: {
    minConfidence: confidenceSchema.optional().describe('Minimum confidence to include'),
  },
  async execute(args) {
    const patterns = listPatterns(args.minConfidence ?? 0)
    return JSON.stringify({ success: true, patterns }, null, 2)
  },
})

export const learning_get_review_queue = tool({
  description: 'Get the spaced repetition review queue.',
  args: {
    dueBefore: z.string().optional().describe('ISO timestamp cutoff for due reviews'),
  },
  async execute(args) {
    const queue = getReviewQueue(args.dueBefore)
    return JSON.stringify({ success: true, queue }, null, 2)
  },
})

export const learning_review_node = tool({
  description: 'Record a spaced repetition review for a knowledge node.',
  args: {
    nodeId: z.string().min(1).describe('Knowledge node ID'),
    quality: z.number().min(0).max(5).describe('Review quality score (0-5)'),
  },
  async execute(args) {
    const schedule = await reviewKnowledgeNode(args.nodeId, args.quality)
    return JSON.stringify({ success: true, schedule }, null, 2)
  },
})

export const learning_create_state_machine = tool({
  description: 'Create a learning state machine for workflow tracking.',
  args: {
    name: z.string().min(1).describe('State machine name'),
    states: z.array(z.string()).min(1).describe('Possible states'),
    transitions: z
      .array(
        z.object({
          from: z.string().min(1),
          to: z.string().min(1),
          event: z.string().min(1),
          description: z.string().optional(),
        }),
      )
      .min(1)
      .describe('State transitions'),
    initialState: z.string().min(1).describe('Initial state'),
    metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
  },
  async execute(args) {
    const machine = await createStateMachine(args)
    return JSON.stringify({ success: true, machine }, null, 2)
  },
})

export const learning_list_state_machines = tool({
  description: 'List all learning state machines.',
  args: {},
  async execute() {
    const machines = listStateMachines()
    return JSON.stringify({ success: true, machines }, null, 2)
  },
})
