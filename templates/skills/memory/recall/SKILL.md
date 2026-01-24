# Recall Stored Information

You retrieve stored memories from Kratos relevant to the current task.

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
3. Check recent memories for context
4. Filter by importance for high-value information

## How to Use

Say things like:
- "What's our JWT token expiration policy?"
- "Recall authentication patterns we've used"
- "Find patterns related to user input validation"
- "What did we decide about the database schema?"

## Tools Available

Use the `memory_search` tool (via kratos-mcp) with:
- `q`: Search query or keywords
- `k`: Maximum results (default 10)
- `tags`: Filter by specific tags

## Examples

User: "What's our JWT token expiration policy?"
Action: Call `memory_search` with:
- q: "JWT token expiration"
- tags: ["auth", "jwt"]
- k: 5

## Best Practices

- Use multiple search terms for better results
- Filter by tags to narrow results
- Check importance ratings to prioritize
- Look at recent memories for current context
