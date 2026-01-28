# Troubleshooting

Common issues and solutions for Kraken Code.

## Installation Issues

### Plugin not loading

**Symptom:** Kraken Code features don't appear in OpenCode

**Solutions:**
1. Verify plugin is in config:
   ```bash
   cat ~/.config/opencode/opencode.json
   ```
   Should contain:
   ```json
   {
     "plugin": ["kraken-code"]
   }
   ```

2. Restart OpenCode:
   ```bash
   opencode --restart
   ```

3. Check installation:
   ```bash
   bun pm ls kraken-code
   ```

4. If missing, reinstall:
   ```bash
   bun install kraken-code
   ```

### Module not found errors

**Symptom:** `Error: Cannot find module 'kraken-code'`

**Solutions:**
1. Ensure Bun or npm is used for installation
2. Run from project root:
   ```bash
   cd /path/to/your/project
   bun install kraken-code
   ```
3. Clear cache and reinstall:
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

---

## Memory & Context Issues

### Kratos memory not persisting

**Symptom:** Memories don't persist across sessions

**Solutions:**
1. Check Kratos directory exists:
   ```bash
   ls -la ~/.kratos
   ```

2. Verify config has Kratos enabled:
   ```json
   {
     "kraken_code": {
       "kratos": {
         "enabled": true,
         "storage_path": "~/.kratos"
       }
     }
   }
   ```

3. Check permissions:
   ```bash
   chmod -R 755 ~/.kratos
   ```

### Context not pruning (token usage high)

**Symptom:** Context window fills up quickly

**Solutions:**
1. Enable DCP (Dynamic Context Pruning):
   ```json
   {
     "kraken_code": {
       "compression": {
         "enabled": true,
         "strategy": "aggressive"
       }
     }
   }
   ```

2. Check context usage:
   ```bash
   opencode stats
   ```

3. Monitor in session with context window monitor hook

---

## Blitzkrieg Issues

### Blitzkrieg not enforcing TDD

**Symptom:** Implementation allowed without tests

**Solutions:**
1. Verify Blitzkrieg is enabled:
   ```json
   {
     "kraken_code": {
       "blitzkrieg": {
         "enabled": true,
         "enforcement": "strict"
       }
     }
   }
   ```

2. Check hooks are loading:
   - Blitzkrieg Test Plan Enforcer
   - Blitzkrieg TDD Workflow
   - Blitzkrieg Evidence Verifier
   - Blitzkrieg Planner Constraints

3. Use `kraken-code doctor -c blitzkrieg` to verify

### Test plan enforcer too strict

**Symptom:** Can't proceed even for trivial changes

**Solutions:**
1. Set enforcement to `moderate` or `permissive`:
   ```json
   {
     "kraken_code": {
       "blitzkrieg": {
         "enforcement": "moderate"
       }
     }
   }
   ```

2. Disable for quick prototyping (not recommended for production):
   ```json
   {
     "kraken_code": {
       "blitzkrieg": {
         "enabled": false
       }
     }
   }
   ```

---

## Agent Issues

### Agent not responding

**Symptom:** Selected agent doesn't provide useful responses

**Solutions:**
1. Check agent is enabled:
   ```json
   {
     "kraken_code": {
       "agents": {
         "Atlas": {
           "enabled": true
         }
       }
     }
   }
   ```

2. Verify model is configured:
   ```json
   {
     "kraken_code": {
       "agents": {
         "Atlas": {
           "model": "zai/glm-4.7"
         }
       }
     }
   }
   ```

3. Try a different agent or the default Kraken agent

### Wrong agent auto-selected

**Symptom:** System picks the wrong specialist for a task

**Solutions:**
1. Manually specify agent:
   ```bash
   opencode run --agent Atlas "Plan architecture"
   ```

2. Disable agent auto-selection in config:
   ```json
   {
     "kraken_code": {
       "auto_select_agent": false
     }
   }
   ```

3. Use agent usage reminder hook to guide selection

---

## MCP Integration Issues

### MCP servers not connecting

**Symptom:** `MCP connection failed` errors

**Solutions:**
1. Check MCP configuration:
   ```bash
   opencode mcp list
   ```

2. Verify MCP server is installed:
   ```bash
   bun pm ls kratos-mcp
   ```

3. Test MCP directly:
   ```bash
   kratos-mcp --help
   ```

### Kratos MCP not working

**Symptom:** Memory tools don't work

**Solutions:**
1. Verify kratos-mcp is installed:
   ```bash
   bun install kratos-mcp@latest
   ```

2. Check MCP config in opencode.json:
   ```json
   {
     "mcp": {
       "servers": {
         "kratos": {
           "command": "node",
           "args": ["node_modules/kratos-mcp/dist/index.js"]
         }
       }
     }
   }
   ```

