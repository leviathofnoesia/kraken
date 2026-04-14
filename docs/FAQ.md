# Frequently Asked Questions

## What replaced the Kratos memory integration?

Kraken Code now uses a unified learning system that stores experiences, knowledge graph nodes, patterns, and spaced repetition schedules in a single on-disk store.

## Where is learning data stored?

By default at `~/.kraken/learning/learning-state.json`. You can change the path via the `learning.storagePath` setting.

## Can I disable parts of the learning system?

Yes. Each learning component has its own `enabled` flag (`experienceStore`, `knowledgeGraph`, `patternDetection`, `spacedRepetition`, `stateMachines`).

## How do I migrate from the old memory config?

If you already had a `memory` block in your config, Kraken Code will still read its `enabled`, `autoSave`, and `storagePath` values as defaults for the new learning config. Updating to the new `learning` block is recommended.

## Does the learning system work without MCP?

Yes. The learning tools are built-in and do not depend on external MCP servers.
