# Kratos Memory Integration

Kratos is an ultra-lean memory system for AI coding tools.

## Features

- **Project Isolation**: Each project has its own memory database
- **Semantic Search**: Find memories by meaning, not just keywords
- **Importance Ratings**: 1-5 scale for prioritization
- **Tagging**: Organize memories with custom tags
- **Path Tracking**: Link memories to specific files

## Tools

### memory_save
Store a new memory in the active Kratos database:

```typescript
{
  summary: "JWT token expiration policy",
  text: "All tokens expire after 15 minutes",
  tags: ["auth", "jwt", "security"],
  paths: ["src/auth/jwt.ts"],
  importance: 4
}
```

### memory_search
Search Kratos memories by query or tags:

```typescript
{
  q: "authentication token",
  k: 10,
  tags: ["auth"]
}
```

### memory_get_recent
Get recent memories from the active project:

```typescript
{
  k: 10
}
```

## Storage

```
~/.kratos/
├── projects/
│   ├── proj_<id>/
│   │   └── memories.db  # SQLite database
│   └── [other projects]/
└── projects.json  # Project metadata
```

## Usage in Kraken Code

Kratos is integrated as MCP tools available to all agents:
- Agents automatically save important decisions
- Memories are retrieved before complex tasks
- Use "remember" and "recall" skills to interact directly
- Memories are stored in `~/.kratos/` by default

## Best Practices

- Use importance ratings consistently (5 = critical)
- Choose meaningful tags for discoverability
- Store complete context (not just snippets)
- Link memories to relevant files
- Search by multiple terms for better results
