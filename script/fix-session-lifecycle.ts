#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const filePath = join(process.cwd(), 'src/hooks/session-lifecycle/index.ts')

// Read the file
let content = readFileSync(filePath, 'utf-8')

// Add logger import after existing imports
const loggerImport = `import { createLogger } from '../../utils/logger'

const loggerCreation = `
const logger = createLogger('session-lifecycle')
`

// Insert after the imports section (after line 2)
const importEndMarker = `import type { Hooks, PluginInput } from '@opencode-ai/plugin'\n`
const insertionIndex = content.indexOf(importEndMarker) + importEndMarker.length
content = content.slice(0, insertionIndex) + loggerImport + loggerCreation + content.slice(insertionIndex)

// Replace all console.log with logger.debug
content = content.replace(/console\.log\(/g, 'logger.debug(')

// Replace all console.warn with logger.warn (but keep critical errors)
content = content.replace(/console\.warn\(/g, 'logger.warn(')

// Write back
writeFileSync(filePath, content, 'utf-8')

console.log('✅ Updated session-lifecycle with logger')
