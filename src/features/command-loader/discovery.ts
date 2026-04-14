import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import type {
  LoadedCommand,
  ParsedFrontmatter,
  CommandScope,
} from "./types"

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/
const HANDOFF_REGEX = /##\s*Handoffs?\s*\n([\s\S]*?)(?=\n##|$)/i

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) {
    return {}
  }

  const frontmatter = match[1]
  const result: ParsedFrontmatter = {}

  const lines = frontmatter.split("\n")
  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    if (key === "true") {
      result[key] = true
    } else if (key === "false") {
      result[key] = false
    } else if (!isNaN(Number(value))) {
      result[key] = Number(value)
    } else {
      result[key] = value
    }
  }

  return result
}

export function parseHandoffs(content: string): string[] {
  const match = content.match(HANDOFF_REGEX)
  if (!match) {
    return []
  }

  const section = match[1]
  const handoffs: string[] = []

  const lines = section.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("-")) {
      handoffs.push(trimmed.slice(1).trim())
    }
  }

  return handoffs
}

export async function loadCommandsFromDir(
  commandsDir: string,
  scope: CommandScope,
  visited: Set<string> = new Set(),
  prefix: string = ""
): Promise<LoadedCommand[]> {
  const commands: LoadedCommand[] = []

  if (!fs.existsSync(commandsDir)) {
    return commands
  }

  const canonicalPath = path.resolve(commandsDir)
  if (visited.has(canonicalPath)) {
    return commands
  }
  visited.add(canonicalPath)

  try {
    const entries = await fs.promises.readdir(commandsDir, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(commandsDir, entry.name)

      if (entry.isDirectory()) {
        const nestedPrefix = prefix ? `${prefix}:${entry.name}` : entry.name
        const nestedCommands = await loadCommandsFromDir(
          entryPath,
          scope,
          visited,
          nestedPrefix
        )
        commands.push(...nestedCommands)
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        try {
          const content = await fs.promises.readFile(entryPath, "utf-8")
          const frontmatter = parseFrontmatter(content)
          const body = content.replace(FRONTMATTER_REGEX, "").trim()

          const commandName = entry.name.slice(0, -3)
          const fullName = prefix ? `${prefix}:${commandName}` : commandName

          commands.push({
            name: fullName,
            path: entryPath,
            definition: {
              name: fullName,
              description: frontmatter.description || "",
              template: body,
              agent: frontmatter.agent,
              model: frontmatter.model,
              subtask: frontmatter.subtask,
              argumentHint: frontmatter.argumentHint,
            },
            scope,
            prefix,
          })
        } catch (error) {
          console.error(
            `[command-loader] Error loading command from ${entryPath}:`,
            error
          )
        }
      }
    }
  } catch (error) {
    console.error(
      `[command-loader] Error reading commands directory ${commandsDir}:`,
      error
    )
  }

  return commands
}

export function getDefaultCommandPaths(): {
  user: string
  project: string
  opencodeGlobal: string
  opencodeProject: string
} {
  const homeDir = os.homedir()
  return {
    user: path.join(homeDir, ".config", "opencode", "commands"),
    project: path.join(process.cwd(), ".claude", "commands"),
    opencodeGlobal: path.join(homeDir, ".config", "opencode", "commands"),
    opencodeProject: path.join(process.cwd(), ".opencode", "commands"),
  }
}

export function expandEnvironmentVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || ""
  })
}
