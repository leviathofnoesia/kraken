#!/usr/bin/env bun
import { execSync } from 'node:child_process'

export interface CiReviewOptions {
  format?: 'markdown' | 'json'
  base?: string
  head?: string
}

interface ChangeSummary {
  filesChanged: number
  insertions: number
  deletions: number
  fileList: string[]
}

function runGitDiffStat(base: string, head: string): string {
  return execSync(`git diff --shortstat ${base}...${head}`, { encoding: 'utf-8' }).trim()
}

function runGitChangedFiles(base: string, head: string): string[] {
  const output = execSync(`git diff --name-only ${base}...${head}`, { encoding: 'utf-8' }).trim()
  if (!output) return []
  return output.split('\n').map((x) => x.trim()).filter(Boolean)
}

export function parseDiffStat(statLine: string, fileList: string[]): ChangeSummary {
  const files = Number(statLine.match(/(\d+)\s+files?\s+changed/)?.[1] || fileList.length || 0)
  const insertions = Number(statLine.match(/(\d+)\s+insertions?\(\+\)/)?.[1] || 0)
  const deletions = Number(statLine.match(/(\d+)\s+deletions?\(-\)/)?.[1] || 0)
  return {
    filesChanged: files,
    insertions,
    deletions,
    fileList,
  }
}

export function formatCiReviewMarkdown(base: string, head: string, summary: ChangeSummary): string {
  const files = summary.fileList.length
    ? summary.fileList.map((f) => `- \`${f}\``).join('\n')
    : '- No file changes detected'

  return [
    '# Kraken CI Review Summary',
    '',
    `- Base: \`${base}\``,
    `- Head: \`${head}\``,
    `- Files changed: **${summary.filesChanged}**`,
    `- Insertions: **${summary.insertions}**`,
    `- Deletions: **${summary.deletions}**`,
    '',
    '## Changed Files',
    files,
    '',
    '## Recommended Next Step',
    '- Run `kraken-code doctor --target ci --strict` in CI before merging.',
  ].join('\n')
}

export async function runCiReview(options: CiReviewOptions = {}): Promise<void> {
  const base = options.base ?? 'origin/main'
  const head = options.head ?? 'HEAD'
  const format = options.format ?? 'markdown'

  const statLine = runGitDiffStat(base, head)
  const files = runGitChangedFiles(base, head)
  const summary = parseDiffStat(statLine, files)

  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          base,
          head,
          summary,
        },
        null,
        2,
      ),
    )
    return
  }

  console.log(formatCiReviewMarkdown(base, head, summary))
}
