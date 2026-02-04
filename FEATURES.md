# Kraken-Code: Features Overview

## Overview

| Aspect | Kraken-Code |
|--------|-------------|
| **Version** | 1.1.4 |
| **Author** | LeviathofNoesia |
| **Type** | Unified OpenCode Plugin |
| **License** | MIT |
| **Philosophy** | "Unified plugin with high-density agents" - Feature completeness, modular architecture |

---

## Architecture

**Core Philosophy**: Feature completeness, modular architecture, comprehensive tooling

**Key Architectural Decisions**:
- 11 sea-themed agents with clear specialization boundaries
- Modular feature system (skills, commands, MCP, memory)
- Native integrations with full SDK implementations
- Comprehensive hook system (30+ hooks)
- Blitzkrieg TDD enforcement system
- Schema-based configuration with Zod validation

---

## Agent System

| Agent | Purpose | Description |
|--------|---------|-------------|
| **Kraken** | Architecture & Orchestration | Primary agent for complex architectural decisions and multi-agent coordination |
| **Atlas** | Planning & Breakdown | Expert at breaking down complex tasks into manageable steps |
| **Nautilus** | Shell & Infrastructure | Shell scripts, CI/CD, infrastructure as code |
| **Abyssal** | Deep Analysis | Deep code analysis, debugging, problem investigation |
| **Coral** | Building & Construction | Building new features and components |
| **Siren** | Communication & Documentation | API docs, README files, user-facing content |
| **Scylla** | Testing & Validation | Creates comprehensive tests and validates implementations |
| **Pearl** | Refactoring & Optimization | Improves code quality, performance, and maintainability |
| **Poseidon** | Data & Infrastructure | Databases, data pipelines, infrastructure management |
| **Leviathan** | Large-Scale Projects | Large-scale refactoring and project-wide changes |

**Characteristics**:
- Manual selection or configurable default (Kraken)
- Sea-themed naming for memorable organization
- Broader coverage (from planning to infrastructure to data)
- User-configured model selection per agent

---

## Tool System

**Core Tools**:
- `grep` - Custom grep with advanced filtering
- `ast-grep` - AST-based code search and modification
- `compression` - Context compression for efficiency
- `glob` - Pattern-based file search
- `session_list`, `session_read`, `session_search`, `session_info` - Session management

**Model Switcher**:
- `model-switcher` - Interactive model selection menu
- Command generation for different models
- Config manager for model preferences

**Ralph Loop**:
- `ralph-loop` - Self-referential development loop with state persistence

**Native Memory Tools**:
- `memory_save` - Save memories with tags and importance
- `memory_search` - Search memories by query or tags
- `memory_get_recent` - Get recent memories
- `memory_ask` - Natural language queries

**MCP Tools** (curated):
- `websearch` - Web search (Exa AI)
- `webfetch` - Web page fetching
- `context7-search` - Official documentation lookup
- `context7-get` - Get specific documentation
- `grep-search` - GitHub code search (grep.app)
- `grep-get-file` - Get file from GitHub

**CLI Tools**:
- Native integrations with GitHub SDK, Git SDK
- PR/Issue management

---

## Feature System

**Blitzkrieg System** (4 components):
- **Test Plan Enforcer**: Requires test plans before implementation
- **TDD Workflow**: Enforces test-first development
- **Evidence Verifier**: Validates test evidence before task completion
- **Planner Constraints**: Enforces planning discipline and complexity limits

**Skills System**:
- Dynamic skill discovery
- Hot reloading
- Rich UI for skill display and selection
- Template support
- Built-in skill templates (10 categories)

**Commands System**:
- Command registry
- Execution engine
- Built-in commands
- Custom commands support

**Memory Integration**:
- Native memory system with persistent storage
- Obsidian MCP (optional)
- Memory search and retrieval
- Natural language queries

**Context Management**:
- DCP (Dynamic Context Pruning) engine
- Context window monitor
- Intelligent compression (70% token reduction)

**Native Integrations**:
- GitHub SDK
- Git SDK
- PR/Issue SDK

**Background Agents**:
- Background task system with hooks

**30+ Hooks**:
- Context management hooks
- Agent coordination hooks
- Error recovery hooks
- Performance hooks
- Communication hooks

---

## MCP Integration

**Built-in MCPs**:
- **websearch** - Exa AI (real-time web search)
- **context7** - Official documentation lookup
- **grep_app** - GitHub code search (grep.app)
- **memory** - Native memory system

**Native Memory Implementation**:
- Local persistence
- Request/response handling with timeouts
- 4 tools: memory_save, memory_search, memory_get_recent, memory_ask

---

## Authentication

**Supported Providers**:
- **Anthropic (Claude)**: Via `src/google-auth.ts`
- **Google Gemini**: Via `src/google-auth.ts`

**Google Auth Module**:
- `src/google-auth.ts` - Google authentication for gemini models

---

## Configuration

**Config Location**:
- `~/.config/opencode/opencode.json` (user)

**Schema Validation**:
- Zod schema validation
- Generated schema: `assets/kraken-code.schema.json`

**Key Config Sections**:
- `agents` - Agent configuration
- `blitzkrieg` - Blitzkrieg TDD enforcement
- `memory` - Memory config
- `mcp` - MCP server config
- `modes` - Special mode configurations (ultrawork, search, analyze, ultrathink)
- `skillMcp` - Skill MCP server config
  - `compression` - Context compression
  - `enhanced` - Enhanced mode

**Schema Autocomplete**:
```json
{
  "$schema": "https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/assets/kraken-code.schema.json"
}
```

