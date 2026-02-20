# Installation Guide

## Prerequisites

- **Node.js 18+** or **Bun 1.2+**
- One host client: **OpenCode**, **Codex**, **Claude Code**, **Cline**, **Cursor**, **VS Code/Antigravity**, or CI agent runtime

## Installation Methods

### Method 1: Bun (Recommended)

```bash
bun install -g kraken-code
kraken-code init --full
```

### Method 2: NPM

```bash
npm install -g kraken-code
kraken-code init --full
```

### Method 3: Homebrew (macOS/Linux)

```bash
brew tap leviathofnoesia/kraken
brew install kraken-code
kraken-code init --full
```

### Method 4: Docker

```bash
docker pull ghcr.io/leviathofnoesia/kraken-code:latest
docker run -it -v $(pwd):/workspace ghcr.io/leviathofnoesia/kraken-code
```

### Method 5: Prebuilt Binaries

Download from [GitHub Releases](https://github.com/leviathofnoesia/kraken-code/releases):

| Platform | Architecture  | File                           |
| -------- | ------------- | ------------------------------ |
| macOS    | Intel x64     | kraken-code-macos-x64.tar.gz   |
| macOS    | Apple Silicon | kraken-code-macos-arm64.tar.gz |
| Linux    | x64           | kraken-code-linux-x64.tar.gz   |
| Linux    | ARM64         | kraken-code-linux-arm64.tar.gz |
| Windows  | x64           | kraken-code-windows-x64.zip    |

### Method 6: Build from Source

```bash
git clone https://github.com/leviathofnoesia/kraken-code.git
cd kraken-code
bun install
bun run build
bun run build:binary
```

## Verifying Installation

```bash
kraken-code --version
kraken-code status
kraken-code doctor
```

## Universal Client Setup

Use `--target` to install outside OpenCode:

```bash
kraken-code init --target codex
kraken-code init --target claude
kraken-code init --target cursor
kraken-code init --target cline
kraken-code init --target vscode
kraken-code init --target ci
```

This writes:

- Shared config: `~/.config/kraken/kraken.json`
- Target profile: `~/.config/kraken/targets/<target>.json`
- Host adapter registration:
  - `codex`: `~/.codex/config.json`
  - `claude`: `~/.claude/settings.local.json`
  - `cline`: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
  - `cursor`: `~/.cursor/mcp.json`
  - `vscode`: VS Code user `settings.json` (`mcp.servers.kraken`)
  - `ci`: `~/.config/kraken/ci/bridge.json`

Verification commands:

```bash
kraken-code status --target <target>
kraken-code doctor --target <target>
kraken-code validate --target <target>
```

Acceptance checklist with copy-paste snippets:

- `docs/UNIVERSAL_ACCEPTANCE.md`

## Updating

```bash
# Bun
bun update -g kraken-code

# NPM
npm update -g kraken-code

# Homebrew
brew upgrade kraken-code
```
