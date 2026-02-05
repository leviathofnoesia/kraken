# Kraken Code Architecture

Kraken Code is structured as a plugin that augments OpenCode with orchestration, hooks, tooling, and a unified learning system.

## High-Level Components

```
src/
├── agents/                # Sea-themed agents with focused roles
├── features/
│   ├── memory/            # Unified learning system (experience store, knowledge graph)
│   ├── mcp/               # Built-in MCP servers (websearch, context7, grep_app)
│   ├── background-agent/  # Background task orchestration
│   ├── skill-mcp-manager/ # Skill-defined MCP servers
│   └── command-loader/    # Built-in command loader
├── hooks/                 # Lifecycle hooks for OpenCode integration
├── tools/                 # CLI-style tools exposed to OpenCode
├── config/                # Zod schemas + config manager
└── storage/               # Session transcripts and todo persistence
```

## Unified Learning System

The learning subsystem is designed to replace the legacy Kratos memory integration with a cohesive, on-disk learning store.

### Core Stores

- **Experience Store**: Captures decisions, outcomes, and context from real sessions.
- **Knowledge Graph**: Nodes and edges for structured knowledge and references.
- **Pattern Detection**: Tracks recurring signals and confidence levels.
- **Spaced Repetition**: Schedules reviews of important knowledge nodes.
- **State Machines**: Tracks multi-step workflows and learning loops.

### Persistence Model

All learning data is stored in `~/.kraken/learning/learning-state.json` (configurable). The system loads once at startup and auto-saves on changes when enabled.

### Tooling Integration

Learning tools are exposed via `learning_*` commands and can be triggered from OpenCode:

- `learning_add_experience`, `learning_search_experiences`
- `learning_add_knowledge_node`, `learning_search_knowledge_nodes`, `learning_link_knowledge_nodes`
- `learning_record_pattern`, `learning_list_patterns`
- `learning_get_review_queue`, `learning_review_node`
- `learning_create_state_machine`, `learning_list_state_machines`

## Hook Lifecycle

Hooks are used to intercept OpenCode lifecycle events (`tool.execute.before`, `tool.execute.after`, etc.) and provide:

- Mode activation (Blitzkrieg, Analyze, Ultrathink)
- Context injection
- Error recovery
- Session storage
- Learning initialization

## Configuration Flow

1. `~/.config/opencode/kraken-code.json` is parsed by the config manager.
2. Zod schemas validate and normalize values.
3. Hook/config loaders consume validated config for runtime behavior.

## Extensibility

- Add new tools under `src/tools/`
- Add new hooks under `src/hooks/`
- Extend learning by adding new store helpers in `src/features/memory/`
