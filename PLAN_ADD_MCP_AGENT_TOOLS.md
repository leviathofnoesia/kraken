# Plan: Add Native MCP Access for Agents

## Summary

Add support for multiple MCP providers to be accessible natively by agents (agent-browser, etc.) with lazy loading and no automatic context injection. MCPs should only load when explicitly invoked.

**Important**: Also refactor existing MCPs (websearch, context7, grep-app) to be accessible as agent tools, not just remote configs for plugin registration.

## Phase 0: Pre-Planning (Constraint Analysis)

### Intent Classification

**Type**: Feature Enhancement

**Confidence**: High

**Rationale:**

- Agents need access to MCP tools beyond current offerings
- Lazy loading required for performance (don't initialize all MCPs)
- No auto-context injection (user wants explicit control)
- Multiple MCP providers: deepwiki, semgrep, sequential-thinking, remote-mcp-servers.org

### Scope

**Must Include**:

- Add remote MCP configurations for new providers (deepwiki, semgrep, sequential-thinking, bridgemind, remote-mcp-servers)
- Refactor existing MCPs (websearch, context7, grep-app) to also provide agent-accessible tools
- Implement lazy loading (initialize only when first tool is called)
- Prevent automatic context injection
- Add proper error handling and timeouts
- Create MCP loader class for managing lazy initialization
- Test MCP tool functionality for all MCPs
- Document available MCPs for users

**Must NOT Include**:

- Auto-injecting MCP context into every agent response
- Initializing all MCPs at plugin startup
- Embedding MCP implementations (use remote configs)
- Making existing MCPs inaccessible to agents

**Definition of Done**:

- [ ] MCPLoader class created with lazy loading
- [ ] Additional MCPs configured (deepwiki, semgrep, sequential-thinking, bridgemind, remote-mcp-servers)
- [ ] Existing MCPs refactored to agent tools (websearch, webfetch, context7_search, context7_get, grep_search, grep_get_file)
- [ ] MCP agent tools created for all 4 new MCPs
- [ ] Existing MCP agent tools created (6 tools)
- [ ] All MCP agent tools registered in plugin (available to agents)
- [ ] All MCPs support lazy loading (new + existing)
- [ ] No auto-context injection (explicit only)
- [ ] Tests created for all new MCPs (4) and existing MCPs (1)
- [ ] README.md updated with all MCP tools documentation
- [ ] MCP_TOOLS.md comprehensive guide created
- [ ] `bun test` passes all MCP tests
- [ ] `bun run typecheck` passes
- [ ] `bun run build` succeeds

## References

**New MCP Tools:**

- Deepwiki: https://mcp.deepwiki.com/mcp
- Semgrep: https://mcp.semgrep.ai/sse
- Sequential Thinking: https://remote-mcp-servers.org/sequential-thinking/mcp
- Bridgemind: https://remote-mcp-servers.org/bridgemind/mcp

**Existing MCPs (being refactored):**

- Exa AI (websearch): https://mcp.exa.ai/mcp
- Context7: https://mcp.context7.com/mcp
- Grep App: https://mcp.grep.app

**New Files to Create:**

1. `src/features/mcp/mcp-loader.ts` - Lazy loading implementation
2. `src/features/mcp/additional-mcps.ts` - Remote configurations (new MCPs)
3. `src/features/mcp/mcp-agent-tools.ts` - Agent-accessible tools (new MCPs)
4. `src/features/mcp/existing-mcp-agent-tools.ts` - Agent-accessible tools (existing MCPs)
5. `src/features/mcp/additional-mcps.test.ts` - Configuration tests (new MCPs)
6. `src/features/mcp/existing-mcp-agent-tools.test.ts` - Configuration tests (existing MCPs)
7. `MCP_TOOLS.md` - Comprehensive documentation

**Files to Modify:**

1. `src/features/mcp/types.ts` - Add MCP loader types
2. `src/features/mcp/index.ts` - Include new MCPs and export getMcpAgentTools
3. `src/index.ts` - Import and register getMcpAgentTools
4. `README.md` - Add MCP tools section

```

```
