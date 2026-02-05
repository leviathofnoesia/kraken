# Kraken Code Homebrew Tap

Homebrew formula for Kraken Code - the autonomous development environment for OpenCode.

## Installation

### Option 1: Using the Tap (Recommended)

```bash
# Add the tap
brew tap leviathofnoesia/kraken

# Install Kraken Code
brew install kraken-code
```

### Option 2: Direct Install

```bash
brew install leviathofnoesia/kraken/kraken-code
```

## Requirements

- macOS 10.14+ or Linux
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [OpenCode](https://opencode.ai) (will be prompted to install if not present)

## Post-Installation

After installation, Kraken Code will automatically initialize itself. To verify:

```bash
# Check status
kraken-code status

# Run diagnostics
kraken-code doctor

# Get help
kraken-code --help
```

## Updating

```bash
brew update
brew upgrade kraken-code
```

## Uninstalling

```bash
brew uninstall kraken-code
brew untap leviathofnoesia/kraken
```

## Building from Source

If you prefer to build from source instead of using prebuilt binaries:

```bash
# Clone the repository
git clone https://github.com/leviathofnoesia/kraken-code.git
cd kraken-code

# Install dependencies and build
bun install
bun run build

# Link locally
ln -s $(pwd)/dist/cli/index.js /usr/local/bin/kraken-code
```

## Troubleshooting

### Installation fails with "SHA256 mismatch"

This usually means the release was updated. Run:

```bash
brew update
brew reinstall kraken-code
```

### Command not found after installation

Make sure Homebrew's bin directory is in your PATH:

```bash
# For bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.bashrc

# For zsh
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
```

### Permission denied errors

The formula installs binaries with proper permissions. If you see permission errors:

```bash
# Reinstall with correct permissions
brew reinstall kraken-code
```

## Alternative Installation Methods

If Homebrew doesn't work for you, try:

- **NPM**: `npm install -g kraken-code`
- **Bun**: `bun install -g kraken-code`
- **Install Script**: `curl -fsSL https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/install.sh | bash`
- **Docker**: `docker pull ghcr.io/leviathofnoesia/kraken-code:latest`

## Support

- GitHub Issues: https://github.com/leviathofnoesia/kraken-code/issues
- Documentation: https://github.com/leviathofnoesia/kraken-code#readme
