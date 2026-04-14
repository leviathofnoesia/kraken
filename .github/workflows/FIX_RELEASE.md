# Fixing Failed Release Workflow

## Problem

The release workflow for v1.1.5 failed because `kraken-code.schema.json` was not being copied to the release directory before uploading assets.

**Error:** 404 Not Found when trying to upload the schema file.

## Root Cause

The workflow only uploaded files from the `release/` directory:

```yaml
files: release/*
```

But the schema file was in `assets/` and wasn't being copied to `release/`.

## Fix Applied

**Commit:** `54d2348`

Added a copy command in the "Prepare release assets" step:

```yaml
- name: Prepare release assets
  run: |
    mkdir -p release
    # ... create binary archives ...
    # Copy additional release files
    cp assets/kraken-code.schema.json release/
    ls -la release/
```

## How to Re-Run the Release

Since the v1.1.5 tag already triggered (and failed) the workflow, you have two options:

### Option 1: Re-Run the Failed Workflow (Recommended)

1. Go to: https://github.com/leviathofnoesia/kraken-code/actions
2. Find the failed workflow run for v1.1.5
3. Click "Re-run jobs" → "Re-run all jobs"

### Option 2: Delete and Recreate the Tag

```bash
# Delete the old tag locally and remotely
git tag -d v1.1.5
git push origin :refs/tags/v1.1.5

# Recreate and push
git tag v1.1.5
git push origin v1.1.5
```

**Note:** If you already created a release for v1.1.5, you'll need to delete it first:

- Go to: https://github.com/leviathofnoesia/kraken-code/releases
- Delete the v1.1.5 release
- Then delete and recreate the tag

### Option 3: Create a New Patch Version

If you prefer not to mess with existing tags:

```bash
# Update version in package.json to 1.1.6
git add package.json
git commit -m "chore: bump version to 1.1.6"
git push origin master

# Create new tag
git tag v1.1.6
git push origin v1.1.6
```

## Verification

After re-running, check:

1. **Actions Tab:** https://github.com/leviathofnoesia/kraken-code/actions
   - All jobs should be green

2. **Release Page:** https://github.com/leviathofnoesia/kraken-code/releases/tag/v1.1.5
   - Should contain:
     - kraken-code-macos-x64.tar.gz
     - kraken-code-macos-arm64.tar.gz
     - kraken-code-linux-x64.tar.gz
     - kraken-code-linux-arm64.tar.gz
     - kraken-code-windows-x64.zip
     - **kraken-code.schema.json** ← This was missing!

3. **Docker Hub:** https://github.com/leviathofnoesia/kraken-code/pkgs/container/kraken-code
   - Should have v1.1.5 tag

## Prevention

The fix is now in place. Future releases will automatically include the schema file.

If you add more release assets in the future, make sure to:

1. Copy them to the `release/` directory in the workflow
2. Or add their path to the `files` parameter in the Create Release step
