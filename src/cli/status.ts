#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs"
import * as path from "path"
import * as os from "os"
import color from "picocolors"

export async function runStatus() {
  console.log(color.cyan("🐙 Kraken Code Status\n"))

  const opencodeConfigPath = path.join(os.homedir(), ".config", "opencode", "opencode.json")
  const krakenConfigPath = path.join(os.homedir(), ".config", "opencode", "kraken-code.json")
  
  // Check OpenCode config for plugin registration
  if (!existsSync(opencodeConfigPath)) {
    console.log(color.red("✗ OpenCode configuration not found"))
    console.log(color.dim("  Run: kraken-code init"))
    return
  }

  const opencodeConfig = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"))
  const isPluginRegistered = opencodeConfig.plugin?.includes("kraken-code") || false

  // Plugin Status
  console.log(color.bold("Plugin:"))
  if (isPluginRegistered) {
    console.log(color.green("  ✓ Registered: kraken-code"))
  } else {
    console.log(color.red("  ✗ Not registered"))
    console.log(color.dim("  Run: kraken-code init"))
  }

  // Check kraken-code config
  if (!existsSync(krakenConfigPath)) {
    console.log(color.yellow("\n⚠ Kraken Code configuration not found"))
    console.log(color.dim("  Run: kraken-code init"))
    return
  }

  const config = JSON.parse(readFileSync(krakenConfigPath, "utf-8"))

  // Plugin Status
  console.log(color.bold("Plugin:"))
  console.log(color.green("  ✓ Registered: kraken-code"))

  // Default Agent
  if (config.default_agent) {
    console.log(color.bold("\nDefault Agent:"))
    console.log(`  ${config.default_agent}`)
  }

  // Agents Status
  if (config.agents) {
    const enabledAgents = Object.entries(config.agents)
      .filter(([_, agent]: [string, any]) => !agent.disable)
      .map(([name]) => name)
    if (enabledAgents.length > 0) {
      console.log(color.bold("\nEnabled Agents:"))
      console.log(`  ${enabledAgents.join(", ")}`)
    }
  }

  // Blitzkrieg Status
  if (config.blitzkrieg) {
    const status = config.blitzkrieg.enabled ? color.green("✓ Enabled") : color.red("✗ Disabled")
    console.log(color.bold("\nBlitzkrieg Mode:"))
    console.log(`  Status: ${status}`)
    console.log(color.dim("  Activate with: 'blitz' or 'blz'"))
  }

  // Memory Status
  if (config.memory) {
    const status = config.memory.enabled ? color.green("✓ Enabled") : color.red("✗ Disabled")
    console.log(color.bold("\nMemory:"))
    console.log(`  Status: ${status}`)
    console.log(`  Storage: ${config.memory.storagePath || "~/.kraken/memory"}`)
  }

  // Modes Status
  if (config.modes) {
    const modeNames: string[] = []
    for (const [modeName, modeConfig] of Object.entries(config.modes)) {
      if (typeof modeConfig === 'object' && modeConfig && (modeConfig as any).enabled) {
        modeNames.push(modeName)
      }
    }
    if (modeNames.length > 0) {
      console.log(color.bold("\nActive Modes:"))
      console.log(`  ${modeNames.join(", ")}`)
    }
  }
}
