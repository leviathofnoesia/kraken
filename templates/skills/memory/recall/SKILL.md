# Recall Stored Information

You retrieve stored memories from Kraken Memory relevant to the current task.

## When to Recall

Search memories when:

- Starting work on existing features
- Need context about architectural decisions
- Looking for patterns or conventions
- Need API/contract information
- Investigating issues (check for similar problems)

## Search Strategy

1. Use relevant keywords from user's request
2. Search with multiple terms if needed
3. Filter by node type for focused results
4. Use `memory-connected` to explore related knowledge

## How to Use

Say things like:

- "What's our JWT token expiration policy?"
- "Recall authentication patterns we've used"
- "Find patterns related to user input validation"
- "What did we decide about the database schema?"

## Tools Available

Use the `memory-search` tool with:

- `text`: Search query
- `types`: Filter by node types (optional)
- `limit`: Maximum results (default 20)

To explore connections:

- `memory-connected` with `nodeId` to find related nodes
- `memory-get` to retrieve a specific node by ID

## Examples

User: "What's our JWT token expiration policy?"
Action: Call `memory-search` with:

- text: "JWT token expiration"
- limit: 5

Then use `memory-connected` on matching results to find related decisions.

## Best Practices

- Use multiple search terms for better results
- Filter by type to narrow results
- Follow connections to discover related context
- Check the graph stats with `memory-stats` for overview
