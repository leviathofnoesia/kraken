# Homebrew Tap for Kraken Code

Official Homebrew tap for [Kraken Code](https://github.com/leviathofnoesia/kraken-code) - the autonomous development environment for OpenCode.

## Installation

```bash
# Add the tap
brew tap leviathofnoesia/kraken

# Install Kraken Code
brew install kraken-code
```

Or install directly without adding the tap:

```bash
brew install leviathofnoesia/kraken/kraken-code
```

## Requirements

- macOS 10.14+ or Linux
- [Bun](https://bun.sh) (recommended) or Node.js 18+

## Post-Installation

After installation, Kraken Code will automatically initialize itself:

```bash
# Verify installation
kraken-code --version

# Check status
kraken-code status

# Run diagnostics
kraken-code doctor
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

## Alternative Installation Methods

If Homebrew doesn't work for you, try:

- **NPM**: `npm install -g kraken-code`
- **Bun**: `bun install -g kraken-code`
- **Install Script**: `curl -fsSL https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/install.sh | bash`
- **Docker**: `docker pull ghcr.io/leviathofnoesia/kraken-code:latest`
- **Binary**: Download from [GitHub Releases](https://github.com/leviathofnoesia/kraken-code/releases)

## Documentation

- [Main Documentation](https://github.com/leviathofnoesia/kraken-code#readme)
- [Installation Guide](https://github.com/leviathofnoesia/kraken-code#installation-guide)
- [Configuration](https://github.com/leviathofnoesia/kraken-code#configuration)

## Support

- GitHub Issues: https://github.com/leviathofnoesia/kraken-code/issues
- Discussions: https://github.com/leviathofnoesia/kraken-code/discussions

## License

MIT License - see [LICENSE](https://github.com/leviathofnoesia/kraken-code/blob/main/LICENSE) for details.
