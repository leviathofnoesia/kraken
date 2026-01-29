# Kraken Code v1.1

<div align="center">

![Version](https://img.shields.io/badge/v1.1-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/runtime-%3E%20bun?label=dark&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

</div>

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

## 🧠 Unified AI Memory System

Kraken Code now includes a **self-improving AI system** with four layers:

1. **Experience Store** - Records interactions with rewards for reinforcement learning
2. **Knowledge Graph** - Entity-based semantic memory with relationships
3. **Pattern Recognition** - Detects recurring behaviors (wins/losses)
4. **State Machine** - Behavioral control with state transitions

### How It Works

- **Automatic Learning:** The system records your work automatically via hooks
- **Memory Retention:** Uses FSRS algorithm for optimal review scheduling
- **Intelligent Context:** Injects relevant suggestions based on past experiences
- **Pattern Detection:** Identifies recurring wins and losses over time
- **Manual Control:** 5 tools for fine-grained control and analysis

### Tools

- `learning-experience` - Add/query experiences for replay
- `learning-knowledge` - Query knowledge graph for entities/relationships
- `learning-pattern` - Detect/manage patterns
- `learning-fsm` - Manage state machines and transitions
- `learning-stats` - Comprehensive statistics across all layers

### Configuration

Enable in your OpenCode config:

```json
{
  "learning": {
    "enabled": true,
    "experienceStore": { "enabled": true, "bufferSize": 1000, "maxAgeDays": 90 },
    "knowledgeGraph": { "enabled": true, "maxNodes": 10000 },
    "patternDetection": { "enabled": true, "minFrequency": 3, "minConfidence": 0.7 },
    "stateMachine": { "enabled": true, "initialState": "unknown" },
    "fsrs": { "enabled": true, "initialIntervals": [1, 3, 7, 14, 30] },
    "hooks": {
      "recordOnToolExecute": true,
      "recordOnSessionEnd": true,
      "injectOnSessionStart": true
    }
  }
}
```

---

## 🎯 Features

### 🧠 Intelligent Delegation

- **Atlas** - Code analysis and pattern recognition
- **Nautilus** - Code search and exploration
- **Abyssal** - Deep debugging with analysis
- **Coral** - Testing and quality assurance
- **Siren** - Documentation generation
- **Scylla** - Project planning and architecture
- **Pearl** - Knowledge synthesis
- **Maelstrom** - Multi-agent orchestration
- **Leviathan** - Strategic planning and high-level decision making
- **Poseidon** - Plan review and validation

### ⚡ Production Modes

- **Blitzkrieg** - TDD enforcement with guardrails
- **Ultrawork** - Parallel agent execution
- **Ultrathink** - Maximum reasoning with enhanced analysis

---

## 📝 Documentation

- **Architecture:** Complete 600+ line specification
- **Implementation Status:** Full analysis and progress tracking
- **Examples:** Usage examples for common workflows
- **Troubleshooting:** Common issues and solutions

---

## 🚀 Getting Started

The learning system works automatically and gets better with every interaction. Use the learning tools to explore patterns, query knowledge, and analyze your progress over time!

<div align="center">

**Built with 🤍 by Leviathanofnoesia**

</div>
