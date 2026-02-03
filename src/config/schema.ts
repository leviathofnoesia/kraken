import { z } from 'zod'

export const OpenCodeXBuiltinAgentNameSchema = z.enum([
  'Kraken',
  'Maelstrom',
  'Nautilus',
  'Abyssal',
  'Coral',
  'Siren',
  'Leviathan',
  'Poseidon (Plan Consultant)',
  'Scylla (Plan Reviewer)',
  'Pearl',
])

export const OpenCodeXHookNameSchema = z.enum([
  'ralph-loop',
  'think-mode',
  'context-window-monitor',
  'session-recovery',
  'comment-checker',
  'keyword-detector',
  'auto-slash-command',
  'directory-agents-injector',
  'directory-readme-injector',
  'rules-injector',
  'preemptive-compaction',
  'compaction-context-injector',
  'edit-error-recovery',
  'empty-message-sanitizer',
  'thinking-block-validator',
  'tool-output-truncator',
  'grep-output-truncator',
  'empty-task-response-detector',
  'blitzkrieg-test-plan-enforcer',
  'blitzkrieg-tdd-workflow',
  'blitzkrieg-evidence-verifier',
  'blitzkrieg-planner-constraints',
])

export const OpenCodeXBuiltinCommandNameSchema = z.enum(['init-deep'])

export const AgentPermissionSchema = z.object({
  edit: z.enum(['allow', 'ask', 'deny']).default('ask'),
  bash: z
    .union([
      z.enum(['allow', 'ask', 'deny']),
      z.record(z.string(), z.enum(['allow', 'ask', 'deny'])),
    ])
    .default('ask'),
  webfetch: z.enum(['allow', 'ask', 'deny']).default('ask'),
  doom_loop: z.enum(['allow', 'ask', 'deny']).default('ask'),
  external_directory: z.enum(['allow', 'ask', 'deny']).default('ask'),
})

export const AgentOverrideConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(['subagent', 'primary', 'all']).optional(),
  color: z.string().optional(),
  permission: AgentPermissionSchema.optional(),
})

export const AgentOverridesSchema = z.object({
  Kraken: AgentOverrideConfigSchema.optional(),
  Maelstrom: AgentOverrideConfigSchema.optional(),
  Nautilus: AgentOverrideConfigSchema.optional(),
  Abyssal: AgentOverrideConfigSchema.optional(),
  Coral: AgentOverrideConfigSchema.optional(),
  Siren: AgentOverrideConfigSchema.optional(),
  Leviathan: AgentOverrideConfigSchema.optional(),
  'Poseidon (Plan Consultant)': AgentOverrideConfigSchema.optional(),
  'Scylla (Plan Reviewer)': AgentOverrideConfigSchema.optional(),
  Pearl: AgentOverrideConfigSchema.optional(),
})

export const RalphLoopConfigSchema = z.object({
  enabled: z.boolean().default(true),
  default_max_iterations: z.number().default(24),
  state_dir: z.string().optional(),
})

export const BackgroundTaskConfigSchema = z.object({
  defaultConcurrency: z.number().optional(),
  providerConcurrency: z.record(z.string(), z.number()).optional(),
  modelConcurrency: z.record(z.string(), z.number()).optional(),
})

export const ThinkModeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  model: z.string().optional(),
  thinkingBudget: z.number().optional(),
})

export const CompressionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  level: z.enum(['cache_hit', 'partial', 'full']).default('partial'),
})

export const BlitzkriegConfigSchema = z.object({
  enabled: z.boolean().default(true),
  testPlan: z.object({
    requiredBeforeImplementation: z.boolean().default(true),
    minTestCases: z.number().int().min(1).default(3),
    requireCoverageThreshold: z.boolean().default(true),
    coverageThresholdPercent: z.number().int().min(0).max(100).default(80),
  }),
  tddWorkflow: z.object({
    enforceWriteTestFirst: z.boolean().default(true),
    forbidCodeWithoutTest: z.boolean().default(true),
    allowRefactorWithoutTest: z.boolean().default(true),
  }),
  evidence: z.object({
    requireTestExecutionEvidence: z.boolean().default(true),
    requireAssertionEvidence: z.boolean().default(true),
    requireEdgeCaseEvidence: z.boolean().default(true),
  }),
  plannerConstraints: z.object({
    requireTestStep: z.boolean().default(true),
    requireVerificationStep: z.boolean().default(true),
    maxImplementationStepComplexity: z.number().int().min(1).max(10).default(3),
  }),
})

