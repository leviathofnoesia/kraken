import { promises as fs } from "fs"
import { join, dirname } from "path"
import type { SkillMcpConfig } from "./types"

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/
const MCP_CONFIG_REGEX = /^mcp:\s*\n([\s\S]*?)(?=\n---|\n[a-z]|$)/m

export interface ParsedSkillMcp {
  skillName: string
  skillPath: string
  mcpConfig?: SkillMcpConfig
}

export async function parseSkillMcpConfig(
  skillPath: string,
  skillName: string
): Promise<SkillMcpConfig | undefined> {
  const mdPath = join(skillPath, "SKILL.md")

  try {
    const content = await fs.readFile(mdPath, "utf-8")

    const frontmatterMatch = content.match(FRONTMATTER_REGEX)
    if (!frontmatterMatch) {
      return undefined
    }

    const frontmatter = frontmatterMatch[1]

    const mcpMatch = frontmatter.match(MCP_CONFIG_REGEX)
    if (!mcpMatch) {
      return undefined
    }

    const mcpSection = mcpMatch[1]
    const mcpConfig: SkillMcpConfig = {}

    let currentMcp: string | null = null
    const lines = mcpSection.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const indent = lines[i].search(/\S/)

      if (indent === 0 && line.endsWith(":")) {
        currentMcp = line.slice(0, -1)
        mcpConfig[currentMcp] = {
          command: "",
          args: [],
        }
      } else if (currentMcp && mcpConfig[currentMcp]) {
        const keyMatch = line.match(/^(\w+):\s*(.*)$/)
        if (keyMatch) {
          const [, key, value] = keyMatch

          if (key === "command") {
            mcpConfig[currentMcp].command = expandEnvironmentVars(value.trim())
          } else if (key === "args") {
            try {
              mcpConfig[currentMcp].args = JSON.parse(
                expandEnvironmentVars(value.trim())
              )
            } catch {
              mcpConfig[currentMcp].args = [expandEnvironmentVars(value.trim())]
            }
          } else if (key === "env") {
            try {
              mcpConfig[currentMcp].env = JSON.parse(
                expandEnvironmentVars(value.trim())
              )
            } catch {
              // Keep empty env if parsing fails
            }
          }
        }
      }
    }

    return mcpConfig
  } catch (error) {
    console.error(
      `[skill-mcp] Error parsing MCP config from ${mdPath}:`,
      error
    )
    return undefined
  }
}

export function expandEnvironmentVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || ""
  })
}

export async function discoverSkillMcpConfigs(
  skillsDir: string
): Promise<ParsedSkillMcp[]> {
  const results: ParsedSkillMcp[] = []

  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(skillsDir, entry.name)
        const mdPath = join(skillPath, "SKILL.md")

        try {
          await fs.access(mdPath)
          const mcpConfig = await parseSkillMcpConfig(skillPath, entry.name)

          if (mcpConfig && Object.keys(mcpConfig).length > 0) {
            results.push({
              skillName: entry.name,
              skillPath,
              mcpConfig,
            })
          }
        } catch {
          // Skill doesn't have SKILL.md, skip
        }
      }
    }
  } catch (error) {
    console.error(
      `[skill-mcp] Error discovering skill MCP configs in ${skillsDir}:`,
      error
    )
  }

  return results
}

export function validateMcpConfig(config: SkillMcpConfig[string]): boolean {
  if (!config || typeof config !== "object") {
    return false
  }

  if (!config.command || typeof config.command !== "string") {
    return false
  }

  if (!Array.isArray(config.args)) {
    return false
  }

  return true
}
