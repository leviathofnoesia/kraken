# Kraken Code Agents

This document describes all specialized agents in Kraken Code and when to use each.

## Agent Overview

Kraken Code provides a suite of sea-themed AI agents, each specialized for specific development tasks. The orchestrator (Kraken) routes requests to the most appropriate agent based on the task context.

## Agent Directory

### Atlas (Architecture Specialist)

- **Purpose**: System architecture and design decisions
- **When to use**: Complex architectural questions, large-scale refactoring, technology selection, performance optimization at system level
- **Capabilities**: First-principles reasoning, structural analysis, design pattern selection
- **Cost**: EXPENSIVE
- **Model**: Claude Opus 4.5 (default)

### Nautilus (Codebase Search)

- **Purpose**: Systematic codebase exploration and pattern recognition
- **When to use**: Multi-module discovery, finding code patterns, understanding project structure
- **Capabilities**: AST-based search, LSP integration, cross-validation
- **Cost**: FREE
- **Model**: Grok Code (default)

### Abyssal (External Research)

- **Purpose**: Research external libraries, frameworks, and best practices
- **When to use**: Library documentation, OSS patterns, external API usage
- **Capabilities**: Web research, documentation synthesis, example gathering
- **Cost**: CHEAP
- **Model**: Configurable (default depends on task)

### Coral (UI/UX Design)

- **Purpose**: Visual design and frontend implementation
- **When to use**: Styling, layout, animation, accessibility
- **Capabilities**: Design system principles, component architecture
- **Cost**: CHEAP
- **Model**: Configurable (default depends on task)

### Siren (Documentation)

- **Purpose**: Technical writing and documentation generation
- **When to use**: README files, API docs, code comments
- **Capabilities**: Information architecture, technical writing, documentation standards
- **Cost**: CHEAP
- **Model**: Configurable (default depends on task)

### Scylla (Code Review)

- **Purpose**: Quality assurance and SOLID principles
- **When to use**: Audit code changes, verify against best practices
- **Capabilities**: Code quality gates, anti-pattern detection
- **Cost**: EXPENSIVE
- **Model**: Claude Sonnet 4 (default)

### Pearl (Multimedia Analysis)

- **Purpose**: PDF, image, and diagram analysis
- **When to use**: Extracting information from PDFs, analyzing screenshots
- **Capabilities**: OCR, image understanding, diagram parsing
- **Cost**: CHEAP
- **Model**: Configurable (default depends on task)

### Maelstrom (Strategic Advisor)

- **Purpose**: Strategic planning and decision-making
- **When to use**: Complex technical decisions, multi-system trade-offs
- **Capabilities**: First-principles reasoning, evidence evaluation
- **Cost**: EXPENSIVE
- **Model**: Configurable (default depends on task)

### Leviathan (Structural Analysis)

- **Purpose**: Code structure and dependency analysis
- **When to use**: God classes, circular dependencies, missing abstractions
- **Capabilities**: Dependency mapping, structural issues detection
- **Cost**: EXPENSIVE
- **Model**: Configurable (default depends on task)

### Poseidon (Pre-Planning Consultant)

- **Purpose**: Constraint satisfaction and requirements analysis
- **When to use**: Before planning complex tasks, ambiguous requirements
- **Capabilities**: Intent classification, constraint extraction, ambiguity detection
- **Cost**: EXPENSIVE
- **Model**: Claude Opus 4.5 (default)

### Cartographer (Advanced Planning Agent) ⭐ NEW

- **Purpose**: Sophisticated planning with hierarchical decomposition and codebase analysis
- **When to use**:
  - Complex multi-step tasks spanning multiple modules
  - Refactoring requiring careful change propagation
  - Architectural changes needing dependency mapping
  - Feature implementation where task decomposition benefits from codebase analysis
- **Capabilities**:
  - **Hierarchical Task Decomposition**: Multi-level task graphs with clear dependencies
  - **Graph-Based Modeling**: Task graphs for optimal decomposition and parallelization
  - **Dependency Analysis**: Using AST, LSP, and static analysis tools
  - **Impact Prediction**: Change propagation analysis before implementation
  - **Risk Assessment**: Systematic risk identification and mitigation strategies
  - **Constraint Satisfaction**: Ensuring plans respect functional and non-functional constraints
  - **MCTS-Inspired Exploration**: Decision exploration for complex choices
- **Key Features**:
  - Intent classification matrix (Refactoring, Greenfield, Enhancement, Integration, Investigation)
  - Scope delimitation (explicit in-scope and out-of-scope items)
  - Dependency graph construction from codebase
  - Parallelization analysis for concurrent execution
  - Critical path identification
  - Rollback strategy planning
  - Structured, machine-parsable plan output
