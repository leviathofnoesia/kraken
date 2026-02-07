# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Build & Test Commands

### Core Commands

- `bun run build` - Build the project (compiles TypeScript to dist/)
- `bun run clean` - Remove dist/ directory
- `bun run typecheck` - Run TypeScript type checking without emitting
- `bun test` - Run all tests

### Running Single Tests

```bash
bun test test/agents/nautilus.test.ts  # Run specific test file
bun test test/agents/                   # Run all tests in a directory
bun test -t "should export"             # Run with filter
```

- `bun install` - Install dependencies
- `bun run dev` - Start development server

## File Editing Rules

**CRITICAL**: The Edit tool requires a fresh Read before every edit operation, even if you previously read the file in the same conversation.

- **Always read immediately before editing**: Use `@read` on the target file right before calling `@edit`
- **No exceptions**: Even if you read the file 2 messages ago, read it again before editing
- **This is enforced**: The tool will error with "You must read file ... before overwriting it" if violated

Example correct workflow:

```
1. @read src/file.ts
2. @edit src/file.ts (change A)
3. @read src/file.ts    ← Must read again
4. @edit src/file.ts (change B)
```

## Code Style Guidelines

### Imports & Organization

```typescript
// Type imports first (use 'type' keyword)
import type { AgentConfig } from '@opencode-ai/sdk'
import type { AgentPromptMetadata } from '../types'

// External dependencies
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

// Local modules
import { createAgentToolRestrictions } from '../shared/permission-compat'
```

Blank lines between import groups. No unused imports.

### TypeScript Configuration

- Strict mode enabled - all code must type-check
- Use `zod` for runtime validation of inputs
- Define types in `types.ts` or adjacent to implementation
- Prefer `interface` for object shapes, `type` for unions/primitives

### Naming Conventions

- camelCase: variables, functions, methods (`getAvailableAgents`, `backgroundTask`)
- PascalCase: types, interfaces, classes, exported factories (`AgentConfig`, `BackgroundManager`)
- UPPER_SNAKE_CASE: constants, enum values (`DEFAULT_MODEL`, "FREE")
- Descriptive names indicating purpose (`createCallAgentTool`, `session_search`)
- Agent names: PascalCase ("Nautilus", "Abyssal")

### Error Handling

```typescript
try {
  const data = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(data) as RalphLoopState
} catch (error) {
  console.error(`[storage] Error reading state for session ${sessionID}:`, error)
  return null
}
async function runGrep(...): Promise<{ success: boolean; matches?: GrepMatch[]; error?: string }>
```

### Testing (bun:test)

```typescript
import { describe, it, expect } from 'bun:test'

describe('Feature Name', () => {
  it('should do something', () => {
    expect(result).toBeDefined()
    expect(result.name).toBe('Nautilus')
  })
})
```

- Test files: `*.test.ts` in `test/` mirroring `src/` structure
- Group tests with `describe` blocks, test happy paths and error cases

### Code Formatting

- 2-space indentation (no tabs)
- Prefer arrow functions: `const x = () => {}`
- Template literals for multi-line strings and interpolation
- Minimal comments - code should be self-documenting
- JSDoc comments only for exported functions/complex types

### File Organization

- `index.ts` - Barrel exports: `export * from "./module"`
- `types.ts` - Shared type definitions
- Feature-based: `agents/`, `tools/`, `hooks/`, `features/`
- Constants at top of files: `const DEFAULT_MODEL = "opencode/grok-code"`

### Tool Pattern (@opencode-ai/plugin)

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"

export const myTool = tool({
  description: "Clear description of what this tool does",
  args: {
    pattern: z.string().min(1).describe("Parameter description"),
    options: z.object({ ... }).optional()
  },
  async execute(args) {
    return JSON.stringify(result)
  }
})
```

### Agent Pattern

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"

const DEFAULT_MODEL = "opencode/grok-code"

const METADATA: AgentPromptMetadata = {
  category: "exploration", cost: "FREE", triggers: [...], useWhen: [...], avoidWhen: [...]
}

const SYSTEM_PROMPT = \`You are...\`

export function createNautilusConfig(model = DEFAULT_MODEL): AgentConfig {
  return { name: "Nautilus", description: "Brief description", prompt: SYSTEM_PROMPT, model }
}

export const nautilusAgent = createNautilusConfig()
```

### Zod Validation

```typescript
export const AgentNameSchema = z.enum(["Nautilus", "Abyssal", ...])
export const ConfigSchema = z.object({
  enabled: z.boolean().default(true), model: z.string().optional(),
  settings: z.record(z.string(), z.any()).optional()
})
```

### Async Patterns

```typescript
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
async function runCommand() {
  const { stdout, stderr } = await execFileAsync('python3', ['script.py'], { timeout: 30000 })
}
```

## Testing Requirements

Always run these before committing:

```bash
bun run typecheck  # Must pass with no errors
bun test           # All tests must pass
bun run build      # Must build successfully
```

## Important Notes

- This is a Bun-based project (Node.js runtime)
- No linter configured - use TypeScript strict mode for validation
- Build target: ESNext for Node.js
- Plugin system: Uses @opencode-ai/plugin and @opencode-ai/sdk
- All code must be ES modules (type: "module" in package.json)

<!-- BEGIN SKILL-COMPILER MANAGED SECTION -->
<!-- DO NOT EDIT THIS SECTION MANUALLY - Generated by skill-compiler -->

## Framework Documentation Indexes

[Zod Docs Index]|root: ./.agent-docs/zod
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for Zod tasks.

[Hono Docs Index]|root: ./.agent-docs/hono
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for Hono tasks.
|{CODE_OF_CONDUCT.md}
|{CONTRIBUTING.md}
|{MIGRATION.md}

<!-- END SKILL-COMPILER MANAGED SECTION -->
