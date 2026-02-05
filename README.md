# Kraken Code v1.1.5

<div align="center">

![Version](https://img.shields.io/badge/v1.1.5-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/bun-1.2%2B-white?labelColor=%231F27&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

</div>

---

> **Kraken Code transforms OpenCode into an autonomous, high-density development environment.**  
> Think of it as giving OpenCode a second brain—one that remembers context, delegates intelligently, and enforces best practices automatically.

## Quick Start

### Installation

Choose your preferred installation method:

```bash
# Option 1: Using Bun (fastest)
bun install -g kraken-code

# Option 2: Using NPM
npm install -g kraken-code

# Option 3: Using the install script (auto-detects environment)
curl -fsSL https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/install.sh | bash

# Option 4: Using Homebrew (macOS/Linux)
brew tap leviathofnoesia/kraken
brew install kraken-code

# Option 5: Using Docker
docker pull ghcr.io/leviathofnoesia/kraken-code:latest

# Option 6: Download binary directly
# Visit: https://github.com/leviathofnoesia/kraken-code/releases/latest
```

### Initialization

After installation, initialize Kraken Code:

```bash
# Initialize with minimal setup (agents only)
kraken-code init --minimal

# Or initialize with full setup (all features)
kraken-code init --full

# Run OpenCode
opencode
```

**Important:** The initialization step is required. It adds the plugin to your `~/.config/opencode/opencode.json` file and sets up all Kraken Code features.

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

### 🧠 **Unified Learning Memory**

Kraken Code now includes a unified learning system that captures experiences, builds a knowledge graph, detects patterns, and schedules spaced repetition reviews across sessions.

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

| OpenCode Alone                       | With Kraken                                   |
| ------------------------------------ | --------------------------------------------- |
| Ask a question → forgets context     | Ask a question → Learning retains context     |
| Do work → guess what's next          | Do work → Blitzkrieg enforces quality         |
| Explore → manual grep searches       | Explore → Nautilus auto-fires on patterns     |
| Multi-step tasks → one-shot guessing | Multi-step tasks → Atlas breaks down properly |
| Change scope → context bloats out    | Change scope → Learning preserves key context |

**The Value Proposition:**

1. **You work faster** - Agents handle specialized tasks while you focus on the big picture
2. **Your code is better** - Blitzkrieg enforces TDD, Scylla validates tests
3. **You stop repeating work** - Learning preserves solutions, patterns, decisions
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

### 💾 **Session & Learning Management**

- **Session tools** - List, read, search sessions
- **Learning memory** - Persist experiences, knowledge nodes, patterns, and review schedules
- **JSONL storage** - OpenCode-compatible transcript format
- **Todo tracking** - Persistent task tracking across sessions

### 🔌 **MCP Integration**

Built-in MCP servers:

- **Websearch** - Exa AI web search
- **Context7** - Official documentation lookup
- **Grep App** - GitHub code search

---

## Installation Guide

### Prerequisites

- **Node.js 18+** or **Bun 1.2+**
- **OpenCode** (will be used after installation)

### Method 1: Package Managers (Recommended)

```bash
# Using Bun (fastest)
bun install -g kraken-code

# Using NPM
npm install -g kraken-code

# Initialize
kraken-code init --minimal
```

### Method 2: Install Script

The install script auto-detects your environment and picks the best installation method:

```bash
curl -fsSL https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/install.sh | bash
```

**What it does:**

1. Detects your OS and architecture
2. Tries Bun → NPM → Binary download → Direct download
3. Auto-initializes Kraken Code
4. Provides clear next steps

### Method 3: Homebrew (macOS/Linux)

```bash
# Add the tap
brew tap leviathofnoesia/kraken

# Install
brew install kraken-code

# The formula includes shell completions and auto-initializes
```

### Method 4: Prebuilt Binaries

Download standalone binaries from [GitHub Releases](https://github.com/leviathofnoesia/kraken-code/releases):

| Platform | Architecture          | Download                         |
| -------- | --------------------- | -------------------------------- |
| macOS    | Intel (x64)           | `kraken-code-macos-x64.tar.gz`   |
| macOS    | Apple Silicon (ARM64) | `kraken-code-macos-arm64.tar.gz` |
| Linux    | x64                   | `kraken-code-linux-x64.tar.gz`   |
| Linux    | ARM64                 | `kraken-code-linux-arm64.tar.gz` |
| Windows  | x64                   | `kraken-code-windows-x64.zip`    |

```bash
# Example: macOS Apple Silicon
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/latest/download/kraken-code-macos-arm64.tar.gz
tar -xzf kraken-code-macos-arm64.tar.gz
sudo mv kraken-code /usr/local/bin/
kraken-code init --minimal
```

### Method 5: Docker

```bash
# Pull the image
docker pull ghcr.io/leviathofnoesia/kraken-code:latest

# Run with your project mounted
docker run -it -v $(pwd):/workspace ghcr.io/leviathofnoesia/kraken-code:latest

# Or run OpenCode directly
docker run -it -v $(pwd):/workspace ghcr.io/leviathofnoesia/kraken-code
```

### Method 6: Build from Source

```bash
# Clone the repository
git clone https://github.com/leviathofnoesia/kraken-code.git
cd kraken-code

# Install dependencies
bun install

# Build
bun run build

# Link locally (optional)
ln -s $(pwd)/dist/cli/index.js /usr/local/bin/kraken-code

# Initialize
kraken-code init --minimal
```

### Verifying Installation

After installation, verify everything is working:

```bash
# Check version
kraken-code --version

# Check status
kraken-code status

# Run diagnostics
kraken-code doctor

# Get help
kraken-code --help
```

### Updating

```bash
# NPM
npm update -g kraken-code

# Bun
bun update -g kraken-code

# Homebrew
brew upgrade kraken-code

# Docker
docker pull ghcr.io/leviathofnoesia/kraken-code:latest

# Binary: Download latest release manually
```

### Troubleshooting

**Command not found after installation:**

```bash
# Make sure global bin directory is in PATH
export PATH="$PATH:$(npm config get prefix)/bin"  # NPM
export PATH="$PATH:$HOME/.bun/bin"                 # Bun
export PATH="$PATH:$HOME/.local/bin"               # Install script
```

**Initialization fails:**

```bash
# Check if OpenCode config directory exists
mkdir -p ~/.config/opencode

# Try manual initialization
kraken-code init --full
```

**Permission denied:**

```bash
# Fix permissions (Unix)
sudo chown -R $(whoami) ~/.config/opencode

# Or reinstall with proper permissions
npm uninstall -g kraken-code
npm install -g kraken-code
```

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
  "learning": {
    "enabled": true,
    "storagePath": "~/.kraken/learning",
    "experienceStore": { "enabled": true, "maxEntries": 2000 },
    "knowledgeGraph": { "enabled": true, "maxNodes": 5000 },
    "patternDetection": { "enabled": true, "minConfidence": 0.6 },
    "spacedRepetition": { "enabled": true, "initialIntervalDays": 1 }
  },
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

## Learning Examples

```bash
learning_add_experience --summary "Migrated cache" \
  --details "Adopted segmented cache to reduce churn" \
  --tags ["performance", "caching"] \
  --confidence 0.75

learning_add_knowledge_node --title "Segmented cache strategy" \
  --content "Split cache into hot/warm tiers for better retention" \
  --tags ["performance"]
```

More examples: [docs/EXAMPLES.md](docs/EXAMPLES.md).

---

## Architecture

```
src/
├── agents/           # 11 sea-themed agents
├── features/
│   ├── skills/      # Skills system with discovery & hot-reload
│   ├── mcp/        # Built-in MCP servers
│   ├── blitzkrieg/  # TDD enforcement system
│   └── storage/     # Session & learning management
├── hooks/           # 31+ hooks for extensibility
├── tools/           # LSP, session, GitHub, Git integrations
├── cli/             # Commands & doctor
└── config/           # Zod schema validation
```

Each feature module can be enabled/disabled independently. For implementation details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/EXAMPLES.md](docs/EXAMPLES.md), and [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for developers who want more than just an AI assistant.**

**Built for autonomous development.**

</div>
