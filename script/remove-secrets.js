#!/usr/bin/env node
/**
 * Security Fix: Remove secrets from replacements.txt and redact-secrets.py
 *
 * CRITICAL: replacements.txt contains real Google OAuth client credentials
 * This script removes all secrets and creates safe replacements
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const replacementsPath = join(process.cwd(), 'replacements.txt')
const redactSecretsPath = join(process.cwd(), 'redact-secrets.py')

console.log('🔒 Removing secrets from replacements.txt...')

try {
  // Read current replacements.txt
  let content = readFileSync(replacementsPath, 'utf-8')

  // Check if file already has header
  const hasHeader = content.trim().startsWith('#!')

  // Remove lines containing real secrets
  const lines = content.split('\n')
  const safeLines = lines.filter((line) => {
    // Skip lines with real secrets
    if (!line || line.trim() === '') return true
    const lower = line.toLowerCase()

    // Skip if contains real secrets
    const hasRealSecret =
      line.includes('GOCSPX') ||
      line.includes('1.apps.googleusercontent.com') ||
      (line.includes('==') && line.includes('.apps.googleusercontent.com'))

    return !hasRealSecret
  })

  // Build new content with header only once
  let newContent
  if (hasHeader) {
    // Keep existing header, append safe lines
    newContent = lines.slice(0, 2).concat(safeLines).join('\n')
  } else {
    // Add header first, then safe lines
    newContent =
      '#!/usr/bin/env python3\n\nREDACT SECRETS CONFIGURATION\n\n# This file processes replacements from replacements.txt\n# \n# SECURITY: replacements.txt should NOT be committed to git\n# It is added to .gitignore to prevent accidental secret commits\n\n'.concat(
        safeLines.join('\n'),
      )
  }

  // Write safe content back
  writeFileSync(replacementsPath, newContent, 'utf-8')

  console.log(`✅ Removed ${lines.length - safeLines.length} lines containing real secrets`)
  console.log(`✅ Kept ${safeLines.length} safe replacement lines`)

  // Update redact-secrets.py to use safe source
  let redactContent = readFileSync(redactSecretsPath, 'utf-8')

  // Add comment about not committing replacements.txt
  redactContent = `#!/usr/bin/env python3
"""
REDACT SECRETS CONFIGURATION
"""

# This file processes replacements from replacements.txt
# 
# SECURITY: replacements.txt should NOT be committed to git
# It is added to .gitignore to prevent accidental secret commits

${redactContent.split('\n').slice(7).join('\n')}`

  writeFileSync(redactSecretsPath, redactContent, 'utf-8')

  console.log('✅ Added security warning to redact-secrets.py')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
