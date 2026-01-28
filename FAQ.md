# Frequently Asked Questions

## General

### What is Kraken Code?

Kraken Code is a plugin for OpenCode that transforms it into an autonomous, high-density development environment. It adds:

- 11 specialized sea-themed agents
- Persistent memory (Kratos)
- TDD enforcement (Blitzkrieg)
- Intelligent context pruning (~70% token savings)
- 30+ hooks for customization
- Built-in MCP integrations

### Why "sea-themed" agents?

The sea theme provides memorable, evocative names for agents with clear domains:

- **Kraken** - Orchestrates everything (like the mythical sea monster)
- **Atlas** - Holds up the world (planning & breakdown)
- **Nautilus** - Explores depths (codebase exploration)
- **Abyssal** - Deep analysis (abyssal zones)
- **Coral** - Building structures (UI construction)
- **Siren** - Calls out clearly (documentation)
- **Scylla** - Tests thoroughly (mythical sea monster)
- **Pearl** - Polishes and refines (refactoring)
- **Maelstrom** - Deep reasoning (turbulent analysis)
- **Leviathan** - Large-scale projects (sea monster)
- **Poseidon** - Controls infrastructure (god of the sea)

It's fun and helps remember which agent does what!

### How much does Kraken Code cost?

Kraken Code is **free and open-source** (MIT license). You only pay for:

- OpenCode subscription (if applicable)
- API costs for the models you use
- Your token usage (though Kratos + DCP reduces this by ~70%)

---

## Installation & Setup

### How do I install Kraken Code?

```bash
bun install kraken-code
```

Then add to `~/.config/opencode/opencode.json`:
```json
{
  "plugin": ["kraken-code"]
}
```

That's it!

### Do I need Bun? Can I use npm?

You can use npm, but Bun is recommended (faster installs, native TypeScript):

```bash
npm install kraken-code
```

### What version of OpenCode do I need?

OpenCode **1.1.1 or later** is required for full hook compatibility. Earlier versions may have issues with hooks.

### Do I need to configure everything?

No! Kraken Code works out of the box with sensible defaults. Run:

```bash
kraken-code init --full
```

For recommended configuration, or use minimal setup:
```bash
kraken-code init --minimal
```

---

## Agents

### How do I choose which agent to use?

You can:

1. **Let Kraken auto-select** (default)
2. **Specify on command line:**
   ```bash
   opencode run --agent Atlas "Plan architecture"
   ```
3. **Set as default in config:**
   ```json
   {
     "kraken_code": {
       "default_agent": "Atlas"
     }
   }
   ```

### When should I use each agent?

| Task | Best Agent |
|------|------------|
| Complex task planning | Atlas |
| Exploring codebase | Nautilus |
| Deep analysis/debugging | Abyssal |
| Building UI | Coral |
| Writing docs | Siren |
| Writing tests | Scylla |
| Refactoring code | Pearl |
| Hard problems | Maelstrom |
| Large refactors | Leviathan |
| Infrastructure/data | Poseidon |
| General/orchestration | Kraken |

### Can I use multiple agents in one session?

Yes! Switch between agents using the `agent` command or let Kraken coordinate multiple agents for complex tasks.

### Can I disable agents I don't use?

Yes, disable individual agents in config:

```json
{
  "kraken_code": {
    "agents": {
      "Maelstrom": {
        "enabled": false
      }
    }
  }
}
```

---

## Memory (Kratos)

### What does Kratos store?

Kratos stores:

- Memories (learned knowledge, decisions, patterns)
- Session transcripts (conversation history)
- Context summaries (compacted session state)
- Todos (persistent task tracking)

### Where is Kratos stored?

By default: `~/.kratos/`

You can customize in config:
```json
{
  "kraken_code": {
    "kratos": {
      "storage_path": "~/custom/path"
    }
  }
}
```

### Does Kratos store my code?

No, Kratos stores **metadata and context**, not your actual code. It stores:

- What you learned
- Decisions you made
- Patterns you discovered
- Solutions to problems

