# Migration Guide: 1.6.0

## Overview

Version `1.6.0` introduces universal target parity improvements and a faster validation path.

## What Changed

- New command: `kraken-code validate --target <target>`
- Universal runtime policy enforcement now applies to plugin-exposed tools in addition to bridge-exposed tools
- Universal CI matrix coverage for:
  - `init`
  - `install`
  - `status`
  - `doctor`
  - `validate`
  - bridge strict/standard policy behavior

## Action Required

1. Re-run initialization for your target:

```bash
kraken-code init --target <target>
```

2. Validate target bootstrap and bridge behavior:

```bash
kraken-code validate --target <target>
```

3. Optional detailed diagnostics:

```bash
kraken-code doctor --target <target> --strict
```

## Target-Specific Acceptance

Use the acceptance checklist and snippets in:

- `docs/UNIVERSAL_ACCEPTANCE.md`
