# Remember Important Information

You store important information in Kraken Memory for future reference.

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

- **ID**: Unique identifier for the node
- **Title**: Short descriptive title
- **Content**: Full explanation or code snippets
- **Type**: concept, fact, procedure, pattern, decision, error, reference, or experience
- **Tags**: Relevant keywords for later search

## How to Use

Say things like:

- "Remember that we use JWT tokens with 15 minute expiration"
- "Store this pattern for future reference"
- "Save this architectural decision"

## Tools Available

Use the `memory-add` tool with:

- `id`: Unique identifier
- `title`: Short description
- `content`: Full content
- `type`: Node type (concept, fact, procedure, pattern, decision, error, reference, experience)
- `tags`: Array of keywords

To connect related knowledge, use `memory-link`:

- `sourceId`: First node ID
- `targetId`: Second node ID
- `relation`: Relationship type (e.g., related_to, depends_on, derived_from)
- `strength`: Connection strength (0-1)

## Examples

User: "Remember that we use JWT tokens with 15 minute expiration"
Action: Call `memory-add` with:

- id: "jwt-policy"
- title: "JWT Token Expiration Policy"
- content: "All authentication tokens are JWT with 15 minute expiration for security"
- type: "decision"
- tags: ["auth", "jwt", "security", "tokens"]

## Best Practices

- Use descriptive, unique IDs
- Choose the correct node type
- Link related nodes with `memory-link`
- Store complete context (not just snippets)
- Tag consistently for discoverability
- Avoid storing temporary debugging info
