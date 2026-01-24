# Kraken Code Model Switcher

Intelligent TUI agent model switching for Kraken Code with subscription-aware setup, presets, and history.

## Features

- **Subscription-Aware Setup**: Like legacy implementations, detects provider subscriptions and configures optimal models
- **Intelligent Presets**: Auto-generated presets (performance, quality, balanced, economy) based on available subscriptions
- **Custom Presets**: Create and save your own presets for quick switching
- **History & Rollback**: Track last 5 configurations with easy rollback
- **Interactive TUI**: Full menu-driven interface using @clack/prompts
- **Hybrid Commands**: Both slash commands and direct tool usage

## Commands

### Setup
```
/model-setup          # Run subscription wizard (first-time only)
/models               # Main menu for all operations
```

### View Status
```
/model-status         # Show current agent configurations
/model-available      # List all available models
/model-history        # View configuration history
```

### Change Models
```
/models Kraken claude-opus-4-5        # Set single agent
/model-preset quality                 # Apply preset
/models preset performance            # Apply preset (alternative)
/model-rollback 0                     # Restore from history
```

### Presets
```
/model-preset performance   # Fastest models
/model-preset quality       # Best quality models
/model-preset balanced      # Optimal mix
/model-preset economy       # Most cost-effective
/models create-preset my-workflow  # Save current as custom
```

## Supported Providers & Models

### Anthropic
- Claude Opus 4.5 (flagship)
- Claude Sonnet 4.5 (balanced)
- Claude Haiku 4.5 (fast)

### OpenAI
- GPT-4o (flagship)
- GPT-4o Mini (fast)

### Google (Antigravity)
- Gemini 3 Pro (flagship)
- Gemini 3 Flash (fast)
- Claude via Antigravity

## Configuration

Configuration is stored in `.opencode/config.json`:

```json
{
  "modelSwitcher": {
    "setupComplete": true,
    "setupDate": 1736726400000,
    "subscriptions": [
      { "provider": "anthropic", "tier": "pro" }
    ],
    "presets": {
      "performance": { ... },
      "quality": { ... },
      "balanced": { ... },
      "economy": { ... }
    },
    "customPresets": {
      "my-workflow": { ... }
    }
  },
  "agents": {
    "Kraken": { "model": "anthropic/claude-opus-4-5" },
    ...
  }
}
```

History is stored in `.opencode/model-switcher-history.json`.

## File Structure

```
kraken-code/
 ├── src/
│   ├── tools/
│   │   └── model-switcher/
│   │       ├── index.ts              # Main tool (model-switcher)
│   │       ├── catalog.ts            # Model database & recommendations
│   │       ├── config-manager.ts     # Config read/write + history
│   │       ├── setup-wizard.ts       # Subscription detection
│   │       └── command-generator.ts  # Auto-generate .md commands
│   └── tui/
│       └── model-menu.ts             # Interactive menus
└── .opencode/
    └── command/
        ├── models.md              # Main switcher command
        ├── model-setup.md         # Setup wizard
        ├── model-preset.md        # Preset apply
        ├── model-status.md        # Status view
        ├── model-history.md       # History
        ├── model-rollback.md      # Rollback
        └── model-available.md     # List models
```

## Architecture

### Tool Actions
- `set` - Change single agent model
- `set-all` - Change all agents to one model
- `preset` - Apply preset configuration
- `status` - Show current configuration
- `available` - List available models
- `create-preset` - Save current as custom preset
- `list-presets` - List all presets
- `history` - Show configuration history
- `rollback` - Restore previous configuration

### Presets
- **performance**: Fastest available models for quick iterations
- **quality**: Best quality models for complex tasks
- **balanced**: Optimal mix based on agent roles
- **economy**: Most cost-effective models

### Agent Recommendations
Based on agent role and subscription tier:

| Agent | Flagship | Balanced | Fast |
|-------|----------|----------|------|
| Kraken | Opus 4.5 | Sonnet 4.5 | Haiku 4.5 |
| Maelstrom | Opus 4.5 | Sonnet 4.5 | Haiku 4.5 |
| Nautilus | Sonnet 4.5 | Sonnet 4.5 | Gemini 3 Flash |
| Abyssal | GPT-4o | GPT-4o | GPT-4o Mini |
| Coral | Sonnet 4.5 | Sonnet 4.5 | Haiku 4.5 |
| Siren | Sonnet 4.5 | Sonnet 4.5 | GPT-4o Mini |
| Leviathan | Opus 4.5 | Sonnet 4.5 | Haiku 4.5 |
| Poseidon | Opus 4.5 | Sonnet 4.5 | Sonnet 4.5 |
| Scylla | Sonnet 4.5 | Sonnet 4.5 | Sonnet 4.5 |
| Pearl | Sonnet 4.5 | Sonnet 4.5 | Gemini 3 Flash |

## Dependencies

- `@clack/core` - TUI primitives
- `@clack/prompts` - Interactive prompts

## Development

```bash
# Type check
npx tsc --noEmit

# Build
bun run build
```
