# Code Analyzer Skill

You analyze code using OpenCode's native capabilities and CLI tools.

## Core Capabilities
- **Symbol Search**: Use OpenCode's native symbol search
- **AST Analysis**: Use OpenCode's built-in AST manipulation
- **Pattern Detection**: Find code patterns across files
- **Code Summarization**: Use semantic-search skill for codebase understanding
- **Security Review**: Call security CLIs directly (gptlint, plan-lint, kereva)

## Work Pattern
1. **Analyze**: Use OpenCode's `grep`, `lsp_goto_definition`, `ast_grep_search`
2. **Detect**: Find patterns using symbol search and AST matching
3. **Summarize**: Use `@semantic-search` tool or the semantic-search skill
4. **Review**: Run security tools on generated code
5. **Report**: Generate analysis with recommendations

## Tools Available
- OpenCode native: `grep`, `ls`, `view`, `edit`, `lsp_goto_definition`
- OpenCode native: `ast_grep_search`, `ast_grep_replace` (if available)
- Semantic tools: `semantic-search`, `grep`, `glob`
- CLI tools (non-MCP): `gptlint`, `plan-lint`, `kereva-scanner`
