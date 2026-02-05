# SHA256 Update Instructions

## Status: Waiting for Binary Builds

The GitHub Actions workflow has been triggered by pushing tag `v1.1.5`.

**Check build status:** https://github.com/leviathofnoesia/kraken-code/actions

## How to Update SHA256 Hashes

Once the release workflow completes, follow these steps:

### Step 1: Download Release Binaries

```bash
# Create a temporary directory
mkdir -p /tmp/kraken-release
cd /tmp/kraken-release

# Download all platform binaries
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-x64.tar.gz
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-arm64.tar.gz
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-x64.tar.gz
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-arm64.tar.gz
```

### Step 2: Calculate SHA256 Hashes

**On macOS:**

```bash
shasum -a 256 kraken-code-macos-x64.tar.gz
shasum -a 256 kraken-code-macos-arm64.tar.gz
shasum -a 256 kraken-code-linux-x64.tar.gz
shasum -a 256 kraken-code-linux-arm64.tar.gz
```

**On Linux:**

```bash
sha256sum kraken-code-macos-x64.tar.gz
sha256sum kraken-code-macos-arm64.tar.gz
sha256sum kraken-code-linux-x64.tar.gz
sha256sum kraken-code-linux-arm64.tar.gz
```

### Step 3: Update the Formula

Edit `homebrew/kraken-code.rb` and replace the placeholder hashes:

```ruby
# Intel Macs
if OS.mac? && Hardware::CPU.intel?
  url "https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-x64.tar.gz"
  sha256 "ACTUAL_HASH_HERE"
end

# Apple Silicon Macs
if OS.mac? && Hardware::CPU.arm?
  url "https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-arm64.tar.gz"
  sha256 "ACTUAL_HASH_HERE"
end

# Linux x64
if OS.linux? && Hardware::CPU.intel?
  url "https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-x64.tar.gz"
  sha256 "ACTUAL_HASH_HERE"
end

# Linux ARM64
if OS.linux? && Hardware::CPU.arm?
  url "https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-arm64.tar.gz"
  sha256 "ACTUAL_HASH_HERE"
end
```

### Step 4: Commit and Push

```bash
git add homebrew/kraken-code.rb
git commit -m "chore(homebrew): update SHA256 hashes for v1.1.5"
git push origin master
```

### Step 5: Update Homebrew Tap (if created)

If you've created the `homebrew-kraken` tap repository:

```bash
cd /path/to/homebrew-kraken
# Copy updated formula
cp /path/to/kraken-code/homebrew/kraken-code.rb .
git add kraken-code.rb
git commit -m "Update to v1.1.5 with SHA256 hashes"
git push
```

## Automated SHA256 Update (Alternative)

You can also use this one-liner to get all hashes:

```bash
#!/bin/bash
VERSION="1.1.5"
REPO="leviathofnoesia/kraken-code"

for platform in macos-x64 macos-arm64 linux-x64 linux-arm64; do
  url="https://github.com/${REPO}/releases/download/v${VERSION}/kraken-code-${platform}.tar.gz"
  echo "${platform}: $(curl -sL "${url}" | sha256sum | cut -d' ' -f1)"
done
```

## Verification

After updating, test the formula:

```bash
# Test without installing
brew install --dry-run ./homebrew/kraken-code.rb

# Or audit the formula
brew audit --strict ./homebrew/kraken-code.rb
```

## Notes

- The Windows binary (`.zip`) doesn't need a SHA256 hash for Homebrew since Homebrew doesn't support Windows
- Each time you release a new version, you must update all SHA256 hashes
- If you re-upload a binary, the hash will change and the formula will fail