- **Cost**: EXPENSIVE
- **Model**: Claude Opus 4.5 (default)
- **Tooling**: Uses `@ast-grep`, LSP tools, grep, and AST analysis
- **Planning Techniques**:
  - Task graph construction
  - Change impact prediction
  - Risk mitigation planning
  - Definition of done with verifiable criteria
- **Avoid When**: Simple single-file changes, trivial bug fixes, well-understood patterns

### Kraken (Orchestrator)

- **Purpose**: Coordinate agents and manage development workflow
- **When to use**: Primary orchestrator, built-in to OpenCode
- **Capabilities**: PDSA cycles, intelligent delegation, constraint analysis (integrated Poseidon)
- **Cost**: N/A (primary agent)
- **Model**: Configurable (default depends on task)

## Agent Selection Guide

### Decision Tree

```text
Task Type?
├─ Visual/UI Design? → Coral
├─ External Library/API Research? → Abyssal
├─ Documentation Needed? → Siren
├─ PDF/Image Analysis? → Pearl
├─ Code Review/Audit? → Scylla
├─ Architecture Decision? → Atlas
├─ Codebase Search (>2 modules)? → Nautilus
├─ Pre-Planning/Requirements Analysis? → Poseidon
├─ Complex Multi-Step Planning? → Cartographer
└─ Default Orchestration → Kraken
```

### When to Use Multiple Agents

Some tasks benefit from sequential delegation:

1. **Complex Feature Implementation**:
   - Start with **Cartographer** for planning
   - Delegate to **Nautilus** for codebase patterns
   - Consult **Atlas** for architecture decisions
   - Use **Coral** for UI components
   - **Kraken** orchestrates the workflow

2. **Major Refactoring**:
   - **Cartographer** creates the refactoring plan
   - **Leviathan** analyzes structure and dependencies
   - **Scylla** reviews against SOLID principles
   - **Kraken** orchestrates execution

3. **New Library Integration**:
   - **Abyssal** researches external patterns
   - **Poseidon** extracts constraints and requirements
   - **Atlas** advises on integration strategy
   - **Cartographer** creates implementation plan

## Agent Cost Summary

| Agent        | Cost      | Reason                                                         |
| ------------ | --------- | -------------------------------------------------------------- |
| Atlas        | EXPENSIVE | Complex reasoning requires powerful models                     |
| Nautilus     | FREE      | Pattern matching is efficient with smaller models              |
| Abyssal      | CHEAP     | Web research doesn't need extensive reasoning                  |
| Coral        | CHEAP     | Design tasks benefit from creative models                      |
| Siren        | CHEAP     | Documentation generation is straightforward                    |
| Scylla       | EXPENSIVE | Code review requires deep analysis                             |
| Pearl        | CHEAP     | Multimedia analysis is domain-specific                         |
| Maelstrom    | EXPENSIVE | Strategic decisions need sophisticated reasoning               |
| Leviathan    | EXPENSIVE | Structural analysis requires comprehensive understanding       |
| Poseidon     | EXPENSIVE | Pre-planning needs extensive analysis                          |
| Cartographer | EXPENSIVE | Complex planning requires deep reasoning and codebase analysis |

## Integration Points

### Tool Restrictions

Most subagents have tool restrictions for safety:

- **Write/Edit Restrictions**: Cartographer, Poseidon, Scylla (planning/review only)
- **Task Restrictions**: Planning agents can't spawn sub-tasks to prevent circular delegation

### Model Selection

Agents use different models based on their complexity requirements:

- **EXPENSIVE agents** (Atlas, Scylla, Maelstrom, Leviathan, Poseidon, Cartographer): Claude Opus 4.5 or equivalent
- **CHEAP agents** (Abyssal, Coral, Siren, Pearl): Mid-tier models (Sonnet, Haiku)
- **FREE agents** (Nautilus): Lightweight models (Grok Code)
- **Primary orchestrator** (Kraken): Configurable based on task

## Extending the Agent Suite

To add a new agent:

1. Create `src/agents/[agent-name].ts`
2. Implement `create[AgentName]Config()` function returning `AgentConfig`
3. Define metadata in `[agentName]PromptMetadata` object
4. Export from `src/agents/index.ts`
5. Add to `src/types.ts` in `BuiltinAgentName` type
6. Create tests in `test/agents/[agent-name].test.ts`
7. Update this documentation

See existing agents (especially `nautilus.ts` or `atlas.ts`) for patterns.
