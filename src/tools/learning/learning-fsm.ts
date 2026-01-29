/**
 * Learning FSM Tool
 *
 * Tool for managing state machines for behavioral control.
 * Supports creating machines, getting status, and transitioning states.
 */

import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import type { StateMachineEngine } from "../../features/learning/state-machine"

/**
 * Create learning-fsm tool
 */
export function createFsmTool(stateMachine: StateMachineEngine) {
  return tool({
    description:
      "Manage state machines for behavioral control. " +
      "Use this tool to create state machines for workflows, track state transitions.",
    args: {
      action: z.enum(["createMachine", "getMachine", "listMachines", "transition", "getCurrentState"]).describe(
        "Action to perform: 'createMachine', 'getMachine', 'listMachines', 'transition', 'getCurrentState'"
      ),
      machineId: z
        .string()
        .optional()
        .describe("Machine ID (for most actions)"),
      description: z
        .string()
        .optional()
        .describe("Machine description (for createMachine)"),
      initialState: z
        .string()
        .optional()
        .describe("Initial state name (for createMachine)"),
      toState: z
        .string()
        .optional()
        .describe("Target state (for transition action)"),
      trigger: z
        .string()
        .optional()
        .describe("Transition trigger (for transition action)")
    },
    async execute(args) {
      const {
        action,
        machineId,
        description,
        initialState,
        toState,
        trigger
      } = args

      try {
        switch (action) {
          case "createMachine": {
            if (!machineId || !initialState) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and initialState are required for 'createMachine' action"
              }, null, 2)
            }

            stateMachine.createMachine(
              machineId,
              description || "",
              initialState,
              {
                [initialState]: {
                  name: initialState,
                  description: "Initial state",
                  transitions: [],
                  metadata: {}
                }
              }
            )

            return JSON.stringify({
              success: true,
              message: "State machine created successfully",
              machineId,
              initialState
            }, null, 2)
          }

          case "getMachine": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'getMachine' action"
              }, null, 2)
            }

            const machine = stateMachine.getMachine(machineId)

            if (!machine) {
              return JSON.stringify({
                success: false,
                error: `State machine not found: ${machineId}`
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              machine: {
                id: machine.id,
                description: machine.description,
                currentState: machine.currentState,
                stateCount: Object.keys(machine.states).length,
                states: Object.entries(machine.states).map(([name, state]: [string, any]) => ({
                  name,
                  description: state.description,
                  transitionCount: state.transitions?.length || 0
                }))
              }
            }, null, 2)
          }

          case "listMachines": {
            const machines = stateMachine.getAllMachines()

            return JSON.stringify({
              success: true,
              count: machines.length,
              machines: machines.map((m: any) => ({
                id: m.id,
                description: m.description,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
            }, null, 2)
          }

          case "transition": {
            if (!machineId || !trigger) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and trigger are required for 'transition' action"
              }, null, 2)
            }

            // Set current machine first
            stateMachine.setCurrentMachine(machineId)

            // Perform transition
            const success = await stateMachine.transition(trigger, { toState })

            if (!success) {
              return JSON.stringify({
                success: false,
                error: "Transition failed - no valid transition path found"
              }, null, 2)
            }

            return JSON.stringify({
              success: true,
              message: "State transition successful",
              machineId,
              currentState: stateMachine.getCurrentState()
            }, null, 2)
          }

          case "getCurrentState": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'getCurrentState' action"
              }, null, 2)
            }

            stateMachine.setCurrentMachine(machineId)
            const currentState = stateMachine.getCurrentState()

            return JSON.stringify({
              success: true,
              currentState
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: createMachine, getMachine, listMachines, transition, getCurrentState`
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
