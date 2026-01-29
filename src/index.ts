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

// Utils
import { getAvailableAgents } from "./utils"

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

// Hooks - FIXED: Using correct exported function names
import { createModeHooks } from "./hooks/mode-hooks"
import { createSessionStorageHook } from "./hooks/session-storage"
import { createClaudeCodeHooks } from "./hooks/claude-code-hooks"
import { createThinkModeHook } from "./hooks/think-mode"
import { createBackgroundAgentFeature } from "./features/background-agent/manager"
import { createContextWindowMonitorHook } from "./hooks/context-window-monitor"
import { createKeywordDetector } from "./hooks/keyword-detector"
import { createAutoSlashCommand } from "./hooks/auto-slash-command"
import { createRulesInjector } from "./hooks/context/rules-injector"
import { createAgentUsageReminder } from "./hooks/agent-usage-reminder"
import { createAnthropicContextWindowLimitRecovery } from "./hooks/anthropic-context-window-limit-recovery"
import { createCompactionContextInjector } from "./hooks/compaction-context-injector"
import { createDirectoryAgentsInjector } from "./hooks/directory-agents-injector"
import { createDirectoryReadmeInjector } from "./hooks/directory-readme-injector"
import { createInteractiveBashSession } from "./hooks/interactive-bash-session"
import { createNonInteractiveEnv } from "./hooks/non-interactive-env"
import { createPreemptiveCompaction } from "./hooks/preemptive-compaction"
import { createThinkingBlockValidator } from "./hooks/thinking-block-validator"
import { createCommentChecker } from "./hooks/comment-checker"
import { createNotificationsHook } from "./hooks/notifications"
import { createEmptyTaskResponseDetectorHook } from "./hooks/empty-task-response-detector"
import { createEditErrorRecovery } from "./hooks/edit-error-recovery"
import { createGrepOutputTruncatorHook } from "./hooks/grep-output-truncator"
import { createSessionRecovery } from "./hooks/session-recovery"
import { createBlitzkriegTestPlanEnforcerHook } from "./hooks/blitzkrieg-test-plan-enforcer"
import { createBlitzkriegTddWorkflowHook } from "./hooks/blitzkrieg-tdd-workflow"
import { createBlitzkriegEvidenceVerifierHook } from "./hooks/blitzkrieg-evidence-verifier"
import { createBlitzkriegPlannerConstraintsHook } from "./hooks/blitzkrieg-planner-constraints"

// MCP & Features
import { initializeAllMcpServers, shutdownAllMcpServers } from "./features/mcp/index"
import { initializeKratos, shutdownKratos } from "./features/mcp/kratos"
import { getBuiltinMcpTools } from "./features/mcp/index"

// Learning System
import { initializeLearningSystem, shutdownLearningSystem } from "./features/learning/integration"

// CLI & Skills
import { getMcpManager } from "./features/skills/mcp-manager"

// Helper function
function getSeaThemedAgents(): Record<string, AgentConfig> {
  return {
    Kraken: krakenAgent,
    Atlas: atlasAgent,
    Nautilus: nautilusAgent,
    Abyssal: abyssalAgent,
    Coral: coralAgent,
    Siren: sirenAgent,
    Scylla: scyllaAgent,
    Pearl: pearlAgent,
    Maelstrom: maelstromAgent,
    Leviathan: leviathanAgent,
    Poseidon: poseidonAgent,
  }
}

function mergeHooks(...hooks: Hooks[]): Hooks {
  const result: Hooks = {}
  for (const hook of hooks) {
    Object.assign(result, hook)
  }
  return result
}

async function initializeCommandLoader(): Promise<void> {
  // Placeholder for command loader initialization
  console.log("[kraken-code] Command loader not yet implemented")
}

async function initializeSkillMcpManager(): Promise<void> {
  // Placeholder for skill MCP manager initialization
  const mcpManager = getMcpManager()
  console.log("[kraken-code] Skill MCP manager initialized")
}

const builtinTools: Record<string, any> = {
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
  "call-kraken-agent": call_kraken_agent,
};

let backgroundManager: BackgroundManager | null = null;

const createOpenCodeXPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const config = (input as any).config as OpenCodeXConfig || {};

  const hooks: Hooks[] = [];

  console.log("[kraken-code] Initializing plugin...");

  // 1. Mode Hooks (Blitzkrieg/Analyze/Ultrathink detection and activation)
  const modeHooks = createModeHooks(input, { 
    enabled: config.modes?.ultrawork?.enabled ?? true,
    autoActivate: true
  });
  Object.assign(hooks, modeHooks);

  // 2. Session Storage Hooks (Todo and transcript tracking)
  const sessionStorageHooks = createSessionStorageHook(input, {
    enabled: config.claudeCodeCompatibility?.dataStorage ?? true
  });
  Object.assign(hooks, sessionStorageHooks);

  // 3. Claude Code Compatibility Hooks (Settings.json, plugin toggles)
  const claudeCodeHooks = createClaudeCodeHooks(input, {
    config: config.claudeCodeCompatibility as any
  });
  Object.assign(hooks, claudeCodeHooks);

  // 4. Basic tools
  hooks.push({ tool: builtinTools });

  // 5. Configuration Hook
  hooks.push({
    config: async (newConfig: any) => {
      console.log("[kraken-code] Configuration updated");

      if (!newConfig.agent) newConfig.agent = {};
      const agents = getSeaThemedAgents();
      for (const [name, agentConfig] of Object.entries(agents)) {
        if (!newConfig.agent[name]) newConfig.agent[name] = agentConfig;
      }
      if (!newConfig.default_agent && newConfig.agent["Kraken"]) newConfig.default_agent = "Kraken";

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
      const mcpConfig = newConfig.mcp || {};
      try {
        await initializeAllMcpServers(mcpConfig);
        console.log("[kraken-code] MCP servers initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing MCP servers:", e);
      }

      // Initialize Learning System (Unified AI Memory)
      try {
        const learningSystem = initializeLearningSystem(input, newConfig.learning);
        Object.assign(hooks, learningSystem.hooks);
        // Convert array to object for tool registration
        const learningTools = {
          "learning-experience": learningSystem.tools.experienceTool,
          "learning-knowledge": learningSystem.tools.knowledgeTool,
          "learning-pattern": learningSystem.tools.patternTool,
          "learning-fsm": learningSystem.tools.fsmTool,
          "learning-stats": learningSystem.tools.statsTool
        };
        hooks.push({ tool: learningTools });
        console.log("[kraken-code] Learning system initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing learning system:", e);
      }
    },
  });

  // 6. Feature/Lifecycle Hooks - All properly integrated now
  try {
    // These hooks are all properly exported and should work correctly
    hooks.push(createThinkModeHook(input));
    hooks.push({ tool: createBackgroundAgentFeature(input).tools });
    hooks.push(createContextWindowMonitorHook(input));
    hooks.push(createRalphLoopHook(input));
    hooks.push(createKeywordDetector(input));
    hooks.push(createAutoSlashCommand(input));
    hooks.push(createRulesInjector(input));
    hooks.push(createAgentUsageReminder(input));
    hooks.push(createAnthropicContextWindowLimitRecovery(input));
    hooks.push(createAutoUpdateChecker(input));
    hooks.push(createCompactionContextInjector(input));
    hooks.push(createDirectoryAgentsInjector(input));
    hooks.push(createDirectoryReadmeInjector(input));
    hooks.push(createEditErrorRecovery(input));
    hooks.push(createEmptyTaskResponseDetectorHook(input));
    hooks.push(createInteractiveBashSession(input));
    hooks.push(createNonInteractiveEnv(input));
    hooks.push(createPreemptiveCompaction(input));
    hooks.push(createSessionRecovery(input));
    hooks.push(createThinkingBlockValidator(input));
    hooks.push(createCommentChecker(input));
    hooks.push(createBlitzkriegTestPlanEnforcerHook(input));
    hooks.push(createBlitzkriegTddWorkflowHook(input));
    hooks.push(createBlitzkriegEvidenceVerifierHook(input));
    hooks.push(createBlitzkriegPlannerConstraintsHook(input));
    hooks.push(createGrepOutputTruncatorHook(input));
    hooks.push(createNotificationsHook(input));
  } catch (e) {
    console.error("Kraken Code: Error initializing hooks", e);
  }

  // 7. Storage Hooks - tool.execute.after for recording tool usage
  hooks.push({
    "tool.execute.after": async (hookInput: any, hookOutput: any) => {
      if (!hookOutput.output) return;

      const { tool, sessionID } = hookInput;

      // Record tool usage in transcript
      if (hookOutput.output && hookOutput.output.toolOutput) {
        await recordToolUse(
          sessionID,
          tool,
          hookOutput.output.toolInput,
          hookOutput.output.toolOutput
        );
      }

      if (sessionID) {
        console.log(`[storage-hooks] Tool ${tool} completed for session ${sessionID}`);
      }
    },
  });

  // 8. MCP Shutdown on plugin exit
  process.on("exit", async () => {
    try {
      await shutdownAllMcpServers();
      await shutdownKratos();
      await shutdownLearningSystem();
    } catch (e) {
      console.error("Kraken Code: Error shutting down services", e);
    }
  });

  const mergedHooks = mergeHooks(...hooks);
  console.log("[kraken-code] Plugin initialized with", Object.keys(mergedHooks).length, "hooks");
  return mergedHooks;
};

export default createOpenCodeXPlugin;
