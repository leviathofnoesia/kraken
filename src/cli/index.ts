#!/usr/bin/env bun
import { Command } from "commander"
import { runDoctor } from "./doctor/runner"
import { runInstall } from "./install"
import { runInit } from "./init"
import { runStatus } from "./status"
import { runUninstall } from "./uninstall"
import { version } from "../../package.json"

const program = new Command()

program
  .name("kraken-code")
  .description("Kraken Code CLI - Unified OpenCode Plugin Manager")
  .version(version)

program
  .command("install")
  .description("Install and register Kraken Code plugin")
  .action(async () => {
    await runInstall()
  })

program
  .command("init")
  .description("Initialize Kraken Code with recommended configuration")
  .option("--minimal", "Minimal setup (agents only)")
  .option("--full", "Full setup (all features)")
  .action(async (options) => {
    await runInit(options)
  })

program
  .command("uninstall")
  .description("Uninstall Kraken Code plugin from OpenCode")
  .option("--config", "Also remove Kraken Code config file")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    await runUninstall(options)
  })

program
  .command("status")
  .description("Show Kraken Code installation status")
  .action(async () => {
    await runStatus()
  })

program
  .command("doctor")
  .description("Run system checks and diagnostics")
  .option("-c, --category <category>", "Run checks for a specific category")
  .option("--json", "Output results as JSON")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    await runDoctor({
      category: options.category,
      json: options.json,
      verbose: options.verbose,
    })
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
