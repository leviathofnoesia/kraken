export interface OpenAITokenExchangeResult {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface OpenAITokens {
  accessToken: string
  refreshToken: string
  expires_in: number
  timestamp: number
  userId?: string
}

export interface OpenAIUserInfo {
  email: string
  name?: string
  userId?: string
}

export interface OpenAIRefreshParts {
  refreshToken: string
  apiKey?: string
}

export interface OAuthErrorPayload {
  error: string | { code?: string; status?: number }
  error_description?: string
}

export interface ParsedOAuthError {
  code?: string
  description?: string
}

export interface AccountStorage {
  version: number
  accounts: StoredAccount[]
  activeIndex: number
}

export interface StoredAccount {
  email: string
  apiKey?: string
  refreshToken: string
  accessToken?: string
  expiresAt?: number
}

export interface OpenAIAuthConfig {
  tokens: OpenAITokens
  autoRefresh?: boolean
  refreshBuffer?: number
}

export type OpenAIAuthMethod = 'oauth' | 'apikey'
