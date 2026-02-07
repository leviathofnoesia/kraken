/**
 * ESLint Rule: No Unguarded Console Statements in Hooks
 *
 * Prevents TUI leakage by enforcing that all console.log/warn/info
 * statements in hooks must use logger with SHOULD_LOG gating.
 * console.error is allowed for critical errors that must always be visible.
 *
 * @see https://eslint.org/docs/latest/extend-rules
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent TUI leakage from unguarded console statements in hooks',
      category: 'Best Practices',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      'use-logger': 'Replace console.{{method}}() with logger.{{method}}()',
      'unguarded-console': 'Unguarded console statement in hook file - use logger',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    // Check if logger is imported in this file
    const sourceText = sourceCode.getText()
    const hasLoggerImport =
      /import\s+['"][^'"]*logger\b['"]/.test(sourceText) ||
      /import\s+.*\s+from\s+['"][^'"]*logger\b['"]/.test(sourceText) ||
      /require\s*\(\s*['"][^'"]*logger['"]\s*\)/.test(sourceText)

    return {
      MemberExpression(node) {
        // Check if this is console.method
        if (node.object.type === 'Identifier' && node.object.name === 'console') {
          const method = node.property.name

          // console.error is ALWAYS allowed (critical errors must show)
          if (method === 'error') {
            return
          }

          // Only check log/warn/info in hook directories
          const filename = context.filename || ''
          const isHookFile = filename.includes('src/hooks/')

          if (isHookFile && ['log', 'warn', 'info'].includes(method)) {
            // Find the parent call expression
            const callExpression = node.parent
            if (callExpression && callExpression.type === 'CallExpression') {
              // If logger is available, suggest using it
              if (hasLoggerImport) {
                context.report({
                  node: callExpression,
                  messageId: 'use-logger',
                  data: { method },
                  fix: (fixer) => {
                    return fixer.replaceText(node.object, 'logger')
                  },
                })
              } else {
                // Logger not available, suggest importing it
                const hookName = filename.split('/').slice(-2, -1).join('-')
                const loggerImport = `import { createLogger } from '../../utils/logger'\n\n`
                const loggerCreation = `const logger = createLogger('${hookName}')\n\n`

                context.report({
                  node: callExpression,
                  messageId: 'unguarded-console',
                  data: { method },
                  fix: (fixer) => {
                    // Find the last import statement
                    const lastImport = sourceCode.ast.body.findLast(
                      (node) =>
                        node.type === 'ImportDeclaration' ||
                        (node.type === 'ExpressionStatement' &&
                          node.expression.type === 'CallExpression' &&
                          node.expression.callee.type === 'Identifier' &&
                          node.expression.callee.name === 'require'),
                    )

                    if (lastImport) {
                      // Compute safe insertion position
                      const insertPoint =
                        sourceCode.getLastToken(lastImport) || sourceCode.getTokenAfter(lastImport)
                      if (insertPoint) {
                        return [
                          fixer.insertTextAfter(insertPoint, `${loggerImport}${loggerCreation}`),
                          fixer.replaceText(node.object, 'logger'),
                        ]
                      }
                    }

                    // Fallback: insert after lastImport.range[1] or at file top
                    const insertPosition = lastImport ? lastImport.range[1] : 0
                    return [
                      fixer.insertTextBeforeRange(
                        [insertPosition, insertPosition],
                        `${loggerImport}${loggerCreation}`,
                      ),
                      fixer.replaceText(node.object, 'logger'),
                    ]
                  },
                })
              }
            }
          }
        }
      },
    }
  },
}

module.exports = {
  rules: {
    'no-unguarded-console-in-hooks': rule,
  },
}