export const EnhancedModeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  keywords: z.array(z.string()).default(['enhanced', 'max', 'full']),
  searchKeywords: z.array(z.string()).default(['search', 'find', 'locate', '찾아', '검색']),
  analyzeKeywords: z.array(z.string()).default(['analyze', 'investigate', '분석', '조사', '調査']),
  thinkKeywords: z.array(z.string()).default(['think', 'reason', 'think deeply', 'ultrathink']),
})

// MCP (Model Context Protocol) Configuration
export const WebsearchMCPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  timeout: z.number().int().min(1000).max(120000).default(30000),
  numResults: z.number().int().min(1).max(20).default(8),
  livecrawl: z.enum(['fallback', 'preferred']).default('fallback'),
  searchType: z.enum(['auto', 'fast', 'deep']).default('auto'),
  contextMaxCharacters: z.number().int().min(1000).max(50000).default(10000),
})

export const Context7MCPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  timeout: z.number().int().min(1000).max(120000).default(30000),
  numResults: z.number().int().min(1).max(10).default(5),
  cacheTTL: z.number().int().min(60).max(3600).default(300),
  maxTokens: z.number().int().min(1000).max(20000).default(5000),
})

export const GrepAppMCPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  githubToken: z.string().optional(),
  timeout: z.number().int().min(1000).max(120000).default(30000),
  maxResults: z.number().int().min(1).max(30).default(10),
  rateLimitDelay: z.number().int().min(100).max(10000).default(1000),
  defaultExtensions: z
    .array(z.string())
    .default(['ts', 'js', 'tsx', 'jsx', 'py', 'java', 'go', 'rs']),
  defaultLanguages: z
    .array(z.string())
    .default(['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust']),
})

export const MCPConfigSchema = z.object({
  websearch: WebsearchMCPConfigSchema.optional(),
  context7: Context7MCPConfigSchema.optional(),
  grep_app: GrepAppMCPConfigSchema.optional(),
})

export const KratosConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  storagePath: z.string().default('~/.kratos'),
})

export const MemoryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  storagePath: z.string().default('~/.kraken/memory'),
})

export const LSPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  workspacePath: z.string().optional(),
  servers: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean().default(true),
        command: z.string().optional(),
        args: z.array(z.string()).optional(),
      }),
    )
    .optional(),
})

export const NotificationsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  idleTimeout: z.number().int().min(1000).default(60000),
  skipIfIncompleteTodos: z.boolean().default(false),
  batchSize: z.number().int().min(1).max(20).default(5),
  batchDelay: z.number().int().min(100).max(10000).default(100),
  maxRetries: z.number().int().min(1).max(10).default(3),
})

export const ModesConfigSchema = z.object({
  blitzkrieg: z
    .object({
      enabled: z.boolean().default(true),
    })
    .optional(),
  ultrawork: z
    .object({
      enabled: z.boolean().default(true),
      parallelAgents: z.number().int().min(1).max(10).default(4),
      concurrencyLimits: z.record(z.string(), z.number().int().min(1).max(10)).optional(),
    })
    .optional(),
  search: z
    .object({
      enabled: z.boolean().default(true),
      maxResults: z.number().int().min(1).max(100).default(50),
    })
    .optional(),
  analyze: z
    .object({
      enabled: z.boolean().default(true),
      consultationPhases: z.number().int().min(1).max(5).default(3),
      expertAgents: z.array(z.string()).optional(),
    })
    .optional(),
  ultrathink: z
    .object({
      enabled: z.boolean().default(true),
      thinkingBudget: z.number().int().min(1000).max(200000).default(32000),
      autoVariantSwitch: z.boolean().default(true),
    })
    .optional(),
})

export const SkillMcpConfigSchema = z.object({
  enabled: z.boolean().default(true),
  idleTimeout: z.number().int().min(60000).max(600000).default(300000),
  maxConnections: z.number().int().min(1).max(50).default(10),
})

