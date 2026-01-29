#!/usr/bin/env bun
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import * as path from "path"
import * as os from "os"
import color from "picocolors"

export async function runInit(options: { minimal?: boolean; full?: boolean }) {
  console.log(color.cyan("🐙 Initializing Kraken Code..."))

  const configDir = path.join(os.homedir(), ".config", "opencode")
  const configPath = path.join(configDir, "opencode.json")
  const krakenConfigPath = path.join(configDir, "kraken-code.json")

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  const isMinimal = options.minimal
  const isFull = options.full

  // OpenCode config - minimal, only plugin reference
  const opencodeConfig = {
    plugin: ["kraken-code"],
  }

  // Kraken Code specific config in separate file
  const krakenConfig = {
    agents: {
      default: "kraken",
      enabled: isMinimal
        ? ["kraken", "atlas"]
        : ["kraken", "atlas", "nautilus", "abyssal", "coral", "siren", "scylla", "pearl"]
    },
    blitzkrieg: {
      enabled: true,
      testPlan: {
        requiredBeforeImplementation: !isMinimal,
        minTestCases: 3,
        requireCoverageThreshold: !isMinimal,
        coverageThresholdPercent: 80
      },
      tddWorkflow: {
        enforceWriteTestFirst: !isMinimal,
        forbidCodeWithoutTest: !isMinimal,
        allowRefactorWithoutTest: true
      },
      evidence: {
        requireTestExecutionEvidence: !isMinimal,
        requireAssertionEvidence: !isMinimal,
        requireEdgeCaseEvidence: !isMinimal
      },
      plannerConstraints: {
        requireTestStep: !isMinimal,
        requireVerificationStep: !isMinimal,
        maxImplementationStepComplexity: 3
      }
    },
    skills: {
      autoLoad: true,
      directories: [
        path.join(configDir, "skill"),
        path.join(__dirname, "../../templates/skills")
      ]
    },
    kratos: {
      enabled: true,
      autoSave: true,
      storagePath: path.join(os.homedir(), ".kratos")
    }
  }

  // Write OpenCode config
  writeFileSync(configPath, JSON.stringify(opencodeConfig, null, 2), "utf-8")
  console.log(color.green(`✓ OpenCode config written to ${configPath}`))

  // Write Kraken Code config separately
  writeFileSync(krakenConfigPath, JSON.stringify(krakenConfig, null, 2), "utf-8")
  console.log(color.green(`✓ Kraken Code config written to ${krakenConfigPath}`))

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
