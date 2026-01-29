# Kraken Code Ruleset Debug Guide

## Current Status

The plugin has been updated with fixes and diagnostic logging. Latest changes:

1. **Fixed invalid permission key mappings** (`src/shared/permission-compat.ts`)
   - Maps legacy tool names (`write`, `task`) to valid OpenCode permission keys
   - Skips tools that don't map to valid keys

2. **Added diagnostic logging** (`src/index.ts`)
   - Logs when agents are being injected
   - Logs the permission keys each agent has before sanitization
   - Logs the final sanitized permission object

## What to Check

When you restart OpenCode, look for these log messages:

```
[kraken-code] Configuration updated
[kraken-code] Injecting agent: Nautilus, has permission: true/false
[kraken-code]    Agent Nautilus permission keys: [list of keys]
[kraken-code] Sanitized Nautilus permission: { final: "permission" object }
```

If you see invalid keys in the output, the fix needs adjustment.

## How to See Logs

The logs will appear in your OpenCode session output. Look for:
1. `[kraken-code]` prefixed messages
2. Any warnings about "Skipping invalid permission key"
3. The final sanitized permission objects

## Expected Output

After the fix, each agent should have only these permission keys:
- `edit`
- `bash`
- `webfetch`
- `doom_loop`
- `external_directory`

With values: `"allow"`, `"ask"`, or `"deny"`

## Next Steps

1. **Restart OpenCode session** (fully, not just reloaded)
2. **Watch the logs** when the plugin loads
3. **If the error persists**, copy the `[kraken-code]` log output and share it
4. **If the error is gone**, the logging can be removed

## Still Getting the Error?

If you're still getting the ruleset validation error after restart:

1. Check the `[kraken-code]` log output
2. Look for any agents with unexpected permission keys
3. Check if any log shows warnings about skipped keys
4. Share the log output so we can see what's happening

## Build and Deploy Status

- ✅ `bun run build` - Success
- ✅ `npm link` - Active (symlinked to source)
- ✅ Git commits pushed to `origin/master`
- ✅ Version: `1.1.2` (latest)

The symlink points to: `~/clawd/Projects/kraken-code`
The dist files were last modified: `2026-01-29 17:54:50`
