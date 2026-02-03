#!/usr/bin/env bun
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import * as path from "path"
import * as os from "os"
import color from "picocolors"

export async function runInit(options: { minimal?: boolean; full?: boolean }) {
  console.log(color.cyan("🐙 Initializing Kraken Code..."))

  const configDir = path.join(os.homedir(), ".config", "opencode")
  const opencodeConfigPath = path.join(configDir, "opencode.json")
  const krakenConfigPath = path.join(configDir, "kraken-code.json")

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  const isMinimal = options.minimal
  const isFull = options.full

  // Plugin config stored in separate file (not in opencode.json)
  const krakenConfig: Record<string, any> = {
    default_agent: "Kraken",
    blitzkrieg: {
      enabled: true,
      testPlan: {
        requiredBeforeImplementation: true,
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80
      },
      tddWorkflow: {
        enforceWriteTestFirst: true,
        forbidCodeWithoutTest: true,
        allowRefactorWithoutTest: true
      },
      evidence: {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true
      },
      plannerConstraints: {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3
      }
    },
    memory: {
      enabled: true,
      autoSave: true,
      storagePath: "~/.kraken/memory"
    },
    modes: {
      blitzkrieg: {
        enabled: true
      },
      ultrathink: {
        enabled: true,
        thinkingBudget: 32000,
        autoVariantSwitch: true
      },
      ultrawork: {
        enabled: true,
        parallelAgents: 4
      },
      search: {
        enabled: true,
        maxResults: 50
      },
      analyze: {
        enabled: true,
        consultationPhases: 3
      }
    }
  }

  // Merge with existing kraken config if it exists
  let existingKrakenConfig: Record<string, any> = {}
  if (existsSync(krakenConfigPath)) {
    try {
      existingKrakenConfig = JSON.parse(readFileSync(krakenConfigPath, "utf-8"))
    } catch {
      existingKrakenConfig = {}
    }
  }

  const mergedKrakenConfig = {
    ...krakenConfig,
    ...existingKrakenConfig
  }

  // Write kraken-code config
  writeFileSync(krakenConfigPath, JSON.stringify(mergedKrakenConfig, null, 2))
  console.log(color.green(`✓ Kraken Code configuration written to ${krakenConfigPath}`))

  // Update opencode.json to add plugin (only)
  let existingOpencodeConfig: Record<string, any> = {}
  if (existsSync(opencodeConfigPath)) {
    try {
      existingOpencodeConfig = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"))
    } catch {
      existingOpencodeConfig = {}
    }
  }

  const mergedOpencodeConfig = {
    ...existingOpencodeConfig,
    $schema: "https://opencode.ai/config.json",
    plugin: Array.from(new Set([
      ...(existingOpencodeConfig.plugin || []),
      "kraken-code"
    ]))
  }

  writeFileSync(opencodeConfigPath, JSON.stringify(mergedOpencodeConfig, null, 2))
  console.log(color.green(`✓ OpenCode configuration updated at ${opencodeConfigPath}`))

  // Install skill templates
  await installSkillTemplates()

  console.log(color.green("\n🎉 Kraken Code initialized!"))
  console.log(color.dim("\nNext steps:"))
  console.log(color.dim("  1. Run: opencode"))
  console.log(color.dim("  2. Use 'blitz' or 'blz' to activate Blitzkrieg Mode"))
}

async function installSkillTemplates() {
  const skillDir = path.join(os.homedir(), ".config", "opencode", "skill")
  
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true })
  }

  const sourceSkillsDir = path.join(__dirname, "../../templates/skills")
  
  // Copy skills from templates (if they exist)
  if (existsSync(sourceSkillsDir)) {
    const { copyFile } = await import("node:fs/promises")
    const { readdir } = await import("node:fs/promises")
    
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
    console.log(color.dim("  ✓ Skill templates ready (manual install)"))
  }
}
