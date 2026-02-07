/**
 * ESLint Rule: No Unguarded Console Statements
 *
 * Prevents TUI leakage by enforcing that all console.log/warn/info
 * statements in hooks must use the logger with SHOULD_LOG gating.
 * console.error is allowed for critical errors that must always be visible.
 */

const { ESLint } = require('eslint')

// Paths that should use gated logging
const HOOK_DIRECTORIES = ['src/hooks/**']

// Paths that should never use console statements at all
const FORBIDDEN_CONSOLE_PATHS = [
  // These are tool files or config files that may need console for debugging
  'src/tools/**',
  'src/features/**',
  'src/config/**',
]

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent TUI leakage from unguarded console statements',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: Array,
  },
  create(context) {
    return {
      // Target all TypeScript files
      files: ['**/*.ts'],

      // Ignore test files
      ignorePatterns: ['**/*.test.ts', '**/test/**', '**/node_modules/**'],

      // Main rule: No unguarded console statements in hooks
      rules: [
        {
          // Match console.log/warn/info calls in hook directories
          meta: {
            type: 'suggestion',
            docs: 'https://github.com/leviathofnoesia/kraken-code/issues',
          },
          test: (node) => {
            const filename = node.filename || ''

            // Only check hook files
            const isHookFile = HOOK_DIRECTORIES.some((dir) =>
              filename.includes(dir.replace('src/', '')),
            )

            // Skip non-hook files that may legitimately use console
            const isAllowedPath = FORBIDDEN_CONSOLE_PATHS.some((dir) =>
              filename.includes(dir.replace('src/', '')),
            )

            // console.error is ALWAYS allowed (critical errors)
            const isConsoleError =
              node.callee.name === 'console' && node.parent.property?.name === 'error'

            if (isHookFile && !isAllowedPath && !isConsoleError) {
              // Check if there's a logger import
              const hasLoggerImport =
                context.sourceCode?.text?.includes('createLogger') ||
                context.sourceCode?.text?.includes('import { Logger }') ||
                context.sourceCode?.text?.includes('from.*logger')

              if (hasLoggerImport) {
                // Unguarded console.log/warn/info found but logger is available
                context.report({
                  node,
                  messageId: 'unguarded-console',
                  fix: `Replace with logger.${node.parent.property?.name}()`,
                })
              } else if (node.callee.name === 'console' && !isConsoleError) {
                // console.error used for non-critical case
                context.report({
                  node,
                  messageId: 'non-critical-console-error',
                  fix: `Use logger.error() for critical errors only, or add logger import and use logger.${node.parent.property?.name}()`,
                })
              }
            }
          },
        },
      ],
    }
  },
}

module.exports = rule
