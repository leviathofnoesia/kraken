# Homebrew Tap Setup Instructions

This directory contains the files needed to create the `leviathofnoesia/homebrew-kraken` tap repository.

## Overview

A Homebrew tap is a separate GitHub repository that hosts Homebrew formulas. Users can install formulas from your tap using:

```bash
brew tap leviathofnoesia/kraken
brew install kraken-code
```

## Files in this Directory

- `kraken-code.rb` - The Homebrew formula (main file)
- `README.md` - Documentation for the tap

## Setup Steps

### Step 1: Create the GitHub Repository

1. Go to https://github.com/new
2. Name the repository: `homebrew-kraken`
3. Make it public
4. Don't initialize with README (we'll push our own)
5. Click "Create repository"

### Step 2: Initialize and Push

```bash
# Navigate to this directory
cd homebrew-tap

# Initialize git repo
git init

# Add files
git add .

# Commit
git commit -m "Initial commit: Add kraken-code formula v1.1.5"

# Add remote (replace with your actual repo URL)
git remote add origin https://github.com/leviathofnoesia/homebrew-kraken.git

# Push
git push -u origin main
```

### Step 3: Update SHA256 Hashes

**IMPORTANT:** The formula currently has placeholder SHA256 hashes. You need to update these after the binaries are built.

To get the SHA256 hashes:

```bash
# Download each binary and get its SHA256
# macOS x64
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-x64.tar.gz
shasum -a 256 kraken-code-macos-x64.tar.gz

# macOS ARM64
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-macos-arm64.tar.gz
shasum -a 256 kraken-code-macos-arm64.tar.gz

# Linux x64
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-x64.tar.gz
shasum -a 256 kraken-code-linux-x64.tar.gz

# Linux ARM64
curl -LO https://github.com/leviathofnoesia/kraken-code/releases/download/v1.1.5/kraken-code-linux-arm64.tar.gz
shasum -a 256 kraken-code-linux-arm64.tar.gz
```

Then update `kraken-code.rb` with the actual hashes.

### Step 4: Test the Formula

Before publishing, test the formula locally:

```bash
# Install from local path
brew install --build-from-source ./kraken-code.rb

# Or test without installing
brew install --dry-run ./kraken-code.rb

# Run formula tests
brew test ./kraken-code.rb

# Audit the formula
brew audit --strict ./kraken-code.rb
```

### Step 5: Commit Updated Formula

```bash
git add kraken-code.rb
git commit -m "Update SHA256 hashes for v1.1.5"
git push
```

## Updating the Formula for New Versions

When releasing a new version of Kraken Code:

1. Update the `version` variable in `kraken-code.rb`
2. Update all SHA256 hashes
3. Update the URLs if the release URL pattern changes
4. Commit and push

```bash
# Update version and hashes in kraken-code.rb
git add kraken-code.rb
git commit -m "Update to v1.2.0"
git push
```

## Directory Structure

The tap repository should look like this:

```
homebrew-kraken/
├── README.md
└── kraken-code.rb
```

That's it! Homebrew will automatically find the formula when users run `brew tap leviathofnoesia/kraken`.

## Troubleshooting

### Formula not found

Make sure the repository is named exactly `homebrew-kraken` (not `kraken-homebrew` or similar).

### SHA256 mismatch errors

This means the binary was updated after you calculated the hash. Recalculate and update the formula.

### Test failures

Run `brew test ./kraken-code.rb` to see detailed error messages.

### Audit failures

Run `brew audit --strict ./kraken-code.rb` to see what needs to be fixed.

## Resources

- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [Homebrew Taps](https://docs.brew.sh/Taps)
- [How to Create and Maintain a Tap](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap)
