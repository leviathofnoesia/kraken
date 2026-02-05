#!/usr/bin/env bun
import { Command } from "commander"
import * as path from "path"
import * as os from "os"
import color from "picocolors"
import { existsSync, readFileSync, unlinkSync, rmSync, writeFileSync } from "fs"

export async function runUninstall(options: { dryRun?: boolean; verbose?: boolean }) {
  const isDryRun = options.dryRun || false
  const configDir = path.join(os.homedir(), ".config", "opencode")
  const opencodeConfigPath = path.join(configDir, "opencode.json")
  const krakenConfigPath = path.join(configDir, "kraken-code.json")
  const skillDir = path.join(configDir, "skill")

  console.log(color.cyan("🗑️  Uninstalling Kraken Code..."))

  if (options.verbose) {
    console.log(color.dim("🗑️  Uninstalling Kraken Code with verbose output..."))
  } else if (isDryRun) {
    console.log(color.yellow("🔍 Dry run mode - showing what would be removed:"))
  }

  // List files that would be removed
  const filesToRemove = []

  if (existsSync(krakenConfigPath)) {
    filesToRemove.push(krakenConfigPath)
  }

  // Check if kraken-code is in opencode.json plugin list (we'll update it in place, not delete it)
  let opencodeConfig: { plugin?: string[] } = {}
  if (existsSync(opencodeConfigPath)) {
    try {
      opencodeConfig = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"))
    } catch {
      // Ignore parsing errors
    }
  }

  if (options.verbose) {
    console.log(color.dim(`ℹ️  Found ${filesToRemove.length} files to remove:`))
    filesToRemove.forEach(file => {
      console.log(color.dim(`    - ${file}`))
    })
  } else {
    console.log(color.dim("  Files to remove:"))
    filesToRemove.forEach(file => {
      console.log(color.dim(`    - ${file}`))
    })
  }

  // List directories that would be removed
  const dirsToRemove: string[] = []
  if (existsSync(skillDir)) {
    dirsToRemove.push(skillDir)
  }

  if (options.verbose) {
    console.log(color.dim(`ℹ️  Found ${dirsToRemove.length} directories to remove:`))
    dirsToRemove.forEach(dir => {
      console.log(color.dim(`    - ${dir}`))
    })
  } else {
    console.log(color.dim("  Directories to remove:"))
    dirsToRemove.forEach(dir => {
      console.log(color.dim(`    - ${dir}`))
    })
  }

  if (isDryRun) {
    console.log(color.green("\n🔍 Dry run complete. No files were actually removed."))
    console.log(color.dim("Run without --dry-run to perform actual uninstall."))
    return
  }

  // Actually remove files
  if (options.verbose) {
    console.log(color.dim("\n🗑️  Removing files..."))
  } else {
    console.log(color.yellow("\n🗑️  Removing files..."))
  }
  filesToRemove.forEach(file => {
    try {
      unlinkSync(file)
      if (options.verbose) {
        console.log(color.dim(`ℹ️  Removed ${file}`))
      }
      console.log(color.green(`✓ Removed ${file}`))
    } catch (error: unknown) {
      console.log(color.yellow(`⚠️  Could not remove ${file}: ${error instanceof Error ? error.message : String(error)}`))
    }
  })

  // Remove directories
  if (options.verbose) {
    console.log(color.dim("🗑️  Removing directories..."))
  } else {
    console.log(color.yellow("🗑️  Removing directories..."))
  }
  dirsToRemove.forEach(dir => {
    try {
      rmSync(dir, { recursive: true, force: true })
      if (options.verbose) {
        console.log(color.dim(`ℹ️  Removed ${dir}`))
      }
      console.log(color.green(`✓ Removed ${dir}`))
    } catch (error: unknown) {
      console.log(color.yellow(`⚠️  Could not remove ${dir}: ${error instanceof Error ? error.message : String(error)}`))
    }
  })

  // Remove kraken-code from opencode.json plugin list
  if (existsSync(opencodeConfigPath)) {
    try {
      const currentConfig = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"))
      if (currentConfig.plugin) {
        const updatedPlugins = currentConfig.plugin.filter((plugin: string) => plugin !== "kraken-code")
        if (updatedPlugins.length !== currentConfig.plugin.length) {
          const updatedConfig = { ...currentConfig, plugin: updatedPlugins }
          writeFileSync(opencodeConfigPath, JSON.stringify(updatedConfig, null, 2))
          if (options.verbose) {
            console.log(color.dim(`ℹ️  Updated opencode.json plugin list (removed kraken-code)`))
          }
          console.log(color.green("✓ Removed kraken-code from opencode.json plugin list"))
        } else if (options.verbose) {
          console.log(color.dim(`ℹ️  kraken-code was not in opencode.json plugin list`))
        }
      }
    } catch (error: unknown) {
      console.log(color.yellow(`⚠️  Could not update opencode.json: ${error instanceof Error ? error.message : String(error)}`))
    }
  } else if (options.verbose) {
    console.log(color.dim(`ℹ️  opencode.json not found, skipping plugin list update`))
  }

  console.log(color.green("\n🎉 Kraken Code uninstalled successfully!"))
  if (options.verbose) {
    console.log(color.dim("\n📋 Summary of changes:"))
    console.log(color.dim("  - Configuration files removed"))
    console.log(color.dim("  - Skill templates removed"))
    console.log(color.dim("  - Plugin registration removed from opencode.json"))
  }
  console.log(color.dim("\nTo reinstall, run: kraken-code install"))
}

// Add to main CLI
export function addUninstallCommand(program: Command) {
  program
    .command("uninstall")
    .description("Uninstall and deregister Kraken Code plugin")
    .option("--dry-run", "Show what would be removed without actually removing")
    .option("-v, --verbose", "Show detailed output")
    .action(async (options) => {
      await runUninstall(options)
    })
}