/**
 * Layer 4: State Machine
 * 
 * Behavioral control through clear state transitions.
 * Hierarchical, stochastic, with entry/exit actions.
 */

import * as fs from "fs"
import * as path from "path"
import type {
  StateDefinition,
  TransitionRule,
  StateMachine,
  StateTransition
} from "./types-unified"

export class StateMachineEngine {
  private stateMachinesPath: string
  private stateMachines: Map<string, StateMachine>
  private currentMachineId?: string

  constructor(storagePath: string) {
    const smDir = path.join(storagePath, "state_machines")
    this.stateMachinesPath = path.join(smDir, "machines.json")
    this.stateMachines = new Map()

    this.ensureStorage()
    this.loadStateMachines()
  }

  private ensureStorage() {
    const dir = path.dirname(this.stateMachinesPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  private loadStateMachines() {
    if (fs.existsSync(this.stateMachinesPath)) {
      const data = fs.readFileSync(this.stateMachinesPath, "utf-8")
      const machinesArray = JSON.parse(data) as StateMachine[]

      for (const machine of machinesArray) {
        this.stateMachines.set(machine.id, machine)
      }

      console.log(`[StateMachine] Loaded ${this.stateMachines.size} state machines`)
    }
  }

  private saveStateMachines() {
    const machinesArray = Array.from(this.stateMachines.values())
    fs.writeFileSync(this.stateMachinesPath, JSON.stringify(machinesArray, null, 2), "utf-8")
  }

  /**
   * Create a new state machine
   */
  createMachine(
    id: string,
    name: string,
    initialState: string,
    states: Record<string, StateDefinition>
  ): StateMachine {
    // Validate that initialState exists in provided states
    if (!states[initialState]) {
      throw new Error(`Initial state '${initialState}' not found in states. Available states: ${Object.keys(states).join(", ")}`)
    }

    const machine: StateMachine = {
      id,
      name,
      initialState,
      states,
      transitions: this.buildTransitionsMap(states),
      currentState: initialState,
      history: [],
      metadata: {
        created: new Date().toISOString(),
        version: "1.0.0",
        triggers: []
      }
    }

    this.stateMachines.set(id, machine)
    this.saveStateMachines()

    return machine
  }

  /**
   * Build transitions map from states
   */
  private buildTransitionsMap(states: Record<string, StateDefinition>): Record<string, TransitionRule[]> {
    const transitions: Record<string, TransitionRule[]> = {}

    for (const [stateName, state] of Object.entries(states)) {
      if (state.transitions && state.transitions.length > 0) {
        transitions[stateName] = state.transitions
      } else {
        transitions[stateName] = []
      }
    }

    return transitions
  }

  /**
   * Get a state machine
   */
  getMachine(id: string): StateMachine | null {
    return this.stateMachines.get(id) || null
  }

  /**
   * Set current machine (active)
   */
  setCurrentMachine(id: string): void {
    if (!this.stateMachines.has(id)) {
      throw new Error(`State machine not found: ${id}`)
    }

    this.currentMachineId = id
    console.log(`[StateMachine] Set current machine: ${id}`)
  }

  /**
   * Get current state
   */
  getCurrentState(): string | null {
    if (!this.currentMachineId) {
      return null
    }

    const machine = this.stateMachines.get(this.currentMachineId)
    return machine?.currentState || null
  }

  /**
   * Get current machine
   */
  getCurrentMachine(): StateMachine | null {
    if (!this.currentMachineId) {
      return null
    }

    return this.stateMachines.get(this.currentMachineId) || null
  }

  /**
   * Transition to a new state
   */
  async transition(trigger: string, context?: any): Promise<boolean> {
    if (!this.currentMachineId) {
      console.warn("[StateMachine] No current machine set")
      return false
    }

    const machine = this.stateMachines.get(this.currentMachineId)
    if (!machine) {
      return false
    }

    const currentState = machine.currentState
    const transitions = machine.transitions[currentState] || []

    // Find matching transition
    let matchedTransition: TransitionRule | null = null

    for (const transition of transitions) {
      if (transition.condition) {
        // Conditional transition
        if (transition.condition(context)) {
          matchedTransition = transition
          break
        }
      } else {
        // Unconditional transition - use trigger to match
        if (this.triggerMatches(transition, trigger)) {
          matchedTransition = transition
          break
        }
      }
    }

    if (!matchedTransition) {
      console.warn(`[StateMachine] No transition found from ${currentState} for trigger: ${trigger}`)
      return false
    }

    // Check probability (stochastic transitions)
    if (matchedTransition.probability !== undefined) {
      const rand = Math.random()
      if (rand > matchedTransition.probability) {
        console.log(`[StateMachine] Stochastic transition not taken (prob: ${matchedTransition.probability})`)
        return false
      }
    }

    // Execute exit action if exists
    const currentStateDef = machine.states[currentState]
    if (currentStateDef?.onExit) {
      currentStateDef.onExit()
    }

    // Record transition
    const transitionRecord: StateTransition = {
      timestamp: new Date().toISOString(),
      fromState: currentState,
      toState: matchedTransition.toState,
      trigger,
      context
    }

    // Update current state
    machine.currentState = matchedTransition.toState
    machine.history.push(transitionRecord)

    // Execute transition action if exists
    if (matchedTransition.action) {
      matchedTransition.action()
    }

    // Execute enter action if exists
    const newStateDef = machine.states[matchedTransition.toState]
    if (newStateDef?.onEnter) {
      newStateDef.onEnter()
    }

    this.saveStateMachines()

    console.log(`[StateMachine] Transitioned: ${currentState} → ${matchedTransition.toState} (trigger: ${trigger})`)

    return true
  }

  /**
   * Check if trigger matches a transition
   */
  private triggerMatches(transition: TransitionRule, trigger: string): boolean {
    // If transition has a toolMethod, check if trigger includes it
    if (transition.toolMethod) {
      return trigger.toLowerCase().includes(transition.toolMethod.toLowerCase())
    }

    // Otherwise, check if trigger matches any defined condition
    return trigger === transition.fromState || trigger.includes(transition.fromState)
  }

  /**
   * Auto-detect state transition from context
   */
  async detectStateTransition(context: any): Promise<string | null> {
    if (!this.currentMachineId) {
      return null
    }

    const machine = this.stateMachines.get(this.currentMachineId)
    if (!machine) {
      return null
    }

    const currentState = machine.currentState

    // Analyze context to determine next state
    const detectedState = this.analyzeContextForState(context, currentState)

    if (detectedState && detectedState !== currentState) {
      // Transition automatically
      try {
        await this.transition(`auto-detect: ${detectedState}`, context)
        return detectedState
      } catch (error: any) {
        console.error(`[StateMachine] Auto-transition failed:`, error)
        return null
      }
    }

    return null
  }

  /**
   * Analyze context to determine state
   */
  private analyzeContextForState(context: any, currentState: string): string | null {
    const contextStr = JSON.stringify(context).toLowerCase()

    // Common state detection rules
    const stateRules: Record<string, RegExp[]> = {
      analyzing: [/analyz/, /review/, /check/, /exam/],
      debugging: [/debug/, /error/, /bug/, /fix/, /issue/],
      implementing: [/implement/, /build/, /create/, /add/],
      testing: [/test/, /verify/, /check/],
      reviewing: [/review/, /inspect/, /audit/],
      deploying: [/deploy/, /release/, /publish/],
      learning: [/learn/, /study/, /research/],
      planning: [/plan/, /design/, /architect/]
    }

    for (const [state, rules] of Object.entries(stateRules)) {
      if (state === currentState) continue

      for (const rule of rules) {
        if (rule.test(contextStr)) {
          return state
        }
      }
    }

    return null
  }

  /**
   * Add a transition rule
   */
  addTransition(machineId: string, fromState: string, transition: TransitionRule): void {
    const machine = this.stateMachines.get(machineId)
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`)
    }

    // Validate that fromState exists in states
    if (!machine.states[fromState]) {
      throw new Error(`Source state '${fromState}' not found in machine states. Available states: ${Object.keys(machine.states).join(", ")}`)
    }

    // Update machine.transitions
    if (!machine.transitions[fromState]) {
      machine.transitions[fromState] = []
    }
    machine.transitions[fromState].push(transition)

    // Update machine.states[fromState].transitions to stay in sync
    if (!machine.states[fromState].transitions) {
      machine.states[fromState].transitions = []
    }
    machine.states[fromState].transitions.push(transition)

    this.saveStateMachines()
  }

  /**
   * Reset state machine to initial state
   */
  resetMachine(machineId: string): void {
    const machine = this.stateMachines.get(machineId)
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`)
    }

    machine.currentState = machine.initialState
    machine.history = []
    this.saveStateMachines()

    console.log(`[StateMachine] Reset machine: ${machineId}`)
  }

