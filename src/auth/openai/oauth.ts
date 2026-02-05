import {
  OPENAI_CLIENT_ID,
  OPENAI_CLIENT_SECRET,
  OPENAI_SCOPES,
  OPENAI_CALLBACK_PORT,
  OPENAI_AUTH_URL,
  OPENAI_TOKEN_URL,
  OPENAI_USERINFO_URL,
} from './constants'
import type { OpenAITokenExchangeResult, OpenAIUserInfo } from './types'

export interface AuthorizationResult {
  url: string
  state: string
  pkce?: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' | 'plain' }
}

export interface CallbackResult {
  code: string
  state: string
  error?: string
}

export async function generatePKCEChallenge(): Promise<{
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256' | 'plain'
}> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)

  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const codeChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  }
}

export async function buildAuthURL(
  clientId: string = OPENAI_CLIENT_ID,
  port: number = OPENAI_CALLBACK_PORT,
  usePKCE: boolean = true,
): Promise<AuthorizationResult> {
  const state = crypto.randomUUID().replace(/-/g, '')

  const redirectUri = `http://localhost:${port}/oauth-callback`

  const url = new URL(OPENAI_AUTH_URL)
  url.pathname += '/authorize'
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', OPENAI_SCOPES.join(' '))
  url.searchParams.set('state', state)

  let pkce:
    | { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' | 'plain' }
    | undefined
  if (usePKCE) {
    pkce = await generatePKCEChallenge()
    url.searchParams.set('code_challenge', pkce.codeChallenge)
    url.searchParams.set('code_challenge_method', pkce.codeChallengeMethod)
  }

  return {
    url: url.toString(),
    state,
    pkce,
  }
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  clientId: string = OPENAI_CLIENT_ID,
  clientSecret: string = OPENAI_CLIENT_SECRET,
  codeVerifier?: string,
): Promise<OpenAITokenExchangeResult> {
  const params: Record<string, string> = {
    client_id: clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }

  if (codeVerifier) {
    params.code_verifier = codeVerifier
  } else {
    params.client_secret = clientSecret
  }

  const response = await fetch(OPENAI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Token exchange failed: ${response.status}`

    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error) {
        errorMessage = `Token exchange failed: ${errorData.error}`
        if (errorData.error_description) {
          errorMessage += ` - ${errorData.error_description}`
        }
      }
    } catch {
      errorMessage += ` - ${errorText}`
    }

    throw new Error(errorMessage)
  }

  const data = (await response.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }

  if (!data.access_token) {
    throw new Error('Token exchange failed: No access token in response')
  }

  if (!data.refresh_token) {
    console.warn(
      'Token exchange warning: No refresh token received. You may need to re-authenticate soon.',
    )
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || '',
    expires_in: data.expires_in,
    token_type: data.token_type,
  }
}

export async function fetchUserInfo(accessToken: string): Promise<OpenAIUserInfo> {
  const response = await fetch(OPENAI_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`)
  }

  const data = (await response.json()) as {
    email?: string
    name?: string
    user_id?: string
  }

  return {
    email: data.email || '',
    name: data.name,
    userId: data.user_id,
  }
}

export interface CallbackServerHandle {
  port: number
  redirectUri: string
  waitForCallback: () => Promise<CallbackResult>
  close: () => void
}

export function startCallbackServer(timeoutMs: number = 5 * 60 * 1000): CallbackServerHandle {
  let server: ReturnType<typeof Bun.serve> | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let resolveCallback: ((result: CallbackResult) => void) | null = null

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (server) {
      server.stop()
      server = null
    }
  }

  const fetchHandler = (request: Request): Response => {
    const url = new URL(request.url)

    if (url.pathname === '/oauth-callback') {
      const code = url.searchParams.get('code') || ''
      const state = url.searchParams.get('state') || ''
      const error = url.searchParams.get('error') || undefined

      let responseBody: string
      if (code && !error) {
        responseBody =
          '<html><body><h1>Login successful</h1><p>You can close this window.</p></body></html>'
      } else {
        responseBody =
          '<html><body><h1>Login failed</h1><p>Please check the CLI output.</p></body></html>'
      }

      setTimeout(() => {
        cleanup()
        if (resolveCallback) {
          resolveCallback({ code, state, error })
        }
      }, 100)

      return new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    return new Response('Not Found', { status: 404 })
  }

  try {
    server = Bun.serve({
      port: OPENAI_CALLBACK_PORT,
      fetch: fetchHandler,
    })
  } catch (error) {
    server = Bun.serve({
      port: 0,
      fetch: fetchHandler,
    })
  }

  const actualPort = server.port as number
  const redirectUri = `http://localhost:${actualPort}/oauth-callback`

  const waitForCallback = (): Promise<CallbackResult> => {
    return new Promise((resolve) => {
      resolveCallback = resolve

      timeoutId = setTimeout(() => {
        cleanup()
        resolve({ code: '', state: '', error: 'timeout' })
      }, timeoutMs)
    })
  }

  return {
    port: actualPort,
    redirectUri,
    waitForCallback,
    close: cleanup,
  }
}

export async function performOAuthFlow(
  openBrowser?: (url: string) => Promise<void>,
  clientId: string = OPENAI_CLIENT_ID,
  clientSecret: string = OPENAI_CLIENT_SECRET,
  usePKCE: boolean = true,
): Promise<{
  tokens: OpenAITokenExchangeResult
  userInfo: OpenAIUserInfo
  state: string
}> {
  const serverHandle = startCallbackServer()

  try {
    const auth = await buildAuthURL(clientId, serverHandle.port, usePKCE)

    console.log(`[openai-auth] Opening OAuth URL in browser: ${auth.url.substring(0, 50)}...`)
    console.log(`[openai-auth] Using ${usePKCE ? 'PKCE' : 'standard'} OAuth flow`)

    if (openBrowser) {
      await openBrowser(auth.url)
    } else {
      console.log(`[openai-auth] Please open this URL in your browser:`)
      console.log(auth.url)
    }

    console.log(`[openai-auth] Waiting for callback on port ${serverHandle.port}...`)
    const callback = await serverHandle.waitForCallback()

    if (callback.error) {
      const error =
        callback.error === 'access_denied'
          ? 'Authentication denied by user'
          : `OAuth error: ${callback.error}`
      throw new Error(error)
    }

    if (!callback.code) {
      throw new Error('No authorization code received')
    }

    if (callback.state !== auth.state) {
      throw new Error('State mismatch - possible CSRF attack')
    }

    const redirectUri = `http://localhost:${serverHandle.port}/oauth-callback`
    const codeVerifier = auth.pkce?.codeVerifier
    const tokens = await exchangeCode(
      callback.code,
      redirectUri,
      clientId,
      clientSecret,
      codeVerifier,
    )
    const userInfo = await fetchUserInfo(tokens.access_token)

    console.log(`[openai-auth] Authentication successful for: ${userInfo.email}`)

    return { tokens, userInfo, state: auth.state }
  } catch (err) {
    serverHandle.close()
    console.error(`[openai-auth] Authentication failed: ${err}`)
    throw err
  }
}
