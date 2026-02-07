#!/usr/bin/env node

/**
 * Pre-commit hook to prevent TUI leakage
 * Blocks commits that have unguarded console statements in hooks
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read package.json to get eslint script name
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
const eslintScript = pkg.scripts?.lint || 'eslint'

console.log('🔍 Checking for unguarded console statements in hooks...')

// Run ESLint with the no-unguarded-console config
const result = spawnSync(
  'eslint',
  ['--config', '.eslintrc.no-unguarded-console.js', '--no-ignore', 'src/hooks/**/*.ts'],
  { encoding: 'utf-8', stdio: 'pipe' },
)

// Parse output for violations
const output = result.stdout || result.stderr || ''

// Check if there are any violations
const hasUnguardedConsole =
  output.includes('unguarded-console') || output.includes('non-critical-console-error')

if (hasUnguardedConsole) {
  console.error('❌ Pre-commit hook FAILED')
  console.error('')
  console.error('Found unguarded console statements in hooks that would cause TUI leakage:')
  console.error('')
  console.error(output)
  console.error('')
  console.error('Please fix by:')
  console.error('  1. Import logger: import { createLogger } from "../../utils/logger"')
  console.error('  2. Create instance: const logger = createLogger("hook-name")')
  console.error('  3. Replace console.log/warn/info with logger.debug/info/warn')
  console.error('   4. Keep console.error for critical errors only')
  console.error('')
  console.error('Then commit again.')
  process.exit(1)
}

// Check for ESLint errors
if (result.status !== 0 && result.status !== null) {
  console.error('❌ Pre-commit hook error: ESLint failed with status', result.status)
  if (output) {
    console.error(output)
  }
  process.exit(1)
}

console.log('✅ No unguarded console statements found')
