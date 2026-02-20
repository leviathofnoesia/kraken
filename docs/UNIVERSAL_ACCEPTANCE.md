# Universal Client Acceptance

This checklist verifies Kraken plugin parity across supported non-OpenCode clients.

## Common Preparation

```bash
bun install -g kraken-code
kraken-code --version
```

## Codex

Setup:

```bash
kraken-code init --target codex
```

Smoke test:

```bash
kraken-code validate --target codex
```

## Claude Code

Setup:

```bash
kraken-code init --target claude
```

Smoke test:

```bash
kraken-code validate --target claude
```

## Cline

Setup:

```bash
kraken-code init --target cline
```

Smoke test:

```bash
kraken-code validate --target cline
```

## Cursor

Setup:

```bash
kraken-code init --target cursor
```

Smoke test:

```bash
kraken-code validate --target cursor
```

## VS Code / Antigravity

Setup:

```bash
kraken-code init --target vscode
```

Smoke test:

```bash
kraken-code validate --target vscode
```

## CI Agents (CodeRabbit / Greptile)

Setup:

```bash
kraken-code init --target ci
```

Smoke test:

```bash
kraken-code validate --target ci
```

## Optional Strict Check

Use strict runtime bridge mode to confirm read-only enforcement:

```bash
printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"ast_grep_replace","arguments":{"pattern":"x","replacement":"y","language":"typescript"}}}' \
| kraken-code bridge start --target codex --mode strict
```

Expected: second response contains `code: -32001` (policy block).
