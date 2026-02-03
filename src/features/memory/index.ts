/**
 * Memory Integration
 *
 * Provides a native, on-disk memory system for Kraken Code.
 * Entries are stored as QMD-style markdown files with YAML frontmatter.
 */

import { promises as fs } from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { load as loadYaml, dump as dumpYaml } from "js-yaml"

import { getKratosConfig, getMemoryConfig } from "../../config/manager"

export interface MemoryProvider {
  name: string
}

export type MemoryImportance = "low" | "medium" | "high"

export interface MemoryEntryInput {
  summary: string
  content: string
  tags?: string[]
  importance?: MemoryImportance
  paths?: string[]
}

export interface MemoryEntry extends MemoryEntryInput {
  id: string
  createdAt: string
  updatedAt: string
  sourcePath?: string
}

export interface MemoryConfig {
  enabled?: boolean
  autoSave?: boolean
  storagePath?: string
}

const DEFAULT_STORAGE_PATH = path.join(os.homedir(), ".kraken", "memory")
let memoryEntries: MemoryEntry[] = []

export class NativeMemory implements MemoryProvider {
  name = "Native"

  async store(key: string, value: any): Promise<void> {
    await saveMemory({
      summary: key,
      content: JSON.stringify(value, null, 2),
    })
  }

  async retrieve(key: string): Promise<any> {
    const matches = await searchMemories(key)
    return matches[0] ?? null
  }
}

export const memory = {
  native: new NativeMemory()
}

export async function initializeMemory(): Promise<{ ready: boolean; loaded: number }> {
  const config = getResolvedMemoryConfig()
  if (config.enabled === false) {
    return { ready: false, loaded: 0 }
  }

  const storageDir = resolveStoragePath(config.storagePath)
  await ensureDirectory(storageDir)
  memoryEntries = await loadEntriesFromDisk(storageDir)
  return { ready: true, loaded: memoryEntries.length }
}

export async function saveMemory(input: MemoryEntryInput): Promise<MemoryEntry> {
  const config = getResolvedMemoryConfig()
  const storageDir = resolveStoragePath(config.storagePath)
  await ensureDirectory(storageDir)

  const now = new Date().toISOString()
  const entry: MemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    tags: input.tags ?? [],
    importance: input.importance ?? "medium",
    summary: input.summary,
    content: input.content,
    paths: input.paths ?? [],
  }

  if (config.enabled === false) {
    return entry
  }

  memoryEntries.push(entry)

  if (config.autoSave !== false) {
    await persistEntry(entry, storageDir)
  }

  return entry
}

export async function searchMemories(query: string): Promise<MemoryEntry[]> {
  const normalizedQuery = query.toLowerCase()

  return memoryEntries.filter((entry) => {
    const tags = entry.tags?.join(" ").toLowerCase() ?? ""
    const paths = entry.paths?.join(" ").toLowerCase() ?? ""
    return (
      entry.summary.toLowerCase().includes(normalizedQuery) ||
      entry.content.toLowerCase().includes(normalizedQuery) ||
      tags.includes(normalizedQuery) ||
      paths.includes(normalizedQuery)
    )
  })
}

export function listMemories(): MemoryEntry[] {
  return [...memoryEntries]
}

function getResolvedMemoryConfig(): MemoryConfig {
  const memoryConfig = getMemoryConfig() ?? {}
  if (Object.keys(memoryConfig).length > 0) {
    return memoryConfig
  }
  const kratosConfig = getKratosConfig()
  return {
    enabled: kratosConfig?.enabled,
    autoSave: kratosConfig?.autoSave,
    storagePath: kratosConfig?.storagePath,
  }
}

function resolveStoragePath(storagePath?: string): string {
  if (!storagePath) {
    return DEFAULT_STORAGE_PATH
  }
  if (storagePath.startsWith("~/")) {
    return path.join(os.homedir(), storagePath.slice(2))
  }
  return storagePath
}

async function ensureDirectory(storageDir: string): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true })
}

async function loadEntriesFromDisk(storageDir: string): Promise<MemoryEntry[]> {
  const entries: MemoryEntry[] = []
  let files: string[] = []

  try {
    files = await fs.readdir(storageDir)
  } catch {
    return entries
  }

  const markdownFiles = files.filter((file) => file.endsWith(".md"))
  for (const file of markdownFiles) {
    const filePath = path.join(storageDir, file)
    try {
      const content = await fs.readFile(filePath, "utf-8")
      const parsed = parseQmd(content)
      if (parsed) {
        entries.push({
          ...parsed,
          sourcePath: filePath,
        })
      }
    } catch (error) {
      console.error(`[memory] Failed to load memory file ${filePath}:`, error)
    }
  }

  return entries
}

async function persistEntry(entry: MemoryEntry, storageDir: string): Promise<void> {
  const fileName = `${entry.id}.md`
  const filePath = path.join(storageDir, fileName)
  const serialized = serializeQmd(entry)
  await fs.writeFile(filePath, serialized, "utf-8")
}

function parseQmd(content: string): MemoryEntry | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return null
  }

  const frontmatter = loadYaml(match[1]) as Record<string, any>
  const body = match[2].trim()

  if (!frontmatter?.id || !frontmatter?.summary) {
    return null
  }

  return {
    id: String(frontmatter.id),
    summary: String(frontmatter.summary),
    content: body,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    importance: (frontmatter.importance as MemoryImportance) ?? "medium",
    paths: Array.isArray(frontmatter.paths) ? frontmatter.paths.map(String) : [],
    createdAt: frontmatter.createdAt ? String(frontmatter.createdAt) : new Date().toISOString(),
    updatedAt: frontmatter.updatedAt ? String(frontmatter.updatedAt) : new Date().toISOString(),
  }
}

function serializeQmd(entry: MemoryEntry): string {
  const frontmatter = dumpYaml({
    id: entry.id,
    summary: entry.summary,
    tags: entry.tags ?? [],
    importance: entry.importance ?? "medium",
    paths: entry.paths ?? [],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }).trim()

  return `---\n${frontmatter}\n---\n\n${entry.content}\n`
}
