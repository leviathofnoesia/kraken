import type { Hooks } from '@opencode-ai/plugin';
import type { PluginInput } from '@opencode-ai/plugin';

export interface ToolOutputTruncatorConfig {
  maxTokens?: number;
  headroomRatio?: number;
  preserveHeaderLines?: number;
}

const TOOL_SPECIFIC_MAX_TOKENS = {
  webfetch: 10000,
  grep: 50000,
  safe_grep: 50000,
  glob: 50000,
  interactive_bash: 20000,
  skill_mcp: 10000,
  websearch: 15000,
  lsp_hover: 30000,
  lsp_goto_definition: 30000,
  lsp_find_references: 30000,
  lsp_document_symbols: 30000,
  lsp_workspace_symbols: 30000,
  lsp_diagnostics: 30000,
  lsp_servers: 10000,
  lsp_prepare_rename: 30000,
  lsp_rename: 30000,
  lsp_code_actions: 30000,
  lsp_code_action_resolve: 30000,
  call_kraken_agent: 50000,
  ast_grep_search: 30000,
  ast_grep_replace: 30000,
  session_list: 5000,
  session_read: 30000,
  session_search: 20000,
  session_info: 10000,
} as const;

const DEFAULT_CONFIG: Required<ToolOutputTruncatorConfig> = {
  maxTokens: 50000,
  headroomRatio: 0.5,
  preserveHeaderLines: 3,
};

const TRUNCATABLE_TOOLS = [
  'lsp_hover',
  'lsp_document_symbols',
  'lsp_workspace_symbols',
  'lsp_find_references',
  'lsp_diagnostics',
  'ast_grep_search',
  'grep',
  'glob',
  'session_list',
  'session_search',
  'session_info',
  'websearch',
  'webfetch',
] as const;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getToolSpecificMaxTokens(toolName: string, defaultMax: number): number {
  return TOOL_SPECIFIC_MAX_TOKENS[toolName as keyof typeof TOOL_SPECIFIC_MAX_TOKENS] ?? defaultMax;
}

function truncateContent(
  content: string,
  maxTokens: number,
  preserveHeaderLines: number,
  toolName?: string,
): string {
  const usableTokens = Math.floor(maxTokens * 0.75);
  const maxChars = Math.floor(usableTokens * 4);

  if (content.length <= maxChars) {
    return content;
  }

  const lines = content.split('\n');
  const headerLines = lines.slice(0, preserveHeaderLines);
  const headerContent = headerLines.join('\n');
  const remainingLines = lines.slice(preserveHeaderLines);
  const remainingContent = remainingLines.join('\n');

  let truncatedContent: string;
  let omittedChars = 0;

  if (remainingContent.length > maxChars - headerContent.length) {
    truncatedContent = remainingContent.substring(0, maxChars - headerContent.length);
    omittedChars = remainingContent.length - truncatedContent.length;
    truncatedContent = headerContent + '\n' + truncatedContent;
  } else {
    return content;
  }

  const totalOmitted = content.length - truncatedContent.length;
  const omittedLines = Math.round(totalOmitted / 100);
  const estimatedTokens = estimateTokens(content);

  let truncationNotice = '\n\n' + '='.repeat(60);
  truncationNotice += `\n[Output truncated: ${estimatedTokens.toLocaleString()} tokens estimated]`;
  truncationNotice += `\nShowing ${truncatedContent.length.toLocaleString()} of ${content.length.toLocaleString()} characters`;
  if (omittedLines > 0) {
    truncationNotice += ` (~${omittedLines} lines omitted)`;
  }
  truncationNotice += '\n' + '='.repeat(60) + '\n';

  return truncatedContent + truncationNotice;
}

function processToolContent(
  content: any,
  config: Required<ToolOutputTruncatorConfig>,
  toolName: string,
): any {
  if (typeof content === 'string') {
    const toolMaxTokens = getToolSpecificMaxTokens(toolName, config.maxTokens);
    return truncateContent(content, toolMaxTokens, config.preserveHeaderLines, toolName);
  }

  if (Array.isArray(content)) {
    const text = JSON.stringify(content);
    const estimatedTokens = estimateTokens(text);
    const toolMaxTokens = getToolSpecificMaxTokens(toolName, config.maxTokens);

    if (estimatedTokens <= config.maxTokens * config.headroomRatio) {
      return content;
    }

    return truncateContent(text, toolMaxTokens, config.preserveHeaderLines, toolName);
  }

  if (content.type === 'image_url') {
    return content;
  }

  if (content.type === 'resource') {
    if (content.resource.text) {
      return {
        ...content,
        resource: {
          ...content.resource,
          text: truncateContent(
            content.resource.text,
            config.maxTokens,
            config.preserveHeaderLines,
            toolName,
          ),
        },
      };
    }
  }

  return content;
}

async function toolExecuteAfter(
  input: any,
  output: any,
  config: Required<ToolOutputTruncatorConfig>,
) {
  const toolName = input.tool;

  if (!TRUNCATABLE_TOOLS.includes(toolName as any)) {
    return;
  }

  if (output?.output && typeof output.output === 'string') {
    output.output = processToolContent(output.output, config, toolName);
  }
}

export function createToolOutputTruncatorHook(
  _input: PluginInput,
  options?: { config?: ToolOutputTruncatorConfig },
): Hooks {
  const finalConfig = { ...DEFAULT_CONFIG, ...options?.config };

  return {
    'tool.execute.after': async (toolInput: any, toolOutput: any) => {
      await toolExecuteAfter(toolInput, toolOutput, finalConfig);
    },
  };
}

export function createHook(
  input: PluginInput,
  options?: { config?: ToolOutputTruncatorConfig },
): Hooks {
  return createToolOutputTruncatorHook(input, options);
}

export const metadata = {
  name: 'tool-output-truncator',
  priority: 40,
  description: 'Truncates large tool outputs with tool-specific limits and header preservation',
} as const;
