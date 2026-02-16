import type { AgentConfig } from '@opencode-ai/sdk'
import type { Hooks, Plugin, PluginInput } from '@opencode-ai/plugin'

import { getClaudeCodeCompatibilityConfig } from './config/manager'
import { createLogger } from './utils/logger'

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
  cartographerAgent,
} from './agents'

// Tools
import { opencodeXCompress } from './tools/compression'
import { modelSwitcher } from './tools/model-switcher'
import { createRalphLoopHook } from './hooks/ralph-loop'
import { createAutoUpdateChecker } from './hooks/auto-update-checker'
import { ast_grep_search, ast_grep_replace } from './tools/ast-grep'
import { session_list, session_read, session_search, session_info } from './tools/session'
import { grep } from './tools/grep'
import { ralphLoop } from './tools/ralph-loop'
import { recordToolUse } from './storage'
import {
  learning_add_experience,
  learning_add_knowledge_node,
  learning_create_state_machine,
  learning_get_review_queue,
  learning_link_knowledge_nodes,
  learning_list_patterns,
  learning_list_state_machines,
  learning_record_pattern,
  learning_review_node,
  learning_search_experiences,
  learning_search_knowledge_nodes,
} from './tools/learning'

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
} from './tools/lsp'

// Hooks
import { createModeHooks } from './hooks/mode-hooks'
import { createSessionStorageHook } from './hooks/session-storage-hook'
import { createClaudeCodeHooks } from './hooks/claude-code-hooks'
import { createThinkModeHook } from './hooks/think-mode'
import { createBackgroundAgentFeature } from './features/background-agent/manager'
import { createContextWindowMonitorHook } from './hooks/context-window-monitor'
import { createKeywordDetector } from './hooks/keyword-detector'
import { createAutoSlashCommand } from './hooks/auto-slash-command'
import { createRulesInjector } from './hooks/context/rules-injector'
import { createAgentUsageReminder } from './hooks/agent-usage-reminder'
import { createAnthropicContextWindowLimitRecovery } from './hooks/anthropic-context-window-limit-recovery'
import { createCompactionContextInjector } from './hooks/compaction-context-injector'
import { createDirectoryAgentsInjector } from './hooks/directory-agents-injector'
import { createDirectoryReadmeInjector } from './hooks/directory-readme-injector'
import { createEditErrorRecovery } from './hooks/edit-error-recovery'
import { createEmptyMessageSanitizer } from './hooks/empty-message-sanitizer'
import { createInteractiveBashSession } from './hooks/interactive-bash-session'
import { createNonInteractiveEnv } from './hooks/non-interactive-env'
import { createPreemptiveCompaction } from './hooks/preemptive-compaction'
import { createSessionRecovery } from './hooks/session-recovery'
import { createThinkingBlockValidator } from './hooks/thinking-block-validator'
import { createCommentChecker } from './hooks/comment-checker'
import { createMemoryGuard, createToolThrottle, createSessionLifecycle } from './hooks'
import { createBlitzkriegTestPlanEnforcerHook } from './hooks/blitzkrieg-test-plan-enforcer'
import { createBlitzkriegTddWorkflowHook } from './hooks/blitzkrieg-tdd-workflow'
import { createBlitzkriegEvidenceVerifierHook } from './hooks/blitzkrieg-evidence-verifier'
import { createBlitzkriegPlannerConstraintsHook } from './hooks/blitzkrieg-planner-constraints'

// Token Efficiency Hooks
import { createThinkingBudgetOptimizerHook } from './hooks/thinking-budget-optimizer'
import { createPromptCompressionHook } from './hooks/prompt-compression'
import { createSmartContextInjectionHook } from './hooks/smart-context-injection'
import { createTranscriptSummarizationHook } from './hooks/transcript-summarization'

// MCP & Features
import { createBuiltinMcpConfigs, getMcpAgentTools } from './features/mcp/index'
import { initializeLearning } from './features/memory'

// CLI & Skills
import { initializeCommandLoader } from './features/command-loader'
import { initializeSkillMcpManager } from './features/skill-mcp-manager'

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
    Cartographer: cartographerAgent,
  }
}

