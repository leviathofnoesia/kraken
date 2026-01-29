/**
 * Learning FSM Tool
 *
 * Tool for managing state machines for behavioral control.
 * Supports creating machines, managing states, and tracking transitions.
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
      "Use this tool to create state machines for workflows, track state transitions, " +
      "and manage behavioral patterns.",
    args: {
      action: z.enum(["createMachine", "getMachine", "listMachines", "deleteMachine", "transition", "getCurrentState", "addState", "removeState", "addTransition"]).describe(
        "Action to perform: 'createMachine', 'getMachine', 'listMachines', 'deleteMachine', 'transition', 'getCurrentState', 'addState', 'removeState', 'addTransition'"
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
      stateName: z
        .string()
        .optional()
        .describe("State name (for addState, removeState)"),
      stateDescription: z
        .string()
        .optional()
        .describe("State description (for addState)"),
      fromState: z
        .string()
        .optional()
        .describe("Source state (for addTransition, transition)"),
      toState: z
        .string()
        .optional()
        .describe("Target state (for addTransition, transition)"),
      condition: z
        .string()
        .optional()
        .describe("Transition condition expression (for addTransition)"),
      metadata: z
        .record(z.any())
        .optional()
        .describe("Additional metadata (for addState)")
    },
    async execute(args) {
      const {
        action,
        machineId,
        description,
        initialState,
        stateName,
        stateDescription,
        fromState,
        toState,
        condition,
        metadata
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
                  description: stateDescription || "Initial state",
                  transitions: [],
                  metadata: metadata || {}
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
                states: Object.entries(machine.states).map(([name, state]) => ({
                  name,
                  description: state.description,
                  transitionCount: state.transitions.length
                }))
              }
            }, null, 2)
          }

          case "listMachines": {
            const machines = stateMachine.listMachines()

            return JSON.stringify({
              success: true,
              count: machines.length,
              machines: machines.map(m => ({
                id: m.id,
                description: m.description,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
            }, null, 2)
          }

          case "deleteMachine": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'deleteMachine' action"
              }, null, 2)
            }

            stateMachine.deleteMachine(machineId)

            return JSON.stringify({
              success: true,
              message: "State machine deleted successfully",
              machineId
            }, null, 2)
          }

          case "transition": {
            if (!machineId || !toState) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and toState are required for 'transition' action"
              }, null, 2)
            }

            const success = stateMachine.transition(machineId, toState)

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
              toState
            }, null, 2)
          }

          case "getCurrentState": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'getCurrentState' action"
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
              currentState: machine.currentState
            }, null, 2)
          }

          case "addState": {
            if (!machineId || !stateName) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and stateName are required for 'addState' action"
              }, null, 2)
            }

            const machine = stateMachine.getMachine(machineId)

            if (!machine) {
              return JSON.stringify({
                success: false,
                error: `State machine not found: ${machineId}`
              }, null, 2)
            }

            stateMachine.addState(machineId, stateName, {
              name: stateName,
              description: stateDescription || "",
              transitions: [],
              metadata: metadata || {}
            })

            return JSON.stringify({
              success: true,
              message: "State added successfully",
              machineId,
              stateName
            }, null, 2)
          }

          case "removeState": {
            if (!machineId || !stateName) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and stateName are required for 'removeState' action"
              }, null, 2)
            }

            stateMachine.removeState(machineId, stateName)

            return JSON.stringify({
              success: true,
              message: "State removed successfully",
              machineId,
              stateName
            }, null, 2)
          }

          case "addTransition": {
            if (!machineId || !fromState || !toState) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId, fromState, and toState are required for 'addTransition' action"
              }, null, 2)
            }

            const machine = stateMachine.getMachine(machineId)

            if (!machine) {
              return JSON.stringify({
                success: false,
                error: `State machine not found: ${machineId}`
              }, null, 2)
            }

            stateMachine.addTransition(machineId, fromState, toState, condition)

            return JSON.stringify({
              success: true,
              message: "Transition added successfully",
              machineId,
              fromState,
              toState,
              hasCondition: !!condition
            }, null, 2)
          }

          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: createMachine, getMachine, listMachines, deleteMachine, transition, getCurrentState, addState, removeState, addTransition`
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
