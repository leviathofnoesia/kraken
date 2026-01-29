/**
 * Learning FSM Tool
 *
 * Manage state machines and state transitions.
 * Part of the unified AI memory system (Layer 4).
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { MCPTool } from "../../features/mcp/types"
import type { StateMachineEngine } from "../../features/learning/state-machine"

let stateMachine: StateMachineEngine | null = null

export function setStateMachine(sm: StateMachineEngine) {
  stateMachine = sm
  console.log("[LearningFsmTool] State machine set")
}

export function getStateMachine(): StateMachineEngine | null {
  return stateMachine
}

const learningFsmToolImpl = tool({
  description: "Manage state machines for behavioral control. State machines define clear state transitions for workflows like code review, debugging, TDD, etc. Use this to create custom state machines or query current state.",
  args: {
    action: z.enum(["create", "transition", "get", "list", "history"]).describe("Action to perform"),
    // Create args
    machineId: z.string().optional().describe("Unique ID for the machine. Required for 'create'."),
    machineName: z.string().optional().describe("Human-readable name. Required for 'create'."),
    initialState: z.string().optional().describe("Starting state. Required for 'create'."),
    states: z.record(z.any()).optional().describe("State definitions (JSON). Required for 'create'."),
    // Transition args
    toState: z.string().optional().describe("Target state. Required for 'transition'."),
    trigger: z.string().optional().describe("What caused the transition. Required for 'transition'."),
    reward: z.number().min(-1).max(1).optional().describe("Reward for this transition. Optional."),
    // Get/List args
    targetMachineId: z.string().optional().describe("Machine ID. Required for 'get'."),
    historyLimit: z.number().min(1).max(100).default(10).optional().describe("History limit. Default: 10."),
  },
  async execute(args, context) {
    if (!stateMachine) {
      throw new Error("State machine not initialized. Call setStateMachine() first.")
    }

    try {
      switch (args.action) {
        case "create":
          return await createMachine(args as any)
        case "transition":
          return await performTransition(args as any)
        case "get":
          return await getMachine(args as any)
        case "list":
          return await listMachines()
        case "history":
          return await getHistory(args as any)
        default:
          throw new Error(`Unknown action: ${args.action}`)
      }
    } catch (error: any) {
      console.error("[LearningFsmTool] Error:", error)
      throw new Error(`Failed to ${args.action}: ${error.message}`)
    }
  }
})

async function createMachine(args: any): Promise<string> {
  if (!args.machineId || !args.machineName || !args.initialState || !args.states) {
    throw new Error("Missing required fields for 'create': machineId, machineName, initialState, states")
  }

  const machine = stateMachine!.createMachine(
    args.machineId,
    args.machineName,
    args.initialState,
    args.states
  )

  return `✅ State machine created\n\n` +
         `ID: ${machine.id}\n` +
         `Name: ${machine.name}\n` +
         `Initial state: ${machine.initialState}\n` +
         `States: ${Object.keys(machine.states).join(", ")}\n\n` +
         `*Use 'learning_fsm' with action='get' to view full details.*`
}

async function performTransition(args: { toState: string; trigger: string; reward?: number }): Promise<string> {
  if (!args.toState || !args.trigger) {
    throw new Error("Missing required fields for 'transition': toState, trigger")
  }

  const result = stateMachine!.transition(
    "default", // Use default machine
    args.toState,
    args.trigger,
    args.reward
  )

  return `✅ State transition\n\n` +
         `Previous state: ${result.previousState}\n` +
         `New state: ${result.currentState}\n` +
         `Trigger: ${args.trigger}\n` +
         (args.reward !== undefined ? `Reward: ${args.reward.toFixed(2)}\n` : "") +
         `Time: ${new Date(result.timestamp).toLocaleString()}`
}

async function getMachine(args: { targetMachineId: string }): Promise<string> {
  if (!args.targetMachineId) {
    throw new Error("Missing required field for 'get': targetMachineId")
  }

  const machine = stateMachine!.getMachine(args.targetMachineId)

  if (!machine) {
    return `State machine not found: ${args.targetMachineId}`
  }

  let output = `**${machine.name}** (${machine.id})\n\n`
  output += `Current state: ${machine.currentState}\n`
  output += `Initial state: ${machine.initialState}\n\n`

  output += `**States:**\n`
  for (const [name, state] of Object.entries(machine.states)) {
    const isCurrent = name === machine.currentState ? " ← [CURRENT]" : ""
    output += `- ${name}${isCurrent}\n`
    output += `  Description: ${state.description}\n`
    if (state.transitions && state.transitions.length > 0) {
      output += `  Transitions: ${state.transitions.map(t => t.toState).join(", ")}\n`
    }
  }

  return output
}

async function listMachines(): Promise<string> {
  const machines = stateMachine!.getAllMachines()

  if (machines.length === 0) {
    return "No state machines found"
  }

  let output = `Found ${machines.length} state machines:\n\n`

  for (let i = 0; i < machines.length; i++) {
    const m = machines[i]
    output += `${i + 1}. **${m.name}** (${m.id})\n`
    output += `   Current state: ${m.currentState}\n`
    output += `   States: ${Object.keys(m.states).join(", ")}\n`
    output += `   Created: ${new Date(m.metadata.created).toLocaleString()}\n\n`
  }

  return output
}

async function getHistory(args: { historyLimit?: number }): Promise<string> {
  const limit = args.historyLimit || 10
  const machine = stateMachine!.getMachine("default")

  if (!machine) {
    return "No default state machine found"
  }

  const history = machine.history.slice(-limit)

  if (history.length === 0) {
    return "No transition history"
  }

  let output = `**Transition History** (last ${history.length}):\n\n`

  for (let i = history.length - 1; i >= 0; i--) {
    const t = history[i]
    const emoji = t.reward && t.reward > 0 ? "✅" : t.reward && t.reward < 0 ? "❌" : "→"
    output += `${emoji} ${t.fromState} → ${t.toState}\n`
    output += `   Trigger: ${t.trigger}\n`
    if (t.reward !== undefined) {
      output += `   Reward: ${t.reward.toFixed(2)}\n`
    }
    output += `   Time: ${new Date(t.timestamp).toLocaleString()}\n\n`
  }

  return output
}

export const learningFsmTool: MCPTool = {
  ...learningFsmToolImpl,
  serverName: 'learning',
  category: 'learning'
}
