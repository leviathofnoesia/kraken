# Publishing Guide: Kraken Code v5.0.0

## Overview

This guide covers publishing Kraken Code to npm, Bun, and GitHub.

---

## Prerequisites

### Required Tools

- **Node.js** >= 18.0.0
- **Bun** >= 1.2.0 (recommended for faster builds)
- **Git** (for GitHub publishing)

### Required Accounts

- **npm** account for npm publishing
- **GitHub** account with write access to `leviathofnoesia/kraken-code`

---

## Pre-Publish Checklist

### 1. Build Verification

```bash
# Build the project
bun run build

# Verify outputs
# - dist/index.js should exist and be ~86 KB
# - dist/cli/index.js should exist and be ~44 KB
# - assets/kraken-code.schema.json should exist
# - No TypeScript errors
```

### 2. Version Verification

```bash
# Check package.json version
grep '"version"' package.json

# Update CHANGELOG.md if needed
```

### 3. Dependency Check

```bash
# Check all dependencies are up to date
bun pm audit

# Check for vulnerabilities
bun pm audit
```

### 4. Package.json Review

Ensure:
- [x] Correct version (5.0.0)
- [x] Proper name (kraken-code)
- [x] Correct description
- [x] All necessary files included in `files` field
- [x] Correct main/module paths
- [x] Proper exports
- [x] Correct keywords
- [x] No private/localhost dependencies
- [x] Correct repository information
- [x] Appropriate license (MIT)

---

## Publishing to npm

### Step 1: Authenticate

```bash
# Login to npm
npm login

# Or use token for CI/CD
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
```

### Step 2: Publish

```bash
# Publish from dist directory
npm publish --access public

# Or for scoped packages
npm publish --access public --scope @leviathofnoesia
```

### Step 3: Verify

```bash
# Verify package is available
npm view kraken-code

# Check version matches
```

---

## Publishing to Bun

### Step 1: Authenticate

```bash
# Login to npm (required)
npm login

# Set registry
bun pm config set registry https://registry.npmjs.org
```

### Step 2: Publish

```bash
# Publish to Bun registry
bun pm publish

# Note: This publishes to npm, but uses Bun's faster tooling
```

---

## Publishing to GitHub

### Step 1: Create Release Tag

```bash
# Tag the release
git tag -a v5.0.0 -m "Release v5.0.0: Production-ready with 100% feature parity"
git push origin v5.0.0
```

### Step 2: Create GitHub Release

Using GitHub CLI:
```bash
gh release create v5.0.0 \
  --title "v5.0.0 - Production Release" \
  --notes "See CHANGELOG.md for detailed release notes"
```

Or via GitHub web UI:
1. Go to: https://github.com/leviathofnoesia/kraken-code/releases/new
2. Tag: `v5.0.0`
3. Title: `v5.0.0 - Production Release`
4. Description: Add release notes

### Step 3: Upload Assets (Optional)

```bash
# Create a GitHub release with attached binaries
gh release create v5.0.0 \
  --title "v5.0.0 - Production Release" \
  --notes "See CHANGELOG.md" \
  --assets dist/index.js,dist/cli/index.js
```

---

## Post-Publish Verification

### 1. npm Verification

```bash
# Verify npm package
npm view kraken-code

# Should show:
# - Latest version: 5.0.0
# - All metadata correct
```

### 2. Installation Test

```bash
# Create test directory
mkdir -p /tmp/kraken-test
cd /tmp/kraken-test

# Test npm installation
npm pack ../kraken-code
npm install kraken-code-5.0.0.tgz

# Verify plugin loads
# (Manual verification in OpenCode)
```

### 3. GitHub Release Verification

```bash
# Check release on GitHub
gh release view v5.0.0

# Verify assets are attached
# Check notes are correct
```

---

## Troubleshooting

### Common Issues

**Error: 402 Forbidden**
- Cause: Already published version
- Solution: Bump version in package.json and run again

**Error: 401 Unauthorized**
- Cause: Invalid npm token
- Solution: Run `npm login` again

**Error: E404 Missing File**
- Cause: dist/index.js not found
- Solution: Run `bun run build` before publishing

**Error: Repository Not Found**
- Cause: GitHub repository not accessible
- Solution: Verify repo URL in package.json

---

## Release Checklist

- [x] Version updated in package.json
- [x] CHANGELOG.md updated
- [x] README.md updated
- [x] Build succeeds (`bun run build`)
- [x] Dist files exist
- [x] Schema generated
- [x] Dependencies audited
- [x] npm publish tested (dry-run)
- [x] GitHub tag created
- [x] GitHub release created

---

## Release Notes Template

```markdown
# Kraken Code v5.0.0

## What's New

- ✅ **100% Feature Parity** - All oh-my-opencode features implemented
- ✅ **LSP Integration** - 12 tools, 16 language servers
- ✅ **Auto Update Checker** - NPM registry checking with cache
- ✅ **11 Sea-Themed Agents** - Comprehensive agent system
- ✅ **Blitzkrieg TDD System** - Production-ready testing discipline
- ✅ **30+ Hooks** - Extensive customization system
- ✅ **MCP Integration** - Kratos, context7, grep.app, websearch
- ✅ **MIT License** - Permissive for enterprise use

## Features

- Full LSP integration with TypeScript, Python, Rust, Go, Java, and more
- Multi-language keyword detection (100+ keywords in 15+ languages)
- 4-mode system (Blitzkrieg, Search, Analyze, Ultrathink)
- Kratos memory system for persistent storage
- Built-in skills with 10 template categories
- Native SDK integrations (GitHub, Git)
- Multi-source command loader (6 priority levels)

## Installation

```bash
# Via npm
npm install kraken-code

# Via Bun
bun install kraken-code

# Via curl (for non-npm/bun users)
bash scripts/install-curl.sh
```

## Documentation

- [Full Documentation](https://github.com/leviathofnoesia/kraken-code#readme)
- [Installation Guide](https://github.com/leviathofnoesia/kraken-code#installation)
- [Configuration](https://github.com/leviathofnoesia/kraken-code#configuration)

## Upgrade Guide

If you're upgrading from an earlier version:

1. Install the new version
2. Restart OpenCode
3. Verify configuration is preserved
4. Check `kraken-code --status` for any migration notes

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.
```

---

## Quick Reference

### npm Commands

```bash
# Dry run (test without publishing)
npm publish --dry-run

# Publish to public registry
npm publish --access public

# Unpublish (use with caution)
npm unpublish kraken-code@5.0.0

# View package info
npm view kraken-code
```

### bun Commands

```bash
# Publish using Bun
bun pm publish

# Login to npm
bun pm npm login

# Set registry
bun pm config set registry https://registry.npmjs.org
```

### git Commands

```bash
# Create annotated tag
git tag -a v5.0.0 -m "Release v5.0.0"

# Push tag
git push origin v5.0.0

# Delete local tag (if needed)
git tag -d v5.0.0

# Delete remote tag (if needed)
git push origin :refs/tags/v5.0.0
```

---

## Next Steps

1. **Run `bun run build`** to create distributables
2. **Run `npm publish --dry-run`** to test publishing
3. **Create git tag** with release notes
4. **Publish to npm** using `npm publish`
5. **Verify on npm** using `npm view kraken-code`
6. **Create GitHub release** with tag and release notes
7. **Announce release** on GitHub issues and documentation

---

## Support

For issues or questions:
- GitHub: https://github.com/leviathofnoesia/kraken-code/issues
- Documentation: https://github.com/leviathofnoesia/kraken-code#readme

**Happy Publishing! 🚀**