---

## CLI Issues

### `kraken-code` command not found

**Symptom:** `command not found: kraken-code`

**Solutions:**
1. Ensure global install:
   ```bash
   bun install -g kraken-code
   ```

2. Add bun to PATH (if not already):
   ```bash
   export PATH="$HOME/.bun/bin:$PATH"
   echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
   ```

3. Verify installation:
   ```bash
   which kraken-code
   ```

### `kraken-code doctor` fails

**Symptom:** Doctor checks fail or hang

**Solutions:**
1. Run with verbose output:
   ```bash
   kraken-code doctor --verbose
   ```

2. Run specific category:
   ```bash
   kraken-code doctor -c agents
   kraken-code doctor -c blitzkrieg
   kraken-code doctor -c kratos
   ```

3. Output as JSON for debugging:
   ```bash
   kraken-code doctor --json
   ```

---

## Hook Issues

### Hooks not firing

**Symptom:** Expected hook behavior doesn't happen

**Solutions:**
1. Check OpenCode version (requires 1.1.1+):
   ```bash
   opencode --version
   ```

2. Verify hooks are properly integrated (v1.1.0+ fix):
   - Should use `message.updated`, not `chat.message`
   - Should use `tool.execute.before/after`, not `chat.params`

3. Test specific hooks with debug mode:
   - Check logs for hook registration
   - Look for hook execution logs

### Session hooks causing errors

**Symptom:** Session crashes on start or end

**Solutions:**
1. Check session storage hook logs:
   - Look for JSONL write errors
   - Verify `~/.config/opencode/sessions/` is writable

2. Disable specific hooks if needed:
   ```json
   {
     "kraken_code": {
       "hooks": {
         "session_storage_hook": {
           "enabled": false
         }
       }
     }
   }
   ```

---

## Performance Issues

### Slow response times

**Symptom:** Takes long time to get responses

**Solutions:**
1. Enable context pruning:
   ```json
   {
     "kraken_code": {
       "compression": {
         "enabled": true,
         "strategy": "aggressive"
       }
     }
   }
   ```

2. Reduce context window limit:
   ```json
   {
     "contextWindow": {
       "maxTokens": 50000
     }
   }
   ```

3. Use faster model for simple tasks:
   ```json
   {
     "kraken_code": {
       "agents": {
         "Kraken": {
           "model": "zai/glm-4-flash"
         }
       }
     }
   }
   ```

### High token usage

**Symptom:** Rapidly consuming token quota

**Solutions:**
1. Check token usage:
   ```bash
   opencode stats --days 7
   ```

2. Enable all optimization features:
   - Kratos memory (reuse past knowledge)
   - DCP pruning (intelligent compression)
   - Session search (find existing solutions)

3. Use Ultrathink mode sparingly (only for complex problems)

---

## Getting Help

If you can't resolve your issue:

1. **Check the docs:**
   - [README.md](README.md) - Main documentation
   - [FEATURES.md](FEATURES.md) - Feature overview
   - [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) - Integration details

2. **Run diagnostics:**
   ```bash
   kraken-code doctor --verbose
   ```

3. **Check OpenCode status:**
   ```bash
   opencode status
   ```

4. **Search existing issues:**
   - Visit [GitHub Issues](https://github.com/leviathofnoesia/kraken-code/issues)

5. **Create a new issue:**
   - Include your config: `cat ~/.config/opencode/opencode.json`
   - Include doctor output: `kraken-code doctor --json`
   - Describe reproduction steps
   - Include environment details (OS, Bun version, etc.)

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module 'kraken-code'` | Plugin not installed | Run `bun install kraken-code` |
| `Hook "chat.message" not found` | Outdated hooks (pre-1.1.0) | Update to v1.1.0+ |
| `Kratos memory not initialized` | Kratos not configured | Enable Kratos in config |
| `Blitzkrieg enforcement failed` | Missing test plan | Create test plan first |
| `MCP connection refused` | MCP server not running | Check MCP config and server |
| `Context window exceeded` | Too much context | Enable DCP compression |
| `Agent not found` | Agent disabled or missing | Check agent config |
| `Session save failed` | Permission denied | Check directory permissions |

---

## Diagnostic Commands

Run these commands to gather diagnostic info:

```bash
# System info
kraken-code doctor --verbose

# OpenCode status
opencode status

# Config check
cat ~/.config/opencode/opencode.json

# Memory check
ls -la ~/.kratos

# Sessions check
ls -la ~/.config/opencode/sessions/

# MCP status
opencode mcp list

# Package check
bun pm ls kraken-code
bun pm ls kratos-mcp
```

---

Still having issues? Please open a GitHub issue with your diagnostic information!
