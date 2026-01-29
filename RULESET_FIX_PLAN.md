# Fix Plan for Ruleset Validation Errors

## Problem

All skill invocations and several file operations are failing with:
```
Invalid option: expected one of "allow"|"deny"|"ask"` at `ruleset[12]` and `ruleset[14]`
```

### Symptoms
- Skills fail: vercel-react-best-practices, web-design-guidelines, baseline-ui, agent-browser, etc.
- File ops fail: bash commands, glob patterns, read tool
- Webfetch fails
- Todo operations fail

## Root Cause Analysis

The `ruleset` is **OpenCode's internal configuration array** for validating tool/agent permissions. Each entry represents a permission rule with:
- `tool` or `agent` identifier
- `action` value: "allow", "deny", or "ask"

Indices 12 and 14 have invalid `action` values.

### Why This Affects Skills

Skills (loaded via MCP) are being interpreted by OpenCode with some default permission configuration. The issue is likely in:
1. **Missing explicit permission settings** in agent configurations
2. **Default permission propagation** that includes invalid values
3. **Agent override merging** that's corrupting the ruleset

## Proposed Fix

### Option A: Add Explicit Permission Defaults to All Agents

For each agent in `src/agents/`, add explicit permission defaults:

```typescript
const krakenAgent: AgentConfig = {
  // ... existing config
  permission: {
    edit: "ask",
    bash: "ask",
    webfetch: "ask",
    doom_loop: "ask",
    external_directory: "ask",
  }
}
```

**Pros:**
- Fixes all agents at once
- Makes permissions explicit and clear
- Consistent across all agents

**Cons:**
- Changes agent interface
- Requires updates to all agent files

### Option B: Fix Agent Override Schema Defaults

Update `AgentOverrideConfigSchema` to ensure `permission` defaults to valid values:

```typescript
export const AgentOverrideConfigSchema = z.object({
  // ... existing fields
  permission: AgentPermissionSchema.default({
    edit: "ask",
    bash: "ask", 
    webfetch: "ask",
    doom_loop: "ask",
    external_directory: "ask",
  }),
})
```

**Pros:**
- Minimal code change
- Fixes at schema level
- All agents inherit proper defaults

**Cons:**
- May still have issues if agents explicitly set invalid permissions

### Option C: Add Configuration Hook to Sanitize Ruleset

Add a hook that sanitizes the config before OpenCode validates it:

```typescript
hooks.push({
  config: async (newConfig: any) => {
    // Sanitize agent permissions
    if (newConfig.agent) {
      for (const agentName of Object.keys(newConfig.agent)) {
        const agent = newConfig.agent[agentName];
        if (agent && !agent.permission) {
          agent.permission = {
            edit: "ask",
            bash: "ask",
            webfetch: "ask",
            doom_loop: "ask",
            external_directory: "ask",
          };
        }
      }
    }
  }
})
```

**Pros:**
- Doesn't require schema changes
- Works with existing agent code
- Sanitizes all incoming configs

**Cons:**
- Adds runtime overhead
- Might mask deeper configuration issues

## Recommended Approach

**Use Option B + Option C combined:**

1. **Immediate Fix (Option C):** Add sanitization hook to ensure permissions are always set
2. **Structural Fix (Option B):** Update schema to have proper defaults

This provides:
- Immediate relief (sanitization)
- Long-term fix (schema defaults)
- Defense in depth (both approaches)

## Implementation Steps

1. Create `fix/ruleset-validation-errors` branch (✓ done)
2. Add sanitization hook to `src/index.ts`
3. Test with a skill invocation
4. Update `AgentOverrideConfigSchema` if needed
5. Run full test of skills, file ops, webfetch
6. Commit and push
7. Create PR with detailed explanation

## Testing Checklist

After fix, verify:
- [ ] Skill invocations work (test with vercel-react-best-practices)
- [ ] Bash commands execute without validation errors
- [ ] Glob patterns work
- [ ] Read tool works
- [ ] Webfetch functions
- [ ] Todo operations work
- [ ] All 8 hooks still functional