export const CommandLoaderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  disabledScopes: z
    .array(
      z.enum([
        'builtin',
        'user',
        'project',
        'opencode',
        'opencode-project',
        'skill',
        'claude-user',
        'claude-project',
      ]),
    )
    .optional(),
})

export const ClaudeCodeCompatibilityConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    settingsJsonHooks: z.boolean().default(true),
    commandLoader: z.boolean().default(true),
    skillLoader: z.boolean().default(true),
    agentLoader: z.boolean().default(true),
    mcpLoader: z.boolean().default(true),
    dataStorage: z.boolean().default(true),
    toggles: z
      .object({
        mcp: z.boolean().default(true),
        commands: z.boolean().default(true),
        skills: z.boolean().default(true),
        agents: z.boolean().default(true),
        hooks: z.boolean().default(true),
        plugins: z.record(z.string(), z.boolean()).optional(),
      })
      .optional(),
  })
  .optional()

export const OpenCodeXConfigSchema = z.object({
  $schema: z.string().optional(),
  disabled_hooks: z.array(OpenCodeXHookNameSchema).optional(),
  disabled_commands: z.array(OpenCodeXBuiltinCommandNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),
  ralphLoop: RalphLoopConfigSchema.optional(),
  backgroundTask: BackgroundTaskConfigSchema.optional(),
  thinkMode: ThinkModeConfigSchema.optional(),
  compression: CompressionConfigSchema.optional(),
  blitzkrieg: BlitzkriegConfigSchema.optional(),
  mcp: MCPConfigSchema.optional(),
  kratos: KratosConfigSchema.optional(),
  memory: MemoryConfigSchema.optional(),
  lsp: LSPConfigSchema.optional(),
  notifications: NotificationsConfigSchema.optional(),
  enhanced: z
    .object({
      enabled: z.boolean().default(true),
      keywords: z.array(z.string()).default(['enhanced', 'max', 'full']),
      searchKeywords: z.array(z.string()).default(['search', 'find', 'locate']),
      analyzeKeywords: z.array(z.string()).default(['analyze', 'examine']),
      thinkKeywords: z.array(z.string()).default(['think', 'reason']),
    })
    .optional(),
  modes: ModesConfigSchema.optional(),
  skillMcp: SkillMcpConfigSchema.optional(),
  commandLoader: CommandLoaderConfigSchema.optional(),
  claudeCodeCompatibility: ClaudeCodeCompatibilityConfigSchema.optional(),
})

export type OpenCodeXConfig = z.infer<typeof OpenCodeXConfigSchema>
export type OpenCodeXBuiltinAgentName = z.infer<typeof OpenCodeXBuiltinAgentNameSchema>
export type OpenCodeXHookName = z.infer<typeof OpenCodeXHookNameSchema>
export type OpenCodeXBuiltinCommandName = z.infer<typeof OpenCodeXBuiltinCommandNameSchema>
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>
export type AgentOverrides = z.infer<typeof AgentOverridesSchema>
export type RalphLoopConfig = z.infer<typeof RalphLoopConfigSchema>
export type BackgroundTaskConfig = z.infer<typeof BackgroundTaskConfigSchema>
export type ThinkModeConfig = z.infer<typeof ThinkModeConfigSchema>
export type CompressionConfig = z.infer<typeof CompressionConfigSchema>
export type BlitzkriegConfig = z.infer<typeof BlitzkriegConfigSchema>
export type WebsearchMCPConfig = z.infer<typeof WebsearchMCPConfigSchema>
export type Context7MCPConfig = z.infer<typeof Context7MCPConfigSchema>
export type GrepAppMCPConfig = z.infer<typeof GrepAppMCPConfigSchema>
export type MCPConfig = z.infer<typeof MCPConfigSchema>
export type KratosConfig = z.infer<typeof KratosConfigSchema>
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>
export type LSPConfig = z.infer<typeof LSPConfigSchema>
export type ModesConfig = z.infer<typeof ModesConfigSchema>
export type SkillMcpConfig = z.infer<typeof SkillMcpConfigSchema>
export type CommandLoaderConfig = z.infer<typeof CommandLoaderConfigSchema>
export type ClaudeCodeCompatibilityConfig = z.infer<typeof ClaudeCodeCompatibilityConfigSchema>
