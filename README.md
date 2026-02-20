# Kraken: An OpenCode Plugin

<div align="center">

![Version](https://img.shields.io/badge/v1.6.0-brightgreen?labelColor=0e8fd0&style=flat-square)
![License](https://img.shields.io/badge/license-MIT?labelColor=black&style=flat-square)
![Bun](https://img.shields.io/badge/bun-1.2%2B-white?labelColor=%231F27&style=flat-square)
![OpenCode](https://img.shields.io/badge/compatibility-green?label=OpenCode&style=flat-square)

**An OpenCode plugin that transforms OpenCode into an autonomous, high-density development environment.**

[Installation](#installation) • [Documentation](./docs) • [Contributing](./CONTRIBUTING.md) • [Changelog](./CHANGELOG.md)

</div>

---

## About

Kraken is a professional OpenCode plugin that adds intelligent agent orchestration, production workflow enforcement, and unified learning memory to your development process. It seamlessly integrates with OpenCode to provide specialized AI agents, TDD workflows, and persistent knowledge management.

## Features

- **12 Specialized Agents** - Intelligent routing to context-aware specialists (Atlas, Nautilus, Abyssal, Coral, Siren, Scylla, Pearl, Maelstrom, Leviathan, Poseidon, Cartographer, and Kraken for orchestration)
- **Production Workflows** - Blitzkrieg TDD enforcement, test planning, and evidence verification
- **Learning Memory** - Persistent experiences, knowledge graphs, and pattern detection across sessions
- **MCP Integration** - Built-in web search, documentation lookup, and code search servers

## Installation

```bash
# Using Bun (recommended)
bun install -g kraken-code

# Initialize with OpenCode
kraken-code init --full

# Run OpenCode
opencode
```

Universal targets:

```bash
kraken-code init --target codex
kraken-code init --target claude
kraken-code validate --target codex
```

See [Installation Guide](./docs/INSTALLATION.md) for additional methods (NPM, Homebrew, Docker, binaries) and [Universal Acceptance](./docs/UNIVERSAL_ACCEPTANCE.md).

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and module overview
- [Installation](./docs/INSTALLATION.md) - Complete setup guide
- [Commands](./docs/COMMANDS.md) - CLI reference
- [Skills](./docs/SKILLS.md) - Writing and using skills
- [Contributing](./docs/CONTRIBUTING.md) - Development setup and guidelines

## More Projects

- [AgentCompiler](https://github.com/leviathofnoesia/AgentCompiler) - Converts framework docs into AI agent-readable indexes
- [AgentCompiler API](https://github.com/leviathofnoesia/agentcompiler-api) - REST API for autonomous doc compilation with x402 payments

## Quick Reference

```bash
# Check version
kraken-code --version

# System status
kraken-code status

# Fast validation
kraken-code validate --target codex

# View help
kraken-code --help
```

## License

MIT License - see [LICENSE](./LICENSE) for details.