---

## Loaders

**Skill Loader**:
```typescript
export class SkillLoader {
  loadSkills(): Skill[]
  getSkill(name: string): Skill | undefined
}
```

- Uses `SKILL.md` files
- Hardcoded path: `../builtin-skills` (not actually used)
- Skills installed via CLI to `~/.config/opencode/skill/`

**Data Storage**:
- Memory storage: `~/.kraken/memory`

---

## Hooks System

**Hook Events** (from plugin interface):
- PreToolUse - Before tool execution
- PostToolUse - After tool execution
- UserPromptSubmit - When user submits prompt
- Stop - When session goes idle
- tool, auth - Additional events

**Hooks Implemented** (31+):

**Core Hooks**:
1. Think Mode
2. Context Window Monitor
3. Ralph Loop
4. Keyword Detector
5. Auto Slash Command
6. Rules Injector
7. Agent Usage Reminder
8. Auto Update Checker

**Context Management**:
8. Anthropic Context Window Limit Recovery
9. Auto Update Checker
10. Claude Code Hooks
11. Compaction Context Injector
12. Directory Agents Injector
13. Directory README Injector
14. Edit Error Recovery
15. Empty Message Sanitizer
16. Empty Task Response Detector
17. Grep Output Truncator
18. Interactive Bash Session
19. Non-Interactive Env
20. Preemptive Compaction
21. Session Recovery
22. Thinking Block Validator
23. Tool Output Truncator

**Comment Checking**:
24. Comment Checker

**Blitzkrieg Hooks**:
25. Blitzkrieg Test Plan Enforcer
26. Blitzkrieg TDD Workflow
27. Blitzkrieg Evidence Verifier
28. Blitzkrieg Planner Constraints

**Additional**:
29. Background Agent
30. CLI Tools

---

## CLI Commands

**CLI Tool**: `kraken-code`

**Commands**:
- `install` - Install and register Kraken Code plugin
- `init [options]` - Initialize with recommended configuration
  - `--minimal` - Minimal setup (agents only)
  - `--full` - Full setup (all features)
- `status` - Show installation status
- `doctor [options]` - Run system checks
  - `-c, --category <category>` - Run checks for specific category
  - `--json` - Output as JSON
  - `-v, --verbose` - Show detailed output

**Initialization Process**:
1. Creates `~/.config/opencode/opencode.json`
2. Configures agents, blitzkrieg, skills, memory
3. Installs skill templates to `~/.config/opencode/skill/`
4. Creates memory storage directory

---

## Philosophy & Usage

**Philosophy**:
- "Unified plugin with high-density agents"
- Feature completeness over raw performance
- Modular architecture
- TDD and testing discipline
- Sea-themed agent organization
- Persistent memory across sessions

**Usage**:
- Sea-themed agents with clear specialization
- Blitzkrieg for TDD enforcement
- Skills for custom workflows
- Native memory for persistent context

**Target Audience**:
- Users wanting comprehensive feature set
- Teams wanting TDD enforcement
- Projects requiring persistent memory
- Users preferring structured, themed organization

---

## Feature Summary

| Category | Kraken-Code |
|----------|-------------|
| **Agent Model Specialization** | User-configured per agent |
| **Number of Agents** | 11 domain-specific |
| **Keyword Detection** | Basic (enhanced mode) |
 | **LSP Integration** | Full (12 tools, 16 servers) |
| **MCP Support** | Built-in MCP servers, structured |
| **Authentication** | 2 providers (Claude, Google) |
| **Loaders** | Skills only |
| **Hooks** | 30+ hooks, code-based |
| **TDD Support** | Full Blitzkrieg system |
| **Memory System** | Native persistent memory |
| **CLI Commands** | install, init, status, doctor |
| **Configuration** | Zod validation, centralized |
| **File-based Hooks** | No (code-based) |
| **Data Persistence** | Memory storage |
| **Native Integrations** | GitHub SDK, Git SDK, PR/Issue SDK |
| **Background Agents** | Yes, manager-based |
| **Context Pruning** | DCP engine + multiple strategies |
| **Todo Enforcement** | Via Blitzkrieg (optional) |
| **Comment Checking** | Comment checker hook |
| **Session Management** | list, read, search, info |
| **Ralph Loop** | Refined implementation with state persistence |
 | **Auto Update** | Yes, NPM registry checking with cache |
| **License** | MIT (permissive) |

---

## Key Features

1. **Sea-themed agent system** - 11 domain-specific agents for comprehensive coverage
2. **Blitzkrieg TDD system** - Complete test-driven development enforcement
3. **Native memory** - Persistent memory storage across sessions
4. **Native SDK integrations** - GitHub, Git, PR/Issue SDKs
5. **Skills system** - Dynamic skill discovery and templates
6. **Extensive hooks** - 30+ hooks for customization
7. **CLI expansion** - init, status, doctor with flexible options
8. **Zod schema validation** - Type-safe configuration
9. **DCP context pruning** - Advanced context management
10. **Commands system** - Built-in and custom commands
11. **Permissive license** - MIT for maximum flexibility

---

## Optimized For

- Feature completeness and modularity
- TDD and testing discipline
- Persistent memory across sessions
- Sea-themed, domain-specific agents
- Comprehensive hook system
- Production-ready, enterprise-grade features
- Structured architecture and organization

---

## When to Use

**Use Kraken-Code if**:
- You want TDD enforcement
- You need persistent memory
- You prefer comprehensive feature sets
- You value structured architecture
- You want native SDK integrations
- You need extensive customization via hooks
- You prefer MIT license
