import type { Plugin, PluginInput } from '@opencode-ai/plugin'
import { performOAuthFlow } from './oauth'
import { OpenAIAuthManager, type OpenAIAuthConfig, type OpenAITokens } from './fetch'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const STORAGE_DIR = join(homedir(), '.config', 'openai-auth')
const STORAGE_FILE = join(STORAGE_DIR, 'tokens.json')

interface StoredTokens {
  tokens?: OpenAITokens
}

async function loadStoredTokens(): Promise<OpenAITokens | null> {
  try {
    if (!existsSync(STORAGE_FILE)) {
      return null
    }

    const content = await readFile(STORAGE_FILE, 'utf-8')
    const stored = JSON.parse(content) as StoredTokens

    if (!stored.tokens) {
      return null
    }

    return stored.tokens
  } catch {
    return null
  }
}

async function saveStoredTokens(tokens: OpenAITokens): Promise<void> {
  try {
    if (!existsSync(STORAGE_DIR)) {
      await mkdir(STORAGE_DIR, { recursive: true })
    }

    const stored: StoredTokens = { tokens }
    await writeFile(STORAGE_FILE, JSON.stringify(stored, null, 2), 'utf-8')

    console.log('[openai-auth] Tokens saved to', STORAGE_FILE)
  } catch (error) {
    console.error('[openai-auth] Failed to save tokens:', error)
    throw error
  }
}

export async function createOpenAIAuthPlugin(
  input: PluginInput,
  options?: { config?: { enabled?: boolean; autoRefresh?: boolean } },
): Promise<Plugin> {
  const config = options?.config ?? { enabled: true, autoRefresh: true }

  if (!config.enabled) {
    return async () => ({}) as any
  }

  const storedTokens = await loadStoredTokens()
  let authManager: OpenAIAuthManager | null = null

  if (storedTokens) {
    console.log('[openai-auth] Found stored tokens')

    const authConfig: OpenAIAuthConfig = {
      tokens: storedTokens,
      autoRefresh: config.autoRefresh,
    }

    authManager = new OpenAIAuthManager(authConfig)
  }

  return async () => {
    return {
      auth: async () => {
        if (!authManager) {
          console.log('[openai-auth] No valid tokens found, performing OAuth flow')

          try {
            const { tokens, userInfo } = await performOAuthFlow()

            const authConfig: OpenAIAuthConfig = {
              tokens: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expires_in: tokens.expires_in,
                timestamp: Date.now(),
                userId: userInfo.userId,
              },
              autoRefresh: config.autoRefresh,
            }

            authManager = new OpenAIAuthManager(authConfig)
            await saveStoredTokens(authManager.getTokens())

            console.log(`[openai-auth] Authenticated as ${userInfo.email}`)
          } catch (error) {
            console.error('[openai-auth] Authentication failed:', error)
            throw error
          }
        } else {
          console.log('[openai-auth] Using existing auth manager')
        }

        return authManager
      },
    } as any
  }
}

export * from './constants'
export * from './types'
