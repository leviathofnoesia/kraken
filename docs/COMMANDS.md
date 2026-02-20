# CLI Commands

## Core Commands

### kraken-code --version

Display version information.

```bash
kraken-code --version
# Output: kraken-code v1.2.1
```

### kraken-code --help

Show help message.

```bash
kraken-code --help
```

### kraken-code status

Display current configuration and system status.

```bash
kraken-code status
```

### kraken-code doctor

Run system diagnostics to verify installation.

```bash
kraken-code doctor
```

### kraken-code validate

Run fast target validation (adapter schema + bridge launchability).

```bash
kraken-code validate --target codex
kraken-code validate --target claude
```

### kraken-code init

Initialize Kraken Code with OpenCode.

```bash
# Minimal setup (agents only)
kraken-code init --minimal

# Full setup (all features)
kraken-code init --full

# Universal targets
kraken-code init --target codex
kraken-code init --target cursor
```

## Learning Commands

Record and manage knowledge:

```bash
# Add experience
learning_add_experience --summary "Solution" --details "Details" --tags ["tag1"]

# Search experiences
learning_search_experiences --query "keyword"

# Add knowledge node
learning_add_knowledge_node --title "Concept" --content "Explanation"

# List patterns
learning_list_patterns

# Get review queue
learning_get_review_queue
```

See [Learning System](./LEARNING.md) for complete documentation.
