# Kraken Code v1.1

<div align="center">

![Version](https://img.shields.io/badge/v1.1-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/bun-1.2%2B-white?labelColor=%231F27&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

</div>

---

> **Kraken Code transforms OpenCode into an autonomous, high-density development environment with properly integrated hooks.**
> Think of it as giving OpenCode a second brain—one that remembers context, delegates intelligently, and enforces best practices automatically.

## Quick Start

```bash
bun install kraken-code
```

Or if you don't have Bun:

```bash
npm install kraken-code
```

Then add to your OpenCode config `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["kraken-code"]
}
```

That's it. Kraken Code auto-configures and integrates seamlessly with OpenCode.

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

### 🧠 **Persistent Memory & Context Management**

Kratos remembers everything across sessions—conversations, decisions, code patterns. No more repeating yourself or asking the same questions.

**Features:**
- **Persistent Memory** - Save, search, and query memories naturally
- **Context Pruning** - Intelligent DCP engine saves ~70% tokens
- **Session Persistence** - All sessions survive restarts
- **Cross-Session Search** - Find solutions from sessions ago

### 🛠 **Smart Tooling**

- **GitHub integration** - PR/issue management, code search across repos
- **Git integration** - Diff management, blame, commit optimization
- **LSP superpowers** - Enhanced hover, code actions, refactoring
- **Session tools** - List, read, search sessions
- **AST-grep** - Code structure-aware search and refactoring

### 📋 **Built-in Commands & Skills**

10+ commands (`kraken-code --help`) and dynamic skill loading from `~/.config/opencode/skill/`. Write a skill once, use it everywhere.

---

## Why Kraken?

**OpenCode is powerful. Kraken makes it unstoppable.**

| OpenCode Alone | With Kraken |
|---------------|--------------|
| Ask a question → forgets context | Ask a question → Kratos remembers |
| Do work → guess what's next | Do work → Blitzkrieg enforces quality |
| Explore → manual grep searches | Explore → Nautilus auto-fires on patterns |
| Multi-step tasks → one-shot guessing | Multi-step tasks → Atlas breaks down properly |
| Change scope → context bloats out | Change scope → Kratos prunes intelligently |

**The Value Proposition:**

1. **You work faster** - Agents handle specialized tasks while you focus on the big picture
2. **Your code is better** - Blitzkrieg enforces TDD, Scylla validates tests
3. **You stop repeating work** - Kratos remembers solutions, patterns, decisions
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

- **Session tools** - List, read, search, info sessions
- **Kratos memory** - Save, search, query memories naturally
- **JSONL storage** - OpenCode-compatible transcript format
- **Todo tracking** - Persistent task tracking across sessions
- **Cross-session search** - Find solutions from 3 sessions ago

### 🔌 **MCP Integration**

Built-in MCP servers:

- **Kratos** - Ultra-lean memory system
- **Websearch** - Exa AI web search
- **Context7** - Official documentation lookup
- **Grep App** - GitHub code search

### ✅ **Hooks Integration (FIXED)**

All 31+ hooks now properly integrated with OpenCode's API:

- **Correct Hook Names:** Using `message.updated`, `tool.execute.before`, `tool.execute.after`, `session.deleted` instead of incorrect `chat.message`, `chat.params`
- **Multilingual Think Mode:** Support for 10+ languages (English, Spanish, French, German, Portuguese, Italian, Russian, Japanese, Chinese, Korean)
- **Session Management:** Proper transcript and todo tracking
- **Context Injection:** Custom context during session compaction
- **Error Recovery:** Session recovery mechanisms
- **Blitzkrieg Enforcement:** Complete TDD workflow hooks
- **Model Verification:** Tested with `zai/glm-4.7` (128K context)

See [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for full verification details.

---

## Configuration

All configuration lives in `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["kraken-code"]
}
```

Run `kraken-code init --full` for recommended defaults.

**Kraken-specific configuration:**

```json
{
  "kraken_code": {
    "default_agent": "Kraken",
    "agents": {
      "Kraken": { "enabled": true, "model": "..." }
    },
    "blitzkrieg": { "enabled": true, "enforcement": "strict" },
    "kratos": { "enabled": true, "storage_path": "~/.kratos" },
    "modes": {
      "blitzkrieg": { "enabled": true },
      "ultrathink": { "enabled": true, "max_tokens": 32000 }
    }
  }
}
```

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
├── hooks/           # 31+ hooks for extensibility (all ✅ FIXED)
├── tools/           # LSP, session, GitHub, Git integrations
├── cli/             # Commands & doctor
└── config/           # Zod schema validation
```

Each feature module can be enabled/disabled independently.

---

## Installation & Usage

### Step 1: Install OpenCode CLI

```bash
curl -fsSL https://opencode.ai/install | bash
```

### Step 2: Add Kraken Code to Config

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["kraken-code"]
}
```

### Step 3: Start OpenCode

```bash
opencode
```

Kraken Code automatically initializes and provides all features.

### Using OpenCode CLI for Coding

Once installed, use these commands for coding tasks:

| Command | Purpose | Example |
|---------|---------|---------|
| `opencode run` | Execute a prompt | `opencode run "Explain how closures work in JavaScript"` |
| `opencode run --model zai/glm-4.7` | Use specific model | `opencode run --model zai/glm-4.7 "Build a React component"` |
| `opencode run --agent Atlas` | Use specific agent | `opencode run --agent Atlas "Plan architecture"` |
| `opencode run --dir /path/to/project` | Work in specific directory | `opencode run --dir /path/to/project "Refactor codebase"` |
| `opencode run --session sess_abc123` | Continue specific session | `opencode run --session sess_abc123` |
| `opencode session list` | List sessions | `opencode session list` |
| `opencode stats` | Show token usage | `opencode stats --days 7` |
| `opencode run --file src/index.ts` | Use with files | `opencode run --file src/index.ts "Review this file"` |

### OpenCode CLI Key Commands

| Command | Description |
|---------|-------------|
| `opencode run` | Execute a prompt directly |
| `opencode agent` | Manage agents (`list`, `create`, etc.) |
| `opencode auth` | Manage credentials (`login`, `logout`) |
| `opencode mcp` | Manage MCP servers (`list`, `add`, `auth`) |
| `opencode session` | Manage sessions (`list`, `delete`, `info`) |
| `opencode stats` | Show token usage and costs |
| `opencode export` | Export session data |
| `opencode serve` | Start headless server |
| `opencode acp` | Start ACP server |
| `opencode web` | Start web interface |

---

## Token & Context Management

### Kratos Memory System

**Ultra-lean persistent memory** - remembers everything across sessions

**Tools:**
- `memory_save` - Save memories with tags and importance
- `memory_search` - Search memories by query or tags
- `memory_get_recent` - Get recent memories
- `memory_ask` - Natural language queries

**Configuration:**
```json
{
  "kratos": {
    "enabled": true,
    "storage_path": "~/.kratos"
  }
}
```

### DCP Context Pruning Engine

**Intelligent context management** - saves ~70% tokens on average

**Features:**
- Context window monitoring
- Intelligent compression
- Preemptive compaction
- Directory-based context injection
- Agent-specific context optimization

---

## Hooks System (✅ All Fixed)

Kraken Code includes **31+ hooks** that properly integrate with OpenCode's API:

### Core Hooks
1. **Think Mode** - Multilingual keyword detection + variant switching
2. **Context Window Monitor** - Track context usage
3. **Ralph Loop** - Self-referential development loop
4. **Keyword Detector** - Auto-activate features based on keywords
5. **Auto Slash Command** - Custom command system

### Context Management Hooks
6. **Anthropic Context Window Limit Recovery** - Handle token limits gracefully
7. **Auto Update Checker** - Keep plugin up to date
8. **Compaction Context Injector** - Custom context during session compaction
9. **Directory Agents Injector** - Auto-load agents per directory
10. **Directory README Injector** - Inject project-specific context
11. **Edit Error Recovery** - Recover from edit failures
12. **Empty Message Sanitizer** - Clean up empty responses
13. **Empty Task Response Detector** - Detect and retry empty tasks
14. **Grep Output Truncator** - Truncate long grep output
15. **Interactive Bash Session** - Manage bash sessions
16. **Non-Interactive Env** - Set non-interactive flags
17. **Preemptive Compaction** - Compaction before context limit
18. **Session Recovery** - Recover from errors
19. **Thinking Block Validator** - Validate thinking blocks

### Quality Hooks
20. **Thinking Block Validator** - Validate thinking blocks
21. **Comment Checker** - Prevent excessive comments

### Blitzkrieg Hooks (5 hooks)
22. **Blitzkrieg Test Plan Enforcer** - Require test plans
23. **Blitzkrieg TDD Workflow** - Enforce TDD cycle
24. **Blitzkrieg Evidence Verifier** - Verify test evidence
25. **Blitzkrieg Planner Constraints** - Limit step complexity
26. **Session Idle Detector** - Detect idle sessions
27. **Notifications Hook** - Send notifications

### Agent Hooks
28. **Agent Usage Reminder** - Suggest specialized agents

### Additional Hooks
29. **Background Agent** - Manage background tasks
30. **CLI Tools** - GitHub/Git integrations
31. **Session Storage Hook** - Track todos and transcripts

**All hooks use correct OpenCode API:**
- ✅ `message.updated` - For chat message updates
- ✅ `tool.execute.before` - Modify tool execution
- ✅ `tool.execute.after` - Track tool results
- ✅ `session.deleted` - Clean up session state

---

## Documentation

- **[README.md](README.md)** - This file
- **[FEATURES.md](FEATURES.md)** - Complete feature overview
- **[FAQ.md](FAQ.md)** - Frequently asked questions
- **[EXAMPLES.md](EXAMPLES.md)** - Practical usage examples
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[INTEGRATION_STATUS.md](INTEGRATION_STATUS.md)** - Integration verification details
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for developers who want more than just an AI assistant.**

**Built for autonomous development.**

</div>
