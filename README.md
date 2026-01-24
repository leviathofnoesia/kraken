# Kraken Code v5.0.0

> Unified OpenCode plugin with high-density agents, advanced modes, skills, commands, and memory integration.

<div align="center">

![Version](https://img.shields.io/badge/v-5.0.0-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/bun-1.2%2B-white?labelColor=%231F27&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

</div>

---

## Installation

### Quick Install

```bash
# Install via npm
npm install kraken-code

# Or with Bun
bun install kraken-code
```

### Alternative: curl Install Script (for non-npm/bun users)

If you don't have npm or Bun installed, you can use the provided curl installer:

```bash
# Run the install script
bash scripts/install-curl.sh

# This script will:
# - Download Kraken Code v5.0.0
# - Extract to ~/.config/opencode/plugins/
# - Verify installation
# - Show next steps
```

### Manual Installation

If you prefer manual installation:

```bash
# 1. Create a plugin directory
mkdir -p ~/.config/opencode/plugins

# 2. Download and extract the plugin
cd ~/.config/opencode/plugins
curl -sSL https://registry.npmjs.org/kraken-code/-/kraken-code-5.0.0.tgz | tar -xz

# 3. Rename the package directory
mv package kraken-code

# 4. Add to OpenCode configuration
# OpenCode and plugin will be detected automatically
```

### Alternative: curl Install (for non-npm/bun users)

If you don't have npm or Bun installed, you can install the plugin directly:

```bash
# 1. Create the plugin directory
mkdir -p ~/.config/opencode/plugins

# 2. Download and extract the plugin
cd ~/.config/opencode/plugins
curl -sSL https://registry.npmjs.org/kraken-code/-/kraken-code-5.0.0.tgz | tar -xz

# 3. Rename the package directory
mv package kraken-code

# 4. Add to OpenCode configuration
# Open OpenCode and the plugin will be detected automatically
```

### Quick Start

```bash
# Launch Kraken Code CLI
kraken-code --help

# Use with OpenCode
# Kraken Code integrates seamlessly with OpenCode's plugin system
```

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Sea-Themed Agent System](#sea-themed-agent-system)
- [Key Features](#key-features)
- [Features Architecture](#features-architecture)
- [Tools](#tools)
- [Hooks](#hooks)
- [Templates](#templates)
- [Blitzkrieg System](#blitzkrieg-system)
- [Mode System](#mode-system)
- [Session Storage](#session-storage)
- [Kratos Memory Integration](#kratos-memory-integration)
- [Skills System](#skills-system)
- [Boss Orchestrator](#boss-orchestrator)
- [Claude Code Compatibility](#claude-code-compatibility)
- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)
- [License](#license)

---

## Overview

Kraken Code is a production-ready OpenCode plugin that combines best practices into a unified, feature-rich system. It includes:

- **Sea-Themed Agents**: 11 specialized agents (Kraken, Atlas, Nautilus, Abyssal, Coral, Siren, Scylla, Pearl, Maelstrom, Leviathan, Poseidon)
- **Advanced Mode System**: 4 modes (Blitzkrieg, Search, Analyze, Ultrathink) with 100+ keywords in 15+ languages
- **Skills System**: Dynamic skill discovery, loading, and 3 implemented built-in skills
- **Commands System**: Multi-source command loader with 6 directory priority system
- **Memory Integration**: Kratos MCP and session-based JSONL storage
- **Native Integrations**: GitHub SDK, Git SDK, PR/Issue SDK
- **Session Storage**: Comprehensive todo and transcript tracking in OpenCode-compatible format
- **Claude Code Compatibility**: Full settings.json hooks and plugin toggles
- **Boss Orchestrator**: Complex task coordination with parallel execution
- **Production-Ready**: Battle-tested with comprehensive documentation

---

## Sea-Themed Agent System

Kraken Code includes 11 specialized sea-themed agents, each designed for specific tasks:

| Agent | Specialty | Description |
|--------|-----------|-------------|
| **Kraken** | Architecture & Orchestration | Primary agent for complex architectural decisions and multi-agent coordination |
| **Atlas** | Planning & Breakdown | Expert at breaking down complex tasks into manageable steps |
| **Nautilus** | Shell & Infrastructure | Specializes in shell scripts, CI/CD, and infrastructure as code |
| **Abyssal** | Deep Analysis | Performs deep code analysis, debugging, and problem investigation |
| **Coral** | Building & Construction | Focuses on building new features and components |
| **Siren** | Communication & Documentation | Handles API docs, README files, and user-facing content |
| **Scylla** | Testing & Validation | Creates comprehensive tests and validates implementations |
| **Pearl** | Refactoring & Optimization | Improves code quality, performance, and maintainability |
| **Maelstrom** | Multi-Model Orchestration | Coordinates between different AI models for best results |
| **Leviathan** | Large-Scale Projects | Manages large-scale refactoring and project-wide changes |
| **Poseidon** | Data & Infrastructure | Handles databases, data pipelines, and infrastructure management |

**Characteristics**:
- Manual selection or configurable default (Kraken)
- Sea-themed naming for memorable organization
- Broader coverage (from planning to infrastructure to data)
- User-configured model selection per agent

---

## Key Features

1. **Sea-themed agent system** - 11 domain-specific agents for comprehensive coverage
2. **Blitzkrieg TDD system** - Complete test-driven development enforcement
3. **Kratos memory** - Persistent memory storage across sessions
4. **Native SDK integrations** - GitHub, Git, PR/Issue SDKs
5. **Skills system** - Dynamic skill discovery and templates
6. **Extensive hooks** - 31+ hooks for customization
7. **CLI expansion** - install, init, status, doctor with flexible options
8. **Zod schema validation** - Type-safe configuration
9. **DCP context pruning** - Advanced context management
10. **Commands system** - Built-in and custom commands
11. **Permissive license** - MIT for maximum flexibility
12. **LSP Integration** - Full language server protocol support
13. **Auto Update Checker** - NPM registry checking with cache

---

## Features Architecture

**Core Philosophy**: Feature completeness, modular architecture, comprehensive tooling

**Key Architectural Decisions**:
- 11 sea-themed agents with clear specialization boundaries
- Modular feature system (skills, commands, MCP, memory)
- Native integrations with full SDK implementations
- Comprehensive hook system (31+ hooks)
- Blitzkrieg TDD enforcement system
- Schema-based configuration with Zod validation

---

## Tools

Kraken Code includes a comprehensive set of tools:

### Core Tools

- `grep` - Custom grep with advanced filtering
- `ast-grep` - AST-based code search and modification
- `session tools` - List, read, search, and get session info
- `compression` - Context compression for efficiency
- `ralph-loop` - Self-referential development loop with state persistence

### LSP Tools

- `lsp_hover` - Get hover information (type, documentation)
- `lsp_goto_definition` - Jump to symbol definition
- `lsp_find_references` - Find all references to a symbol
- `lsp_document_symbols` - Get all symbols in a document
- `lsp_workspace_symbols` - Search workspace for symbols
- `lsp_diagnostics` - Get diagnostics (errors, warnings) for a file
- `lsp_prepare_rename` - Prepare to rename a symbol
- `lsp_rename` - Rename a symbol across workspace
- `lsp_code_actions` - Get available code actions
- `lsp_code_action_resolve` - Resolve a code action
- `lsp_servers` - List all available LSP servers and installation status

### MCP Tools

- `websearch` - Web search (Exa AI)
- `webfetch` - Web page fetching
- `context7-search` - Official documentation lookup
- `context7-get` - Get specific documentation
- `grep-search` - GitHub code search (grep.app)
- `grep-get-file` - Get file from GitHub
- `kratos memory tools` - memory_save, memory_search, memory_get_recent, memory_ask

---

## Hooks

**Hooks Implemented** (31+):

### Core Hooks

1. **Think Mode Hook** - Context-aware mode switching
2. **Context Window Monitor** - Track and manage context usage
3. **Ralph Loop Hook** - State persistence for development loops
4. **Keyword Detector Hook** - Multi-language keyword detection (100+ keywords, 15+ languages)
5. **Auto Slash Command Hook** - Automatic command injection
6. **Rules Injector Hook** - Context rule enforcement
7. **Agent Usage Reminder** - Track and display agent usage

### Context Management

8. **Anthropic Context Window Limit Recovery** - Graceful degradation on limit
9. **Auto Update Checker Hook** - NPM registry checking with cache
10. **Compaction Context Injector** - Context summary injection
11. **Directory Agents Injector Hook** - Agent discovery for workspace
12. **Directory README Injector Hook** - README-based context
13. **Edit Error Recovery Hook** - Automatic retry on edit failures
14. **Empty Message Sanitizer Hook** - Filter empty messages
15. **Empty Task Response Detector Hook** - Detect and retry empty responses
16. **Grep Output Truncator Hook** - Limit grep output size
17. **Interactive Bash Session Hook** - Track bash sessions
18. **Non-Interactive Env Hook** - Detect non-interactive mode
19. **Preemptive Compaction Hook** - Proactive context compaction
20. **Session Recovery Hook** - Recover from session failures
21. **Thinking Block Validator Hook** - Validate thinking block format

### Comment Checking

22. **Comment Checker Hook** - Ensure code has comments

### Blitzkrieg Hooks

23. **Blitzkrieg Test Plan Enforcer** - Require test plans before implementation
24. **Blitzkrieg TDD Workflow** - Enforce test-first development
25. **Blitzkrieg Evidence Verifier** - Validate test evidence
26. **Blitzkrieg Planner Constraints** - Enforce planning discipline

### Additional

27. **Background Agent Hook** - Manager-based background tasks
28. **CLI Tools Hook** - Command registration and execution
29. **Tool Output Truncator Hook** - Limit tool output size

---

## Templates

Kraken Code includes skill templates in 10 categories:

- **Code Generator** - Create boilerplate code
- **Code Analyzer** - Analyze code quality
- **Code Simplifier** - Reduce complexity
- **Test Generator** - Create comprehensive tests
- **Opencode Native** - Wrap OpenCode tools
- **Documentation** - Generate documentation
- **Refactoring** - Suggest improvements
- **Security Scanner** - Find vulnerabilities
- **Performance** - Optimize performance

---

## Blitzkrieg System

**Blitzkrieg TDD System** (4 components):

1. **Test Plan Enforcer** - Requires test plans before implementation
2. **TDD Workflow** - Enforces test-first development
3. **Evidence Verifier** - Validates test evidence before task completion
4. **Planner Constraints** - Enforces planning discipline and complexity limits

---

## Mode System

**4 Modes with 100+ Keywords**:

| Mode | Purpose | Keywords |
|-------|---------|----------|
| **Blitzkrieg** | TDD/Testing focus | test, tdd, unit, integration, specs |
| **Search** | Exploration focus | find, search, explore, discovery |
| **Analyze** | Deep analysis focus | analyze, review, audit, debug |
| **Ultrathink** | Maximum detail focus | think, detail, explain, expand |

**Multi-Language Support**: Keywords in 15+ languages including Korean, Chinese, Hindi, Arabic, Spanish, French, German, Vietnamese, Turkish, Italian, Polish, Hebrew, Indonesian, Ukrainian, Greek, Czech, Romanian, Danish, Swedish, Norwegian, Dutch, Thai, Japanese, Portuguese, Russian

---

## Session Storage

**Session Management Tools**:
- `session_list` - List all sessions
- `session_read` - Read session transcript
- `session_search` - Search session content
- `session_info` - Get session metadata

**Storage Format**: OpenCode-compatible JSONL format

---

## Kratos Memory Integration

**Memory Tools**:
- `memory_save` - Save memories with tags and importance
- `memory_search` - Search memories by query or tags
- `memory_get_recent` - Get recent memories
- `memory_ask` - Natural language queries

**Storage**: Persistent local storage (`~/.kratos`)

---

## Skills System

**Built-in Skills**:
- 3 fully implemented built-in skills
- 10 skill template categories
- Dynamic skill discovery and hot reloading
- Frontmatter-based skill configuration

---

## Boss Orchestrator

**Complex Task Coordination**:
- Parallel execution support
- Multi-agent planning
- Task breakdown and scheduling

---

## Claude Code Compatibility

**Full Settings.json Integration**:
- Plugin toggles
- Settings hooks
- Compatibility layer

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
2. Configures agents, blitzkrieg, skills, kratos
3. Installs skill templates to `~/.config/opencode/skill/`
4. Creates Kratos storage directory

---

## Configuration

**Config Location**:
- `~/.config/opencode/opencode.json` (user)

**Schema Validation**:
- Zod schema validation
- Generated schema: `assets/kraken-code.schema.json`

**Key Config Sections**:
- `kraken_code` - Main configuration object
  - `agents` - Agent configuration (default, enabled)
  - `blitzkrieg` - Blitzkrieg TDD enforcement
  - `skills` - Skills system config
  - `kratos` - Kratos memory config
  - `mcp` - MCP server config
  - `compression` - Context compression
  - `modes` - Mode system configuration
  - `auto_update_checker` - Auto update checker config

**Schema Autocomplete**:
```json
{
  "$schema": "https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/assets/kraken-code.schema.json"
}
```

---

## Troubleshooting

### Common Issues

**Plugin Not Loading**:
1. Verify installation: `npm list kraken-code`
2. Check OpenCode config: `~/.config/opencode/opencode.json`
3. Restart OpenCode

**Memory Not Working**:
1. Check Kratos storage: `~/.kratos`
2. Verify kratos-mcp is running: Check `kraken-code doctor -c mcp`
3. Check configuration in opencode.json

**Skills Not Loading**:
1. Verify skill directory: `~/.config/opencode/skill/`
2. Check skill syntax: Each skill must have SKILL.md
3. Check for syntax errors in skill files

**LSP Not Working**:
1. Verify language server: `kraken-code doctor -c lsp`
2. Check TypeScript: `which typescript-language-server`
3. Verify file path: LSP tools need absolute paths

---

## Architecture

**Modular Feature System**:

```
src/features/
├── skills/                    # Skills system with built-in skills
├── commands/                  # Commands system with multi-source loader
├── skill-mcp-manager/         # Skill MCP connection pooling
├── mcp/                       # Built-in MCP management
├── storage/                    # Session storage (todos, transcripts)
├── claude-code-compatibility/  # Claude Code compatibility layer
├── background-agent/           # Background task system
├── context-pruning/           # DCP engine
├── native-integrations/       # Native SDK integrations
└── blitzkrieg/                # Blitzkrieg TDD system

src/hooks/                        # 31+ hooks for customization
src/tools/                        # Tool implementations
src/agents/                       # Sea-themed agent definitions
src/config/                       # Schema and validation
```

Each feature module can be enabled/disabled independently through configuration.

---

## License

MIT License - see LICENSE file for details

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Support

- **GitHub Issues**: https://github.com/leviathofnoesia/kraken-code/issues
- **Documentation**: See [README.md](README.md) for detailed documentation
