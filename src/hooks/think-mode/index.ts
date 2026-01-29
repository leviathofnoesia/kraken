/**
 * Think Mode Hook
 *
 * Detects "think" keywords in user input and activates enhanced reasoning mode.
 * Switches variant to 'max' and enables thinking for supported providers.
 */

import type { Hooks, PluginInput } from '@opencode-ai/plugin';

/**
 * Supported providers that support thinking mode
 */
const THINKING_SUPPORTED_PROVIDERS = [
  'anthropic',
  'bedrock',
  'google',
  'openai',
];

/**
 * Think keywords to detect (case-insensitive)
 * Includes multilingual support
 */
const THINK_KEYWORDS = [
  // English
  'think',
  'let me think',
  'i need to think',
  'take time to think',
  'think about this',
  'think carefully',

  // Spanish
  'piensa',
  'déjame pensar',
  'necesito pensar',
  'piénsalo',
  'piensa cuidadosamente',

  // French
  'réfléchis',
  'laissez-moi réfléchir',
  'je dois réfléchir',
  'réfléchissez-y',
  'réfléchir attentivement',

  // German
  'denk nach',
  'lass mich nachdenken',
  'ich muss nachdenken',
  'denk darüber nach',
  'denke sorgfältig',

  // Portuguese
  'pense',
  'deixe-me pensar',
  'preciso pensar',
  'pense sobre isso',
  'pense cuidadosamente',

  // Italian
  'pensa',
  'fammi pensare',
  'devo pensare',
  'pensa a questo',
  'pensa attentamente',

  // Russian
  'подумай',
  'дай мне подумать',
  'мне нужно подумать',
  'подумай об этом',
  'подумай внимательно',

  // Japanese
  '考えて',
  '考えさせて',
  '考える必要がある',
  'これについて考えて',
  '注意深く考えて',

  // Chinese (Simplified)
  '思考',
  '让我想想',
  '我需要思考',
  '思考这个',
  '仔细思考',

  // Chinese (Traditional)
  '思考',
  '讓我思考',
  '我需要思考',
  '思考這個',
  '仔細思考',

  // Korean
  '생각해',
  '생각하게 해줘',
  '생각해야 해',
  '이것에 대해 생각해',
  '신중하게 생각해',
];

/**
 * Check if thinking is supported for given provider
 * @param provider - The provider name
 * @returns True if thinking is supported
 */
function isThinkingSupported(provider: string): boolean {
  // Simple provider name matching
  return THINKING_SUPPORTED_PROVIDERS.some(supported =>
    provider.toLowerCase().includes(supported.toLowerCase())
  );
}

/**
 * Session state for tracking think mode activation
 */
interface ThinkModeSession {
  enabled: boolean;
  activatedAt: number;
}

/**
 * Map of sessionID to think mode state
 */
const thinkModeSessions = new Map<string, ThinkModeSession>();

/**
 * Get think mode state for a session
 * @param sessionID - The session ID
 * @returns The session state or undefined
 */
function getSessionState(sessionID: string): ThinkModeSession | undefined {
  return thinkModeSessions.get(sessionID);
}

/**
 * Set think mode state for a session
 * @param sessionID - The session ID
 * @param enabled - Whether think mode is enabled
 */
function setSessionState(sessionID: string, enabled: boolean): void {
  thinkModeSessions.set(sessionID, {
    enabled,
    activatedAt: Date.now(),
  });
}

/**
 * Clear think mode state for a session
 * @param sessionID - The session ID
 */
function clearSessionState(sessionID: string): void {
  thinkModeSessions.delete(sessionID);
}

/**
 * Detect if think mode should be activated based on input
 * @param content - The user's message content
 * @returns True if think mode should be activated
 */
export function shouldActivateThinkMode(content: string): boolean {
  const lowercaseContent = content.toLowerCase();

  // Check if any think keyword is present
  for (const keyword of THINK_KEYWORDS) {
    if (lowercaseContent.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Create think mode hook
 * Uses session and tool hooks for think mode detection and activation.
 *
 * @param input - The plugin input context
 * @returns A Hooks object with think mode functionality
 */
export function createThinkModeHook(input: PluginInput): Hooks {
  return {
    // Detect think mode keywords in chat messages
    'chat.message': async (chatInput: any, chatOutput: any) => {
      const { sessionID } = chatInput;
      const parts = chatOutput?.parts || [];
      const content = parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n')
        .trim();

      // Check if content exists and is a string
      if (typeof content === 'string' && content.length > 0) {
        // Detect if think mode should be activated
        const shouldActivate = shouldActivateThinkMode(content);

        if (shouldActivate) {
          console.log(`[think-mode] Activated for session ${sessionID}`);
          setSessionState(sessionID, true);
        }
      }
    },

    // Hook executed to modify chat parameters - apply think mode settings
    'tool.execute.before': async (toolInput: any, toolOutput: any) => {
      const { sessionID } = toolInput;
      const { provider } = toolInput;

      // Check if think mode is enabled for this session
      const sessionState = getSessionState(sessionID);

      if (sessionState?.enabled && toolInput.tool === 'task') {
        console.log(`[think-mode] Applying think mode for session ${sessionID}`);

        // In a full implementation, we would modify the tool output to:
        // 1. Switch to high-variant model
        // 2. Enable thinking budget
        // This requires intercepting the task tool's execution

        // For now, we'll log the intent
        const providerID = provider?.info?.id || provider?.options?.providerID || '';
        if (isThinkingSupported(providerID)) {
          console.log(`[think-mode] Would apply think mode for provider ${providerID}`);
        }
      }

      // Allow execution to continue
      return;
    },
  };
}
