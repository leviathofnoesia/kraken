# Popular Tools & Services

Kraken-Code comes with a comprehensive feature set, but you can easily extend it with these popular services.

## Installation

### Supabase
Database, Auth, and Realtime.
- **MCP:** `supabase-mcp` (Official/Community)
- **Setup:** Requires Project ID, Anon Key, and Service Role Key.

## Manual Installation Required
These tools do not have a standalone MCP server package suitable for automated installation (they may require interactive wizards or hosted connections). Follow the links to set them up manually in your `~/.config/opencode/opencode.json`.

### Vercel
Deployment platform.
- **Installation:** [Vercel MCP Documentation](https://vercel.com/docs/mcp/vercel-mcp)
- **Method:** Connect to `https://mcp.vercel.app` (SSE) via your MCP client config.

### Cloudflare
Edge platform (Workers, R2, D1).
- **Installation:** `npx @cloudflare/mcp-server-cloudflare`
- **Docs:** [Cloudflare MCP GitHub](https://github.com/cloudflare/mcp-server-cloudflare)
- **Note:** Requires manual authentication flow (`wrangler login`).

### PostHog
Product analytics.
- **Installation:** `npx @posthog/wizard@latest mcp add`
- **Docs:** [PostHog MCP Documentation](https://posthog.com/docs/model-context-protocol)
- **Method:** Interactive wizard adds it to your config.

### Polar
Funding platform for open source.
- **Installation:** Check [Polar Documentation](https://docs.polar.sh) for latest MCP support.
