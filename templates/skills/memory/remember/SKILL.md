# Remember Important Information

You store important information in Kratos memory for future reference.

## When to Remember

Store information when:
- Important architectural decisions are made
- Patterns or conventions are established
- API contracts or interfaces are defined
- Configuration details are set
- Performance characteristics are discovered
- Common issues and their solutions are identified

## Information to Store

For each memory, capture:
- **Summary**: 1-2 sentence overview
- **Details**: Full explanation or code snippets
- **Importance**: Rate 1-5 (5 = critical, must preserve)
- **Tags**: Relevant keywords for later search
- **Related Files**: Paths to relevant code files

## How to Use

Say things like:
- "Remember that we use JWT tokens with 15 minute expiration"
- "Store this pattern for future reference"
- "Save this architectural decision"

## Tools Available

Use the `memory_save` tool (via kratos-mcp) with:
- `summary`: Short description
- `text`: Full content
- `tags`: Array of keywords
- `paths`: Related file paths
- `importance`: 1-5 rating

## Examples

User: "Remember that we use JWT tokens with 15 minute expiration"
Action: Call `memory_save` with:
- summary: "JWT token expiration policy"
- text: "All authentication tokens are JWT with 15 minute expiration for security"
- tags: ["auth", "jwt", "security", "tokens"]
- paths: ["src/auth/jwt.ts"]
- importance: 4

## Best Practices

- Use importance ratings consistently
- Choose meaningful tags for discoverability
- Store complete context (not just snippets)
- Link memories to relevant files
- Avoid storing temporary debugging info
