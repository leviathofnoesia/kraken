# Kraken Code Examples

## Learning Tools

### Capture an Experience

```bash
learning_add_experience --summary "Switched cache strategy" \
  --details "Moved from LRU to segmented cache to handle bursty traffic." \
  --tags ["performance", "caching"] \
  --outcome "Reduced 99p latency by 12%" \
  --confidence 0.8
```

### Create Knowledge Nodes

```bash
learning_add_knowledge_node --title "Cache segmentation" \
  --content "Segment cache into hot/warm buckets to reduce churn." \
  --type "decision" \
  --tags ["performance", "design"]
```

### Link Knowledge Nodes

```bash
learning_link_knowledge_nodes --sourceId node_123 --targetId node_456 \
  --relation "depends_on" --strength 0.7
```

### Record a Pattern

```bash
learning_record_pattern --name "cache-churn" \
  --description "Cache churn increases once traffic exceeds 1k rps." \
  --triggers ["cache", "traffic"]
```

### Review Queue

```bash
learning_get_review_queue --dueBefore "2025-01-01T00:00:00.000Z"
```

### Log a Review

```bash
learning_review_node --nodeId node_123 --quality 4
```

### State Machines

```bash
learning_create_state_machine --name "Release Checklist" \
  --states ["planned", "in-progress", "verified", "released"] \
  --transitions '[{"from":"planned","to":"in-progress","event":"start"},{"from":"in-progress","to":"verified","event":"qa"},{"from":"verified","to":"released","event":"ship"}]' \
  --initialState "planned"
```

## Configuration Example

```json
{
  "learning": {
    "enabled": true,
    "storagePath": "~/.kraken/learning",
    "experienceStore": { "enabled": true, "maxEntries": 2000 },
    "knowledgeGraph": { "enabled": true, "maxNodes": 5000 },
    "patternDetection": { "enabled": true, "minConfidence": 0.6 },
    "spacedRepetition": { "enabled": true, "initialIntervalDays": 1 },
    "stateMachines": { "enabled": true }
  }
}
```
