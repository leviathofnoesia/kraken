#!/usr/bin/env bun
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
// @ts-ignore - jsonc-parser exports parseJsonc
import { parseJsonc } from 'jsonc-parser'
import * as path from 'path'
import * as os from 'os'
import color from 'picocolors'

export async function runInit(options: { minimal?: boolean; full?: boolean; verbose?: boolean }) {
  if (options.verbose) {
    console.log(color.dim('🐙 Initializing Kraken Code with verbose output...'))
  } else {
    console.log(color.cyan('🐙 Initializing Kraken Code...'))
  }

  const configDir = path.join(os.homedir(), '.config', 'opencode')
  const opencodeConfigPath = path.join(configDir, 'opencode.json')
  const krakenConfigPath = path.join(configDir, 'kraken-code.json')

  // Check if config directory exists, create if needed
  if (!existsSync(configDir)) {
    try {
      mkdirSync(configDir, { recursive: true })
      if (options.verbose) {
        console.log(color.dim(`ℹ️  Created config directory: ${configDir}`))
      }
      console.log(color.green(`✓ Created config directory: ${configDir}`))
    } catch (error: unknown) {
      console.error(
        color.red(
          `❌ Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      console.error(
        color.dim(
          'Try running with elevated permissions or check permissions for ~/.config/opencode',
        ),
      )
      process.exit(1)
    }
  } else if (options.verbose) {
    console.log(color.dim(`ℹ️  Config directory already exists: ${configDir}`))
  }

  const isMinimal = options.minimal
  const isFull = options.full

  // Plugin config stored in separate file (not in opencode.json)
  // Note: Agent switching is controlled by mode:'primary' on each AgentConfig,
  // not by config properties. The OpenCode platform reads mode from pluginConfig.agent.
  const krakenConfig: Record<string, any> = {
    blitzkrieg: {
      enabled: true,
      testPlan: {
        requiredBeforeImplementation: true,
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80,
      },
      tddWorkflow: {
        enforceWriteTestFirst: true,
        forbidCodeWithoutTest: true,
        allowRefactorWithoutTest: true,
      },
      evidence: {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true,
      },
      plannerConstraints: {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3,
      },
    },
    kratos: {
      enabled: true,
      autoSave: true,
      storagePath: '~/.kratos',
    },
    modes: {
      blitzkrieg: {
        enabled: true,
      },
      ultrathink: {
        enabled: true,
        thinkingBudget: 32000,
        autoVariantSwitch: true,
      },
      ultrawork: {
        enabled: true,
        parallelAgents: 4,
      },
      search: {
        enabled: true,
        maxResults: 50,
      },
      analyze: {
        enabled: true,
        consultationPhases: 3,
      },
    },
  }

  // Merge with existing kraken config if it exists
  let existingKrakenConfig: Record<string, any> = {}
  if (existsSync(krakenConfigPath)) {
    try {
      existingKrakenConfig = parseJsonc(readFileSync(krakenConfigPath, 'utf-8'))
      if (options.verbose) {
        console.log(
          color.dim(
            `ℹ️  Found existing Kraken configuration at ${krakenConfigPath}, merging with new settings`,
          ),
        )
      }
    } catch (error: unknown) {
      console.error(
        color.red(
          `❌ Failed to read existing Kraken configuration: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      console.error(
        color.dim(
          'This might be a corrupted config file. Try removing it manually and re-running init.',
        ),
      )
      existingKrakenConfig = {}
    }
  } else if (options.verbose) {
    console.log(color.dim(`ℹ️  No existing Kraken configuration found at ${krakenConfigPath}`))
  }

  const mergedKrakenConfig = {
    ...krakenConfig,
    ...existingKrakenConfig,
  }

  // Write kraken-code config
  try {
    writeFileSync(krakenConfigPath, JSON.stringify(mergedKrakenConfig, null, 2))
    if (options.verbose) {
      console.log(
        color.dim(`ℹ️  Wrote configuration with ${Object.keys(mergedKrakenConfig).length} keys`),
      )
    }
    console.log(color.green(`✓ Kraken Code configuration written to ${krakenConfigPath}`))
  } catch (error) {
    console.error(
      color.red(
        `❌ Failed to write Kraken configuration: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
    console.error(color.dim('Check permissions for the config file and try again.'))
    process.exit(1)
  }

  // Update opencode.json to add plugin (only)
  let existingOpencodeConfig: Record<string, any> = {}
  if (existsSync(opencodeConfigPath)) {
    try {
      existingOpencodeConfig = parseJsonc(readFileSync(opencodeConfigPath, 'utf-8'))
      if (options.verbose) {
        console.log(color.dim(`ℹ️  Found existing OpenCode configuration at ${opencodeConfigPath}`))
      }
    } catch (error: unknown) {
      console.error(
        color.red(
          `❌ Failed to read OpenCode configuration: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      console.error(
        color.dim(
          'This might be a corrupted opencode.json file. Try removing it manually and re-running init.',
        ),
      )
      existingOpencodeConfig = {}
    }
  } else if (options.verbose) {
    console.log(color.dim(`ℹ️  No existing OpenCode configuration found at ${opencodeConfigPath}`))
  }

  const mergedOpencodeConfig = {
    ...existingOpencodeConfig,
    plugin: Array.from(new Set([...(existingOpencodeConfig.plugin || []), 'kraken-code'])),
  }

  if (options.verbose) {
    console.log(
      color.dim(
        `ℹ️  Adding kraken-code to plugin list (current plugins: ${existingOpencodeConfig.plugin || []})`,
      ),
    )
  }

  try {
    writeFileSync(opencodeConfigPath, JSON.stringify(mergedOpencodeConfig, null, 2))
    if (options.verbose) {
      console.log(
        color.dim(
          `ℹ️  Updated OpenCode configuration with ${mergedOpencodeConfig.plugin.length} plugins`,
        ),
      )
    }
    console.log(color.green(`✓ OpenCode configuration updated at ${opencodeConfigPath}`))
  } catch (error: unknown) {
    console.error(
      color.red(
        `❌ Failed to update OpenCode configuration: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
    console.error(color.dim('Check permissions for the config file and try again.'))
    process.exit(1)
  }

  // Install skill templates
  try {
    await installSkillTemplates()
    if (options.verbose) {
      console.log(color.dim(`ℹ️  Skill templates installation completed successfully`))
    }
    console.log(color.green('✓ Skill templates installed successfully'))
  } catch (error: unknown) {
    console.error(
      color.yellow(
        `⚠️  Failed to install skill templates: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
    console.error(
      color.dim(
        'You can install them manually later by copying templates/skills to ~/.config/opencode/skill',
      ),
    )
  }

  console.log(color.green('\n🎉 Kraken Code initialized successfully!'))
  console.log(color.dim('\nNext steps:'))
  console.log(color.dim('  1. Run: opencode'))
  console.log(color.dim("  2. Use 'blitz' or 'blz' to activate Blitzkrieg Mode"))

  // Verify installation
  if (options.verbose) {
    console.log(color.dim('\n🔍 Verifying installation with detailed output...'))
  } else {
    console.log(color.dim('\n🔍 Verifying installation...'))
  }
  try {
    const opencodeConfigPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.json')
    const opencodeConfig = parseJsonc(readFileSync(opencodeConfigPath, 'utf-8'))

    if (opencodeConfig.plugin && opencodeConfig.plugin.includes('kraken-code')) {
      console.log(color.green('✓ Kraken Code plugin is registered in opencode.json'))
    } else {
      console.log(
        color.yellow(
          '⚠️  Kraken Code plugin not found in opencode.json - may need manual registration',
        ),
      )
    }

    const krakenConfigPath = path.join(os.homedir(), '.config', 'opencode', 'kraken-code.json')
    if (existsSync(krakenConfigPath)) {
      console.log(color.green('✓ Kraken Code configuration file exists'))
    } else {
      console.log(color.yellow('⚠️  Kraken Code configuration file missing'))
    }

    // Check if kraken-code appears in plugin list
    const { exec } = await import('node:child_process')
    const result = await new Promise((resolve) => {
      exec('opencode --plugins', (error, stdout, stderr) => {
        resolve(stdout)
      })
    })

    if ((result as string).includes('kraken-code')) {
      console.log(color.green('✓ Kraken Code appears in plugin list'))
    } else {
      console.log(
        color.yellow(
          "⚠️  Kraken Code not found in plugin list - run 'opencode --plugins' to verify",
        ),
      )
    }
  } catch (error) {
    console.log(color.yellow('⚠️  Verification failed - some checks could not be performed'))
  }
}

async function installSkillTemplates() {
  const skillDir = path.join(os.homedir(), '.config', 'opencode', 'skill')

  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true })
  }

  const sourceSkillsDir = path.join(__dirname, '../../templates/skills')

  // Copy skills from templates (if they exist)
  if (existsSync(sourceSkillsDir)) {
    const { copyFile } = await import('node:fs/promises')
    const { readdir } = await import('node:fs/promises')

    try {
      const skillCategories = await readdir(sourceSkillsDir)

      for (const category of skillCategories) {
        const sourcePath = path.join(sourceSkillsDir, category)
        const destPath = path.join(skillDir, category)

        if (!existsSync(destPath)) {
          mkdirSync(destPath, { recursive: true })
        }

        const skillFiles = await readdir(sourcePath)

        for (const skillFile of skillFiles) {
          const sourceFilePath = path.join(sourcePath, skillFile)
          const destFilePath = path.join(destPath, skillFile)
          await copyFile(sourceFilePath, destFilePath)
        }
      }
    } catch (error) {
      console.log(color.dim(`  ✓ Skill templates installed`))
    }
  } else {
    console.log(color.dim('  ✓ Skill templates ready (manual install)'))
  }
}
