import type { Plugin, PluginInput, Hooks, ToolDefinition } from "@opencode-ai/plugin"
import type { BackgroundManager } from "./features/background-agent/manager"
import type { AgentConfig } from "@opencode-ai/sdk"
import { z } from "zod"
import type { OpenCodeXConfig } from "./config/schema"

// Agents
import {
  krakenAgent,
  atlasAgent,
  nautilusAgent,
  abyssalAgent,
  coralAgent,
  sirenAgent,
  scyllaAgent,
  pearlAgent,
  maelstromAgent,
  leviathanAgent,
  poseidonAgent,
} from "./agents"

// Tools
import { opencodeXCompress } from "./tools/compression"
import { createRalphLoopHook } from "./hooks/ralph-loop"
import { createAutoUpdateChecker } from "./hooks/auto-update-checker"
import {
  ast_grep_search,
  ast_grep_replace,
} from "./tools/ast-grep"
import {
  session_list,
  session_read,
  session_search,
  session_info,
} from "./tools/session"
import { grep } from "./tools/grep"
import { ralphLoop } from "./tools/ralph-loop"
import { call_kraken_agent } from "./tools/agent-call"
import { recordToolUse } from "./storage"

// LSP tools
import {
  lsp_hover,
  lsp_goto_definition,
  lsp_find_references,
  lsp_document_symbols,
  lsp_workspace_symbols,
  lsp_diagnostics,
  lsp_prepare_rename,
  lsp_rename,
  lsp_code_actions,
  lsp_code_action_resolve,
  lsp_servers,
} from "./tools/lsp"

const builtinTools: Record<string, ToolDefinition> = {
  ast_grep_search,
  ast_grep_replace,
  grep,
  session_list,
  session_read,
  session_search,
  session_info,
  "model-switcher": opencodeXCompress,
  "ralph-loop": ralphLoop,
  lsp_hover,
  lsp_goto_definition,
  lsp_find_references,
  lsp_document_symbols,
  lsp_workspace_symbols,
  lsp_diagnostics,
  lsp_prepare_rename,
  lsp_rename,
  lsp_code_actions,
  lsp_code_action_resolve,
  lsp_servers,
  "websearch": {
    name: "websearch",
    description: "Search the web using Exa AI",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        numResults: { type: "number", default: 8 },
      },
      required: ["query"],
    },
  },
  "webfetch": {
    name: "webfetch",
    description: "Fetch a web page",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        format: { type: "string", enum: ["text", "markdown", "html"] },
      },
      required: ["url"],
    },
  },
  "context7-search": {
    name: "context7-search",
    description: "Search official documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        numResults: { type: "number", default: 5 },
      },
      required: ["query"],
    },
  },
  "context7-get": {
    name: "context7-get",
    description: "Get specific documentation",
    inputSchema: {
      type: "object",
      properties: {
        library: { type: "string" },
        section: { type: "string" },
      },
      required: ["library"],
    },
  },
  "grep-search": {
    name: "grep-search",
    description: "Search code across GitHub",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        language: { type: "string" },
        numResults: { type: "number", default: 10 },
      },
      required: ["query"],
    },
  },
  "grep-get-file": {
    name: "grep-get-file",
    description: "Get file from GitHub",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string" },
        path: { type: "string" },
      },
      required: ["repo", "path"],
    },
  },
  "call-kraken-agent": call_kraken_agent,
};

let backgroundManager: BackgroundManager | null = null;

const createOpenCodeXPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const config = (input as any).config as OpenCodeXConfig || {};

  const hooks: Hooks[] = [];

  // 1. Mode Hooks (Blitzkrieg/Analyze/Ultrathink detection and activation)
  const modeHooks = createModeHooks(input, config.modes);
  Object.assign(hooks, modeHooks);

  // 2. Session Storage Hooks (Todo and transcript tracking)
  const sessionStorageHooks = createSessionStorageHook(input, config.claudeCodeCompatibility?.dataStorage);
  Object.assign(hooks, sessionStorageHooks);

  // 3. Claude Code Compatibility Hooks (Settings.json, plugin toggles)
  const claudeCodeHooks = createClaudeCodeHooks(input, config.claudeCodeCompatibility);
  Object.assign(hooks, claudeCodeHooks);

  // 4. Basic tools
  hooks.push({ tool: builtinTools });

  // 5. Configuration Hook
  hooks.push({
    config: async (config: any) => {
      if (!config.agent) config.agent = {};
      const agents = getSeaThemedAgents();
      for (const [name, agentConfig] of Object.entries(agents)) {
        if (!config.agent[name]) config.agent[name] = agentConfig;
      }
      if (!config.default_agent && config.agent["Kraken"]) config.default_agent = "Kraken";

      // Initialize command loader
      try {
        await initializeCommandLoader();
        console.log("[kraken-code] Command loader initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing command loader:", e);
      }

      // Initialize skill MCP manager
      try {
        await initializeSkillMcpManager();
        console.log("[kraken-code] Skill MCP manager initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing skill MCP manager:", e);
      }

      // Initialize Kratos
      try {
        await initializeKratos();
        console.log("[kraken-code] Kratos initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing Kratos:", e);
      }

      // Initialize all MCP servers
      const mcpConfig = config.mcp || {};
      try {
        await initializeAllMcpServers(mcpConfig);
        console.log("[kraken-code] MCP servers initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing MCP servers:", e);
      }
    },
  });

  // 6. Feature/Lifecycle Hooks
  try {
    hooks.push(createThinkModeHook(input));
    hooks.push({ tool: createBackgroundAgentFeature(input).tools });
    hooks.push(createContextWindowMonitorHook(input));
    hooks.push(createRalphLoopHook(input));
    hooks.push(createContextInjector(input));
    hooks.push(createKeywordDetector(input));
    hooks.push(createAutoSlashCommand(input));
    hooks.push(createRulesInjector(input));
    hooks.push(createAgentUsageReminder(input));
    hooks.push(createAnthropicContextWindowLimitRecovery(input));
    hooks.push(createAutoUpdateChecker(input));
  hooks.push(createCompactionContextInjector(input));
  hooks.push(createDirectoryAgentsInjector(input));
  hooks.push(createDirectoryReadmeInjector(input));
  // hooks.push(createEditErrorRecovery(input));
  // hooks.push(createEmptyMessageSanitizer(input));
  hooks.push(createInteractiveBashSession(input));
  hooks.push(createNonInteractiveEnv(input));
  hooks.push(createPreemptiveCompaction(input));
  // hooks.push(createSessionRecovery(input));
  hooks.push(createThinkingBlockValidator(input));
  hooks.push(createCommentChecker(input));
  // hooks.push(createBlitzkriegTestPlanEnforcerHook(input));
  // hooks.push(createBlitzkriegTddWorkflowHook(input));
  // hooks.push(createBlitzkriegEvidenceVerifierHook(input));
  // hooks.push(createBlitzkriegPlannerConstraintsHook(input));
  // hooks.push(createSessionIdleDetectorHook(input));
  // hooks.push(createNotificationsHook(input));
  } catch (e) {
    console.error("Kraken Code: Error initializing hooks", e);
  }

  // 7. Storage Hooks
  hooks.push({
    "tool.execute.after": async (input: any, output: any) => {
      if (!output.output) return;

      const { tool, sessionID } = input;

      // Record tool usage in transcript
      if (output.output && output.output.toolOutput) {
        await recordToolUse(
          sessionID,
          tool,
          output.output.toolInput,
          output.output.toolOutput
        );
      }

      if (sessionID) {
        console.log(`[storage-hooks] Tool ${tool} completed for session ${sessionID}`);
      }
    },
  });

  hooks.push({
    config: async (config: any) => {
      const mcpConfig = config.mcp || {};
      try {
        await initializeAllMcpServers(mcpConfig);
      } catch (e) {
        console.error("Kraken Code: Error initializing MCP servers", e);
      }
    },
  });

  // 8. MCP Shutdown on plugin exit
  process.on("exit", async () => {
    try {
      await shutdownAllMcpServers();
      await shutdownKratos();
    } catch (e) {
      console.error("Kraken Code: Error shutting down services", e);
    }
  });

  return mergeHooks(...hooks);
};

export default createOpenCodeXPlugin;
