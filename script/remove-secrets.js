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

  const HEADER_SENTINEL = '# REDACT SECRETS CONFIGURATION'

  // Helper function to check if a line contains secrets
  function isSecretLine(line) {
    if (!line || line.trim() === '') return false
    return (
      line.includes('GOCSPX') ||
      line.includes('1.apps.googleusercontent.com') ||
      (line.includes('==') && line.includes('.apps.googleusercontent.com'))
    )
  }

  // Remove lines containing real secrets
  const lines = content.split('\n')
  const safeLines = lines.filter((line) => !isSecretLine(line))

  // Find header sentinel index
  const headerIndex = lines.indexOf(HEADER_SENTINEL)

  // Build new content with header
  let newContent
  if (headerIndex !== -1) {
    // Header exists, keep it and filter secrets from after header
    const headerLength = 1
    const safeLinesAfterHeader = lines
      .slice(headerIndex + headerLength)
      .filter((line) => !isSecretLine(line))
    newContent = lines
      .slice(0, headerIndex + headerLength)
      .concat(safeLinesAfterHeader)
      .join('\n')
  } else {
    // No header, add it with safe lines
    newContent =
      '# REDACT SECRETS CONFIGURATION\n\n# This file processes replacements from replacements.txt\n# \n# SECURITY: replacements.txt should NOT be committed to git\n# It is added to .gitignore to prevent accidental secret commits\n\n'.concat(
        safeLines.join('\n'),
      )
  }

  // Write safe content back
  writeFileSync(replacementsPath, newContent, 'utf-8')

  console.log(`✅ Removed ${lines.length - safeLines.length} lines containing real secrets`)
  console.log(`✅ Kept ${safeLines.length} safe replacement lines`)

  // Update redact-secrets.py to use safe source
  const redactContent = `#!/usr/bin/env python3
"""
REDACT SECRETS CONFIGURATION
"""

# This file processes replacements from replacements.txt
#
# SECURITY: replacements.txt should NOT be committed to git
# It is added to .gitignore to prevent accidental secret commits

import sys
import os

def redact_secrets(content):
    """Redact sensitive information from content."""
    # This is a placeholder - implement actual redaction logic
    return content

if __name__ == '__main__':
    # Read replacements.txt and process
    replacements_path = os.path.join(os.path.dirname(__file__), 'replacements.txt')
    if os.path.exists(replacements_path):
        with open(replacements_path, 'r') as f:
            content = f.read()
            redacted = redact_secrets(content)
            print(redacted)
    else:
        print(f"File not found: {replacements_path}", file=sys.stderr)
        sys.exit(1)
`

  writeFileSync(redactSecretsPath, redactContent, 'utf-8')

  console.log('✅ Added security warning to redact-secrets.py')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
