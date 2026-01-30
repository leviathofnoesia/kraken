/**
 * Antigravity OAuth 2.0 flow implementation.
 * Handles Google OAuth for Antigravity authentication.
 */
import {
  ANTIGRAVITY_CLIENT_ID,
  ANTIGRAVITY_CLIENT_SECRET,
  ANTIGRAVITY_REDIRECT_URI,
  ANTIGRAVITY_SCOPES,
  ANTIGRAVITY_CALLBACK_PORT,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
} from "./constants"
import type {
  AntigravityTokenExchangeResult,
  AntigravityUserInfo,
} from "./types"

/**
 * PKCE code challenge and verifier pair
 */
export interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: "S256" | "plain"
}

/**
 * Result from building an OAuth authorization URL.
 */
export interface AuthorizationResult {
  /** Full OAuth URL to open in browser */
  url: string
  /** State for CSRF protection */
  state: string
  /** PKCE challenge if PKCE is enabled */
  pkce?: PKCEChallenge
}

/**
 * Result from the OAuth callback server.
 */
export interface CallbackResult {
  /** Authorization code from Google */
  code: string
  /** State parameter from callback */
  state: string
  /** Error message if any */
  error?: string
}

/**
 * Generate a PKCE code verifier and challenge
 * Uses SHA-256 for code challenge method as recommended by RFC 7636
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
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
  projectId?: string,
  clientId: string = ANTIGRAVITY_CLIENT_ID,
  port: number = ANTIGRAVITY_CALLBACK_PORT,
  usePKCE: boolean = true,
): Promise<AuthorizationResult> {
  if (!usePKCE) {
    console.warn("[OAuth] PKCE is disabled. This weakens security and is not recommended. PKCE (RFC 7636) prevents authorization code interception attacks.")
  }
  const state = crypto.randomUUID().replace(/-/g, "")
  
  const redirectUri = `http://localhost:${port}/oauth-callback`
  
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", ANTIGRAVITY_SCOPES.join(" "))
  url.searchParams.set("state", state)
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  
  let pkce: PKCEChallenge | undefined
  if (usePKCE) {
    pkce = await generatePKCEChallenge()
    url.searchParams.set("code_challenge", pkce.codeChallenge)
    url.searchParams.set("code_challenge_method", pkce.codeChallengeMethod)
  }
  
  return {
    url: url.toString(),
    state,
    pkce,
  }
}

/**
 * Exchange authorization code for tokens.
 *
 * @param code - Authorization code from OAuth callback
 * @param redirectUri - OAuth redirect URI
 * @param clientId - Optional custom client ID (defaults to ANTIGRAVITY_CLIENT_ID)
 * @param clientSecret - Optional custom client secret (defaults to ANTIGRAVITY_CLIENT_SECRET)
 * @param codeVerifier - PKCE code verifier (if PKCE was used)
 * @returns Token exchange result with access and refresh tokens
 */
export async function exchangeCode(
  code: string,
  redirectUri: string,
  clientId: string = ANTIGRAVITY_CLIENT_ID,
  clientSecret: string = ANTIGRAVITY_CLIENT_SECRET,
  codeVerifier?: string
): Promise<AntigravityTokenExchangeResult> {
  const params: Record<string, string> = {
    client_id: clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  }

  if (codeVerifier) {
    params.code_verifier = codeVerifier
  } else {
    params.client_secret = clientSecret
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
    } catch (e) {
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
    throw new Error("Token exchange failed: No access token in response")
  }

  if (!data.refresh_token) {
    console.warn("Token exchange warning: No refresh token received. You may need to re-authenticate soon.")
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || "",
    expires_in: data.expires_in,
    token_type: data.token_type,
  }
}

/**
 * Fetch user info from Google's userinfo API.
 *
 * @param accessToken - Valid access token
 * @returns User info containing email
 */
export async function fetchUserInfo(
  accessToken: string
): Promise<AntigravityUserInfo> {
  const response = await fetch(`${GOOGLE_USERINFO_URL}?alt=json`, {
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
    picture?: string
  }

  return {
    email: data.email || "",
    name: data.name,
    picture: data.picture,
  }
}

export interface CallbackServerHandle {
  port: number
  redirectUri: string
  waitForCallback: () => Promise<CallbackResult>
  close: () => void
}

export function startCallbackServer(
  timeoutMs: number = 5 * 60 * 1000
): CallbackServerHandle {
  let server: ReturnType<typeof Bun.serve> | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let resolveCallback: ((result: CallbackResult) => void) | null = null
  let rejectCallback: ((error: Error) => void) | null = null

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

    if (url.pathname === "/oauth-callback") {
      const code = url.searchParams.get("code") || ""
      const state = url.searchParams.get("state") || ""
      const error = url.searchParams.get("error") || undefined

      let responseBody: string
      if (code && !error) {
        responseBody =
          "<html><body><h1>Login successful</h1><p>You can close this window.</p></body></html>"
      } else {
        responseBody =
          "<html><body><h1>Login failed</h1><p>Please check the CLI output.</p></body></html>"
      }

      setTimeout(() => {
        cleanup()
        if (resolveCallback) {
          resolveCallback({ code, state, error })
        }
      }, 100)

      return new Response(responseBody, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    }

    return new Response("Not Found", { status: 404 })
  }

  try {
    server = Bun.serve({
      port: ANTIGRAVITY_CALLBACK_PORT,
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
    return new Promise((resolve, reject) => {
      resolveCallback = resolve
      rejectCallback = reject

      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error("OAuth callback timeout"))
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
  projectId?: string,
  openBrowser?: (url: string) => Promise<void>,
  clientId: string = ANTIGRAVITY_CLIENT_ID,
  clientSecret: string = ANTIGRAVITY_CLIENT_SECRET,
  usePKCE: boolean = true
): Promise<{
  tokens: AntigravityTokenExchangeResult
  userInfo: AntigravityUserInfo
  state: string
}> {
  const serverHandle = startCallbackServer()
  
  try {
    const auth = await buildAuthURL(projectId, clientId, serverHandle.port, usePKCE)
    
    console.log(`[google-auth] Opening OAuth URL in browser: ${auth.url.substring(0, 50)}...`)
    console.log(`[google-auth] Using ${usePKCE ? 'PKCE' : 'standard'} OAuth flow`)
    
    if (openBrowser) {
      await openBrowser(auth.url)
    } else {
      console.log(`[google-auth] Please open this URL in your browser:`)
      console.log(auth.url)
    }
    
    console.log(`[google-auth] Waiting for callback on port ${serverHandle.port}...`)
    const callback = await serverHandle.waitForCallback()
    
    if (callback.error) {
      const error = callback.error === 'access_denied'
        ? 'Authentication denied by user'
        : `OAuth error: ${callback.error}`
      throw new Error(error)
    }
    
    if (!callback.code) {
      throw new Error("No authorization code received")
    }
    
    if (callback.state !== auth.state) {
      throw new Error("State mismatch - possible CSRF attack")
    }
    
    const redirectUri = `http://localhost:${serverHandle.port}/oauth-callback`
    const codeVerifier = auth.pkce?.codeVerifier
    const tokens = await exchangeCode(callback.code, redirectUri, clientId, clientSecret, codeVerifier)
    const userInfo = await fetchUserInfo(tokens.access_token)
    
    console.log(`[google-auth] Authentication successful for: ${userInfo.email}`)
    
    return { tokens, userInfo, state: auth.state }
  } catch (err) {
    serverHandle.close()
    console.error(`[google-auth] Authentication failed: ${err}`)
    throw err
  }
}
