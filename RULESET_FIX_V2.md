# Ruleset Fix V2 - Sanitizing Invalid Permission Keys

## Root Cause

The original fix added default permissions when `agent.permission` was missing, but it **didn't handle agents that already had permission fields with INVALID keys**.

### The Problem

OpenCode's `AgentPermissionSchema` only accepts these keys:
- `edit`
- `bash`
- `webfetch`
- `doom_loop`
- `external_directory`

But agents Nautilus and Maelstrom use `createAgentToolRestrictions()` which creates:

```typescript
{
  permission: {
    write: "deny",  // ❌ INVALID - not in schema
    edit: "deny",   // ✅ VALID
    task: "deny"    // ❌ INVALID - not in schema
  }
}
```

These invalid keys (`write`, `task`) were being passed through to OpenCode, causing:

```
Invalid option: expected one of "allow"|"deny"|"ask"` at ruleset[12] and ruleset[14]
```

## The Fix

Updated the config hook to **always sanitize permissions**:

1. **Create a clean permission object** with only valid keys
2. **Copy only valid keys** from existing `agent.permission`
3. **Validate values** are `"allow"`, `"ask"`, or `"deny"`
4. **Apply defaults** for any missing valid keys
5. **Replace** the original permission object with the sanitized one

This runs for **all agents**, whether they have a permission field or not.

## Code Change

```typescript
const validPermissionKeys = ["edit", "bash", "webfetch", "doom_loop", "external_directory"] as const;
const defaultPermissions = {
  edit: "ask" as const,
  bash: "ask" as const,
  webfetch: "ask" as const,
  doom_loop: "ask" as const,
  external_directory: "ask" as const,
};

for (const agentName of Object.keys(newConfig.agent)) {
  const agent = newConfig.agent[agentName];
  if (agent) {
    const cleanPermission: Record<string, "allow" | "ask" | "deny"> = {};

    // Copy only valid permission keys from existing agent.permission
    if (agent.permission && typeof agent.permission === "object") {
      for (const key of validPermissionKeys) {
        if (key in agent.permission) {
          const value = agent.permission[key];
          if (value === "allow" || value === "ask" || value === "deny") {
            cleanPermission[key] = value;
          }
        }
      }
    }

    // Merge with defaults for any missing valid keys
    for (const key of validPermissionKeys) {
      if (!(key in cleanPermission)) {
        cleanPermission[key] = defaultPermissions[key];
      }
    }

    // Replace with sanitized permission object
    agent.permission = cleanPermission;
  }
}
```

## Impact

- **Fixes** ruleset validation errors for all agents
- **Preserves** explicit permission settings when valid
- **Removes** invalid permission keys that cause errors
- **Adds** defaults for missing valid keys

## Next Steps

1. Rebuild: `bun run build` ✅ Done
2. Plugin is linked globally ✅ Done
3. User needs to restart OpenCode session to load the updated plugin

## Testing

After restarting OpenCode, verify:
- [ ] Skill invocations work (no ruleset errors)
- [ ] Bash commands work
- [ ] File operations (read/write/edit/glob) work
- [ ] Webfetch works
- [ ] All agents are accessible
