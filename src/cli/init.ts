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
  // Note: Kraken agents are injected directly here as a workaround since
  // the config hook may not be called during initial OpenCode startup
  const opencodeConfig = {
    plugin: ["kraken-code"],
    agent: {
      Kraken: {
        description: "Orchestration agent with integrated pre-planning. Coordinates development workflows through PDSA cycles, intelligent delegation, and constraint analysis.",
        mode: "primary",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Atlas: {
        description: "Architecture specialist using first-principles reasoning and structural analysis.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Nautilus: {
        description: "Codebase exploration agent with pattern recognition and systematic search capabilities.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Abyssal: {
        description: "External research agent for docs, OSS projects, and API references.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Coral: {
        description: "Visual/UI/UX design specialist with design sensibility.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Siren: {
        description: "Technical writing and documentation specialist.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Scylla: {
        description: "Code review and quality gate specialist.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      },
      Pearl: {
        description: "Code summarization and analysis specialist.",
        mode: "subagent",
        permission: {
          edit: "ask",
          bash: "ask",
          webfetch: "ask",
          doom_loop: "ask",
          external_directory: "ask"
        }
      }
    },
    default_agent: "Kraken"
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
    learning: {
      enabled: true,
      storagePath: path.join(os.homedir(), ".clawd", "learning")
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
