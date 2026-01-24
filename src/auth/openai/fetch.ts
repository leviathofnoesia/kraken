import type { OpenAITokens, OpenAITokenExchangeResult, OpenAIAuthConfig } from './types'
import { isTokenExpired, refreshAccessToken } from './token'

export class OpenAIAuthManager {
  private config: OpenAIAuthConfig
  private refreshPromise: Promise<string> | null = null

  constructor(config: OpenAIAuthConfig) {
    this.config = {
      autoRefresh: true,
      refreshBuffer: 5 * 60 * 1000,
      ...config,
    }
  }

  async getAccessToken(): Promise<string> {
    const { tokens, autoRefresh } = this.config

    if (!isTokenExpired(tokens)) {
      return tokens.accessToken
    }

    if (autoRefresh) {
      return await this.refreshToken()
    }

    throw new Error('Access token is expired and auto-refresh is disabled')
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    console.log('[openai-auth] Refreshing access token...')

    this.refreshPromise = (async () => {
      try {
        const newTokens = await refreshAccessToken(
          this.config.tokens.refreshToken
        )

        const tokenData: OpenAITokens = {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expires_in: newTokens.expires_in,
          timestamp: Date.now(),
          userId: this.config.tokens.userId,
        }

        this.config.tokens = tokenData

        console.log('[openai-auth] Access token refreshed successfully')
        return newTokens.access_token
      } catch (error) {
        console.error('[openai-auth] Failed to refresh access token:', error)
        throw error
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  getTokens(): OpenAITokens {
    return this.config.tokens
  }

  updateTokens(tokens: Partial<OpenAITokens>): void {
    this.config.tokens = {
      ...this.config.tokens,
      ...tokens,
    } as OpenAITokens
  }
}