### How do I search Kratos?

Use the memory tools:

```bash
# Search memories
opencode run "Search Kratos for React patterns"

# Get recent memories
opencode run "What did I learn about testing?"

# Natural language query
opencode run "Ask Kratos about performance issues"
```

### Can I export Kratos data?

Yes, it's stored as JSONL files in `~/.kratos/`. You can:

1. Copy the directory:
   ```bash
   cp -r ~/.kratos ~/kratos-backup
   ```

2. Export with OpenCode:
   ```bash
   opencode export
   ```

---

## Blitzkrieg (TDD)

### What is Blitzkrieg?

Blitzkrieg is Kraken Code's TDD enforcement system. It ensures:

1. **Test plans are written** before implementation
2. **Tests pass** before completing tasks
3. **Evidence is verified** (test results, coverage)
4. **Steps are planned** (prevents analysis paralysis)

### Do I have to use Blitzkrieg?

No, you can disable it:

```json
{
  "kraken_code": {
    "blitzkrieg": {
      "enabled": false
    }
  }
}
```

But it's highly recommended for production code!

### Can Blitzkrieg be less strict?

Yes, set enforcement level:

```json
{
  "kraken_code": {
    "blitzkrieg": {
      "enforcement": "moderate"  // or "permissive"
    }
  }
}
```

- **strict** - Full enforcement (default)
- **moderate** - Some flexibility
- **permissive** - Gentle reminders only

### Does Blitzkrieg work with any testing framework?

Yes! It's framework-agnostic. Works with:

- Jest, Vitest, Mocha, Chai
- Testing Library
- Cypress, Playwright, Puppeteer
- Any other test framework

---

## Context & Performance

### How does Kraken Code save tokens?

Three ways:

1. **Kratos Memory** - Reuse past knowledge instead of re-explaining
2. **DCP (Dynamic Context Pruning)** - Intelligently removes unnecessary context (~70% savings)
3. **Session Search** - Find existing solutions instead of re-solving

### What's the typical token savings?

~70% on average, depending on:

- How often you reuse memories
- Your context pruning settings
- The complexity of your projects

### Can I adjust context pruning?

Yes, configure compression:

```json
{
  "kraken_code": {
    "compression": {
      "enabled": true,
      "strategy": "aggressive"  // or "standard", "minimal"
    }
  }
}
```

### Is Kraken Code slow?

Not at all! It's designed to be lightweight:

- Hooks run in milliseconds
- Memory queries are fast (indexed JSONL)
- MCP servers are subprocess-based (non-blocking)

---

## MCP Integration

### What MCPs are included?

Built-in MCPs:

- **Kratos** - Persistent memory
- **Websearch** - Exa AI web search
- **Context7** - Official docs lookup
- **Grep App** - GitHub code search

### Can I add my own MCPs?

Yes! Add to OpenCode config:

```json
{
  "mcp": {
    "servers": {
      "my-mcp": {
        "command": "node",
        "args": ["path/to/my-mcp/index.js"]
      }
    }
  }
}
```

### Do I need kratos-mcp?

If you use Kratos memory, yes:

```bash
bun install kratos-mcp
```

Kraken Code handles the configuration automatically.

---

## Hooks

### What are hooks?

Hooks let you customize OpenCode's behavior. Kraken Code provides **30+ hooks** that:

- Enforce workflows (Blitzkrieg)
- Manage context (pruning, compression)
- Validate output (thinking blocks, comments)
- Handle errors (recovery mechanisms)
- Track state (sessions, todos)

### Can I disable hooks I don't want?

Yes, disable in config:

```json
{
  "kraken_code": {
    "hooks": {
      "comment_checker": {
        "enabled": false
      }
    }
  }
}
```

### Can I write my own hooks?

Absolutely! Hooks are just TypeScript functions in `src/hooks/`. See existing hooks for examples.

---

## CLI

### What commands does `kraken-code` provide?

```bash
kraken-code install    # Install and register plugin
kraken-code init       # Initialize config
kraken-code status     # Show status
kraken-code doctor     # Run diagnostics
```