function mergeHooks(...hooks: Hooks[]): Hooks {
  const result: Hooks = {}
  const configHooks: Array<(config: any) => Promise<void>> = []

  for (const hook of hooks) {
    // Collect config hooks separately
    if (hook.config) {
      configHooks.push(hook.config)
    }

    // Merge other hooks
    for (const [key, value] of Object.entries(hook)) {
      if (key !== 'config') {
        // For tool hooks, merge objects instead of overwriting
        if (key === 'tool' && typeof value === 'object' && value !== null) {
          if (!result[key] || typeof result[key] !== 'object') {
            result[key as keyof Hooks] = value
          } else {
            // Merge tool objects
            result[key as keyof Hooks] = { ...(result[key] as object), ...value }
          }
        } else {
          result[key as keyof Hooks] = value
        }
      }
    }
  }

  // Chain all config hooks
  if (configHooks.length > 0) {
    result.config = async (config: any) => {
      for (const configHook of configHooks) {
        await configHook(config)
      }
    }
  }

  return result
}

const builtinTools: Record<string, any> = {
  ast_grep_search,
  ast_grep_replace,
  grep,
  session_list,
  session_read,
  session_search,
  session_info,
  'kraken-compress': opencodeXCompress,
  'model-switcher': modelSwitcher,
  'ralph-loop': ralphLoop,
  learning_add_experience,
  learning_search_experiences,
  learning_add_knowledge_node,
  learning_search_knowledge_nodes,
  learning_link_knowledge_nodes,
  learning_record_pattern,
  learning_list_patterns,
  learning_get_review_queue,
  learning_review_node,
  learning_create_state_machine,
  learning_list_state_machines,
  ...getMcpAgentTools(),
}

const createOpenCodeXPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const logger = createLogger('plugin-main')

  const hooks: Hooks[] = []

  // 1. Mode Hooks (Blitzkrieg/Analyze/Ultrathink detection and activation)
  const modeHooks = createModeHooks(input, { autoActivate: true })
  Object.assign(hooks, modeHooks)

  // 2. Session Storage Hooks (Todo and transcript tracking)
  const claudeCodeConfig = getClaudeCodeCompatibilityConfig()
  const sessionStorageHooks = createSessionStorageHook(input, {
    config: {
      enabled: claudeCodeConfig?.enabled ?? true,
      recordTodos: true,
      recordTranscripts: true,
    },
  })
  Object.assign(hooks, sessionStorageHooks)

  // 3. Claude Code Compatibility Hooks (Settings.json, plugin toggles)
  const claudeCodeHooks = createClaudeCodeHooks(input, {
    config: claudeCodeConfig,
  })
  Object.assign(hooks, claudeCodeHooks)

  // 4. Basic tools
  hooks.push({ tool: builtinTools })

  // 5. Configuration Hook
  hooks.push({
    config: async (pluginConfig: any) => {
      if (!pluginConfig.agent) pluginConfig.agent = {}
      const agents = getSeaThemedAgents()
      for (const [name, agentConfig] of Object.entries(agents)) {
        // Merge: plugin defaults as base, user overrides on top
        // This ensures mode, prompt, and other defaults always propagate
        // even when the user has partial overrides in their config
        pluginConfig.agent[name] = { ...agentConfig, ...pluginConfig.agent[name] }
      }

      // Ensure primary agents always retain their mode even after user overrides
      // Without this, a user override missing 'mode' would demote a primary agent
      const primaryAgents = ['Kraken', 'Cartographer']
      for (const name of primaryAgents) {
        if (pluginConfig.agent[name]) {
          pluginConfig.agent[name].mode = 'primary'
        }
      }

      // Parallelize initialization for faster startup
      await Promise.all([
        (async () => {
          try {
            await initializeCommandLoader()
            logger.debug('Command loader initialized')
          } catch (e) {
            if (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1') {
              logger.error('Error initializing command loader:', e)
            }
          }
        })(),
        (async () => {
          try {
            await initializeSkillMcpManager()
            logger.debug('Skill MCP manager initialized')
          } catch (e) {
            if (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1') {
              logger.error('Error initializing skill MCP manager:', e)
            }
          }
        })(),
        (async () => {
          try {
            const mcpConfig = pluginConfig.mcp || {}
            // Extract option keys that shouldn't be in MCP map
            const { disabled_mcps, websearch, ...mcpEntries } = mcpConfig as any
            const builtinMcpConfigs = createBuiltinMcpConfigs(disabled_mcps || [], { websearch })
            // Merge: built-in configs as defaults, user config takes precedence
            const mergedMcpConfigs = { ...builtinMcpConfigs, ...mcpEntries }
            pluginConfig.mcp = mergedMcpConfigs as any
            logger.debug('MCP server configs added')
          } catch (e) {
            if (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1') {
              logger.error('Error initializing MCP servers:', e)
            }
          }
        })(),
        (async () => {
          try {
            await initializeLearning()
            logger.debug('Learning system initialized')
          } catch (e) {
            if (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1') {
              logger.error('Error initializing learning system:', e)
            }
          }
        })(),
      ])
    },
  })

  // 6. Feature/Lifecycle Hooks
  try {
    hooks.push(createThinkModeHook(input))
    hooks.push({ tool: createBackgroundAgentFeature(input).tools })
    hooks.push(createContextWindowMonitorHook(input))
    hooks.push(createRalphLoopHook(input))
    hooks.push(createKeywordDetector(input))
    hooks.push(createAutoSlashCommand(input))
    hooks.push(createRulesInjector(input))
    hooks.push(createAgentUsageReminder(input))
    hooks.push(createAnthropicContextWindowLimitRecovery(input))
    hooks.push(createAutoUpdateChecker(input))
    hooks.push(createCompactionContextInjector(input))
    hooks.push(createDirectoryAgentsInjector(input))
    hooks.push(createDirectoryReadmeInjector(input))
    hooks.push(createEditErrorRecovery(input))
    hooks.push(createEmptyMessageSanitizer(input))
    hooks.push(createInteractiveBashSession(input))
    hooks.push(createNonInteractiveEnv(input))
    hooks.push(createPreemptiveCompaction(input))
    hooks.push(createSessionRecovery(input))
    hooks.push(createThinkingBlockValidator(input))
    hooks.push(createCommentChecker(input))

    // Memory leak prevention hooks - ensure these are ordered appropriately
    hooks.push(createMemoryGuard(input))
    hooks.push(createToolThrottle(input))
    hooks.push(createSessionLifecycle(input))

    hooks.push(createBlitzkriegTestPlanEnforcerHook())
    hooks.push(createBlitzkriegTddWorkflowHook())
    hooks.push(createBlitzkriegEvidenceVerifierHook())
    hooks.push(createBlitzkriegPlannerConstraintsHook())

    // Token Efficiency Hooks (Phase 1 & 2)
    hooks.push(createThinkingBudgetOptimizerHook(input))
    hooks.push(createPromptCompressionHook(input))
    hooks.push(createSmartContextInjectionHook(input))
    hooks.push(createTranscriptSummarizationHook(input))
  } catch (e) {
    if (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1') {
      logger.error('Error initializing hooks:', e)
    }
  }

  // 7. Storage Hooks
  hooks.push({
    'tool.execute.after': async (input: any, output: any) => {
      if (!output.output) return

      const { tool, sessionID } = input

      // Record tool usage in transcript
      if (output.output && output.output.toolOutput) {
        await recordToolUse(sessionID, tool, output.output.toolInput, output.output.toolOutput)
      }

      if (sessionID && (process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1')) {
        console.log(`[storage-hooks] Tool ${tool} completed for session ${sessionID}`)
      }
    },
  })

  // 7. MCP Shutdown on plugin exit
  process.on('exit', async () => {
    // No shutdown needed for remote MCP configurations
  })

  return mergeHooks(...hooks)
}

export default createOpenCodeXPlugin
