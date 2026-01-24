# TOOLS KNOWLEDGE BASE

## OVERVIEW

**Kraken-Code Agent Tooling**

Comprehensive tooling ecosystem for sea-themed agents: AST-aware code search, file operations, background task management, and advanced hooks system.

## AVAILABLE TOOLS

### Core Tools (Full Implemented)

| Category | Tools | Description |
|----------|-------|-------------|
| **AST** | `ast_grep_search`, `ast_grep_replace` | Pattern-based code search/replace with 25 language support |
| **File Search** | `grep`, `glob` | Content and file pattern matching with timeout safety |
| **Session** | `session_list`, `session_read`, `session_search`, `session_info` | OpenCode session file management |
| **Background** | `background_task_status`, `background_task_list`, `background_task_cancel` | Async agent task orchestration |
 | **Terminal** | `interactive_bash` | Interactive bash session control |
 | **Ralph Loop** | `ralph_loop_status`, `ralph_loop_cancel`, `ralph_loop_continue` | Iterative task execution with state persistence |
 | **Model Switcher** | `model-switcher-*` | Interactive model selection and configuration |
 | **Compression** | `kraken-compress` | Context compression for efficiency |
 | **Agent Control** | `call_agent` | Spawn specialized explore/librarian agents |
| **Memory (Kratos)** | `memory_save`, `memory_search`, `memory_get_recent`, `memory_ask` | Persistent memory storage and retrieval |
| **MCP Integration** | `websearch`, `webfetch`, `context7-search`, `context7-get`, `grep-search`, `grep-get-file` | Curated MCP servers for web search, documentation, and code search |
| **Commands** | `ralph-loop` | Built-in command system |

### Specialized Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Blitzkrieg System** | ✅ Full | Complete TDD enforcement: test plans, TDD workflow, evidence verification, planner constraints (4 hooks, integrated into plugin) |
| **Skills System** | ✅ Full | Dynamic skill discovery and loading from templates/ |
| **MCP Integration** | ✅ Full | Built-in MCP servers + Kratos memory with full JSON-RPC protocol |
| **Context Management** | ✅ Partial | AGENTS.md injector exists, directory-specific instructions support |
| **Hooks System** | ✅ Extensive | 30+ hooks including: keyword detection, think mode, Ralph Loop, session recovery, auto-update, comment checker, and more |
| **Google Multi-Account Auth** | ✅ Full | AccountManager class with account rotation, rate limit handling, tier-based selection |

## MISSING TOOLS

**Note**: The following tools are planned but not yet implemented. These represent high-priority additions for future releases.

| Priority | Tools | Description | Est. Effort |
|----------|-------|-------------|--------------|
| HIGH | **LSP Tools** | IDE-like code intelligence (hover, goto definition, find references, document symbols, diagnostics, servers, rename, code actions) | 12-16 hrs |
| HIGH | **Git Operations** | Git status, commit, push, pull, branch operations | 6-8 hrs |
| HIGH | **Glob Tool** | Advanced file pattern matching | 2-3 hrs |
| HIGH | **Agent Calling** | Explicit explore/librarian agent spawning with background mode | 3-4 hrs |
| MEDIUM | **Multimodal Analysis** | PDF/image analysis via agent-browser | 8-10 hrs |
| MEDIUM | **Bash Session Management** | Tmux session management with creation/switch/info/history | 8-12 hrs |
| LOW | **Glob Patterns** | Advanced glob matching with project rules | 2-3 hrs |

## KRATEN-SPECIFIC FEATURES

### Sea-Themed Agent System

Kraken Code uses sea-themed agents with clear specialization:

| Agent | Specialty | Description |
|--------|-----------|-------------|
| **Kraken** | Architecture & Orchestration | Primary orchestrator for complex tasks |
| **Atlas** | Planning & Breakdown | Expert at task decomposition |
| **Nautilus** | Shell & Infrastructure | CI/CD, shell scripts, infrastructure |
| **Abyssal** | Deep Analysis | Deep code analysis, debugging, problem investigation |
| **Coral** | Building & Construction | New feature development |
| **Siren** | Communication & Documentation | API docs, README files |
| **Scylla** | Testing & Validation | Comprehensive test creation |
| **Pearl** | Refactoring & Optimization | Code quality, performance improvements |
| **Poseidon** | Data & Infrastructure | Databases, data pipelines |
| **Leviathan** | Large-Scale Projects | Major refactoring, project-wide changes |

### Blitzkrieg TDD System

Complete test-driven development enforcement ensuring code quality:

| Component | Hook | Description |
|-----------|------|-------------|
| **Test Plan Enforcer** | `blitzkrieg-test-plan-enforcer` | Requires test plan before implementation |
| **TDD Workflow** | `blitzkrieg-tdd-workflow` | Enforces test-first development |
| **Evidence Verifier** | `blitzkrieg-evidence-verifier` | Verifies test execution evidence |
| **Planner Constraints** | `blitzkrieg-planner-constraints` | Validates planning complexity and structure |

## TOOL USAGE

### Ralph Loop

Start a self-referential development loop:

```bash
/ralph-loop "Build a REST API"
```

- Runs until completion promise detected
- Persists state across sessions
- Supports `/cancel-ralph` to stop
- Configurable max iterations (default: 100)

### Model Switcher

Interactive model selection:

```bash
/model-switcher
```

- Browse available models by provider
- Set default models for specific agents
- Manage model preferences

### Background Agents

Spawn specialized agents for parallel execution:

```bash
# Run explore agent in background
call_agent --agent explore --background "Analyze this codebase"

# Check background task status
background_task_status

# List all background tasks
background_task_list
```

### Kratos Memory

Persistent context across sessions:

```bash
# Save a memory
memory_save --summary "API design decision" --text "Used JWT because..." --tags ["auth", "api"] --importance 5

# Search memories
memory_search --q "authentication" --k 10

# Natural language query
memory_ask --question "How did we implement JWT?"
```

## BEST PRACTICES

1. **Use AST-grep** over string search for code changes - it's language-aware
2. **Leverage Background Agents** for time-consuming parallel tasks
3. **Use Kratos Memory** for context that spans sessions
4. **Use Blitzkrieg** for TDD-compliant development workflows
5. **Use Model Switcher** to select optimal models per task type

## FUTURE ENHANCEMENTS

Planned improvements for future releases:

1. **LSP Tools Integration** - Add IDE-like code intelligence (hover, goto definition, find references, document symbols, diagnostics)
2. **Git Operations** - Native Git SDK integration for version control workflows
3. **Multimodal Analysis** - PDF/image analysis via agent-browser
4. **Bash Session Management** - Tmux session management with creation/switch/info/history
5. **Agent Calling** - Explicit explore/librarian agent spawning with background mode
6. **Advanced Glob** - Project-rule-based pattern matching
