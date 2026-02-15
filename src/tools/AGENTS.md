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
| **Learning Memory** | `learning_add_experience`, `learning_search_experiences`, `learning_add_knowledge_node`, `learning_search_knowledge_nodes`, `learning_link_knowledge_nodes`, `learning_record_pattern`, `learning_list_patterns`, `learning_get_review_queue`, `learning_review_node`, `learning_create_state_machine`, `learning_list_state_machines` | Unified learning storage and retrieval |
| **MCP Integration** | `websearch`, `webfetch`, `context7-search`, `context7-get`, `grep-search`, `grep-get-file` | Curated MCP servers for web search, documentation, and code search |
| **Commands** | `ralph-loop` | Built-in command system |

### Specialized Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Blitzkrieg System** | ✅ Full | Complete TDD enforcement: test plans, TDD workflow, evidence verification, planner constraints (4 hooks, integrated into plugin) |
| **Skills System** | ✅ Full | Dynamic skill discovery and loading from templates/ |
| **MCP Integration** | ✅ Full | Built-in MCP servers for web search, documentation, and code search |
| **Context Management** | ✅ Partial | AGENTS.md injector exists, directory-specific instructions support |
| **Hooks System** | ✅ Extensive | 30+ hooks including: keyword detection, think mode, Ralph Loop, session recovery, auto-update, comment checker, and more |
| **Google Multi-Account Auth** | ✅ Full | AccountManager class with account rotation, rate limit handling, tier-based selection |

## IMPLEMENTED TOOLS

All previously planned tools are now fully implemented:

| Status | Tools | Description |
|--------|-------|-------------|
| ✅ | **LSP Tools** | IDE-like code intelligence (hover, goto definition, find references, document symbols, diagnostics, servers, rename, code actions) |
| ✅ | **Git Operations** | Git status, commit, push, pull, branch, diff, log, stash, rebase, tag, merge, reset, fetch, checkout |
| ✅ | **Glob Tool** | Advanced file pattern matching (glob_tool, find_files, find_in_files) |
| ✅ | **Agent Calling** | Subagent spawning with background mode (call_agent, background_task_status, background_task_list, background_task_cancel) |
| ✅ | **Multimodal Analysis** | Pearl agent for PDF/image/diagram analysis |
| ✅ | **Binary Build** | Cross-platform binary compilation (bun build --compile) |
| ⚠️ | **Bash Session Management** | Session tracking exists (interactive-bash-session hook), tmux integration pending |

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

### Unified Learning Memory

Persistent context across sessions:

```bash
# Save an experience
learning_add_experience --summary "API design decision" --details "Used JWT because..." --tags ["auth", "api"] --confidence 0.8

# Search experiences
learning_search_experiences --query "authentication"

# Record a knowledge node
learning_add_knowledge_node --title "JWT decision" --content "JWT chosen for stateless auth" --tags ["auth"]
```

## BEST PRACTICES

1. **Use AST-grep** over string search for code changes - it's language-aware
2. **Leverage Background Agents** for time-consuming parallel tasks
3. **Use Learning Memory** for context that spans sessions
4. **Use Blitzkrieg** for TDD-compliant development workflows
5. **Use Model Switcher** to select optimal models per task type

## FUTURE ENHANCEMENTS

All planned tools are now implemented. Future enhancements will focus on:

1. **Enhanced LSP Tools** - Additional language servers, improved diagnostics
2. **Tmux Integration** - Full tmux session management with attach/detach
3. **Code Signing** - macOS/Windows code signing for releases
4. **Auto-Update** - Binary auto-update mechanism
5. **Plugin System** - Third-party plugin support
