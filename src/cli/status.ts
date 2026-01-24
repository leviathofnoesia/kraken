#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs"
import * as path from "path"
import * as os from "os"
import color from "picocolors"

export async function runStatus() {
  console.log(color.cyan("🐙 Kraken Code Status\n"))

  const configPath = path.join(os.homedir(), ".config", "opencode", "opencode.json")
  
  if (!existsSync(configPath)) {
    console.log(color.red("✗ Configuration not found"))
    console.log(color.dim("  Run: kraken-code init"))
    return
  }

  const config = JSON.parse(readFileSync(configPath, "utf-8"))
  const kc = config.kraken_code || {}

  // Plugin Status
  console.log(color.bold("Plugin:"))
  console.log(color.green("  ✓ Registered: kraken-code"))

  // Agents Status
  if (kc.agents) {
    console.log(color.bold("\nAgents:"))
    console.log(`  Default: ${kc.agents.default}`)
    console.log(`  Enabled: ${kc.agents.enabled.join(", ")}`)
  }

  // Blitzkrieg Status
  if (kc.blitzkrieg) {
    const status = kc.blitzkrieg.enabled ? color.green("✓ Enabled") : color.red("✗ Disabled")
    console.log(color.bold("\nBlitzkrieg Mode:"))
    console.log(`  Status: ${status}`)
    console.log(color.dim("  Activate with: 'blitz' or 'blz'"))
  }

  // Kratos Memory Status
  if (kc.kratos) {
    const status = kc.kratos.enabled ? color.green("✓ Enabled") : color.red("✗ Disabled")
    console.log(color.bold("\nMemory (Kratos):"))
    console.log(`  Status: ${status}`)
    console.log(`  Storage: ${kc.kratos.storagePath}`)
  }

  // Skills Status
  if (kc.skills) {
    const status = kc.skills.autoLoad ? color.green("✓ Auto-load") : color.red("✗ Manual")
    console.log(color.bold("\nSkills:"))
    console.log(`  ${status}`)
    console.log(`  Directories: ${kc.skills.directories?.length || 0}`)
  }
}
