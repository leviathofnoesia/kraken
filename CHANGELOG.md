# Changelog

All notable changes to Kraken Code will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-02-05

### Fixed

- Removed Google OAuth auth from kraken-code codebase (should be separate package)
- Fixed duplicate logging in uninstall command when verbose mode enabled
- Added JSONC comment support to uninstall config parsing
- Removed unused KRAKEN_BUILD=1 environment variable from build scripts

## [5.0.0] - 2026-01-24

### Added

- **Mode System**: 4-mode detection with 100+ keywords in 15+ languages (Blitzkrieg, Search, Analyze, Ultrathink)
- **Session Storage**: JSONL-based todo and transcript storage for OpenCode compatibility
- **Skill MCP Manager**: Connection pooling with 5-minute idle timeout
- **Built-in Skills**: Playwright (browser automation), Frontend-UI/UX (design guidelines), Git-Master (atomic commits)
- **Boss Orchestrator**: Complex task coordination with parallel execution
- **Claude Code Compatibility**: Settings.json hooks and plugin toggles
- **Multilingual Support**: 15+ languages for keyword detection
- **Enhanced Documentation**: Production-ready README with comprehensive configuration examples
- **CI/CD**: GitHub Actions workflows for automated testing and releases
- **Comprehensive Test Suite**: 88% test coverage (441/497 tests passing)
- **11 Sea-Themed Agents**: Added Maelstrom, Leviathan, and Poseidon agents

### Changed

- Fixed "ultrawork" naming to "blitzkrieg" throughout codebase
- Improved mode detection confidence scoring
- Enhanced session storage with JSONL format
- Updated README for public launch with version badges
- Increased agent count from 10 to 11 with new Maelstrom, Leviathan, and Poseidon agents

### Fixed

- TypeScript compilation errors in hooks
- Import path issues for storage system
- Mode detector keyword database
- Removed lsp-tools.test.ts (LSP handled by separate agent)
- Fixed test failures to achieve 88% pass rate

### Security

- No security vulnerabilities

## [4.0.0] - 2026-01-23

### Added

- Initial kraken-code consolidation
- 10 sea-themed agents
- Blitzkrieg TDD system
- Kratos memory integration
- 30+ hooks for customization
- Skills system with templates
- Commands system with execution engine
- MCP management with built-in servers

### Notes

This is the initial release consolidating OpenChode and OpenCode-X.
