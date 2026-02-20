#!/usr/bin/env bun
import { Command } from "commander"
import { runDoctor } from "./doctor/runner"
import { runInstall } from "./install"
import { runInit } from "./init"
import { runStatus } from "./status"
import { runUninstall, addUninstallCommand } from "./uninstall"
import { runBridgeStart } from "./bridge"
import { runCiReview } from "./ci"
import { runValidateCommand } from "./validate"
import { version } from "../../package.json"

const program = new Command()

program
  .name("kraken-code")
  .description("Kraken Code CLI - Unified OpenCode Plugin Manager")
  .version(version)

program
  .command("install")
  .description("Install and register Kraken Code plugin")
  .option("--target <target>", "Installation target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .action(async (options) => {
    await runInstall({ target: options.target })
  })

program
  .command("init")
  .description("Initialize Kraken Code with recommended configuration")
  .option("--minimal", "Minimal setup (agents only)")
  .option("--full", "Full setup (all features)")
  .option("--target <target>", "Initialization target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    await runInit(options)
  })

program
  .command("bridge")
  .description("Run Kraken interoperability bridge")
  .command("start")
  .description("Start bridge server")
  .option("--protocol <protocol>", "Bridge protocol (currently: mcp)", "mcp")
  .option("--target <target>", "Bridge target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .option("--mode <mode>", "Bridge mode: standard|strict", "standard")
  .action(async (options) => {
    await runBridgeStart(options)
  })

program
  .command("status")
  .description("Show Kraken Code installation status")
  .option("--target <target>", "Status target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .action(async (options) => {
    await runStatus({ target: options.target })
  })

addUninstallCommand(program)

program
  .command("doctor")
  .description("Run system checks and diagnostics")
  .option("-c, --category <category>", "Run checks for a specific category")
  .option("--json", "Output results as JSON")
  .option("--strict", "Treat warnings as failures (useful for CI)")
  .option("--target <target>", "Doctor target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    await runDoctor({
      category: options.category,
      json: options.json,
      strict: options.strict,
      target: options.target,
      verbose: options.verbose,
    })
  })

program
  .command("validate")
  .description("Fast target validation (adapter schema + bridge launchability)")
  .option("--target <target>", "Validation target: opencode|codex|claude|cline|cursor|vscode|ci", "opencode")
  .option("--json", "Output validation result as JSON")
  .action(async (options) => {
    await runValidateCommand({ target: options.target, json: options.json })
  })

program
  .command("ci")
  .description("CI-focused utilities")
  .command("review")
  .description("Generate CI review summary for current repository state")
  .option("--format <format>", "Output format: markdown|json", "markdown")
  .option("--base <ref>", "Base git ref", "origin/main")
  .option("--head <ref>", "Head git ref", "HEAD")
  .action(async (options) => {
    await runCiReview(options)
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
