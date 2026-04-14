# Kraken Code v1.0

<div align="center">

![Version](https://img.shields.io/badge/v1.0-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/bun-1.2%2B-white?labelColor=%231F27&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

</div>

---

> **Kraken Code transforms OpenCode into an autonomous, high-density development environment.**  
> Think of it as giving OpenCode a second brain—one that remembers context, delegates intelligently, and enforces best practices automatically.

## Quick Start

```bash
# Install Kraken Code
bun install kraken-code

# Or with npm
npm install kraken-code

# Or with curl (for non-package-manager users)
bash scripts/install-curl.sh

# Initialize with minimal setup (agents only)
kraken-code init --minimal

# Or initialize with full setup (all features)
kraken-code init --full

# Run OpenCode
opencode
```

**Important:** After installation, you must run `kraken-code init` to create the proper configuration. The CLI command adds the plugin to your `~/.config/opencode/opencode.json` file and sets up all Kraken Code features.

For detailed installation options, run: `kraken-code --help`

---

## What Kraken Does for You

### 🧠 **Intelligent Delegation**

Don't do everything yourself. Kraken routes work to the right specialist automatically:

- **Architecture decisions?** → Ask **Atlas** (merged Maelstrom + Leviathan expertise)
- **Deep analysis needed?** → Deploy **Abyssal** for external research
- **Building UI?** → Hand to **Coral** for visual precision
- **Writing docs?** → Let **Siren** craft clear documentation
- **Complex test failures?** → Consult **Scylla** for test strategy
- **Infrastructure work?** → **Poseidon** handles data pipelines and CI/CD

### ⚡ **Production Modes**

Four expert modes that reconfigure the entire system:

- **Blitzkrieg** - TDD enforcement, rapid iteration with guardrails
- **Search** - Multi-angle codebase exploration with Nautilus auto-firing
- **Analyze** - Deep debugging with 100+ language keyword detection
- **Ultrathink** - Maximum reasoning budget for complex problems

### 🧠 **Persistent Memory**

Kraken Memory remembers everything across sessions—conversations, decisions, code patterns. Spatial knowledge graph with vector search. No more repeating yourself or asking the same questions.

### 🛠 **Smart Tooling**

- **GitHub integration** - PR/issue management, code search across repos
- **Git integration** - Diff management, blame, commit optimization
- **LSP superpowers** - Enhanced hover, code actions, refactoring
- **Session search** - Find that solution from 3 sessions ago in seconds

### 📋 **Built-in Commands & Skills**

10+ commands (`kraken-code --help`) and dynamic skill loading from `~/.config/opencode/skill/`. Write a skill once, use it everywhere.

---

## Why Kraken?

**OpenCode is powerful. Kraken makes it unstoppable.**

| OpenCode Alone                       | With Kraken                                       |
| ------------------------------------ | ------------------------------------------------- |
| Ask a question → forgets context     | Ask a question → Kraken Memory remembers          |
| Do work → guess what's next          | Do work → Blitzkrieg enforces quality             |
| Explore → manual grep searches       | Explore → Nautilus auto-fires on patterns         |
| Multi-step tasks → one-shot guessing | Multi-step tasks → Atlas breaks down properly     |
| Change scope → context bloats out    | Change scope → Kraken Memory prunes intelligently |

**The Value Proposition:**

1. **You work faster** - Agents handle specialized tasks while you focus on the big picture
2. **Your code is better** - Blitzkrieg enforces TDD, Scylla validates tests
3. **You stop repeating work** - Kraken Memory remembers solutions, patterns, decisions
4. **You navigate larger codebases** - Nautilus finds patterns you'd miss
5. **You get unstuck faster** - Atlas breaks down complex problems before you start

---

## Core Capabilities

### 🌊 **11 Sea-Themed Agents**

Each agent has a personality, a specialty, and knows when to step in:

```
Kraken     → Orchestrates everything, keeps you on track
Atlas      → Breaks down complex tasks systematically
Nautilus   → Explores codebases, finds patterns automatically
Abyssal    → Researches external docs, libraries, APIs
Coral       → Builds UI with design sensibility
Siren       → Writes clear, structured documentation
Scylla      → Creates comprehensive tests, validates coverage
Pearl       → Refactors for performance, readability
Maelstrom   → First-principles reasoning for hard problems
Leviathan  → Manages large-scale refactors, architecture
Poseidon    → Handles infrastructure, data pipelines
```

### 🏎️ **Blitzkrieg System**

Production-ready TDD workflow:

- **Test Plan Enforcer** - No implementation without test plans
- **TDD Workflow** - Write tests first, verify, then implement
- **Evidence Verifier** - Requires passing tests before completion
- **Planner Constraints** - Limits step complexity, prevents analysis paralysis

### 💾 **Session & Memory Management**

- **Session tools** - List, read, search sessions
- **Kraken Memory** - Save, search, link knowledge nodes naturally
- **JSONL storage** - OpenCode-compatible transcript format
- **Todo tracking** - Persistent task tracking across sessions

### 🔌 **MCP Integration**

Built-in MCP servers:

- **Kraken Memory** - Spatial knowledge graph with vector compression
- **Websearch** - Exa AI web search
- **Context7** - Official documentation lookup
- **Grep App** - GitHub code search

---

## Configuration

All configuration lives in `~/.config/opencode/opencode.json`:

```json
{
  "default_agent": "Kraken",
  "agents": {
    "Kraken": { "enabled": true, "model": "..." }
  },
  "blitzkrieg": { "enabled": true, "enforcement": "strict" },
  "kraken-memory": { "enabled": true, "dbPath": "~/.kraken-memory/memory.db" },
  "modes": {
    "blitzkrieg": { "enabled": true },
    "ultrathink": { "enabled": true, "thinkingBudget": 32000 }
  }
}
```

Run `kraken-code init --full` for recommended defaults.

---

## CLI Commands

```bash
# Install Kraken Code
kraken-code install

# Initialize with full setup
kraken-code init --full

# Check system health
kraken-code doctor

# Show configuration
kraken-code status
```

---

## Architecture

```
src/
├── agents/           # 11 sea-themed agents
├── features/
│   ├── skills/      # Skills system with discovery & hot-reload
│   ├── mcp/        # Built-in MCP servers
│   ├── blitzkrieg/  # TDD enforcement system
│   └── storage/     # Session & memory management
├── hooks/           # 31+ hooks for extensibility
├── tools/           # LSP, session, GitHub, Git integrations
├── cli/             # Commands & doctor
└── config/           # Zod schema validation
```

Each feature module can be enabled/disabled independently.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for developers who want more than just an AI assistant.**

**Built for autonomous development.**

</div>
