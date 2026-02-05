import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface Skill {
  name: string
  description: string
  instructions: string
}

export class SkillLoader {
  private skills: Map<string, Skill> = new Map()
  private builtinSkillsPath: string

  constructor(builtinSkillsPath: string) {
    this.builtinSkillsPath = builtinSkillsPath
  }

  loadSkills(): Skill[] {
    if (!existsSync(this.builtinSkillsPath)) {
      console.warn(`Skills directory not found: ${this.builtinSkillsPath}`)
      return []
    }

    const entries = readdirSync(this.builtinSkillsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(this.builtinSkillsPath, entry.name)
        const mdPath = join(skillPath, 'SKILL.md')

        if (existsSync(mdPath)) {
          const content = readFileSync(mdPath, 'utf-8')
          this.skills.set(entry.name, {
            name: entry.name,
            description: `Skill loaded from ${entry.name}`,
            instructions: content,
          })
        }
      }
    }

    return Array.from(this.skills.values())
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name)
  }
}

export const skillLoader = new SkillLoader(join(__dirname, '../builtin-skills'))

let isInitialized = false

export async function initializeSkillLoader(): Promise<SkillLoader> {
  if (!isInitialized) {
    skillLoader.loadSkills()
    isInitialized = true
  }
  return skillLoader
}

export async function getSkills(): Promise<Skill[]> {
  const loader = await initializeSkillLoader()
  return loader.loadSkills()
}

export async function getSkillContent(name: string): Promise<string | null> {
  const loader = await initializeSkillLoader()
  const skill = loader.getSkill(name)
  return skill?.instructions ?? null
}