### What does `kraken-code doctor` do?

Checks for:

- Plugin installation
- OpenCode compatibility
- Agent configuration
- Blitzkrieg setup
- Kratos storage
- MCP servers
- Config validity

Run with categories:
```bash
kraken-code doctor -c agents
kraken-code doctor -c blitzkrieg
kraken-code doctor -c kratos
```

---

## Troubleshooting

### Kraken Code isn't working!

1. Verify plugin in config:
   ```bash
   cat ~/.config/opencode/opencode.json
   ```

2. Check installation:
   ```bash
   bun pm ls kraken-code
   ```

3. Run diagnostics:
   ```bash
   kraken-code doctor --verbose
   ```

4. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Hooks aren't firing!

Ensure you're using:

- **Kraken Code v1.1.0+** (hooks fix)
- **OpenCode v1.1.1+** (proper hook API)

Pre-1.1.0 hooks used incorrect API names.

### Memory isn't persisting!

1. Verify Kratos directory:
   ```bash
   ls -la ~/.kratos
   ```

2. Check Kratos is enabled in config:
   ```json
   {
     "kraken_code": {
       "kratos": {
         "enabled": true
       }
     }
   }
   ```

3. Check permissions:
   ```bash
   chmod -R 755 ~/.kratos
   ```

---

## Usage Examples

### How do I use Kraken Code in a real project?

```bash
# Initialize
cd my-project
kraken-code init --full

# Start OpenCode
opencode

# Plan a feature
opencode run --agent Atlas "Plan user authentication system"

# Implement with TDD enforcement
opencode run "Implement login endpoint"

# Kratos will remember decisions
opencode run "What did we decide about password hashing?"

# Explore codebase
opencode run --agent Nautilus "Find all database queries"

# Write tests
opencode run --agent Scylla "Test the auth system"
```

### Can I use Kraken Code with existing projects?

Yes! Kraken Code works with:

- JavaScript/TypeScript projects
- React, Vue, Angular, Svelte
- Node.js backends
- Any OpenCode-supported language

Just install and start using:

```bash
cd existing-project
bun install kraken-code
opencode
```

---

## Comparison

### Kraken Code vs OpenCode alone?

| Feature | OpenCode Alone | With Kraken |
|---------|---------------|-------------|
| Agent system | Basic | 11 specialized agents |
| Memory | Per-session | Persistent across sessions |
| TDD enforcement | Manual | Blitzkrieg automation |
| Context pruning | Basic | ~70% savings with DCP |
| Hooks | Limited | 30+ extensive hooks |
| MCP integration | Manual | 4 built-in MCPs |
| Customization | Config only | Hooks + agents + skills |

---

## Advanced

### Can I customize agents?

Yes! You can:

1. **Change models per agent:**
   ```json
   {
     "kraken_code": {
       "agents": {
         "Atlas": {
           "model": "claude-3-opus"
         }
       }
     }
   }
   ```

2. **Customize prompts** (edit agent files in `src/agents/`)

3. **Create new agents** (follow existing agent patterns)

### What are skills?

Skills are reusable workflows stored in `~/.config/opencode/skill/`. Each skill has a `SKILL.md` file that defines what it does.

Use skills for:

- Project-specific workflows
- Team conventions
- Repeated patterns
- Custom integrations

### How do I create a skill?

1. Create skill directory:
   ```bash
   mkdir -p ~/.config/opencode/skill/my-skill
   ```

2. Write `SKILL.md`:
   ```markdown
   # My Skill

   What this skill does and when to use it.

   ## Usage

   Instructions for using this skill.
   ```

3. Use in OpenCode:
   ```bash
   opencode run --skill my-skill "Do something"
   ```

---

## Still Have Questions?

- Check [README.md](README.md) for main documentation
- Check [FEATURES.md](FEATURES.md) for feature details
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for issues
- Search [GitHub Issues](https://github.com/leviathofnoesia/kraken-code/issues)
- Open a new issue with your question!