  /**
   * Get transition history
   */
  getHistory(machineId: string): StateTransition[] {
    const machine = this.stateMachines.get(machineId)
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`)
    }

    return machine.history
  }

  /**
   * Get statistics
   */
  getStats(machineId: string): {
    currentState: string
    totalTransitions: number
    transitionsByState: Record<string, number>
    avgTimeBetweenTransitions?: number
  } {
    const machine = this.stateMachines.get(machineId)
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`)
    }

    const transitionsByState: Record<string, number> = {}

    for (const transition of machine.history) {
      transitionsByState[transition.toState] = (transitionsByState[transition.toState] || 0) + 1
    }

    let avgTimeBetweenTransitions: number | undefined

    if (machine.history.length > 1) {
      let totalTime = 0
      for (let i = 1; i < machine.history.length; i++) {
        const prev = new Date(machine.history[i - 1].timestamp).getTime()
        const curr = new Date(machine.history[i].timestamp).getTime()
        totalTime += (curr - prev)
      }
      avgTimeBetweenTransitions = totalTime / (machine.history.length - 1)
    }

    return {
      currentState: machine.currentState,
      totalTransitions: machine.history.length,
      transitionsByState,
      avgTimeBetweenTransitions
    }
  }

  /**
   * Export state machine
   */
  exportMachine(machineId: string): StateMachine | null {
    const machine = this.stateMachines.get(machineId)
    if (!machine) {
      return null
    }

    return JSON.parse(JSON.stringify(machine))
  }

  /**
   * Get all state machines
   */
  getAllMachines(): StateMachine[] {
    return Array.from(this.stateMachines.values())
  }
}
