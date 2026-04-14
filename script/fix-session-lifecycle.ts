#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const filePath = join(process.cwd(), 'src/hooks/session-lifecycle/index.ts')

// Read the file
let content = readFileSync(filePath, 'utf-8')

// Add logger import after existing imports
const loggerImport = `import { createLogger } from '../../utils/logger'\n\n`

const loggerCreation = `const logger = createLogger('session-lifecycle')\n\n`

// Insert after the imports section (after line 2)
const importEndMarker = `import type { Hooks, PluginInput } from '@opencode-ai/plugin'\n`
const idx = content.indexOf(importEndMarker)

if (idx === -1) {
  throw new Error('Import end marker not found in file')
}

// Check if logger already exists to make this idempotent
if (content.includes(loggerImport.trim()) || content.includes(loggerCreation.trim())) {
  console.log('✅ Logger already exists, skipping insertion')
} else {
  const insertionIndex = idx + importEndMarker.length
  content =
    content.slice(0, insertionIndex) + loggerImport + loggerCreation + content.slice(insertionIndex)
}

// Replace all console.log with logger.debug
content = content.replace(/console\.log\(/g, 'logger.debug(')

// Replace all console.warn with logger.warn (but keep critical errors)
content = content.replace(/console\.warn\(/g, 'logger.warn(')

// Write back
writeFileSync(filePath, content, 'utf-8')

console.log('✅ Updated session-lifecycle with logger')
