import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// ../node_modules/sisteransi/src/index.js
var require_src = __commonJS((exports, module) => {
  var ESC = "\x1B";
  var CSI = `${ESC}[`;
  var beep = "\x07";
  var cursor = {
    to(x, y) {
      if (!y)
        return `${CSI}${x + 1}G`;
      return `${CSI}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI}${-x}D`;
      else if (x > 0)
        ret += `${CSI}${x}C`;
      if (y < 0)
        ret += `${CSI}${-y}A`;
      else if (y > 0)
        ret += `${CSI}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// src/auth/antigravity/types.ts
var MODEL_FAMILIES = ["claude", "gemini-flash", "gemini-pro"];
// src/auth/antigravity/constants.ts
var ANTIGRAVITY_CLIENT_ID = "REDACTED.apps.googleusercontent.com";
var ANTIGRAVITY_CLIENT_SECRET = "GOCSPX-REDACTED";
var ANTIGRAVITY_CALLBACK_PORT = 51121;
var ANTIGRAVITY_REDIRECT_URI = `http://localhost:${ANTIGRAVITY_CALLBACK_PORT}/oauth-callback`;
var ANTIGRAVITY_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cclog",
  "https://www.googleapis.com/auth/experimentsandconfigs"
];
var ANTIGRAVITY_ENDPOINT_FALLBACKS = [
  "https://daily-cloudcode-pa.sandbox.googleapis.com",
  "https://daily-cloudcode-pa.googleapis.com",
  "https://cloudcode-pa.googleapis.com"
];
var ANTIGRAVITY_API_VERSION = "v1internal";
var ANTIGRAVITY_HEADERS = {
  "User-Agent": "google-api-nodejs-client/9.15.1",
  "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
  "Client-Metadata": JSON.stringify({
    ideType: "IDE_UNSPECIFIED",
    platform: "PLATFORM_UNSPECIFIED",
    pluginType: "GEMINI"
  })
};
var ANTIGRAVITY_DEFAULT_PROJECT_ID = "rising-fact-p41fc";
var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo";
var ANTIGRAVITY_TOKEN_REFRESH_BUFFER_MS = 60000;
var SKIP_THOUGHT_SIGNATURE_VALIDATOR = "skip_thought_signature_validator";
var ANTIGRAVITY_SYSTEM_PROMPT = `<identity>
You are Antigravity, a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding.
You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question.
The USER will send you requests, which you must always prioritize addressing. Along with each USER request, we will attach additional metadata about their current state, such as what files they have open and where their cursor is.
This information may or may not be relevant to the coding task, it is up for you to decide.
</identity>

<tool_calling>
Call tools as you normally would. The following list provides additional guidance to help you avoid errors:
  - **Absolute paths only**. When using tools that accept file path arguments, ALWAYS use the absolute file path.
</tool_calling>

<web_application_development>
## Technology Stack
Your web applications should be built using the following technologies:
1. **Core**: Use HTML for structure and Javascript for logic.
2. **Styling (CSS)**: Use Vanilla CSS for maximum flexibility and control. Avoid using TailwindCSS unless the USER explicitly requests it; in this case, first confirm which TailwindCSS version to use.
3. **Web App**: If the USER specifies that they want a more complex web app, use a framework like Next.js or Vite. Only do this if the USER explicitly requests a web app.
4. **New Project Creation**: If you need to use a framework for a new app, use \`npx\` with the appropriate script, but there are some rules to follow:
   - Use \`npx -y\` to automatically install the script and its dependencies
   - You MUST run the command with \`--help\` flag to see all available options first
   - Initialize the app in the current directory with \`./\` (example: \`npx -y create-vite-app@latest ./\`)
</web_application_development>
`;
var REASONING_EFFORT_BUDGET_MAP = {
  none: 0,
  auto: -1,
  minimal: 512,
  low: 1024,
  medium: 8192,
  high: 24576,
  xhigh: 32768
};
var ANTIGRAVITY_MODEL_CONFIGS = {
  "gemini-2.5-flash": {
    thinkingType: "numeric",
    min: 0,
    max: 24576,
    zeroAllowed: true
  },
  "gemini-2.5-flash-lite": {
    thinkingType: "numeric",
    min: 0,
    max: 24576,
    zeroAllowed: true
  },
  "gemini-2.5-computer-use-preview-10-2025": {
    thinkingType: "numeric",
    min: 128,
    max: 32768,
    zeroAllowed: false
  },
  "gemini-3-pro-preview": {
    thinkingType: "levels",
    min: 128,
    max: 32768,
    zeroAllowed: false,
    levels: ["low", "high"]
  },
  "gemini-3-flash-preview": {
    thinkingType: "levels",
    min: 128,
    max: 32768,
    zeroAllowed: false,
    levels: ["minimal", "low", "medium", "high"]
  },
  "gemini-claude-sonnet-4-5-thinking": {
    thinkingType: "numeric",
    min: 1024,
    max: 200000,
    zeroAllowed: false
  },
  "gemini-claude-opus-4-5-thinking": {
    thinkingType: "numeric",
    min: 1024,
    max: 200000,
    zeroAllowed: false
  }
};
function normalizeModelId(model) {
  let normalized = model;
  if (normalized.includes("/")) {
    normalized = normalized.split("/").pop() || normalized;
  }
  if (normalized.startsWith("antigravity-")) {
    normalized = normalized.substring("antigravity-".length);
  }
  normalized = normalized.replace(/-thinking-(low|medium|high)$/, "");
  normalized = normalized.replace(/-(high|low)$/, "");
  return normalized;
}
var ANTIGRAVITY_SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-computer-use-preview-10-2025",
  "gemini-3-pro-preview",
  "gemini-3-flash-preview",
  "gemini-claude-sonnet-4-5-thinking",
  "gemini-claude-opus-4-5-thinking"
];
function alias2ModelName(modelName) {
  if (modelName.startsWith("gemini-claude-")) {
    return modelName.substring("gemini-".length);
  }
  return modelName;
}
// src/auth/antigravity/oauth.ts
async function generatePKCEChallenge() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const encoder = new TextEncoder;
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeChallenge = btoa(String.fromCharCode(...hashArray)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256"
  };
}
async function buildAuthURL(projectId, clientId = ANTIGRAVITY_CLIENT_ID, port = ANTIGRAVITY_CALLBACK_PORT, usePKCE = true) {
  if (!usePKCE) {
    console.warn("[OAuth] PKCE is disabled. This weakens security and is not recommended. PKCE (RFC 7636) prevents authorization code interception attacks.");
  }
  const state = crypto.randomUUID().replace(/-/g, "");
  const redirectUri = `http://localhost:${port}/oauth-callback`;
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", ANTIGRAVITY_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  let pkce;
  if (usePKCE) {
    pkce = await generatePKCEChallenge();
    url.searchParams.set("code_challenge", pkce.codeChallenge);
    url.searchParams.set("code_challenge_method", pkce.codeChallengeMethod);
  }
  return {
    url: url.toString(),
    state,
    pkce
  };
}
async function exchangeCode(code, redirectUri, clientId = ANTIGRAVITY_CLIENT_ID, clientSecret = ANTIGRAVITY_CLIENT_SECRET, codeVerifier) {
  const params = {
    client_id: clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  };
  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  } else {
    params.client_secret = clientSecret;
  }
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(params)
  });
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Token exchange failed: ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        errorMessage = `Token exchange failed: ${errorData.error}`;
        if (errorData.error_description) {
          errorMessage += ` - ${errorData.error_description}`;
        }
      }
    } catch (e) {
      errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Token exchange failed: No access token in response");
  }
  if (!data.refresh_token) {
    console.warn("Token exchange warning: No refresh token received. You may need to re-authenticate soon.");
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || "",
    expires_in: data.expires_in,
    token_type: data.token_type
  };
}
async function fetchUserInfo(accessToken) {
  const response = await fetch(`${GOOGLE_USERINFO_URL}?alt=json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }
  const data = await response.json();
  return {
    email: data.email || "",
    name: data.name,
    picture: data.picture
  };
}
function startCallbackServer(timeoutMs = 5 * 60 * 1000) {
  let server = null;
  let timeoutId = null;
  let resolveCallback = null;
  let rejectCallback = null;
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (server) {
      server.stop();
      server = null;
    }
  };
  const fetchHandler = (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/oauth-callback") {
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      const error = url.searchParams.get("error") || undefined;
      let responseBody;
      if (code && !error) {
        responseBody = "<html><body><h1>Login successful</h1><p>You can close this window.</p></body></html>";
      } else {
        responseBody = "<html><body><h1>Login failed</h1><p>Please check the CLI output.</p></body></html>";
      }
      setTimeout(() => {
        cleanup();
        if (resolveCallback) {
          resolveCallback({ code, state, error });
        }
      }, 100);
      return new Response(responseBody, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    }
    return new Response("Not Found", { status: 404 });
  };
  try {
    server = Bun.serve({
      port: ANTIGRAVITY_CALLBACK_PORT,
      fetch: fetchHandler
    });
  } catch (error) {
    server = Bun.serve({
      port: 0,
      fetch: fetchHandler
    });
  }
  const actualPort = server.port;
  const redirectUri = `http://localhost:${actualPort}/oauth-callback`;
  const waitForCallback = () => {
    return new Promise((resolve, reject) => {
      resolveCallback = resolve;
      rejectCallback = reject;
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("OAuth callback timeout"));
      }, timeoutMs);
    });
  };
  return {
    port: actualPort,
    redirectUri,
    waitForCallback,
    close: cleanup
  };
}
async function performOAuthFlow(projectId, openBrowser, clientId = ANTIGRAVITY_CLIENT_ID, clientSecret = ANTIGRAVITY_CLIENT_SECRET, usePKCE = true) {
  const serverHandle = startCallbackServer();
  try {
    const auth = await buildAuthURL(projectId, clientId, serverHandle.port, usePKCE);
    console.log(`[google-auth] Opening OAuth URL in browser: ${auth.url.substring(0, 50)}...`);
    console.log(`[google-auth] Using ${usePKCE ? "PKCE" : "standard"} OAuth flow`);
    if (openBrowser) {
      await openBrowser(auth.url);
    } else {
      console.log(`[google-auth] Please open this URL in your browser:`);
      console.log(auth.url);
    }
    console.log(`[google-auth] Waiting for callback on port ${serverHandle.port}...`);
    const callback = await serverHandle.waitForCallback();
    if (callback.error) {
      const error = callback.error === "access_denied" ? "Authentication denied by user" : `OAuth error: ${callback.error}`;
      throw new Error(error);
    }
    if (!callback.code) {
      throw new Error("No authorization code received");
    }
    if (callback.state !== auth.state) {
      throw new Error("State mismatch - possible CSRF attack");
    }
    const redirectUri = `http://localhost:${serverHandle.port}/oauth-callback`;
    const codeVerifier = auth.pkce?.codeVerifier;
    const tokens = await exchangeCode(callback.code, redirectUri, clientId, clientSecret, codeVerifier);
    const userInfo = await fetchUserInfo(tokens.access_token);
    console.log(`[google-auth] Authentication successful for: ${userInfo.email}`);
    return { tokens, userInfo, state: auth.state };
  } catch (err) {
    serverHandle.close();
    console.error(`[google-auth] Authentication failed: ${err}`);
    throw err;
  }
}
// src/auth/antigravity/token.ts
class AntigravityTokenRefreshError extends Error {
  code;
  description;
  status;
  statusText;
  responseBody;
  constructor(options) {
    super(options.message);
    this.name = "AntigravityTokenRefreshError";
    this.code = options.code;
    this.description = options.description;
    this.status = options.status;
    this.statusText = options.statusText;
    this.responseBody = options.responseBody;
  }
  get isInvalidGrant() {
    return this.code === "invalid_grant";
  }
  get isNetworkError() {
    return this.status === 0;
  }
}
function parseOAuthErrorPayload(text) {
  if (!text) {
    return {};
  }
  try {
    const payload = JSON.parse(text);
    let code;
    if (typeof payload.error === "string") {
      code = payload.error;
    } else if (payload.error && typeof payload.error === "object") {
      code = payload.error.status ?? payload.error.code;
    }
    return {
      code,
      description: payload.error_description
    };
  } catch {
    return { description: text };
  }
}
function isTokenExpired(tokens) {
  const expirationTime = tokens.timestamp + tokens.expires_in * 1000;
  return Date.now() >= expirationTime - ANTIGRAVITY_TOKEN_REFRESH_BUFFER_MS;
}
var MAX_REFRESH_RETRIES = 3;
var INITIAL_RETRY_DELAY_MS = 1000;
function calculateRetryDelay(attempt) {
  return Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt), 1e4);
}
function isRetryableError(status) {
  if (status === 0)
    return true;
  if (status === 429)
    return true;
  if (status >= 500 && status < 600)
    return true;
  return false;
}
async function refreshAccessToken(refreshToken, clientId = ANTIGRAVITY_CLIENT_ID, clientSecret = ANTIGRAVITY_CLIENT_SECRET) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });
  let lastError;
  for (let attempt = 0;attempt <= MAX_REFRESH_RETRIES; attempt++) {
    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      if (response.ok) {
        const data = await response.json();
        return {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_in: data.expires_in,
          token_type: data.token_type
        };
      }
      const responseBody = await response.text().catch(() => {
        return;
      });
      const parsed = parseOAuthErrorPayload(responseBody);
      lastError = new AntigravityTokenRefreshError({
        message: parsed.description || `Token refresh failed: ${response.status} ${response.statusText}`,
        code: parsed.code,
        description: parsed.description,
        status: response.status,
        statusText: response.statusText,
        responseBody
      });
      if (parsed.code === "invalid_grant") {
        throw lastError;
      }
      if (!isRetryableError(response.status)) {
        throw lastError;
      }
      if (attempt < MAX_REFRESH_RETRIES) {
        const delay = calculateRetryDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (error instanceof AntigravityTokenRefreshError) {
        throw error;
      }
      lastError = new AntigravityTokenRefreshError({
        message: error instanceof Error ? error.message : "Network error during token refresh",
        status: 0,
        statusText: "Network Error"
      });
      if (attempt < MAX_REFRESH_RETRIES) {
        const delay = calculateRetryDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new AntigravityTokenRefreshError({
    message: "Token refresh failed after all retries",
    status: 0,
    statusText: "Max Retries Exceeded"
  });
}
function parseStoredToken(stored) {
  const parts = stored.split("|");
  const [refreshToken, projectId, managedProjectId] = parts;
  return {
    refreshToken: refreshToken || "",
    projectId: projectId || undefined,
    managedProjectId: managedProjectId || undefined
  };
}
function formatTokenForStorage(refreshToken, projectId, managedProjectId) {
  return `${refreshToken}|${projectId}|${managedProjectId || ""}`;
}
// src/auth/antigravity/project.ts
var projectContextCache = new Map;
function debugLog(message) {
  if (process.env.ANTIGRAVITY_DEBUG === "1") {
    console.log(`[antigravity-project] ${message}`);
  }
}
var CODE_ASSIST_METADATA = {
  ideType: "IDE_UNSPECIFIED",
  platform: "PLATFORM_UNSPECIFIED",
  pluginType: "GEMINI"
};
function extractProjectId(project) {
  if (!project)
    return;
  if (typeof project === "string") {
    const trimmed = project.trim();
    return trimmed || undefined;
  }
  if (typeof project === "object" && "id" in project) {
    const id = project.id;
    if (typeof id === "string") {
      const trimmed = id.trim();
      return trimmed || undefined;
    }
  }
  return;
}
function getDefaultTierId(allowedTiers) {
  if (!allowedTiers || allowedTiers.length === 0)
    return;
  for (const tier of allowedTiers) {
    if (tier?.isDefault)
      return tier.id;
  }
  return allowedTiers[0]?.id;
}
function isFreeTier(tierId) {
  if (!tierId)
    return true;
  const lower = tierId.toLowerCase();
  return lower === "free" || lower === "free-tier" || lower.startsWith("free");
}
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function callLoadCodeAssistAPI(accessToken, projectId) {
  const metadata = { ...CODE_ASSIST_METADATA };
  if (projectId)
    metadata.duetProject = projectId;
  const requestBody = { metadata };
  if (projectId)
    requestBody.cloudaicompanionProject = projectId;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": ANTIGRAVITY_HEADERS["User-Agent"],
    "X-Goog-Api-Client": ANTIGRAVITY_HEADERS["X-Goog-Api-Client"],
    "Client-Metadata": ANTIGRAVITY_HEADERS["Client-Metadata"]
  };
  for (const baseEndpoint of ANTIGRAVITY_ENDPOINT_FALLBACKS) {
    const url = `${baseEndpoint}/${ANTIGRAVITY_API_VERSION}:loadCodeAssist`;
    debugLog(`[loadCodeAssist] Trying: ${url}`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        debugLog(`[loadCodeAssist] Failed: ${response.status} ${response.statusText}`);
        continue;
      }
      const data = await response.json();
      debugLog(`[loadCodeAssist] Success: ${JSON.stringify(data)}`);
      return data;
    } catch (err) {
      debugLog(`[loadCodeAssist] Error: ${err}`);
      continue;
    }
  }
  debugLog(`[loadCodeAssist] All endpoints failed`);
  return null;
}
async function onboardManagedProject(accessToken, tierId, projectId, attempts = 10, delayMs = 5000) {
  debugLog(`[onboardUser] Starting with tierId=${tierId}, projectId=${projectId || "none"}`);
  const metadata = { ...CODE_ASSIST_METADATA };
  if (projectId)
    metadata.duetProject = projectId;
  const requestBody = { tierId, metadata };
  if (!isFreeTier(tierId)) {
    if (!projectId) {
      debugLog(`[onboardUser] Non-FREE tier requires projectId, returning undefined`);
      return;
    }
    requestBody.cloudaicompanionProject = projectId;
  }
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": ANTIGRAVITY_HEADERS["User-Agent"],
    "X-Goog-Api-Client": ANTIGRAVITY_HEADERS["X-Goog-Api-Client"],
    "Client-Metadata": ANTIGRAVITY_HEADERS["Client-Metadata"]
  };
  debugLog(`[onboardUser] Request body: ${JSON.stringify(requestBody)}`);
  for (let attempt = 0;attempt < attempts; attempt++) {
    debugLog(`[onboardUser] Attempt ${attempt + 1}/${attempts}`);
    for (const baseEndpoint of ANTIGRAVITY_ENDPOINT_FALLBACKS) {
      const url = `${baseEndpoint}/${ANTIGRAVITY_API_VERSION}:onboardUser`;
      debugLog(`[onboardUser] Trying: ${url}`);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          debugLog(`[onboardUser] Failed: ${response.status} ${response.statusText} - ${errorText}`);
          continue;
        }
        const payload = await response.json();
        debugLog(`[onboardUser] Response: ${JSON.stringify(payload)}`);
        const managedProjectId = payload.response?.cloudaicompanionProject?.id;
        if (payload.done && managedProjectId) {
          debugLog(`[onboardUser] Success! Got managed project ID: ${managedProjectId}`);
          return managedProjectId;
        }
        if (payload.done && projectId) {
          debugLog(`[onboardUser] Done but no managed ID, using original: ${projectId}`);
          return projectId;
        }
        debugLog(`[onboardUser] Not done yet, payload.done=${payload.done}`);
      } catch (err) {
        debugLog(`[onboardUser] Error: ${err}`);
        continue;
      }
    }
    if (attempt < attempts - 1) {
      debugLog(`[onboardUser] Waiting ${delayMs}ms before next attempt...`);
      await wait(delayMs);
    }
  }
  debugLog(`[onboardUser] All attempts exhausted, returning undefined`);
  return;
}
async function fetchProjectContext(accessToken) {
  debugLog(`[fetchProjectContext] Starting...`);
  const cached = projectContextCache.get(accessToken);
  if (cached) {
    debugLog(`[fetchProjectContext] Returning cached result: ${JSON.stringify(cached)}`);
    return cached;
  }
  const loadPayload = await callLoadCodeAssistAPI(accessToken);
  if (loadPayload?.cloudaicompanionProject) {
    const projectId = extractProjectId(loadPayload.cloudaicompanionProject);
    debugLog(`[fetchProjectContext] loadCodeAssist returned project: ${projectId}`);
    if (projectId) {
      const result = { cloudaicompanionProject: projectId };
      projectContextCache.set(accessToken, result);
      debugLog(`[fetchProjectContext] Using loadCodeAssist project ID: ${projectId}`);
      return result;
    }
  }
  if (!loadPayload) {
    debugLog(`[fetchProjectContext] loadCodeAssist returned null, trying with fallback project ID`);
    const fallbackPayload = await callLoadCodeAssistAPI(accessToken, ANTIGRAVITY_DEFAULT_PROJECT_ID);
    const fallbackProjectId = extractProjectId(fallbackPayload?.cloudaicompanionProject);
    if (fallbackProjectId) {
      const result = { cloudaicompanionProject: fallbackProjectId };
      projectContextCache.set(accessToken, result);
      debugLog(`[fetchProjectContext] Using fallback project ID: ${fallbackProjectId}`);
      return result;
    }
    debugLog(`[fetchProjectContext] Fallback also failed, using default: ${ANTIGRAVITY_DEFAULT_PROJECT_ID}`);
    return { cloudaicompanionProject: ANTIGRAVITY_DEFAULT_PROJECT_ID };
  }
  const currentTierId = loadPayload.currentTier?.id;
  debugLog(`[fetchProjectContext] currentTier: ${currentTierId}, allowedTiers: ${JSON.stringify(loadPayload.allowedTiers)}`);
  if (currentTierId && !isFreeTier(currentTierId)) {
    debugLog(`[fetchProjectContext] PAID tier detected (${currentTierId}), using fallback: ${ANTIGRAVITY_DEFAULT_PROJECT_ID}`);
    return { cloudaicompanionProject: ANTIGRAVITY_DEFAULT_PROJECT_ID };
  }
  const defaultTierId = getDefaultTierId(loadPayload.allowedTiers);
  const tierId = defaultTierId ?? "free-tier";
  debugLog(`[fetchProjectContext] Resolved tierId: ${tierId}`);
  if (!isFreeTier(tierId)) {
    debugLog(`[fetchProjectContext] Non-FREE tier (${tierId}) without project, using fallback: ${ANTIGRAVITY_DEFAULT_PROJECT_ID}`);
    return { cloudaicompanionProject: ANTIGRAVITY_DEFAULT_PROJECT_ID };
  }
  debugLog(`[fetchProjectContext] FREE tier detected (${tierId}), calling onboardUser...`);
  const managedProjectId = await onboardManagedProject(accessToken, tierId);
  if (managedProjectId) {
    const result = {
      cloudaicompanionProject: managedProjectId,
      managedProjectId
    };
    projectContextCache.set(accessToken, result);
    debugLog(`[fetchProjectContext] Got managed project ID: ${managedProjectId}`);
    return result;
  }
  debugLog(`[fetchProjectContext] Failed to get managed project ID, using fallback: ${ANTIGRAVITY_DEFAULT_PROJECT_ID}`);
  return { cloudaicompanionProject: ANTIGRAVITY_DEFAULT_PROJECT_ID };
}
function clearProjectContextCache(accessToken) {
  if (accessToken) {
    projectContextCache.delete(accessToken);
  } else {
    projectContextCache.clear();
  }
}
function invalidateProjectContextByRefreshToken(_refreshToken) {
  projectContextCache.clear();
  debugLog(`[invalidateProjectContextByRefreshToken] Cleared all project context cache due to refresh token invalidation`);
}
// src/auth/antigravity/request.ts
function buildRequestHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": ANTIGRAVITY_HEADERS["User-Agent"],
    "X-Goog-Api-Client": ANTIGRAVITY_HEADERS["X-Goog-Api-Client"],
    "Client-Metadata": ANTIGRAVITY_HEADERS["Client-Metadata"]
  };
}
function extractModelFromBody(body) {
  const model = body.model;
  if (typeof model === "string" && model.trim()) {
    return model.trim();
  }
  return;
}
function extractModelFromUrl(url) {
  const match = url.match(/\/models\/([^:]+):/);
  if (match && match[1]) {
    return match[1];
  }
  return;
}
function extractActionFromUrl(url) {
  const match = url.match(/\/models\/[^:]+:(\w+)/);
  if (match && match[1]) {
    return match[1];
  }
  return;
}
function isGenerativeLanguageRequest(url) {
  return url.includes("generativelanguage.googleapis.com");
}
function buildAntigravityUrl(baseEndpoint, action, streaming) {
  const query = streaming ? "?alt=sse" : "";
  return `${baseEndpoint}/${ANTIGRAVITY_API_VERSION}:${action}${query}`;
}
function getDefaultEndpoint() {
  return ANTIGRAVITY_ENDPOINT_FALLBACKS[0];
}
function generateRequestId() {
  return `agent-${crypto.randomUUID()}`;
}
function injectSystemPrompt(wrappedBody) {
  if (!wrappedBody.request || typeof wrappedBody.request !== "object") {
    return;
  }
  const req = wrappedBody.request;
  if (req.systemInstruction && typeof req.systemInstruction === "object") {
    const existing = req.systemInstruction;
    if (existing.parts && Array.isArray(existing.parts)) {
      const firstPart = existing.parts[0];
      if (firstPart && typeof firstPart === "object" && "text" in firstPart) {
        const text = firstPart.text;
        if (text.includes("<identity>")) {
          return;
        }
      }
    }
  }
  const newParts = [{ text: ANTIGRAVITY_SYSTEM_PROMPT }];
  if (req.systemInstruction && typeof req.systemInstruction === "object") {
    const existing = req.systemInstruction;
    if (existing.parts && Array.isArray(existing.parts)) {
      for (const part of existing.parts) {
        if (part && typeof part === "object" && "text" in part) {
          newParts.push(part);
        }
      }
    }
  }
  req.systemInstruction = {
    role: "user",
    parts: newParts
  };
}
function wrapRequestBody(body, projectId, modelName, sessionId) {
  const requestPayload = { ...body };
  delete requestPayload.model;
  let normalizedModel = modelName;
  if (normalizedModel.startsWith("antigravity-")) {
    normalizedModel = normalizedModel.substring("antigravity-".length);
  }
  const apiModel = alias2ModelName(normalizedModel);
  debugLog2(`[MODEL] input="${modelName}" → normalized="${normalizedModel}" → api="${apiModel}"`);
  const requestObj = {
    ...requestPayload,
    sessionId,
    toolConfig: {
      ...requestPayload.toolConfig || {},
      functionCallingConfig: {
        mode: "VALIDATED"
      }
    }
  };
  delete requestObj.safetySettings;
  const wrappedBody = {
    project: projectId,
    model: apiModel,
    userAgent: "antigravity",
    requestType: "agent",
    requestId: generateRequestId(),
    request: requestObj
  };
  injectSystemPrompt(wrappedBody);
  return wrappedBody;
}
function debugLog2(message) {
  if (process.env.ANTIGRAVITY_DEBUG === "1") {
    console.log(`[antigravity-request] ${message}`);
  }
}
function injectThoughtSignatureIntoFunctionCalls(body, signature) {
  const effectiveSignature = signature || SKIP_THOUGHT_SIGNATURE_VALIDATOR;
  debugLog2(`[TSIG][INJECT] signature=${effectiveSignature.substring(0, 30)}... (${signature ? "provided" : "default"})`);
  debugLog2(`[TSIG][INJECT] body keys: ${Object.keys(body).join(", ")}`);
  const contents = body.contents;
  if (!contents || !Array.isArray(contents)) {
    debugLog2(`[TSIG][INJECT] No contents array! Has messages: ${!!body.messages}`);
    return body;
  }
  debugLog2(`[TSIG][INJECT] Found ${contents.length} content blocks`);
  let injectedCount = 0;
  const modifiedContents = contents.map((content) => {
    if (!content.parts || !Array.isArray(content.parts)) {
      return content;
    }
    const modifiedParts = content.parts.map((part) => {
      if (part.functionCall && !part.thoughtSignature) {
        injectedCount++;
        return {
          ...part,
          thoughtSignature: effectiveSignature
        };
      }
      return part;
    });
    return { ...content, parts: modifiedParts };
  });
  debugLog2(`[TSIG][INJECT] injected signature into ${injectedCount} functionCall(s)`);
  return { ...body, contents: modifiedContents };
}
function isStreamingRequest(url, body) {
  const action = extractActionFromUrl(url);
  if (action === "streamGenerateContent") {
    return true;
  }
  if (body.stream === true) {
    return true;
  }
  return false;
}
function transformRequest(options) {
  const {
    url,
    body,
    accessToken,
    projectId,
    sessionId,
    modelName,
    endpointOverride,
    thoughtSignature
  } = options;
  const effectiveModel = modelName || extractModelFromBody(body) || extractModelFromUrl(url) || "gemini-3-pro-high";
  const streaming = isStreamingRequest(url, body);
  const action = streaming ? "streamGenerateContent" : "generateContent";
  const endpoint = endpointOverride || getDefaultEndpoint();
  const transformedUrl = buildAntigravityUrl(endpoint, action, streaming);
  const headers = buildRequestHeaders(accessToken);
  if (streaming) {
    headers["Accept"] = "text/event-stream";
  }
  const bodyWithSignature = injectThoughtSignatureIntoFunctionCalls(body, thoughtSignature);
  const wrappedBody = wrapRequestBody(bodyWithSignature, projectId, effectiveModel, sessionId);
  return {
    url: transformedUrl,
    headers,
    body: wrappedBody,
    streaming
  };
}
function addStreamingHeaders(headers) {
  return {
    ...headers,
    Accept: "text/event-stream"
  };
}
// src/auth/antigravity/response.ts
function extractUsageFromHeaders(headers) {
  const cached = headers.get("x-antigravity-cached-content-token-count");
  const total = headers.get("x-antigravity-total-token-count");
  const prompt = headers.get("x-antigravity-prompt-token-count");
  const candidates = headers.get("x-antigravity-candidates-token-count");
  if (!cached && !total && !prompt && !candidates) {
    return;
  }
  const usage = {};
  if (cached) {
    const parsed = parseInt(cached, 10);
    if (!isNaN(parsed)) {
      usage.cachedContentTokenCount = parsed;
    }
  }
  if (total) {
    const parsed = parseInt(total, 10);
    if (!isNaN(parsed)) {
      usage.totalTokenCount = parsed;
    }
  }
  if (prompt) {
    const parsed = parseInt(prompt, 10);
    if (!isNaN(parsed)) {
      usage.promptTokenCount = parsed;
    }
  }
  if (candidates) {
    const parsed = parseInt(candidates, 10);
    if (!isNaN(parsed)) {
      usage.candidatesTokenCount = parsed;
    }
  }
  return Object.keys(usage).length > 0 ? usage : undefined;
}
function extractRetryAfterMs(response, errorBody) {
  const retryAfterHeader = response.headers.get("Retry-After");
  if (retryAfterHeader) {
    const seconds = parseFloat(retryAfterHeader);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }
  const retryAfterMsHeader = response.headers.get("retry-after-ms");
  if (retryAfterMsHeader) {
    const ms = parseInt(retryAfterMsHeader, 10);
    if (!isNaN(ms) && ms > 0) {
      return ms;
    }
  }
  if (!errorBody) {
    return;
  }
  const error = errorBody.error;
  if (!error?.details || !Array.isArray(error.details)) {
    return;
  }
  const retryInfo = error.details.find((detail) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
  if (!retryInfo?.retryDelay || typeof retryInfo.retryDelay !== "string") {
    return;
  }
  const match = retryInfo.retryDelay.match(/^([\d.]+)s$/);
  if (match?.[1]) {
    const seconds = parseFloat(match[1]);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }
  return;
}
function parseErrorBody(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.error && typeof parsed.error === "object") {
      const errorObj = parsed.error;
      return {
        message: String(errorObj.message || "Unknown error"),
        type: errorObj.type ? String(errorObj.type) : undefined,
        code: errorObj.code
      };
    }
    if (parsed.message && typeof parsed.message === "string") {
      return {
        message: parsed.message,
        type: parsed.type ? String(parsed.type) : undefined,
        code: parsed.code
      };
    }
    return;
  } catch {
    return {
      message: text || "Unknown error"
    };
  }
}
async function transformResponse(response) {
  const headers = new Headers(response.headers);
  const usage = extractUsageFromHeaders(headers);
  if (!response.ok) {
    const text = await response.text();
    const error = parseErrorBody(text);
    const retryAfterMs = extractRetryAfterMs(response, error ? { error } : undefined);
    let errorBody;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = { error: { message: text } };
    }
    const retryMs = extractRetryAfterMs(response, errorBody) ?? retryAfterMs;
    if (retryMs) {
      headers.set("Retry-After", String(Math.ceil(retryMs / 1000)));
      headers.set("retry-after-ms", String(retryMs));
    }
    return {
      response: new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers
      }),
      usage,
      retryAfterMs: retryMs,
      error
    };
  }
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (!isJson) {
    return { response, usage };
  }
  try {
    const text = await response.text();
    const parsed = JSON.parse(text);
    let transformedBody = parsed;
    if (parsed.response !== undefined) {
      transformedBody = parsed.response;
    }
    return {
      response: new Response(JSON.stringify(transformedBody), {
        status: response.status,
        statusText: response.statusText,
        headers
      }),
      usage
    };
  } catch {
    return { response, usage };
  }
}
function transformSseLine(line) {
  if (!line.startsWith("data:")) {
    return line;
  }
  const json = line.slice(5).trim();
  if (!json || json === "[DONE]") {
    return line;
  }
  try {
    const parsed = JSON.parse(json);
    if (parsed.response !== undefined) {
      return `data: ${JSON.stringify(parsed.response)}`;
    }
    return line;
  } catch {
    return line;
  }
}
function transformStreamingPayload(payload) {
  return payload.split(`
`).map(transformSseLine).join(`
`);
}
function createSseTransformStream() {
  const decoder = new TextDecoder;
  const encoder = new TextEncoder;
  let buffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(`
`);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const transformed = transformSseLine(line);
        controller.enqueue(encoder.encode(transformed + `
`));
      }
    },
    flush(controller) {
      if (buffer) {
        const transformed = transformSseLine(buffer);
        controller.enqueue(encoder.encode(transformed));
      }
    }
  });
}
async function transformStreamingResponse(response) {
  const headers = new Headers(response.headers);
  const usage = extractUsageFromHeaders(headers);
  if (!response.ok) {
    const text = await response.text();
    const error = parseErrorBody(text);
    let errorBody;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = { error: { message: text } };
    }
    const retryAfterMs = extractRetryAfterMs(response, errorBody);
    if (retryAfterMs) {
      headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      headers.set("retry-after-ms", String(retryAfterMs));
    }
    return {
      response: new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers
      }),
      usage,
      retryAfterMs,
      error
    };
  }
  const contentType = response.headers.get("content-type") ?? "";
  const isEventStream = contentType.includes("text/event-stream") || response.url.includes("alt=sse");
  if (!isEventStream) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      let transformedBody2 = parsed;
      if (parsed.response !== undefined) {
        transformedBody2 = parsed.response;
      }
      return {
        response: new Response(JSON.stringify(transformedBody2), {
          status: response.status,
          statusText: response.statusText,
          headers
        }),
        usage
      };
    } catch {
      return {
        response: new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers
        }),
        usage
      };
    }
  }
  if (!response.body) {
    return { response, usage };
  }
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/event-stream; charset=utf-8");
  const transformStream = createSseTransformStream();
  const transformedBody = response.body.pipeThrough(transformStream);
  return {
    response: new Response(transformedBody, {
      status: response.status,
      statusText: response.statusText,
      headers
    }),
    usage
  };
}
function isStreamingResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("text/event-stream") || response.url.includes("alt=sse");
}
function extractSignatureFromSsePayload(payload) {
  const lines = payload.split(`
`);
  let lastSignature;
  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }
    const json = line.slice(5).trim();
    if (!json || json === "[DONE]") {
      continue;
    }
    try {
      const parsed = JSON.parse(json);
      const response = parsed.response || parsed;
      const candidates = response.candidates;
      if (candidates && Array.isArray(candidates)) {
        for (const candidate of candidates) {
          const content = candidate.content;
          const parts = content?.parts;
          if (parts && Array.isArray(parts)) {
            for (const part of parts) {
              const sig = part.thoughtSignature || part.thought_signature;
              if (sig && typeof sig === "string") {
                lastSignature = sig;
              }
            }
          }
        }
      }
    } catch {}
  }
  return lastSignature;
}
function extractUsageFromSsePayload(payload) {
  const lines = payload.split(`
`);
  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }
    const json = line.slice(5).trim();
    if (!json || json === "[DONE]") {
      continue;
    }
    try {
      const parsed = JSON.parse(json);
      if (parsed.usageMetadata && typeof parsed.usageMetadata === "object") {
        const meta = parsed.usageMetadata;
        return {
          prompt_tokens: typeof meta.promptTokenCount === "number" ? meta.promptTokenCount : 0,
          completion_tokens: typeof meta.candidatesTokenCount === "number" ? meta.candidatesTokenCount : 0,
          total_tokens: typeof meta.totalTokenCount === "number" ? meta.totalTokenCount : 0
        };
      }
      if (parsed.response && typeof parsed.response === "object") {
        const resp = parsed.response;
        if (resp.usageMetadata && typeof resp.usageMetadata === "object") {
          const meta = resp.usageMetadata;
          return {
            prompt_tokens: typeof meta.promptTokenCount === "number" ? meta.promptTokenCount : 0,
            completion_tokens: typeof meta.candidatesTokenCount === "number" ? meta.candidatesTokenCount : 0,
            total_tokens: typeof meta.totalTokenCount === "number" ? meta.totalTokenCount : 0
          };
        }
      }
      if (parsed.usage && typeof parsed.usage === "object") {
        const u = parsed.usage;
        return {
          prompt_tokens: typeof u.prompt_tokens === "number" ? u.prompt_tokens : 0,
          completion_tokens: typeof u.completion_tokens === "number" ? u.completion_tokens : 0,
          total_tokens: typeof u.total_tokens === "number" ? u.total_tokens : 0
        };
      }
    } catch {}
  }
  return;
}
// src/auth/antigravity/tools.ts
function normalizeToolsForGemini(tools) {
  if (!tools || tools.length === 0) {
    return;
  }
  const functionDeclarations = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") {
      continue;
    }
    const toolType = tool.type ?? "function";
    if (toolType === "function" && tool.function) {
      const declaration = {
        name: tool.function.name
      };
      if (tool.function.description) {
        declaration.description = tool.function.description;
      }
      if (tool.function.parameters) {
        declaration.parameters = tool.function.parameters;
      } else {
        declaration.parameters = { type: "object", properties: {} };
      }
      functionDeclarations.push(declaration);
    } else if (toolType !== "function" && process.env.ANTIGRAVITY_DEBUG === "1") {
      console.warn(`[antigravity-tools] Unsupported tool type: "${toolType}". Tool will be skipped.`);
    }
  }
  if (functionDeclarations.length === 0) {
    return;
  }
  return { functionDeclarations };
}
function normalizeToolResultsFromGemini(results) {
  if (!results || results.length === 0) {
    return [];
  }
  const toolCalls = [];
  let callCounter = 0;
  for (const result of results) {
    if (result.functionCall) {
      callCounter++;
      const toolCall = {
        id: `call_${Date.now()}_${callCounter}`,
        type: "function",
        function: {
          name: result.functionCall.name,
          arguments: JSON.stringify(result.functionCall.args ?? {})
        }
      };
      toolCalls.push(toolCall);
    }
  }
  return toolCalls;
}
function convertFunctionCallToToolCall(functionCall, id) {
  return {
    id: id ?? `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "function",
    function: {
      name: functionCall.name,
      arguments: JSON.stringify(functionCall.args ?? {})
    }
  };
}
function hasFunctionTools(tools) {
  if (!tools || tools.length === 0) {
    return false;
  }
  return tools.some((tool) => tool.type === "function" && tool.function);
}
function extractFunctionDeclarations(tools) {
  if (!tools || typeof tools !== "object") {
    return [];
  }
  const geminiTools = tools;
  if (Array.isArray(geminiTools.functionDeclarations) && geminiTools.functionDeclarations.length > 0) {
    return geminiTools.functionDeclarations;
  }
  if (Array.isArray(tools)) {
    const normalized = normalizeToolsForGemini(tools);
    return normalized?.functionDeclarations ?? [];
  }
  return [];
}
// src/auth/antigravity/thinking.ts
var DEFAULT_THINKING_BUDGET = 16000;
function shouldIncludeThinking(model) {
  if (!model || typeof model !== "string") {
    return false;
  }
  const lowerModel = model.toLowerCase();
  if (lowerModel.endsWith("-high")) {
    return true;
  }
  if (lowerModel.includes("thinking")) {
    return true;
  }
  return false;
}
function isThinkingCapableModel(model) {
  if (!model || typeof model !== "string") {
    return false;
  }
  const lowerModel = model.toLowerCase();
  return lowerModel.includes("thinking") || lowerModel.includes("gemini-3") || lowerModel.endsWith("-high");
}
function isThinkingPart(part) {
  if (part.thought === true) {
    return true;
  }
  if (part.type === "thinking" || part.type === "reasoning") {
    return true;
  }
  return false;
}
function hasValidSignature(part) {
  if (part.thought === true && part.thoughtSignature) {
    return true;
  }
  if ((part.type === "thinking" || part.type === "reasoning") && part.signature) {
    return true;
  }
  return false;
}
function extractThinkingBlocks(response) {
  const thinkingBlocks = [];
  if (response.candidates && Array.isArray(response.candidates)) {
    for (const candidate of response.candidates) {
      const parts = candidate.content?.parts;
      if (!parts || !Array.isArray(parts)) {
        continue;
      }
      for (let i = 0;i < parts.length; i++) {
        const part = parts[i];
        if (!part || typeof part !== "object") {
          continue;
        }
        if (isThinkingPart(part)) {
          const block = {
            text: part.text || "",
            index: thinkingBlocks.length
          };
          if (part.thought === true && part.thoughtSignature) {
            block.signature = part.thoughtSignature;
          } else if (part.signature) {
            block.signature = part.signature;
          }
          thinkingBlocks.push(block);
        }
      }
    }
  }
  if (response.content && Array.isArray(response.content)) {
    for (let i = 0;i < response.content.length; i++) {
      const item = response.content[i];
      if (!item || typeof item !== "object") {
        continue;
      }
      if (item.type === "thinking" || item.type === "reasoning") {
        thinkingBlocks.push({
          text: item.text || "",
          signature: item.signature,
          index: thinkingBlocks.length
        });
      }
    }
  }
  const combinedThinking = thinkingBlocks.map((b) => b.text).join(`

`);
  return {
    thinkingBlocks,
    combinedThinking,
    hasThinking: thinkingBlocks.length > 0
  };
}
function formatThinkingForOpenAI(thinking) {
  if (!thinking || !Array.isArray(thinking) || thinking.length === 0) {
    return [];
  }
  return thinking.map((block) => {
    const formatted = {
      type: "reasoning",
      text: block.text || ""
    };
    if (block.signature) {
      formatted.signature = block.signature;
    }
    return formatted;
  });
}
function transformCandidateThinking(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return candidate;
  }
  const content = candidate.content;
  if (!content || typeof content !== "object" || !Array.isArray(content.parts)) {
    return candidate;
  }
  const thinkingTexts = [];
  const transformedParts = content.parts.map((part) => {
    if (part && typeof part === "object" && part.thought === true) {
      thinkingTexts.push(part.text || "");
      return {
        ...part,
        type: "reasoning",
        thought: undefined
      };
    }
    return part;
  });
  const result = {
    ...candidate,
    content: { ...content, parts: transformedParts }
  };
  if (thinkingTexts.length > 0) {
    result.reasoning_content = thinkingTexts.join(`

`);
  }
  return result;
}
function transformAnthropicThinking(content) {
  if (!content || !Array.isArray(content)) {
    return content;
  }
  return content.map((block) => {
    if (block && typeof block === "object" && block.type === "thinking") {
      return {
        type: "reasoning",
        text: block.text || "",
        ...block.signature ? { signature: block.signature } : {}
      };
    }
    return block;
  });
}
function filterUnsignedThinkingBlocks(parts) {
  if (!parts || !Array.isArray(parts)) {
    return parts;
  }
  return parts.filter((part) => {
    if (!part || typeof part !== "object") {
      return true;
    }
    if (isThinkingPart(part)) {
      return hasValidSignature(part);
    }
    return true;
  });
}
function transformResponseThinking(response) {
  if (!response || typeof response !== "object") {
    return response;
  }
  const result = { ...response };
  if (Array.isArray(result.candidates)) {
    result.candidates = result.candidates.map(transformCandidateThinking);
  }
  if (Array.isArray(result.content)) {
    result.content = transformAnthropicThinking(result.content);
  }
  return result;
}
function normalizeThinkingConfig(config) {
  if (!config || typeof config !== "object") {
    return;
  }
  const record = config;
  const budgetRaw = record.thinkingBudget ?? record.thinking_budget;
  const includeRaw = record.includeThoughts ?? record.include_thoughts;
  const thinkingBudget = typeof budgetRaw === "number" && Number.isFinite(budgetRaw) ? budgetRaw : undefined;
  const includeThoughts = typeof includeRaw === "boolean" ? includeRaw : undefined;
  const enableThinking = thinkingBudget !== undefined && thinkingBudget > 0;
  const finalInclude = enableThinking ? includeThoughts ?? false : false;
  if (!enableThinking && finalInclude === false && thinkingBudget === undefined && includeThoughts === undefined) {
    return;
  }
  const normalized = {};
  if (thinkingBudget !== undefined) {
    normalized.thinkingBudget = thinkingBudget;
  }
  if (finalInclude !== undefined) {
    normalized.includeThoughts = finalInclude;
  }
  return normalized;
}
function extractThinkingConfig(requestPayload, generationConfig, extraBody) {
  const thinkingConfig = generationConfig?.thinkingConfig ?? extraBody?.thinkingConfig ?? requestPayload.thinkingConfig;
  if (thinkingConfig && typeof thinkingConfig === "object") {
    const config = thinkingConfig;
    return {
      includeThoughts: Boolean(config.includeThoughts),
      thinkingBudget: typeof config.thinkingBudget === "number" ? config.thinkingBudget : DEFAULT_THINKING_BUDGET
    };
  }
  const anthropicThinking = extraBody?.thinking ?? requestPayload.thinking;
  if (anthropicThinking && typeof anthropicThinking === "object") {
    const thinking = anthropicThinking;
    if (thinking.type === "enabled" || thinking.budgetTokens) {
      return {
        includeThoughts: true,
        thinkingBudget: typeof thinking.budgetTokens === "number" ? thinking.budgetTokens : DEFAULT_THINKING_BUDGET
      };
    }
  }
  const reasoningEffort = requestPayload.reasoning_effort ?? extraBody?.reasoning_effort;
  if (reasoningEffort && typeof reasoningEffort === "string") {
    const budget = REASONING_EFFORT_BUDGET_MAP[reasoningEffort];
    if (budget !== undefined) {
      if (reasoningEffort === "none") {
        return { deleteThinkingConfig: true };
      }
      return {
        includeThoughts: true,
        thinkingBudget: budget
      };
    }
  }
  return;
}
function resolveThinkingConfig(userConfig, isThinkingModel, isClaudeModel, hasAssistantHistory) {
  if (isClaudeModel && hasAssistantHistory) {
    return { includeThoughts: false, thinkingBudget: 0 };
  }
  if (isThinkingModel && !userConfig) {
    return { includeThoughts: true, thinkingBudget: DEFAULT_THINKING_BUDGET };
  }
  return userConfig;
}
function getModelThinkingConfig(model) {
  const normalized = normalizeModelId(model);
  if (ANTIGRAVITY_MODEL_CONFIGS[normalized]) {
    return ANTIGRAVITY_MODEL_CONFIGS[normalized];
  }
  if (normalized.includes("gemini-3")) {
    return {
      thinkingType: "levels",
      min: 128,
      max: 32768,
      zeroAllowed: false,
      levels: ["low", "high"]
    };
  }
  if (normalized.includes("gemini-2.5")) {
    return {
      thinkingType: "numeric",
      min: 0,
      max: 24576,
      zeroAllowed: true
    };
  }
  if (normalized.includes("claude")) {
    return {
      thinkingType: "numeric",
      min: 1024,
      max: 200000,
      zeroAllowed: false
    };
  }
  return;
}
function budgetToLevel(budget, model) {
  const config = getModelThinkingConfig(model);
  if (!config?.levels) {
    return "medium";
  }
  const budgetMap = {
    512: "minimal",
    1024: "low",
    8192: "medium",
    24576: "high"
  };
  if (budgetMap[budget]) {
    return budgetMap[budget];
  }
  return config.levels[config.levels.length - 1] || "high";
}
function applyThinkingConfigToRequest(requestBody, model, config) {
  if ("deleteThinkingConfig" in config && config.deleteThinkingConfig) {
    if (requestBody.request && typeof requestBody.request === "object") {
      const req2 = requestBody.request;
      if (req2.generationConfig && typeof req2.generationConfig === "object") {
        const genConfig2 = req2.generationConfig;
        delete genConfig2.thinkingConfig;
      }
    }
    return;
  }
  const modelConfig = getModelThinkingConfig(model);
  if (!modelConfig) {
    return;
  }
  if (!requestBody.request || typeof requestBody.request !== "object") {
    return;
  }
  const req = requestBody.request;
  if (!req.generationConfig || typeof req.generationConfig !== "object") {
    req.generationConfig = {};
  }
  const genConfig = req.generationConfig;
  genConfig.thinkingConfig = {};
  const thinkingConfig = genConfig.thinkingConfig;
  thinkingConfig.include_thoughts = true;
  if (modelConfig.thinkingType === "numeric") {
    thinkingConfig.thinkingBudget = config.thinkingBudget;
  } else if (modelConfig.thinkingType === "levels") {
    const budget = config.thinkingBudget ?? DEFAULT_THINKING_BUDGET;
    let level = budgetToLevel(budget, model);
    level = level.toLowerCase();
    thinkingConfig.thinkingLevel = level;
  }
}
// src/auth/antigravity/thought-signature-store.ts
var signatureStore = new Map;
var sessionIdStore = new Map;
function setThoughtSignature(sessionKey, signature) {
  if (sessionKey && signature) {
    signatureStore.set(sessionKey, signature);
  }
}
function getThoughtSignature(sessionKey) {
  return signatureStore.get(sessionKey);
}
function clearThoughtSignature(sessionKey) {
  signatureStore.delete(sessionKey);
}
function getOrCreateSessionId(fetchInstanceId, sessionId) {
  if (sessionId) {
    sessionIdStore.set(fetchInstanceId, sessionId);
    return sessionId;
  }
  const existing = sessionIdStore.get(fetchInstanceId);
  if (existing) {
    return existing;
  }
  const n = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const newSessionId = `-${n}`;
  sessionIdStore.set(fetchInstanceId, newSessionId);
  return newSessionId;
}
function clearSessionId(fetchInstanceId) {
  sessionIdStore.delete(fetchInstanceId);
}
function clearFetchInstanceData(fetchInstanceId) {
  signatureStore.delete(fetchInstanceId);
  sessionIdStore.delete(fetchInstanceId);
}
// src/auth/antigravity/message-converter.ts
function debugLog3(message) {
  if (process.env.ANTIGRAVITY_DEBUG === "1") {
    console.log(`[antigravity-converter] ${message}`);
  }
}
function convertOpenAIToGemini(messages, thoughtSignature) {
  debugLog3(`Converting ${messages.length} messages, signature: ${thoughtSignature ? "present" : "none"}`);
  const contents = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      contents.push({
        role: "user",
        parts: [{ text: typeof msg.content === "string" ? msg.content : "" }]
      });
      continue;
    }
    if (msg.role === "user") {
      const parts = convertContentToParts(msg.content);
      contents.push({ role: "user", parts });
      continue;
    }
    if (msg.role === "assistant") {
      const parts = [];
      if (msg.content) {
        parts.push(...convertContentToParts(msg.content));
      }
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const toolCall of msg.tool_calls) {
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }
          const part = {
            functionCall: {
              name: toolCall.function.name,
              args
            }
          };
          part.thoughtSignature = thoughtSignature || SKIP_THOUGHT_SIGNATURE_VALIDATOR;
          debugLog3(`Injected signature into functionCall: ${toolCall.function.name} (${thoughtSignature ? "provided" : "default"})`);
          parts.push(part);
        }
      }
      if (parts.length > 0) {
        contents.push({ role: "model", parts });
      }
      continue;
    }
    if (msg.role === "tool") {
      let response = {};
      try {
        response = typeof msg.content === "string" ? JSON.parse(msg.content) : { result: msg.content };
      } catch {
        response = { result: msg.content };
      }
      const toolName = msg.name || "unknown";
      contents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: toolName,
            response
          }
        }]
      });
      continue;
    }
  }
  debugLog3(`Converted to ${contents.length} content blocks`);
  return contents;
}
function convertContentToParts(content) {
  if (!content) {
    return [{ text: "" }];
  }
  if (typeof content === "string") {
    return [{ text: content }];
  }
  const parts = [];
  for (const part of content) {
    if (part.type === "text" && part.text) {
      parts.push({ text: part.text });
    } else if (part.type === "image_url" && part.image_url?.url) {
      const url = part.image_url.url;
      if (url.startsWith("data:")) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
    }
  }
  return parts.length > 0 ? parts : [{ text: "" }];
}
function hasOpenAIMessages(body) {
  return Array.isArray(body.messages) && body.messages.length > 0;
}
function convertRequestBody(body, thoughtSignature) {
  if (!hasOpenAIMessages(body)) {
    debugLog3("No messages array found, returning body as-is");
    return body;
  }
  const messages = body.messages;
  const contents = convertOpenAIToGemini(messages, thoughtSignature);
  const converted = { ...body };
  delete converted.messages;
  converted.contents = contents;
  debugLog3(`Converted body: messages → contents (${contents.length} blocks)`);
  return converted;
}
// src/auth/antigravity/storage.ts
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";

// src/shared/data-path.ts
import path from "node:path";
import os from "node:os";
function getDataDir() {
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdgConfig, "kraken-code");
}

// src/auth/antigravity/storage.ts
function getPluginDataDir() {
  return join(getDataDir(), "opencode");
}
function getStoragePath() {
  return join(getPluginDataDir(), "kraken-code-accounts.json");
}
async function loadAccounts(path2) {
  const storagePath = path2 ?? getStoragePath();
  try {
    const content = await fs.readFile(storagePath, "utf-8");
    const data = JSON.parse(content);
    if (!isValidAccountStorage(data)) {
      return null;
    }
    return data;
  } catch (error) {
    const errorCode = error.code;
    if (errorCode === "ENOENT") {
      return null;
    }
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}
async function saveAccounts(storage, path2) {
  const storagePath = path2 ?? getStoragePath();
  await fs.mkdir(dirname(storagePath), { recursive: true });
  const content = JSON.stringify(storage, null, 2);
  const tempPath = `${storagePath}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tempPath, content, { encoding: "utf-8", mode: 384 });
  try {
    await fs.rename(tempPath, storagePath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
}
function isValidAccountStorage(data) {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data;
  if (typeof obj.version !== "number") {
    return false;
  }
  if (!Array.isArray(obj.accounts)) {
    return false;
  }
  if (typeof obj.activeIndex !== "number") {
    return false;
  }
  return true;
}

// src/auth/antigravity/accounts.ts
function isRateLimitedForFamily(account, family) {
  const resetTime = account.rateLimits[family];
  return resetTime !== undefined && Date.now() < resetTime;
}

class AccountManager {
  accounts = [];
  currentIndex = 0;
  activeIndex = 0;
  constructor(auth, storedAccounts) {
    if (storedAccounts && storedAccounts.accounts.length > 0) {
      const validActiveIndex = typeof storedAccounts.activeIndex === "number" && storedAccounts.activeIndex >= 0 && storedAccounts.activeIndex < storedAccounts.accounts.length ? storedAccounts.activeIndex : 0;
      this.activeIndex = validActiveIndex;
      this.currentIndex = validActiveIndex;
      this.accounts = storedAccounts.accounts.map((acc, index) => ({
        index,
        parts: {
          refreshToken: acc.refreshToken,
          projectId: acc.projectId,
          managedProjectId: acc.managedProjectId
        },
        access: index === validActiveIndex ? auth.access : acc.accessToken,
        expires: index === validActiveIndex ? auth.expires : acc.expiresAt,
        rateLimits: acc.rateLimits ?? {},
        lastUsed: 0,
        email: acc.email,
        tier: acc.tier
      }));
    } else {
      this.activeIndex = 0;
      this.currentIndex = 0;
      const parts = parseStoredToken(auth.refresh);
      this.accounts.push({
        index: 0,
        parts,
        access: auth.access,
        expires: auth.expires,
        rateLimits: {},
        lastUsed: 0
      });
    }
  }
  getAccountCount() {
    return this.accounts.length;
  }
  getCurrentAccount() {
    if (this.activeIndex >= 0 && this.activeIndex < this.accounts.length) {
      return this.accounts[this.activeIndex] ?? null;
    }
    return null;
  }
  getAccounts() {
    return this.accounts.map((acc) => ({ ...acc }));
  }
  getCurrentOrNextForFamily(family) {
    for (const account of this.accounts) {
      this.clearExpiredRateLimits(account);
    }
    const current = this.getCurrentAccount();
    if (current) {
      if (!isRateLimitedForFamily(current, family)) {
        const betterTierAvailable = current.tier !== "paid" && this.accounts.some((a) => a.tier === "paid" && !isRateLimitedForFamily(a, family));
        if (!betterTierAvailable) {
          current.lastUsed = Date.now();
          return current;
        }
      }
    }
    const next = this.getNextForFamily(family);
    if (next) {
      this.activeIndex = next.index;
    }
    return next;
  }
  getNextForFamily(family) {
    const available = this.accounts.filter((a) => !isRateLimitedForFamily(a, family));
    if (available.length === 0) {
      return null;
    }
    const paidAvailable = available.filter((a) => a.tier === "paid");
    const pool = paidAvailable.length > 0 ? paidAvailable : available;
    const account = pool[this.currentIndex % pool.length];
    if (!account) {
      return null;
    }
    this.currentIndex++;
    account.lastUsed = Date.now();
    return account;
  }
  markRateLimited(account, retryAfterMs, family) {
    account.rateLimits[family] = Date.now() + retryAfterMs;
  }
  clearExpiredRateLimits(account) {
    const now = Date.now();
    for (const family of MODEL_FAMILIES) {
      if (account.rateLimits[family] !== undefined && now >= account.rateLimits[family]) {
        delete account.rateLimits[family];
      }
    }
  }
  addAccount(parts, access, expires, email, tier) {
    this.accounts.push({
      index: this.accounts.length,
      parts,
      access,
      expires,
      rateLimits: {},
      lastUsed: 0,
      email,
      tier
    });
  }
  removeAccount(index) {
    if (index < 0 || index >= this.accounts.length) {
      return false;
    }
    this.accounts.splice(index, 1);
    if (index < this.activeIndex) {
      this.activeIndex--;
    } else if (index === this.activeIndex) {
      this.activeIndex = Math.min(this.activeIndex, Math.max(0, this.accounts.length - 1));
    }
    if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.accounts.length - 1));
    }
    for (let i = 0;i < this.accounts.length; i++) {
      this.accounts[i].index = i;
    }
    return true;
  }
  async save(path2) {
    const storage = {
      version: 1,
      accounts: this.accounts.map((acc) => ({
        email: acc.email ?? "",
        tier: acc.tier ?? "free",
        refreshToken: acc.parts.refreshToken,
        projectId: acc.parts.projectId ?? "",
        managedProjectId: acc.parts.managedProjectId,
        accessToken: acc.access ?? "",
        expiresAt: acc.expires ?? 0,
        rateLimits: acc.rateLimits
      })),
      activeIndex: Math.max(0, this.activeIndex)
    };
    await saveAccounts(storage, path2);
  }
  toAuthDetails() {
    const current = this.getCurrentAccount() ?? this.accounts[0];
    if (!current) {
      throw new Error("No accounts available");
    }
    const allRefreshTokens = this.accounts.map((acc) => formatTokenForStorage(acc.parts.refreshToken, acc.parts.projectId ?? "", acc.parts.managedProjectId)).join("|||");
    return {
      type: "oauth",
      refresh: allRefreshTokens,
      access: current.access ?? "",
      expires: current.expires ?? 0
    };
  }
}

// src/auth/antigravity/fetch.ts
function debugLog4(message) {
  if (process.env.ANTIGRAVITY_DEBUG === "1") {
    console.log(`[antigravity-fetch] ${message}`);
  }
}
function isRetryableError2(status) {
  if (status === 0)
    return true;
  if (status === 429)
    return true;
  if (status >= 500 && status < 600)
    return true;
  return false;
}
function getModelFamilyFromModelName(modelName) {
  const lower = modelName.toLowerCase();
  if (lower.includes("claude") || lower.includes("anthropic"))
    return "claude";
  if (lower.includes("flash"))
    return "gemini-flash";
  if (lower.includes("gemini"))
    return "gemini-pro";
  return null;
}
function getModelFamilyFromUrl(url) {
  if (url.includes("claude"))
    return "claude";
  if (url.includes("flash"))
    return "gemini-flash";
  return "gemini-pro";
}
function getModelFamily(url, init) {
  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body);
      if (typeof body.model === "string") {
        const fromModel = getModelFamilyFromModelName(body.model);
        if (fromModel)
          return fromModel;
      }
    } catch {}
  }
  return getModelFamilyFromUrl(url);
}
var GCP_PERMISSION_ERROR_PATTERNS = [
  "PERMISSION_DENIED",
  "does not have permission",
  "Cloud AI Companion API has not been used",
  "has not been enabled"
];
function isGcpPermissionError(text) {
  return GCP_PERMISSION_ERROR_PATTERNS.some((pattern) => text.includes(pattern));
}
function calculateRetryDelay2(attempt) {
  return Math.min(200 * Math.pow(2, attempt), 2000);
}
async function isRetryableResponse(response) {
  if (isRetryableError2(response.status))
    return true;
  if (response.status === 403) {
    try {
      const text = await response.clone().text();
      if (text.includes("SUBSCRIPTION_REQUIRED") || text.includes("Gemini Code Assist license")) {
        debugLog4(`[RETRY] 403 SUBSCRIPTION_REQUIRED detected, will retry with next endpoint`);
        return true;
      }
    } catch {}
  }
  return false;
}
async function attemptFetch(options) {
  const { endpoint, url, init, accessToken, projectId, sessionId, modelName, thoughtSignature } = options;
  debugLog4(`Trying endpoint: ${endpoint}`);
  try {
    const rawBody = init.body;
    if (rawBody !== undefined && typeof rawBody !== "string") {
      debugLog4(`Non-string body detected (${typeof rawBody}), signaling pass-through`);
      return "pass-through";
    }
    let parsedBody = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = {};
      }
    }
    debugLog4(`[BODY] Keys: ${Object.keys(parsedBody).join(", ")}`);
    debugLog4(`[BODY] Has contents: ${!!parsedBody.contents}, Has messages: ${!!parsedBody.messages}`);
    if (parsedBody.contents) {
      const contents = parsedBody.contents;
      debugLog4(`[BODY] contents length: ${contents.length}`);
      contents.forEach((c, i) => {
        debugLog4(`[BODY] contents[${i}].role: ${c.role}, parts: ${JSON.stringify(c.parts).substring(0, 200)}`);
      });
    }
    if (parsedBody.tools && Array.isArray(parsedBody.tools)) {
      const normalizedTools = normalizeToolsForGemini(parsedBody.tools);
      if (normalizedTools) {
        parsedBody.tools = normalizedTools;
      }
    }
    if (hasOpenAIMessages(parsedBody)) {
      debugLog4(`[CONVERT] Converting OpenAI messages to Gemini contents`);
      parsedBody = convertRequestBody(parsedBody, thoughtSignature);
      debugLog4(`[CONVERT] After conversion - Has contents: ${!!parsedBody.contents}`);
    }
    const transformed = transformRequest({
      url,
      body: parsedBody,
      accessToken,
      projectId,
      sessionId,
      modelName,
      endpointOverride: endpoint,
      thoughtSignature
    });
    const effectiveModel = modelName || transformed.body.model;
    const thinkingConfig = extractThinkingConfig(parsedBody, parsedBody.generationConfig, parsedBody);
    if (thinkingConfig) {
      debugLog4(`[THINKING] Applying thinking config for model: ${effectiveModel}`);
      applyThinkingConfigToRequest(transformed.body, effectiveModel, thinkingConfig);
      debugLog4(`[THINKING] Thinking config applied successfully`);
    }
    debugLog4(`[REQ] streaming=${transformed.streaming}, url=${transformed.url}`);
    const maxPermissionRetries = 10;
    for (let attempt = 0;attempt <= maxPermissionRetries; attempt++) {
      const response = await fetch(transformed.url, {
        method: init.method || "POST",
        headers: transformed.headers,
        body: JSON.stringify(transformed.body),
        signal: init.signal
      });
      debugLog4(`[RESP] status=${response.status} content-type=${response.headers.get("content-type") ?? ""} url=${response.url}`);
      if (response.status === 401) {
        debugLog4(`[401] Unauthorized response detected, signaling token refresh needed`);
        return "needs-refresh";
      }
      if (response.status === 403) {
        try {
          const text = await response.clone().text();
          if (isGcpPermissionError(text)) {
            if (attempt < maxPermissionRetries) {
              const delay = calculateRetryDelay2(attempt);
              debugLog4(`[RETRY] GCP permission error, retry ${attempt + 1}/${maxPermissionRetries} after ${delay}ms`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            debugLog4(`[RETRY] GCP permission error, max retries exceeded`);
          }
        } catch {}
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        let retryAfterMs = 60000;
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            retryAfterMs = parsed * 1000;
          } else {
            const httpDate = Date.parse(retryAfter);
            if (!isNaN(httpDate)) {
              retryAfterMs = Math.max(0, httpDate - Date.now());
            }
          }
        }
        debugLog4(`[429] Rate limited, retry-after: ${retryAfterMs}ms`);
        await response.body?.cancel();
        return { type: "rate-limited", retryAfterMs, status: 429 };
      }
      if (response.status >= 500 && response.status < 600) {
        debugLog4(`[5xx] Server error ${response.status}, marking for rotation`);
        await response.body?.cancel();
        return { type: "rate-limited", retryAfterMs: 300000, status: response.status };
      }
      if (!response.ok && await isRetryableResponse(response)) {
        debugLog4(`Endpoint failed: ${endpoint} (status: ${response.status}), trying next`);
        return null;
      }
      return response;
    }
    return null;
  } catch (error) {
    debugLog4(`Endpoint failed: ${endpoint} (${error instanceof Error ? error.message : "Unknown error"}), trying next`);
    return null;
  }
}
function extractSignatureFromResponse(parsed) {
  if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
    return;
  }
  for (const candidate of parsed.candidates) {
    const parts = candidate.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const sig = part.thoughtSignature || part.thought_signature;
      if (sig && typeof sig === "string") {
        return sig;
      }
    }
  }
  return;
}
async function transformResponseWithThinking(response, modelName, fetchInstanceId) {
  const streaming = isStreamingResponse(response);
  let result;
  if (streaming) {
    result = await transformStreamingResponse(response);
  } else {
    result = await transformResponse(response);
  }
  if (streaming) {
    return result.response;
  }
  try {
    const text = await result.response.clone().text();
    debugLog4(`[TSIG][RESP] Response text length: ${text.length}`);
    const parsed = JSON.parse(text);
    debugLog4(`[TSIG][RESP] Parsed keys: ${Object.keys(parsed).join(", ")}`);
    debugLog4(`[TSIG][RESP] Has candidates: ${!!parsed.candidates}, count: ${parsed.candidates?.length ?? 0}`);
    const signature = extractSignatureFromResponse(parsed);
    debugLog4(`[TSIG][RESP] Signature extracted: ${signature ? signature.substring(0, 30) + "..." : "NONE"}`);
    if (signature) {
      setThoughtSignature(fetchInstanceId, signature);
      debugLog4(`[TSIG][STORE] Stored signature for ${fetchInstanceId}`);
    } else {
      debugLog4(`[TSIG][WARN] No signature found in response!`);
    }
    if (shouldIncludeThinking(modelName)) {
      const thinkingResult = extractThinkingBlocks(parsed);
      if (thinkingResult.hasThinking) {
        const transformed = transformResponseThinking(parsed);
        return new Response(JSON.stringify(transformed), {
          status: result.response.status,
          statusText: result.response.statusText,
          headers: result.response.headers
        });
      }
    }
  } catch {}
  return result.response;
}
function createAntigravityFetch(getAuth, client, providerId, clientId, clientSecret, accountManager) {
  let cachedTokens = null;
  let cachedProjectId = null;
  let lastAccountIndex = null;
  const fetchInstanceId = crypto.randomUUID();
  let manager = accountManager || null;
  let accountsLoaded = false;
  const fetchFn = async (url, init = {}) => {
    debugLog4(`Intercepting request to: ${url}`);
    const auth = await getAuth();
    if (!auth.access || !auth.refresh) {
      throw new Error("Antigravity: No authentication tokens available");
    }
    let refreshParts = parseStoredToken(auth.refresh);
    if (!accountsLoaded && !manager && auth.refresh) {
      try {
        const storedAccounts = await loadAccounts();
        if (storedAccounts) {
          manager = new AccountManager({ refresh: auth.refresh, access: auth.access || "", expires: auth.expires || 0 }, storedAccounts);
          debugLog4(`[ACCOUNTS] Loaded ${manager.getAccountCount()} accounts from storage`);
        }
      } catch (error) {
        debugLog4(`[ACCOUNTS] Failed to load accounts, falling back to single-account: ${error instanceof Error ? error.message : "Unknown"}`);
      }
      accountsLoaded = true;
    }
    let currentAccount = null;
    if (manager) {
      const family = getModelFamily(url, init);
      currentAccount = manager.getCurrentOrNextForFamily(family);
      if (currentAccount) {
        debugLog4(`[ACCOUNTS] Using account ${currentAccount.index + 1}/${manager.getAccountCount()} for ${family}`);
        if (lastAccountIndex === null || lastAccountIndex !== currentAccount.index) {
          if (lastAccountIndex !== null) {
            debugLog4(`[ACCOUNTS] Account changed from ${lastAccountIndex + 1} to ${currentAccount.index + 1}, clearing cached state`);
          } else if (cachedProjectId) {
            debugLog4(`[ACCOUNTS] First account introduced, clearing cached state`);
          }
          cachedProjectId = null;
          cachedTokens = null;
        }
        lastAccountIndex = currentAccount.index;
        if (currentAccount.access && currentAccount.expires) {
          auth.access = currentAccount.access;
          auth.expires = currentAccount.expires;
        }
        refreshParts = {
          refreshToken: currentAccount.parts.refreshToken,
          projectId: currentAccount.parts.projectId,
          managedProjectId: currentAccount.parts.managedProjectId
        };
      }
    }
    if (!cachedTokens) {
      cachedTokens = {
        type: "antigravity",
        access_token: auth.access,
        refresh_token: refreshParts.refreshToken,
        expires_in: auth.expires ? Math.floor((auth.expires - Date.now()) / 1000) : 3600,
        timestamp: auth.expires ? auth.expires - 3600 * 1000 : Date.now()
      };
    } else {
      cachedTokens.access_token = auth.access;
      cachedTokens.refresh_token = refreshParts.refreshToken;
    }
    if (isTokenExpired(cachedTokens)) {
      debugLog4("Token expired, refreshing...");
      try {
        const newTokens = await refreshAccessToken(refreshParts.refreshToken, clientId, clientSecret);
        cachedTokens = {
          type: "antigravity",
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_in: newTokens.expires_in,
          timestamp: Date.now()
        };
        clearProjectContextCache();
        const formattedRefresh = formatTokenForStorage(newTokens.refresh_token, refreshParts.projectId || "", refreshParts.managedProjectId);
        await client.set(providerId, {
          access: newTokens.access_token,
          refresh: formattedRefresh,
          expires: Date.now() + newTokens.expires_in * 1000
        });
        debugLog4("Token refreshed successfully");
      } catch (error) {
        if (error instanceof AntigravityTokenRefreshError) {
          if (error.isInvalidGrant) {
            debugLog4(`[REFRESH] Token revoked (invalid_grant), clearing caches`);
            invalidateProjectContextByRefreshToken(refreshParts.refreshToken);
            clearProjectContextCache();
          }
          throw new Error(`Antigravity: Token refresh failed: ${error.description || error.message}${error.code ? ` (${error.code})` : ""}`);
        }
        throw new Error(`Antigravity: Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    if (!cachedProjectId) {
      const projectContext = await fetchProjectContext(cachedTokens.access_token);
      cachedProjectId = projectContext.cloudaicompanionProject || "";
      debugLog4(`[PROJECT] Fetched project ID: "${cachedProjectId}"`);
    }
    const projectId = cachedProjectId;
    debugLog4(`[PROJECT] Using project ID: "${projectId}"`);
    let modelName;
    if (init.body) {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
        if (typeof body.model === "string") {
          modelName = body.model;
        }
      } catch {}
    }
    const maxEndpoints = Math.min(ANTIGRAVITY_ENDPOINT_FALLBACKS.length, 3);
    const sessionId = getOrCreateSessionId(fetchInstanceId);
    const thoughtSignature = getThoughtSignature(fetchInstanceId);
    debugLog4(`[TSIG][GET] sessionId=${sessionId}, signature=${thoughtSignature ? thoughtSignature.substring(0, 20) + "..." : "none"}`);
    let hasRefreshedFor401 = false;
    const executeWithEndpoints = async () => {
      for (let i = 0;i < maxEndpoints; i++) {
        const endpoint = ANTIGRAVITY_ENDPOINT_FALLBACKS[i];
        const response = await attemptFetch({
          endpoint,
          url,
          init,
          accessToken: cachedTokens.access_token,
          projectId,
          sessionId,
          modelName,
          thoughtSignature
        });
        if (response === "pass-through") {
          debugLog4("Non-string body detected, passing through with auth headers");
          const headersWithAuth = {
            ...init.headers,
            Authorization: `Bearer ${cachedTokens.access_token}`
          };
          return fetch(url, { ...init, headers: headersWithAuth });
        }
        if (response === "needs-refresh") {
          if (hasRefreshedFor401) {
            debugLog4("[401] Already refreshed once, returning unauthorized error");
            return new Response(JSON.stringify({
              error: {
                message: "Authentication failed after token refresh",
                type: "unauthorized",
                code: "token_refresh_failed"
              }
            }), {
              status: 401,
              statusText: "Unauthorized",
              headers: { "Content-Type": "application/json" }
            });
          }
          debugLog4("[401] Refreshing token and retrying...");
          hasRefreshedFor401 = true;
          try {
            const newTokens = await refreshAccessToken(refreshParts.refreshToken, clientId, clientSecret);
            cachedTokens = {
              type: "antigravity",
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expires_in: newTokens.expires_in,
              timestamp: Date.now()
            };
            clearProjectContextCache();
            const formattedRefresh = formatTokenForStorage(newTokens.refresh_token, refreshParts.projectId || "", refreshParts.managedProjectId);
            await client.set(providerId, {
              access: newTokens.access_token,
              refresh: formattedRefresh,
              expires: Date.now() + newTokens.expires_in * 1000
            });
            debugLog4("[401] Token refreshed, retrying request...");
            return executeWithEndpoints();
          } catch (refreshError) {
            if (refreshError instanceof AntigravityTokenRefreshError) {
              if (refreshError.isInvalidGrant) {
                debugLog4(`[401] Token revoked (invalid_grant), clearing caches`);
                invalidateProjectContextByRefreshToken(refreshParts.refreshToken);
                clearProjectContextCache();
              }
              debugLog4(`[401] Token refresh failed: ${refreshError.description || refreshError.message}`);
              return new Response(JSON.stringify({
                error: {
                  message: refreshError.description || refreshError.message,
                  type: refreshError.isInvalidGrant ? "token_revoked" : "unauthorized",
                  code: refreshError.code || "token_refresh_failed"
                }
              }), {
                status: 401,
                statusText: "Unauthorized",
                headers: { "Content-Type": "application/json" }
              });
            }
            debugLog4(`[401] Token refresh failed: ${refreshError instanceof Error ? refreshError.message : "Unknown error"}`);
            return new Response(JSON.stringify({
              error: {
                message: refreshError instanceof Error ? refreshError.message : "Unknown error",
                type: "unauthorized",
                code: "token_refresh_failed"
              }
            }), {
              status: 401,
              statusText: "Unauthorized",
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        if (response && typeof response === "object" && "type" in response && response.type === "rate-limited") {
          const rateLimitInfo = response;
          const family = getModelFamily(url, init);
          if (rateLimitInfo.retryAfterMs > 5000 && manager && currentAccount) {
            manager.markRateLimited(currentAccount, rateLimitInfo.retryAfterMs, family);
            await manager.save();
            debugLog4(`[RATE-LIMIT] Account ${currentAccount.index + 1} rate-limited for ${family}, rotating...`);
            const nextAccount = manager.getCurrentOrNextForFamily(family);
            if (nextAccount && nextAccount.index !== currentAccount.index) {
              debugLog4(`[RATE-LIMIT] Switched to account ${nextAccount.index + 1}`);
              return fetchFn(url, init);
            }
          }
          const isLastEndpoint = i === maxEndpoints - 1;
          if (isLastEndpoint) {
            const isServerError = rateLimitInfo.status >= 500;
            debugLog4(`[RATE-LIMIT] No alternative account or endpoint, returning ${rateLimitInfo.status}`);
            return new Response(JSON.stringify({
              error: {
                message: isServerError ? `Server error (${rateLimitInfo.status}). Retry after ${Math.ceil(rateLimitInfo.retryAfterMs / 1000)} seconds` : `Rate limited. Retry after ${Math.ceil(rateLimitInfo.retryAfterMs / 1000)} seconds`,
                type: isServerError ? "server_error" : "rate_limit",
                code: isServerError ? "server_error" : "rate_limited"
              }
            }), {
              status: rateLimitInfo.status,
              statusText: isServerError ? "Server Error" : "Too Many Requests",
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(Math.ceil(rateLimitInfo.retryAfterMs / 1000))
              }
            });
          }
          debugLog4(`[RATE-LIMIT] No alternative account available, trying next endpoint`);
          continue;
        }
        if (response && response instanceof Response) {
          debugLog4(`Success with endpoint: ${endpoint}`);
          const transformedResponse = await transformResponseWithThinking(response, modelName || "", fetchInstanceId);
          return transformedResponse;
        }
      }
      const errorMessage = `All Antigravity endpoints failed after ${maxEndpoints} attempts`;
      debugLog4(errorMessage);
      return new Response(JSON.stringify({
        error: {
          message: errorMessage,
          type: "endpoint_failure",
          code: "all_endpoints_failed"
        }
      }), {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      });
    };
    return executeWithEndpoints();
  };
  return fetchFn;
}
// ../node_modules/@clack/prompts/node_modules/@clack/core/dist/index.mjs
var import_picocolors = __toESM(require_picocolors(), 1);
import { stdout as R, stdin as q } from "node:process";
var import_sisteransi = __toESM(require_src(), 1);
import ot from "node:readline";
var at = (t) => t === 161 || t === 164 || t === 167 || t === 168 || t === 170 || t === 173 || t === 174 || t >= 176 && t <= 180 || t >= 182 && t <= 186 || t >= 188 && t <= 191 || t === 198 || t === 208 || t === 215 || t === 216 || t >= 222 && t <= 225 || t === 230 || t >= 232 && t <= 234 || t === 236 || t === 237 || t === 240 || t === 242 || t === 243 || t >= 247 && t <= 250 || t === 252 || t === 254 || t === 257 || t === 273 || t === 275 || t === 283 || t === 294 || t === 295 || t === 299 || t >= 305 && t <= 307 || t === 312 || t >= 319 && t <= 322 || t === 324 || t >= 328 && t <= 331 || t === 333 || t === 338 || t === 339 || t === 358 || t === 359 || t === 363 || t === 462 || t === 464 || t === 466 || t === 468 || t === 470 || t === 472 || t === 474 || t === 476 || t === 593 || t === 609 || t === 708 || t === 711 || t >= 713 && t <= 715 || t === 717 || t === 720 || t >= 728 && t <= 731 || t === 733 || t === 735 || t >= 768 && t <= 879 || t >= 913 && t <= 929 || t >= 931 && t <= 937 || t >= 945 && t <= 961 || t >= 963 && t <= 969 || t === 1025 || t >= 1040 && t <= 1103 || t === 1105 || t === 8208 || t >= 8211 && t <= 8214 || t === 8216 || t === 8217 || t === 8220 || t === 8221 || t >= 8224 && t <= 8226 || t >= 8228 && t <= 8231 || t === 8240 || t === 8242 || t === 8243 || t === 8245 || t === 8251 || t === 8254 || t === 8308 || t === 8319 || t >= 8321 && t <= 8324 || t === 8364 || t === 8451 || t === 8453 || t === 8457 || t === 8467 || t === 8470 || t === 8481 || t === 8482 || t === 8486 || t === 8491 || t === 8531 || t === 8532 || t >= 8539 && t <= 8542 || t >= 8544 && t <= 8555 || t >= 8560 && t <= 8569 || t === 8585 || t >= 8592 && t <= 8601 || t === 8632 || t === 8633 || t === 8658 || t === 8660 || t === 8679 || t === 8704 || t === 8706 || t === 8707 || t === 8711 || t === 8712 || t === 8715 || t === 8719 || t === 8721 || t === 8725 || t === 8730 || t >= 8733 && t <= 8736 || t === 8739 || t === 8741 || t >= 8743 && t <= 8748 || t === 8750 || t >= 8756 && t <= 8759 || t === 8764 || t === 8765 || t === 8776 || t === 8780 || t === 8786 || t === 8800 || t === 8801 || t >= 8804 && t <= 8807 || t === 8810 || t === 8811 || t === 8814 || t === 8815 || t === 8834 || t === 8835 || t === 8838 || t === 8839 || t === 8853 || t === 8857 || t === 8869 || t === 8895 || t === 8978 || t >= 9312 && t <= 9449 || t >= 9451 && t <= 9547 || t >= 9552 && t <= 9587 || t >= 9600 && t <= 9615 || t >= 9618 && t <= 9621 || t === 9632 || t === 9633 || t >= 9635 && t <= 9641 || t === 9650 || t === 9651 || t === 9654 || t === 9655 || t === 9660 || t === 9661 || t === 9664 || t === 9665 || t >= 9670 && t <= 9672 || t === 9675 || t >= 9678 && t <= 9681 || t >= 9698 && t <= 9701 || t === 9711 || t === 9733 || t === 9734 || t === 9737 || t === 9742 || t === 9743 || t === 9756 || t === 9758 || t === 9792 || t === 9794 || t === 9824 || t === 9825 || t >= 9827 && t <= 9829 || t >= 9831 && t <= 9834 || t === 9836 || t === 9837 || t === 9839 || t === 9886 || t === 9887 || t === 9919 || t >= 9926 && t <= 9933 || t >= 9935 && t <= 9939 || t >= 9941 && t <= 9953 || t === 9955 || t === 9960 || t === 9961 || t >= 9963 && t <= 9969 || t === 9972 || t >= 9974 && t <= 9977 || t === 9979 || t === 9980 || t === 9982 || t === 9983 || t === 10045 || t >= 10102 && t <= 10111 || t >= 11094 && t <= 11097 || t >= 12872 && t <= 12879 || t >= 57344 && t <= 63743 || t >= 65024 && t <= 65039 || t === 65533 || t >= 127232 && t <= 127242 || t >= 127248 && t <= 127277 || t >= 127280 && t <= 127337 || t >= 127344 && t <= 127373 || t === 127375 || t === 127376 || t >= 127387 && t <= 127404 || t >= 917760 && t <= 917999 || t >= 983040 && t <= 1048573 || t >= 1048576 && t <= 1114109;
var lt = (t) => t === 12288 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510;
var ht = (t) => t >= 4352 && t <= 4447 || t === 8986 || t === 8987 || t === 9001 || t === 9002 || t >= 9193 && t <= 9196 || t === 9200 || t === 9203 || t === 9725 || t === 9726 || t === 9748 || t === 9749 || t >= 9800 && t <= 9811 || t === 9855 || t === 9875 || t === 9889 || t === 9898 || t === 9899 || t === 9917 || t === 9918 || t === 9924 || t === 9925 || t === 9934 || t === 9940 || t === 9962 || t === 9970 || t === 9971 || t === 9973 || t === 9978 || t === 9981 || t === 9989 || t === 9994 || t === 9995 || t === 10024 || t === 10060 || t === 10062 || t >= 10067 && t <= 10069 || t === 10071 || t >= 10133 && t <= 10135 || t === 10160 || t === 10175 || t === 11035 || t === 11036 || t === 11088 || t === 11093 || t >= 11904 && t <= 11929 || t >= 11931 && t <= 12019 || t >= 12032 && t <= 12245 || t >= 12272 && t <= 12287 || t >= 12289 && t <= 12350 || t >= 12353 && t <= 12438 || t >= 12441 && t <= 12543 || t >= 12549 && t <= 12591 || t >= 12593 && t <= 12686 || t >= 12688 && t <= 12771 || t >= 12783 && t <= 12830 || t >= 12832 && t <= 12871 || t >= 12880 && t <= 19903 || t >= 19968 && t <= 42124 || t >= 42128 && t <= 42182 || t >= 43360 && t <= 43388 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65049 || t >= 65072 && t <= 65106 || t >= 65108 && t <= 65126 || t >= 65128 && t <= 65131 || t >= 94176 && t <= 94180 || t === 94192 || t === 94193 || t >= 94208 && t <= 100343 || t >= 100352 && t <= 101589 || t >= 101632 && t <= 101640 || t >= 110576 && t <= 110579 || t >= 110581 && t <= 110587 || t === 110589 || t === 110590 || t >= 110592 && t <= 110882 || t === 110898 || t >= 110928 && t <= 110930 || t === 110933 || t >= 110948 && t <= 110951 || t >= 110960 && t <= 111355 || t === 126980 || t === 127183 || t === 127374 || t >= 127377 && t <= 127386 || t >= 127488 && t <= 127490 || t >= 127504 && t <= 127547 || t >= 127552 && t <= 127560 || t === 127568 || t === 127569 || t >= 127584 && t <= 127589 || t >= 127744 && t <= 127776 || t >= 127789 && t <= 127797 || t >= 127799 && t <= 127868 || t >= 127870 && t <= 127891 || t >= 127904 && t <= 127946 || t >= 127951 && t <= 127955 || t >= 127968 && t <= 127984 || t === 127988 || t >= 127992 && t <= 128062 || t === 128064 || t >= 128066 && t <= 128252 || t >= 128255 && t <= 128317 || t >= 128331 && t <= 128334 || t >= 128336 && t <= 128359 || t === 128378 || t === 128405 || t === 128406 || t === 128420 || t >= 128507 && t <= 128591 || t >= 128640 && t <= 128709 || t === 128716 || t >= 128720 && t <= 128722 || t >= 128725 && t <= 128727 || t >= 128732 && t <= 128735 || t === 128747 || t === 128748 || t >= 128756 && t <= 128764 || t >= 128992 && t <= 129003 || t === 129008 || t >= 129292 && t <= 129338 || t >= 129340 && t <= 129349 || t >= 129351 && t <= 129535 || t >= 129648 && t <= 129660 || t >= 129664 && t <= 129672 || t >= 129680 && t <= 129725 || t >= 129727 && t <= 129733 || t >= 129742 && t <= 129755 || t >= 129760 && t <= 129768 || t >= 129776 && t <= 129784 || t >= 131072 && t <= 196605 || t >= 196608 && t <= 262141;
var O = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var y = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var M = /\t{1,1000}/y;
var P = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var L = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var ct = /\p{M}+/gu;
var pt = { limit: 1 / 0, ellipsis: "" };
var X = (t, e = {}, s = {}) => {
  const i = e.limit ?? 1 / 0, r = e.ellipsis ?? "", n = e?.ellipsisWidth ?? (r ? X(r, pt, s).width : 0), u = s.ansiWidth ?? 0, a = s.controlWidth ?? 0, l = s.tabWidth ?? 8, E = s.ambiguousWidth ?? 1, g = s.emojiWidth ?? 2, m = s.fullWidthWidth ?? 2, A = s.regularWidth ?? 1, V = s.wideWidth ?? 2;
  let h = 0, o = 0, f = t.length, v = 0, F = false, d = f, b = Math.max(0, i - n), C = 0, B = 0, c = 0, p = 0;
  t:
    for (;; ) {
      if (B > C || o >= f && o > h) {
        const ut = t.slice(C, B) || t.slice(h, o);
        v = 0;
        for (const Y of ut.replaceAll(ct, "")) {
          const $ = Y.codePointAt(0) || 0;
          if (lt($) ? p = m : ht($) ? p = V : E !== A && at($) ? p = E : p = A, c + p > b && (d = Math.min(d, Math.max(C, h) + v)), c + p > i) {
            F = true;
            break t;
          }
          v += Y.length, c += p;
        }
        C = B = 0;
      }
      if (o >= f)
        break;
      if (L.lastIndex = o, L.test(t)) {
        if (v = L.lastIndex - o, p = v * A, c + p > b && (d = Math.min(d, o + Math.floor((b - c) / A))), c + p > i) {
          F = true;
          break;
        }
        c += p, C = h, B = o, o = h = L.lastIndex;
        continue;
      }
      if (O.lastIndex = o, O.test(t)) {
        if (c + u > b && (d = Math.min(d, o)), c + u > i) {
          F = true;
          break;
        }
        c += u, C = h, B = o, o = h = O.lastIndex;
        continue;
      }
      if (y.lastIndex = o, y.test(t)) {
        if (v = y.lastIndex - o, p = v * a, c + p > b && (d = Math.min(d, o + Math.floor((b - c) / a))), c + p > i) {
          F = true;
          break;
        }
        c += p, C = h, B = o, o = h = y.lastIndex;
        continue;
      }
      if (M.lastIndex = o, M.test(t)) {
        if (v = M.lastIndex - o, p = v * l, c + p > b && (d = Math.min(d, o + Math.floor((b - c) / l))), c + p > i) {
          F = true;
          break;
        }
        c += p, C = h, B = o, o = h = M.lastIndex;
        continue;
      }
      if (P.lastIndex = o, P.test(t)) {
        if (c + g > b && (d = Math.min(d, o)), c + g > i) {
          F = true;
          break;
        }
        c += g, C = h, B = o, o = h = P.lastIndex;
        continue;
      }
      o += 1;
    }
  return { width: F ? b : c, index: F ? d : f, truncated: F, ellipsed: F && i >= n };
};
var ft = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var S = (t, e = {}) => X(t, ft, e).width;
var W = "\x1B";
var Z = "";
var Ft = 39;
var j = "\x07";
var Q = "[";
var dt = "]";
var tt = "m";
var U = `${dt}8;;`;
var et = new RegExp(`(?:\\${Q}(?<code>\\d+)m|\\${U}(?<uri>.*)${j})`, "y");
var mt = (t) => {
  if (t >= 30 && t <= 37 || t >= 90 && t <= 97)
    return 39;
  if (t >= 40 && t <= 47 || t >= 100 && t <= 107)
    return 49;
  if (t === 1 || t === 2)
    return 22;
  if (t === 3)
    return 23;
  if (t === 4)
    return 24;
  if (t === 7)
    return 27;
  if (t === 8)
    return 28;
  if (t === 9)
    return 29;
  if (t === 0)
    return 0;
};
var st = (t) => `${W}${Q}${t}${tt}`;
var it = (t) => `${W}${U}${t}${j}`;
var gt = (t) => t.map((e) => S(e));
var G = (t, e, s) => {
  const i = e[Symbol.iterator]();
  let r = false, n = false, u = t.at(-1), a = u === undefined ? 0 : S(u), l = i.next(), E = i.next(), g = 0;
  for (;!l.done; ) {
    const m = l.value, A = S(m);
    a + A <= s ? t[t.length - 1] += m : (t.push(m), a = 0), (m === W || m === Z) && (r = true, n = e.startsWith(U, g + 1)), r ? n ? m === j && (r = false, n = false) : m === tt && (r = false) : (a += A, a === s && !E.done && (t.push(""), a = 0)), l = E, E = i.next(), g += m.length;
  }
  u = t.at(-1), !a && u !== undefined && u.length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
};
var vt = (t) => {
  const e = t.split(" ");
  let s = e.length;
  for (;s > 0 && !(S(e[s - 1]) > 0); )
    s--;
  return s === e.length ? t : e.slice(0, s).join(" ") + e.slice(s).join("");
};
var Et = (t, e, s = {}) => {
  if (s.trim !== false && t.trim() === "")
    return "";
  let i = "", r, n;
  const u = t.split(" "), a = gt(u);
  let l = [""];
  for (const [h, o] of u.entries()) {
    s.trim !== false && (l[l.length - 1] = (l.at(-1) ?? "").trimStart());
    let f = S(l.at(-1) ?? "");
    if (h !== 0 && (f >= e && (s.wordWrap === false || s.trim === false) && (l.push(""), f = 0), (f > 0 || s.trim === false) && (l[l.length - 1] += " ", f++)), s.hard && a[h] > e) {
      const v = e - f, F = 1 + Math.floor((a[h] - v - 1) / e);
      Math.floor((a[h] - 1) / e) < F && l.push(""), G(l, o, e);
      continue;
    }
    if (f + a[h] > e && f > 0 && a[h] > 0) {
      if (s.wordWrap === false && f < e) {
        G(l, o, e);
        continue;
      }
      l.push("");
    }
    if (f + a[h] > e && s.wordWrap === false) {
      G(l, o, e);
      continue;
    }
    l[l.length - 1] += o;
  }
  s.trim !== false && (l = l.map((h) => vt(h)));
  const E = l.join(`
`), g = E[Symbol.iterator]();
  let m = g.next(), A = g.next(), V = 0;
  for (;!m.done; ) {
    const h = m.value, o = A.value;
    if (i += h, h === W || h === Z) {
      et.lastIndex = V + 1;
      const F = et.exec(E)?.groups;
      if (F?.code !== undefined) {
        const d = Number.parseFloat(F.code);
        r = d === Ft ? undefined : d;
      } else
        F?.uri !== undefined && (n = F.uri.length === 0 ? undefined : F.uri);
    }
    const f = r ? mt(r) : undefined;
    o === `
` ? (n && (i += it("")), r && f && (i += st(f))) : h === `
` && (r && f && (i += st(r)), n && (i += it(n))), V += h.length, m = A, A = g.next();
  }
  return i;
};
function K(t, e, s) {
  return String(t).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => Et(i, e, s)).join(`
`);
}
var At = ["up", "down", "left", "right", "space", "enter", "cancel"];
var _ = { actions: new Set(At), aliases: new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["\x03", "cancel"], ["escape", "cancel"]]), messages: { cancel: "Canceled", error: "Something went wrong" }, withGuide: true };
function H(t, e) {
  if (typeof t == "string")
    return _.aliases.get(t) === e;
  for (const s of t)
    if (s !== undefined && H(s, e))
      return true;
  return false;
}
function _t(t, e) {
  if (t === e)
    return;
  const s = t.split(`
`), i = e.split(`
`), r = Math.max(s.length, i.length), n = [];
  for (let u = 0;u < r; u++)
    s[u] !== i[u] && n.push(u);
  return { lines: n, numLinesBefore: s.length, numLinesAfter: i.length, numLines: r };
}
var bt = globalThis.process.platform.startsWith("win");
var z = Symbol("clack:cancel");
function Ct(t) {
  return t === z;
}
function T(t, e) {
  const s = t;
  s.isTTY && s.setRawMode(e);
}
var rt = (t) => ("columns" in t) && typeof t.columns == "number" ? t.columns : 80;
var nt = (t) => ("rows" in t) && typeof t.rows == "number" ? t.rows : 20;
function Bt(t, e, s, i = s) {
  const r = rt(t ?? R);
  return K(e, r - s.length, { hard: true, trim: false }).split(`
`).map((n, u) => `${u === 0 ? i : s}${n}`).join(`
`);
}

class x {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = new Map;
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  constructor(e, s = true) {
    const { input: i = q, output: r = R, render: n, signal: u, ...a } = e;
    this.opts = a, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = n.bind(this), this._track = s, this._abortSignal = u, this.input = i, this.output = r;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(e, s) {
    const i = this._subscribers.get(e) ?? [];
    i.push(s), this._subscribers.set(e, i);
  }
  on(e, s) {
    this.setSubscriber(e, { cb: s });
  }
  once(e, s) {
    this.setSubscriber(e, { cb: s, once: true });
  }
  emit(e, ...s) {
    const i = this._subscribers.get(e) ?? [], r = [];
    for (const n of i)
      n.cb(...s), n.once && r.push(() => i.splice(i.indexOf(n), 1));
    for (const n of r)
      n();
  }
  prompt() {
    return new Promise((e) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), e(z);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      this.rl = ot.createInterface({ input: this.input, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), this.rl.prompt(), this.opts.initialUserInput !== undefined && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), T(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), T(this.input, false), e(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), T(this.input, false), e(z);
      });
    });
  }
  _isActionKey(e, s) {
    return e === "\t";
  }
  _setValue(e) {
    this.value = e, this.emit("value", this.value);
  }
  _setUserInput(e, s) {
    this.userInput = e ?? "", this.emit("userInput", this.userInput), s && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  onKeypress(e, s) {
    if (this._track && s.name !== "return" && (s.name && this._isActionKey(e, s) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), s?.name && (!this._track && _.aliases.has(s.name) && this.emit("cursor", _.aliases.get(s.name)), _.actions.has(s.name) && this.emit("cursor", s.name)), e && (e.toLowerCase() === "y" || e.toLowerCase() === "n") && this.emit("confirm", e.toLowerCase() === "y"), this.emit("key", e?.toLowerCase(), s), s?.name === "return") {
      if (this.opts.validate) {
        const i = this.opts.validate(this.value);
        i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
      }
      this.state !== "error" && (this.state = "submit");
    }
    H([e, s?.name, s?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), T(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const e = K(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, e * -1));
  }
  render() {
    const e = K(this._render(this) ?? "", process.stdout.columns, { hard: true, trim: false });
    if (e !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const s = _t(this._prevFrame, e), i = nt(this.output);
        if (this.restoreCursor(), s) {
          const r = Math.max(0, s.numLinesAfter - i), n = Math.max(0, s.numLinesBefore - i);
          let u = s.lines.find((a) => a >= r);
          if (u === undefined) {
            this._prevFrame = e;
            return;
          }
          if (s.lines.length === 1) {
            this.output.write(import_sisteransi.cursor.move(0, u - n)), this.output.write(import_sisteransi.erase.lines(1));
            const a = e.split(`
`);
            this.output.write(a[u]), this._prevFrame = e, this.output.write(import_sisteransi.cursor.move(0, a.length - u - 1));
            return;
          } else if (s.lines.length > 1) {
            if (r < n)
              u = r;
            else {
              const l = u - n;
              l > 0 && this.output.write(import_sisteransi.cursor.move(0, l));
            }
            this.output.write(import_sisteransi.erase.down());
            const a = e.split(`
`).slice(u);
            this.output.write(a.join(`
`)), this._prevFrame = e;
            return;
          }
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(e), this.state === "initial" && (this.state = "active"), this._prevFrame = e;
    }
  }
}
function wt(t, e) {
  if (t === undefined || e.length === 0)
    return 0;
  const s = e.findIndex((i) => i.value === t);
  return s !== -1 ? s : 0;
}
function Dt(t, e) {
  return (e.label ?? String(e.value)).toLowerCase().includes(t.toLowerCase());
}
function St(t, e) {
  if (e)
    return t ? e : e[0];
}

class Vt extends x {
  filteredOptions;
  multiple;
  isNavigating = false;
  selectedValues = [];
  focusedValue;
  #t = 0;
  #s = "";
  #i;
  #e;
  get cursor() {
    return this.#t;
  }
  get userInputWithCursor() {
    if (!this.userInput)
      return import_picocolors.default.inverse(import_picocolors.default.hidden("_"));
    if (this._cursor >= this.userInput.length)
      return `${this.userInput}█`;
    const e = this.userInput.slice(0, this._cursor), [s, ...i] = this.userInput.slice(this._cursor);
    return `${e}${import_picocolors.default.inverse(s)}${i.join("")}`;
  }
  get options() {
    return typeof this.#e == "function" ? this.#e() : this.#e;
  }
  constructor(e) {
    super(e), this.#e = e.options;
    const s = this.options;
    this.filteredOptions = [...s], this.multiple = e.multiple === true, this.#i = e.filter ?? Dt;
    let i;
    if (e.initialValue && Array.isArray(e.initialValue) ? this.multiple ? i = e.initialValue : i = e.initialValue.slice(0, 1) : !this.multiple && this.options.length > 0 && (i = [this.options[0].value]), i)
      for (const r of i) {
        const n = s.findIndex((u) => u.value === r);
        n !== -1 && (this.toggleSelected(r), this.#t = n);
      }
    this.focusedValue = this.options[this.#t]?.value, this.on("key", (r, n) => this.#r(r, n)), this.on("userInput", (r) => this.#n(r));
  }
  _isActionKey(e, s) {
    return e === "\t" || this.multiple && this.isNavigating && s.name === "space" && e !== undefined && e !== "";
  }
  #r(e, s) {
    const i = s.name === "up", r = s.name === "down", n = s.name === "return";
    i || r ? (this.#t = Math.max(0, Math.min(this.#t + (i ? -1 : 1), this.filteredOptions.length - 1)), this.focusedValue = this.filteredOptions[this.#t]?.value, this.multiple || (this.selectedValues = [this.focusedValue]), this.isNavigating = true) : n ? this.value = St(this.multiple, this.selectedValues) : this.multiple ? this.focusedValue !== undefined && (s.name === "tab" || this.isNavigating && s.name === "space") ? this.toggleSelected(this.focusedValue) : this.isNavigating = false : (this.focusedValue && (this.selectedValues = [this.focusedValue]), this.isNavigating = false);
  }
  deselectAll() {
    this.selectedValues = [];
  }
  toggleSelected(e) {
    this.filteredOptions.length !== 0 && (this.multiple ? this.selectedValues.includes(e) ? this.selectedValues = this.selectedValues.filter((s) => s !== e) : this.selectedValues = [...this.selectedValues, e] : this.selectedValues = [e]);
  }
  #n(e) {
    if (e !== this.#s) {
      this.#s = e;
      const s = this.options;
      e ? this.filteredOptions = s.filter((i) => this.#i(e, i)) : this.filteredOptions = [...s], this.#t = wt(this.focusedValue, this.filteredOptions), this.focusedValue = this.filteredOptions[this.#t]?.value, this.multiple || (this.focusedValue !== undefined ? this.toggleSelected(this.focusedValue) : this.deselectAll());
    }
  }
}

class kt extends x {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(e) {
    super(e, false), this.value = !!e.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (s) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = s, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}

class yt extends x {
  options;
  cursor = 0;
  #t;
  getGroupItems(e) {
    return this.options.filter((s) => s.group === e);
  }
  isGroupSelected(e) {
    const s = this.getGroupItems(e), i = this.value;
    return i === undefined ? false : s.every((r) => i.includes(r.value));
  }
  toggleValue() {
    const e = this.options[this.cursor];
    if (this.value === undefined && (this.value = []), e.group === true) {
      const s = e.value, i = this.getGroupItems(s);
      this.isGroupSelected(s) ? this.value = this.value.filter((r) => i.findIndex((n) => n.value === r) === -1) : this.value = [...this.value, ...i.map((r) => r.value)], this.value = Array.from(new Set(this.value));
    } else {
      const s = this.value.includes(e.value);
      this.value = s ? this.value.filter((i) => i !== e.value) : [...this.value, e.value];
    }
  }
  constructor(e) {
    super(e, false);
    const { options: s } = e;
    this.#t = e.selectableGroups !== false, this.options = Object.entries(s).flatMap(([i, r]) => [{ value: i, group: true, label: i }, ...r.map((n) => ({ ...n, group: i }))]), this.value = [...e.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: i }) => i === e.cursorAt), this.#t ? 0 : 1), this.on("cursor", (i) => {
      switch (i) {
        case "left":
        case "up": {
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
          break;
        }
        case "down":
        case "right": {
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
          break;
        }
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
}
function D(t, e, s) {
  const i = t + e, r = Math.max(s.length - 1, 0), n = i < 0 ? r : i > r ? 0 : i;
  return s[n].disabled ? D(n, e < 0 ? -1 : 1, s) : n;
}
class Wt extends x {
  options;
  cursor = 0;
  get _selectedValue() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._selectedValue.value;
  }
  constructor(e) {
    super(e, false), this.options = e.options;
    const s = this.options.findIndex(({ value: r }) => r === e.initialValue), i = s === -1 ? 0 : s;
    this.cursor = this.options[i].disabled ? D(i, 1, this.options) : i, this.changeValue(), this.on("cursor", (r) => {
      switch (r) {
        case "left":
        case "up":
          this.cursor = D(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = D(this.cursor, 1, this.options);
          break;
      }
      this.changeValue();
    });
  }
}

// ../node_modules/@clack/prompts/dist/index.mjs
var import_picocolors2 = __toESM(require_picocolors(), 1);
import P2 from "node:process";
var import_sisteransi2 = __toESM(require_src(), 1);
function ht2() {
  return P2.platform !== "win32" ? P2.env.TERM !== "linux" : !!P2.env.CI || !!P2.env.WT_SESSION || !!P2.env.TERMINUS_SUBLIME || P2.env.ConEmuTask === "{cmd::Cmder}" || P2.env.TERM_PROGRAM === "Terminus-Sublime" || P2.env.TERM_PROGRAM === "vscode" || P2.env.TERM === "xterm-256color" || P2.env.TERM === "alacritty" || P2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var ee = ht2();
var w2 = (e, r) => ee ? e : r;
var Me = w2("◆", "*");
var ce = w2("■", "x");
var de = w2("▲", "x");
var k = w2("◇", "o");
var $e = w2("┌", "T");
var h = w2("│", "|");
var x2 = w2("└", "—");
var Re = w2("┐", "T");
var Oe = w2("┘", "—");
var Y = w2("●", ">");
var K2 = w2("○", " ");
var te = w2("◻", "[•]");
var G2 = w2("◼", "[+]");
var z2 = w2("◻", "[ ]");
var Pe = w2("▪", "•");
var se = w2("─", "-");
var he = w2("╮", "+");
var Ne = w2("├", "+");
var me = w2("╯", "+");
var pe = w2("╰", "+");
var We = w2("╭", "+");
var ge = w2("●", "•");
var fe = w2("◆", "*");
var Fe = w2("▲", "!");
var ye = w2("■", "x");
var N2 = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return import_picocolors2.default.cyan(Me);
    case "cancel":
      return import_picocolors2.default.red(ce);
    case "error":
      return import_picocolors2.default.yellow(de);
    case "submit":
      return import_picocolors2.default.green(k);
  }
};
var Ee = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return import_picocolors2.default.cyan(h);
    case "cancel":
      return import_picocolors2.default.red(h);
    case "error":
      return import_picocolors2.default.yellow(h);
    case "submit":
      return import_picocolors2.default.green(h);
  }
};
var mt2 = (e) => e === 161 || e === 164 || e === 167 || e === 168 || e === 170 || e === 173 || e === 174 || e >= 176 && e <= 180 || e >= 182 && e <= 186 || e >= 188 && e <= 191 || e === 198 || e === 208 || e === 215 || e === 216 || e >= 222 && e <= 225 || e === 230 || e >= 232 && e <= 234 || e === 236 || e === 237 || e === 240 || e === 242 || e === 243 || e >= 247 && e <= 250 || e === 252 || e === 254 || e === 257 || e === 273 || e === 275 || e === 283 || e === 294 || e === 295 || e === 299 || e >= 305 && e <= 307 || e === 312 || e >= 319 && e <= 322 || e === 324 || e >= 328 && e <= 331 || e === 333 || e === 338 || e === 339 || e === 358 || e === 359 || e === 363 || e === 462 || e === 464 || e === 466 || e === 468 || e === 470 || e === 472 || e === 474 || e === 476 || e === 593 || e === 609 || e === 708 || e === 711 || e >= 713 && e <= 715 || e === 717 || e === 720 || e >= 728 && e <= 731 || e === 733 || e === 735 || e >= 768 && e <= 879 || e >= 913 && e <= 929 || e >= 931 && e <= 937 || e >= 945 && e <= 961 || e >= 963 && e <= 969 || e === 1025 || e >= 1040 && e <= 1103 || e === 1105 || e === 8208 || e >= 8211 && e <= 8214 || e === 8216 || e === 8217 || e === 8220 || e === 8221 || e >= 8224 && e <= 8226 || e >= 8228 && e <= 8231 || e === 8240 || e === 8242 || e === 8243 || e === 8245 || e === 8251 || e === 8254 || e === 8308 || e === 8319 || e >= 8321 && e <= 8324 || e === 8364 || e === 8451 || e === 8453 || e === 8457 || e === 8467 || e === 8470 || e === 8481 || e === 8482 || e === 8486 || e === 8491 || e === 8531 || e === 8532 || e >= 8539 && e <= 8542 || e >= 8544 && e <= 8555 || e >= 8560 && e <= 8569 || e === 8585 || e >= 8592 && e <= 8601 || e === 8632 || e === 8633 || e === 8658 || e === 8660 || e === 8679 || e === 8704 || e === 8706 || e === 8707 || e === 8711 || e === 8712 || e === 8715 || e === 8719 || e === 8721 || e === 8725 || e === 8730 || e >= 8733 && e <= 8736 || e === 8739 || e === 8741 || e >= 8743 && e <= 8748 || e === 8750 || e >= 8756 && e <= 8759 || e === 8764 || e === 8765 || e === 8776 || e === 8780 || e === 8786 || e === 8800 || e === 8801 || e >= 8804 && e <= 8807 || e === 8810 || e === 8811 || e === 8814 || e === 8815 || e === 8834 || e === 8835 || e === 8838 || e === 8839 || e === 8853 || e === 8857 || e === 8869 || e === 8895 || e === 8978 || e >= 9312 && e <= 9449 || e >= 9451 && e <= 9547 || e >= 9552 && e <= 9587 || e >= 9600 && e <= 9615 || e >= 9618 && e <= 9621 || e === 9632 || e === 9633 || e >= 9635 && e <= 9641 || e === 9650 || e === 9651 || e === 9654 || e === 9655 || e === 9660 || e === 9661 || e === 9664 || e === 9665 || e >= 9670 && e <= 9672 || e === 9675 || e >= 9678 && e <= 9681 || e >= 9698 && e <= 9701 || e === 9711 || e === 9733 || e === 9734 || e === 9737 || e === 9742 || e === 9743 || e === 9756 || e === 9758 || e === 9792 || e === 9794 || e === 9824 || e === 9825 || e >= 9827 && e <= 9829 || e >= 9831 && e <= 9834 || e === 9836 || e === 9837 || e === 9839 || e === 9886 || e === 9887 || e === 9919 || e >= 9926 && e <= 9933 || e >= 9935 && e <= 9939 || e >= 9941 && e <= 9953 || e === 9955 || e === 9960 || e === 9961 || e >= 9963 && e <= 9969 || e === 9972 || e >= 9974 && e <= 9977 || e === 9979 || e === 9980 || e === 9982 || e === 9983 || e === 10045 || e >= 10102 && e <= 10111 || e >= 11094 && e <= 11097 || e >= 12872 && e <= 12879 || e >= 57344 && e <= 63743 || e >= 65024 && e <= 65039 || e === 65533 || e >= 127232 && e <= 127242 || e >= 127248 && e <= 127277 || e >= 127280 && e <= 127337 || e >= 127344 && e <= 127373 || e === 127375 || e === 127376 || e >= 127387 && e <= 127404 || e >= 917760 && e <= 917999 || e >= 983040 && e <= 1048573 || e >= 1048576 && e <= 1114109;
var pt2 = (e) => e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510;
var gt2 = (e) => e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 || e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9800 && e <= 9811 || e === 9855 || e === 9875 || e === 9889 || e === 9898 || e === 9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e === 9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <= 10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 || e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 || e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12771 || e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 19903 || e >= 19968 && e <= 42124 || e >= 42128 && e <= 42182 || e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 || e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 || e >= 100352 && e <= 101589 || e >= 101632 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e === 110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 && e <= 111355 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <= 127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 && e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >= 127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 || e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 && e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <= 128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 || e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129672 || e >= 129680 && e <= 129725 || e >= 129727 && e <= 129733 || e >= 129742 && e <= 129755 || e >= 129760 && e <= 129768 || e >= 129776 && e <= 129784 || e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141;
var ve = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var re = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var ie = /\t{1,1000}/y;
var Ae = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var ne = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var ft2 = /\p{M}+/gu;
var Ft2 = { limit: 1 / 0, ellipsis: "" };
var Le = (e, r = {}, s = {}) => {
  const i = r.limit ?? 1 / 0, n = r.ellipsis ?? "", o = r?.ellipsisWidth ?? (n ? Le(n, Ft2, s).width : 0), u = s.ansiWidth ?? 0, l = s.controlWidth ?? 0, a = s.tabWidth ?? 8, d = s.ambiguousWidth ?? 1, g = s.emojiWidth ?? 2, E = s.fullWidthWidth ?? 2, p = s.regularWidth ?? 1, y2 = s.wideWidth ?? 2;
  let $ = 0, c = 0, m = e.length, f = 0, F = false, v = m, S2 = Math.max(0, i - o), B = 0, b = 0, A = 0, C = 0;
  e:
    for (;; ) {
      if (b > B || c >= m && c > $) {
        const _2 = e.slice(B, b) || e.slice($, c);
        f = 0;
        for (const D2 of _2.replaceAll(ft2, "")) {
          const T2 = D2.codePointAt(0) || 0;
          if (pt2(T2) ? C = E : gt2(T2) ? C = y2 : d !== p && mt2(T2) ? C = d : C = p, A + C > S2 && (v = Math.min(v, Math.max(B, $) + f)), A + C > i) {
            F = true;
            break e;
          }
          f += D2.length, A += C;
        }
        B = b = 0;
      }
      if (c >= m)
        break;
      if (ne.lastIndex = c, ne.test(e)) {
        if (f = ne.lastIndex - c, C = f * p, A + C > S2 && (v = Math.min(v, c + Math.floor((S2 - A) / p))), A + C > i) {
          F = true;
          break;
        }
        A += C, B = $, b = c, c = $ = ne.lastIndex;
        continue;
      }
      if (ve.lastIndex = c, ve.test(e)) {
        if (A + u > S2 && (v = Math.min(v, c)), A + u > i) {
          F = true;
          break;
        }
        A += u, B = $, b = c, c = $ = ve.lastIndex;
        continue;
      }
      if (re.lastIndex = c, re.test(e)) {
        if (f = re.lastIndex - c, C = f * l, A + C > S2 && (v = Math.min(v, c + Math.floor((S2 - A) / l))), A + C > i) {
          F = true;
          break;
        }
        A += C, B = $, b = c, c = $ = re.lastIndex;
        continue;
      }
      if (ie.lastIndex = c, ie.test(e)) {
        if (f = ie.lastIndex - c, C = f * a, A + C > S2 && (v = Math.min(v, c + Math.floor((S2 - A) / a))), A + C > i) {
          F = true;
          break;
        }
        A += C, B = $, b = c, c = $ = ie.lastIndex;
        continue;
      }
      if (Ae.lastIndex = c, Ae.test(e)) {
        if (A + g > S2 && (v = Math.min(v, c)), A + g > i) {
          F = true;
          break;
        }
        A += g, B = $, b = c, c = $ = Ae.lastIndex;
        continue;
      }
      c += 1;
    }
  return { width: F ? S2 : A, index: F ? v : m, truncated: F, ellipsed: F && i >= o };
};
var yt2 = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var M2 = (e, r = {}) => Le(e, yt2, r).width;
var ae = "\x1B";
var je = "";
var Et2 = 39;
var Ce = "\x07";
var Ve = "[";
var vt2 = "]";
var ke = "m";
var we = `${vt2}8;;`;
var Ge = new RegExp(`(?:\\${Ve}(?<code>\\d+)m|\\${we}(?<uri>.*)${Ce})`, "y");
var At2 = (e) => {
  if (e >= 30 && e <= 37 || e >= 90 && e <= 97)
    return 39;
  if (e >= 40 && e <= 47 || e >= 100 && e <= 107)
    return 49;
  if (e === 1 || e === 2)
    return 22;
  if (e === 3)
    return 23;
  if (e === 4)
    return 24;
  if (e === 7)
    return 27;
  if (e === 8)
    return 28;
  if (e === 9)
    return 29;
  if (e === 0)
    return 0;
};
var He = (e) => `${ae}${Ve}${e}${ke}`;
var Ue = (e) => `${ae}${we}${e}${Ce}`;
var Ct2 = (e) => e.map((r) => M2(r));
var Se = (e, r, s) => {
  const i = r[Symbol.iterator]();
  let n = false, o = false, u = e.at(-1), l = u === undefined ? 0 : M2(u), a = i.next(), d = i.next(), g = 0;
  for (;!a.done; ) {
    const E = a.value, p = M2(E);
    l + p <= s ? e[e.length - 1] += E : (e.push(E), l = 0), (E === ae || E === je) && (n = true, o = r.startsWith(we, g + 1)), n ? o ? E === Ce && (n = false, o = false) : E === ke && (n = false) : (l += p, l === s && !d.done && (e.push(""), l = 0)), a = d, d = i.next(), g += E.length;
  }
  u = e.at(-1), !l && u !== undefined && u.length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
};
var wt2 = (e) => {
  const r = e.split(" ");
  let s = r.length;
  for (;s > 0 && !(M2(r[s - 1]) > 0); )
    s--;
  return s === r.length ? e : r.slice(0, s).join(" ") + r.slice(s).join("");
};
var St2 = (e, r, s = {}) => {
  if (s.trim !== false && e.trim() === "")
    return "";
  let i = "", n, o;
  const u = e.split(" "), l = Ct2(u);
  let a = [""];
  for (const [$, c] of u.entries()) {
    s.trim !== false && (a[a.length - 1] = (a.at(-1) ?? "").trimStart());
    let m = M2(a.at(-1) ?? "");
    if ($ !== 0 && (m >= r && (s.wordWrap === false || s.trim === false) && (a.push(""), m = 0), (m > 0 || s.trim === false) && (a[a.length - 1] += " ", m++)), s.hard && l[$] > r) {
      const f = r - m, F = 1 + Math.floor((l[$] - f - 1) / r);
      Math.floor((l[$] - 1) / r) < F && a.push(""), Se(a, c, r);
      continue;
    }
    if (m + l[$] > r && m > 0 && l[$] > 0) {
      if (s.wordWrap === false && m < r) {
        Se(a, c, r);
        continue;
      }
      a.push("");
    }
    if (m + l[$] > r && s.wordWrap === false) {
      Se(a, c, r);
      continue;
    }
    a[a.length - 1] += c;
  }
  s.trim !== false && (a = a.map(($) => wt2($)));
  const d = a.join(`
`), g = d[Symbol.iterator]();
  let E = g.next(), p = g.next(), y2 = 0;
  for (;!E.done; ) {
    const $ = E.value, c = p.value;
    if (i += $, $ === ae || $ === je) {
      Ge.lastIndex = y2 + 1;
      const F = Ge.exec(d)?.groups;
      if (F?.code !== undefined) {
        const v = Number.parseFloat(F.code);
        n = v === Et2 ? undefined : v;
      } else
        F?.uri !== undefined && (o = F.uri.length === 0 ? undefined : F.uri);
    }
    const m = n ? At2(n) : undefined;
    c === `
` ? (o && (i += Ue("")), n && m && (i += He(m))) : $ === `
` && (n && m && (i += He(n)), o && (i += Ue(o))), y2 += $.length, E = p, p = g.next();
  }
  return i;
};
function q2(e, r, s) {
  return String(e).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => St2(i, r, s)).join(`
`);
}
var It2 = (e, r, s, i, n) => {
  let o = r, u = 0;
  for (let l = s;l < i; l++) {
    const a = e[l];
    if (o = o - a.length, u++, o <= n)
      break;
  }
  return { lineCount: o, removals: u };
};
var J = (e) => {
  const { cursor: r, options: s, style: i } = e, n = e.output ?? process.stdout, o = rt(n), u = e.columnPadding ?? 0, l = e.rowPadding ?? 4, a = o - u, d = nt(n), g = import_picocolors2.default.dim("..."), E = e.maxItems ?? Number.POSITIVE_INFINITY, p = Math.max(d - l, 0), y2 = Math.max(Math.min(E, p), 5);
  let $ = 0;
  r >= y2 - 3 && ($ = Math.max(Math.min(r - y2 + 3, s.length - y2), 0));
  let c = y2 < s.length && $ > 0, m = y2 < s.length && $ + y2 < s.length;
  const f = Math.min($ + y2, s.length), F = [];
  let v = 0;
  c && v++, m && v++;
  const S2 = $ + (c ? 1 : 0), B = f - (m ? 1 : 0);
  for (let A = S2;A < B; A++) {
    const C = q2(i(s[A], A === r), a, { hard: true, trim: false }).split(`
`);
    F.push(C), v += C.length;
  }
  if (v > p) {
    let A = 0, C = 0, _2 = v;
    const D2 = r - S2, T2 = (W2, I2) => It2(F, _2, W2, I2, p);
    c ? ({ lineCount: _2, removals: A } = T2(0, D2), _2 > p && ({ lineCount: _2, removals: C } = T2(D2 + 1, F.length))) : ({ lineCount: _2, removals: C } = T2(D2 + 1, F.length), _2 > p && ({ lineCount: _2, removals: A } = T2(0, D2))), A > 0 && (c = true, F.splice(0, A)), C > 0 && (m = true, F.splice(F.length - C, C));
  }
  const b = [];
  c && b.push(g);
  for (const A of F)
    for (const C of A)
      b.push(C);
  return m && b.push(g), b;
};
var Mt2 = (e) => {
  const r = e.active ?? "Yes", s = e.inactive ?? "No";
  return new kt({ active: r, inactive: s, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue ?? true, render() {
    const i = `${import_picocolors2.default.gray(h)}
${N2(this.state)}  ${e.message}
`, n = this.value ? r : s;
    switch (this.state) {
      case "submit":
        return `${i}${import_picocolors2.default.gray(h)}  ${import_picocolors2.default.dim(n)}`;
      case "cancel":
        return `${i}${import_picocolors2.default.gray(h)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(n))}
${import_picocolors2.default.gray(h)}`;
      default:
        return `${i}${import_picocolors2.default.cyan(h)}  ${this.value ? `${import_picocolors2.default.green(Y)} ${r}` : `${import_picocolors2.default.dim(K2)} ${import_picocolors2.default.dim(r)}`} ${import_picocolors2.default.dim("/")} ${this.value ? `${import_picocolors2.default.dim(K2)} ${import_picocolors2.default.dim(s)}` : `${import_picocolors2.default.green(Y)} ${s}`}
${import_picocolors2.default.cyan(x2)}
`;
    }
  } }).prompt();
};
var Ut = import_picocolors2.default.magenta;
var Ye = { light: w2("─", "-"), heavy: w2("━", "="), block: w2("█", "#") };
var oe = (e, r) => e.includes(`
`) ? e.split(`
`).map((s) => r(s)).join(`
`) : r(e);
var qt = (e) => {
  const r = (s, i) => {
    const n = s.label ?? String(s.value);
    switch (i) {
      case "disabled":
        return `${import_picocolors2.default.gray(K2)} ${oe(n, import_picocolors2.default.gray)}${s.hint ? ` ${import_picocolors2.default.dim(`(${s.hint ?? "disabled"})`)}` : ""}`;
      case "selected":
        return `${oe(n, import_picocolors2.default.dim)}`;
      case "active":
        return `${import_picocolors2.default.green(Y)} ${n}${s.hint ? ` ${import_picocolors2.default.dim(`(${s.hint})`)}` : ""}`;
      case "cancelled":
        return `${oe(n, (o) => import_picocolors2.default.strikethrough(import_picocolors2.default.dim(o)))}`;
      default:
        return `${import_picocolors2.default.dim(K2)} ${oe(n, import_picocolors2.default.dim)}`;
    }
  };
  return new Wt({ options: e.options, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue, render() {
    const s = `${N2(this.state)}  `, i = `${Ee(this.state)}  `, n = Bt(e.output, e.message, i, s), o = `${import_picocolors2.default.gray(h)}
${n}
`;
    switch (this.state) {
      case "submit": {
        const u = `${import_picocolors2.default.gray(h)}  `, l = Bt(e.output, r(this.options[this.cursor], "selected"), u);
        return `${o}${l}`;
      }
      case "cancel": {
        const u = `${import_picocolors2.default.gray(h)}  `, l = Bt(e.output, r(this.options[this.cursor], "cancelled"), u);
        return `${o}${l}
${import_picocolors2.default.gray(h)}`;
      }
      default: {
        const u = `${import_picocolors2.default.cyan(h)}  `, l = o.split(`
`).length;
        return `${o}${u}${J({ output: e.output, cursor: this.cursor, options: this.options, maxItems: e.maxItems, columnPadding: u.length, rowPadding: l + 2, style: (a, d) => r(a, a.disabled ? "disabled" : d ? "active" : "inactive") }).join(`
${u}`)}
${import_picocolors2.default.cyan(x2)}
`;
      }
    }
  } }).prompt();
};
var ze = `${import_picocolors2.default.gray(h)}  `;

// src/auth/antigravity/cli.ts
async function promptAddAnotherAccount(currentCount) {
  if (!process.stdout.isTTY) {
    return false;
  }
  const result = await Mt2({
    message: `Add another Google account?
Currently have ${currentCount} accounts (max 10)`
  });
  if (Ct(result)) {
    return false;
  }
  return result;
}
async function promptAccountTier() {
  if (!process.stdout.isTTY) {
    return "free";
  }
  const tier = await qt({
    message: "Select account tier",
    options: [
      { value: "free", label: "Free" },
      { value: "paid", label: "Paid" }
    ]
  });
  if (Ct(tier)) {
    return "free";
  }
  return tier;
}

// ../node_modules/open/index.js
import process8 from "node:process";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import childProcess3 from "node:child_process";
import fs6, { constants as fsConstants2 } from "node:fs/promises";

// ../node_modules/wsl-utils/index.js
import { promisify as promisify2 } from "node:util";
import childProcess2 from "node:child_process";
import fs5, { constants as fsConstants } from "node:fs/promises";

// ../node_modules/is-wsl/index.js
import process2 from "node:process";
import os2 from "node:os";
import fs4 from "node:fs";

// ../node_modules/is-inside-container/index.js
import fs3 from "node:fs";

// ../node_modules/is-docker/index.js
import fs2 from "node:fs";
var isDockerCached;
function hasDockerEnv() {
  try {
    fs2.statSync("/.dockerenv");
    return true;
  } catch {
    return false;
  }
}
function hasDockerCGroup() {
  try {
    return fs2.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
  } catch {
    return false;
  }
}
function isDocker() {
  if (isDockerCached === undefined) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup();
  }
  return isDockerCached;
}

// ../node_modules/is-inside-container/index.js
var cachedResult;
var hasContainerEnv = () => {
  try {
    fs3.statSync("/run/.containerenv");
    return true;
  } catch {
    return false;
  }
};
function isInsideContainer() {
  if (cachedResult === undefined) {
    cachedResult = hasContainerEnv() || isDocker();
  }
  return cachedResult;
}

// ../node_modules/is-wsl/index.js
var isWsl = () => {
  if (process2.platform !== "linux") {
    return false;
  }
  if (os2.release().toLowerCase().includes("microsoft")) {
    if (isInsideContainer()) {
      return false;
    }
    return true;
  }
  try {
    return fs4.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isInsideContainer() : false;
  } catch {
    return false;
  }
};
var is_wsl_default = process2.env.__IS_WSL_TEST__ ? isWsl : isWsl();

// ../node_modules/powershell-utils/index.js
import process3 from "node:process";
import { Buffer } from "node:buffer";
import { promisify } from "node:util";
import childProcess from "node:child_process";
var execFile = promisify(childProcess.execFile);
var powerShellPath = () => `${process3.env.SYSTEMROOT || process3.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
var executePowerShell = async (command, options = {}) => {
  const {
    powerShellPath: psPath,
    ...execFileOptions
  } = options;
  const encodedCommand = executePowerShell.encodeCommand(command);
  return execFile(psPath ?? powerShellPath(), [
    ...executePowerShell.argumentsPrefix,
    encodedCommand
  ], {
    encoding: "utf8",
    ...execFileOptions
  });
};
executePowerShell.argumentsPrefix = [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-EncodedCommand"
];
executePowerShell.encodeCommand = (command) => Buffer.from(command, "utf16le").toString("base64");
executePowerShell.escapeArgument = (value) => `'${String(value).replaceAll("'", "''")}'`;

// ../node_modules/wsl-utils/utilities.js
function parseMountPointFromConfig(content) {
  for (const line of content.split(`
`)) {
    if (/^\s*#/.test(line)) {
      continue;
    }
    const match = /^\s*root\s*=\s*(?<mountPoint>"[^"]*"|'[^']*'|[^#]*)/.exec(line);
    if (!match) {
      continue;
    }
    return match.groups.mountPoint.trim().replaceAll(/^["']|["']$/g, "");
  }
}

// ../node_modules/wsl-utils/index.js
var execFile2 = promisify2(childProcess2.execFile);
var wslDrivesMountPoint = (() => {
  const defaultMountPoint = "/mnt/";
  let mountPoint;
  return async function() {
    if (mountPoint) {
      return mountPoint;
    }
    const configFilePath = "/etc/wsl.conf";
    let isConfigFileExists = false;
    try {
      await fs5.access(configFilePath, fsConstants.F_OK);
      isConfigFileExists = true;
    } catch {}
    if (!isConfigFileExists) {
      return defaultMountPoint;
    }
    const configContent = await fs5.readFile(configFilePath, { encoding: "utf8" });
    const parsedMountPoint = parseMountPointFromConfig(configContent);
    if (parsedMountPoint === undefined) {
      return defaultMountPoint;
    }
    mountPoint = parsedMountPoint;
    mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
    return mountPoint;
  };
})();
var powerShellPathFromWsl = async () => {
  const mountPoint = await wslDrivesMountPoint();
  return `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
};
var powerShellPath2 = is_wsl_default ? powerShellPathFromWsl : powerShellPath;
var canAccessPowerShellPromise;
var canAccessPowerShell = async () => {
  canAccessPowerShellPromise ??= (async () => {
    try {
      const psPath = await powerShellPath2();
      await fs5.access(psPath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  })();
  return canAccessPowerShellPromise;
};
var wslDefaultBrowser = async () => {
  const psPath = await powerShellPath2();
  const command = String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`;
  const { stdout } = await executePowerShell(command, { powerShellPath: psPath });
  return stdout.trim();
};
var convertWslPathToWindows = async (path2) => {
  if (/^[a-z]+:\/\//i.test(path2)) {
    return path2;
  }
  try {
    const { stdout } = await execFile2("wslpath", ["-aw", path2], { encoding: "utf8" });
    return stdout.trim();
  } catch {
    return path2;
  }
};

// ../node_modules/define-lazy-prop/index.js
function defineLazyProperty(object, propertyName, valueGetter) {
  const define = (value) => Object.defineProperty(object, propertyName, { value, enumerable: true, writable: true });
  Object.defineProperty(object, propertyName, {
    configurable: true,
    enumerable: true,
    get() {
      const result = valueGetter();
      define(result);
      return result;
    },
    set(value) {
      define(value);
    }
  });
  return object;
}

// ../node_modules/default-browser/index.js
import { promisify as promisify6 } from "node:util";
import process6 from "node:process";
import { execFile as execFile6 } from "node:child_process";

// ../node_modules/default-browser-id/index.js
import { promisify as promisify3 } from "node:util";
import process4 from "node:process";
import { execFile as execFile3 } from "node:child_process";
var execFileAsync = promisify3(execFile3);
async function defaultBrowserId() {
  if (process4.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const { stdout } = await execFileAsync("defaults", ["read", "com.apple.LaunchServices/com.apple.launchservices.secure", "LSHandlers"]);
  const match = /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout);
  const browserId = match?.groups.id ?? "com.apple.Safari";
  if (browserId === "com.apple.safari") {
    return "com.apple.Safari";
  }
  return browserId;
}

// ../node_modules/run-applescript/index.js
import process5 from "node:process";
import { promisify as promisify4 } from "node:util";
import { execFile as execFile4, execFileSync } from "node:child_process";
var execFileAsync2 = promisify4(execFile4);
async function runAppleScript(script, { humanReadableOutput = true, signal } = {}) {
  if (process5.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const outputArguments = humanReadableOutput ? [] : ["-ss"];
  const execOptions = {};
  if (signal) {
    execOptions.signal = signal;
  }
  const { stdout } = await execFileAsync2("osascript", ["-e", script, outputArguments], execOptions);
  return stdout.trim();
}

// ../node_modules/bundle-name/index.js
async function bundleName(bundleId) {
  return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}

// ../node_modules/default-browser/windows.js
import { promisify as promisify5 } from "node:util";
import { execFile as execFile5 } from "node:child_process";
var execFileAsync3 = promisify5(execFile5);
var windowsBrowserProgIds = {
  MSEdgeHTM: { name: "Edge", id: "com.microsoft.edge" },
  MSEdgeBHTML: { name: "Edge Beta", id: "com.microsoft.edge.beta" },
  MSEdgeDHTML: { name: "Edge Dev", id: "com.microsoft.edge.dev" },
  AppXq0fevzme2pys62n3e0fbqa7peapykr8v: { name: "Edge", id: "com.microsoft.edge.old" },
  ChromeHTML: { name: "Chrome", id: "com.google.chrome" },
  ChromeBHTML: { name: "Chrome Beta", id: "com.google.chrome.beta" },
  ChromeDHTML: { name: "Chrome Dev", id: "com.google.chrome.dev" },
  ChromiumHTM: { name: "Chromium", id: "org.chromium.Chromium" },
  BraveHTML: { name: "Brave", id: "com.brave.Browser" },
  BraveBHTML: { name: "Brave Beta", id: "com.brave.Browser.beta" },
  BraveDHTML: { name: "Brave Dev", id: "com.brave.Browser.dev" },
  BraveSSHTM: { name: "Brave Nightly", id: "com.brave.Browser.nightly" },
  FirefoxURL: { name: "Firefox", id: "org.mozilla.firefox" },
  OperaStable: { name: "Opera", id: "com.operasoftware.Opera" },
  VivaldiHTM: { name: "Vivaldi", id: "com.vivaldi.Vivaldi" },
  "IE.HTTP": { name: "Internet Explorer", id: "com.microsoft.ie" }
};
var _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));

class UnknownBrowserError extends Error {
}
async function defaultBrowser(_execFileAsync = execFileAsync3) {
  const { stdout } = await _execFileAsync("reg", [
    "QUERY",
    " HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
    "/v",
    "ProgId"
  ]);
  const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout);
  if (!match) {
    throw new UnknownBrowserError(`Cannot find Windows browser in stdout: ${JSON.stringify(stdout)}`);
  }
  const { id } = match.groups;
  const browser = windowsBrowserProgIds[id];
  if (!browser) {
    throw new UnknownBrowserError(`Unknown browser ID: ${id}`);
  }
  return browser;
}

// ../node_modules/default-browser/index.js
var execFileAsync4 = promisify6(execFile6);
var titleize = (string) => string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x3) => x3.toUpperCase());
async function defaultBrowser2() {
  if (process6.platform === "darwin") {
    const id = await defaultBrowserId();
    const name = await bundleName(id);
    return { name, id };
  }
  if (process6.platform === "linux") {
    const { stdout } = await execFileAsync4("xdg-mime", ["query", "default", "x-scheme-handler/http"]);
    const id = stdout.trim();
    const name = titleize(id.replace(/.desktop$/, "").replace("-", " "));
    return { name, id };
  }
  if (process6.platform === "win32") {
    return defaultBrowser();
  }
  throw new Error("Only macOS, Linux, and Windows are supported");
}

// ../node_modules/is-in-ssh/index.js
import process7 from "node:process";
var isInSsh = Boolean(process7.env.SSH_CONNECTION || process7.env.SSH_CLIENT || process7.env.SSH_TTY);
var is_in_ssh_default = isInSsh;

// ../node_modules/open/index.js
var fallbackAttemptSymbol = Symbol("fallbackAttempt");
var __dirname2 = import.meta.url ? path2.dirname(fileURLToPath(import.meta.url)) : "";
var localXdgOpenPath = path2.join(__dirname2, "xdg-open");
var { platform, arch } = process8;
var tryEachApp = async (apps, opener) => {
  if (apps.length === 0) {
    return;
  }
  const errors = [];
  for (const app of apps) {
    try {
      return await opener(app);
    } catch (error) {
      errors.push(error);
    }
  }
  throw new AggregateError(errors, "Failed to open in all supported apps");
};
var baseOpen = async (options) => {
  options = {
    wait: false,
    background: false,
    newInstance: false,
    allowNonzeroExitCode: false,
    ...options
  };
  const isFallbackAttempt = options[fallbackAttemptSymbol] === true;
  delete options[fallbackAttemptSymbol];
  if (Array.isArray(options.app)) {
    return tryEachApp(options.app, (singleApp) => baseOpen({
      ...options,
      app: singleApp,
      [fallbackAttemptSymbol]: true
    }));
  }
  let { name: app, arguments: appArguments = [] } = options.app ?? {};
  appArguments = [...appArguments];
  if (Array.isArray(app)) {
    return tryEachApp(app, (appName) => baseOpen({
      ...options,
      app: {
        name: appName,
        arguments: appArguments
      },
      [fallbackAttemptSymbol]: true
    }));
  }
  if (app === "browser" || app === "browserPrivate") {
    const ids = {
      "com.google.chrome": "chrome",
      "google-chrome.desktop": "chrome",
      "com.brave.browser": "brave",
      "org.mozilla.firefox": "firefox",
      "firefox.desktop": "firefox",
      "com.microsoft.msedge": "edge",
      "com.microsoft.edge": "edge",
      "com.microsoft.edgemac": "edge",
      "microsoft-edge.desktop": "edge",
      "com.apple.safari": "safari"
    };
    const flags = {
      chrome: "--incognito",
      brave: "--incognito",
      firefox: "--private-window",
      edge: "--inPrivate"
    };
    let browser;
    if (is_wsl_default) {
      const progId = await wslDefaultBrowser();
      const browserInfo = _windowsBrowserProgIdMap.get(progId);
      browser = browserInfo ?? {};
    } else {
      browser = await defaultBrowser2();
    }
    if (browser.id in ids) {
      const browserName = ids[browser.id.toLowerCase()];
      if (app === "browserPrivate") {
        if (browserName === "safari") {
          throw new Error("Safari doesn't support opening in private mode via command line");
        }
        appArguments.push(flags[browserName]);
      }
      return baseOpen({
        ...options,
        app: {
          name: apps[browserName],
          arguments: appArguments
        }
      });
    }
    throw new Error(`${browser.name} is not supported as a default browser`);
  }
  let command;
  const cliArguments = [];
  const childProcessOptions = {};
  let shouldUseWindowsInWsl = false;
  if (is_wsl_default && !isInsideContainer() && !is_in_ssh_default && !app) {
    shouldUseWindowsInWsl = await canAccessPowerShell();
  }
  if (platform === "darwin") {
    command = "open";
    if (options.wait) {
      cliArguments.push("--wait-apps");
    }
    if (options.background) {
      cliArguments.push("--background");
    }
    if (options.newInstance) {
      cliArguments.push("--new");
    }
    if (app) {
      cliArguments.push("-a", app);
    }
  } else if (platform === "win32" || shouldUseWindowsInWsl) {
    command = await powerShellPath2();
    cliArguments.push(...executePowerShell.argumentsPrefix);
    if (!is_wsl_default) {
      childProcessOptions.windowsVerbatimArguments = true;
    }
    if (is_wsl_default && options.target) {
      options.target = await convertWslPathToWindows(options.target);
    }
    const encodedArguments = ["$ProgressPreference = 'SilentlyContinue';", "Start"];
    if (options.wait) {
      encodedArguments.push("-Wait");
    }
    if (app) {
      encodedArguments.push(executePowerShell.escapeArgument(app));
      if (options.target) {
        appArguments.push(options.target);
      }
    } else if (options.target) {
      encodedArguments.push(executePowerShell.escapeArgument(options.target));
    }
    if (appArguments.length > 0) {
      appArguments = appArguments.map((argument) => executePowerShell.escapeArgument(argument));
      encodedArguments.push("-ArgumentList", appArguments.join(","));
    }
    options.target = executePowerShell.encodeCommand(encodedArguments.join(" "));
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
    }
  } else {
    if (app) {
      command = app;
    } else {
      const isBundled = !__dirname2 || __dirname2 === "/";
      let exeLocalXdgOpen = false;
      try {
        await fs6.access(localXdgOpenPath, fsConstants2.X_OK);
        exeLocalXdgOpen = true;
      } catch {}
      const useSystemXdgOpen = process8.versions.electron ?? (platform === "android" || isBundled || !exeLocalXdgOpen);
      command = useSystemXdgOpen ? "xdg-open" : localXdgOpenPath;
    }
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
      childProcessOptions.detached = true;
    }
  }
  if (platform === "darwin" && appArguments.length > 0) {
    cliArguments.push("--args", ...appArguments);
  }
  if (options.target) {
    cliArguments.push(options.target);
  }
  const subprocess = childProcess3.spawn(command, cliArguments, childProcessOptions);
  if (options.wait) {
    return new Promise((resolve, reject) => {
      subprocess.once("error", reject);
      subprocess.once("close", (exitCode) => {
        if (!options.allowNonzeroExitCode && exitCode !== 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }
        resolve(subprocess);
      });
    });
  }
  if (isFallbackAttempt) {
    return new Promise((resolve, reject) => {
      subprocess.once("error", reject);
      subprocess.once("spawn", () => {
        subprocess.once("close", (exitCode) => {
          subprocess.off("error", reject);
          if (exitCode !== 0) {
            reject(new Error(`Exited with code ${exitCode}`));
            return;
          }
          subprocess.unref();
          resolve(subprocess);
        });
      });
    });
  }
  subprocess.unref();
  return new Promise((resolve, reject) => {
    subprocess.once("error", reject);
    subprocess.once("spawn", () => {
      subprocess.off("error", reject);
      resolve(subprocess);
    });
  });
};
var open = (target, options) => {
  if (typeof target !== "string") {
    throw new TypeError("Expected a `target`");
  }
  return baseOpen({
    ...options,
    target
  });
};
function detectArchBinary(binary) {
  if (typeof binary === "string" || Array.isArray(binary)) {
    return binary;
  }
  const { [arch]: archBinary } = binary;
  if (!archBinary) {
    throw new Error(`${arch} is not supported`);
  }
  return archBinary;
}
function detectPlatformBinary({ [platform]: platformBinary }, { wsl } = {}) {
  if (wsl && is_wsl_default) {
    return detectArchBinary(wsl);
  }
  if (!platformBinary) {
    throw new Error(`${platform} is not supported`);
  }
  return detectArchBinary(platformBinary);
}
var apps = {
  browser: "browser",
  browserPrivate: "browserPrivate"
};
defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
  darwin: "google chrome",
  win32: "chrome",
  linux: ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
  }
}));
defineLazyProperty(apps, "brave", () => detectPlatformBinary({
  darwin: "brave browser",
  win32: "brave",
  linux: ["brave-browser", "brave"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
    x64: ["/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe", "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"]
  }
}));
defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
  darwin: "firefox",
  win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
  linux: "firefox"
}, {
  wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe"
}));
defineLazyProperty(apps, "edge", () => detectPlatformBinary({
  darwin: "microsoft edge",
  win32: "msedge",
  linux: ["microsoft-edge", "microsoft-edge-dev"]
}, {
  wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
}));
defineLazyProperty(apps, "safari", () => detectPlatformBinary({
  darwin: "Safari"
}));
var open_default = open;

// src/auth/antigravity/browser.ts
function debugLog5(message) {
  if (process.env.ANTIGRAVITY_DEBUG === "1") {
    console.log(`[antigravity-browser] ${message}`);
  }
}
async function openBrowserURL(url) {
  debugLog5(`Opening browser: ${url}`);
  try {
    await open_default(url);
    debugLog5("Browser opened successfully");
    return true;
  } catch (error) {
    debugLog5(`Failed to open browser: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// src/auth/antigravity/plugin.ts
var GOOGLE_PROVIDER_ID = "google";
var MAX_ACCOUNTS = 10;
function isOAuthAuth(auth) {
  return auth.type === "oauth";
}
async function createGoogleAntigravityAuthPlugin({
  client
}) {
  let cachedClientId = ANTIGRAVITY_CLIENT_ID;
  let cachedClientSecret = ANTIGRAVITY_CLIENT_SECRET;
  const authHook = {
    provider: GOOGLE_PROVIDER_ID,
    loader: async (auth, provider) => {
      const currentAuth = await auth();
      if (process.env.ANTIGRAVITY_DEBUG === "1") {
        console.log("[antigravity-plugin] loader called");
        console.log("[antigravity-plugin] auth type:", currentAuth?.type);
        console.log("[antigravity-plugin] auth keys:", Object.keys(currentAuth || {}));
      }
      if (!isOAuthAuth(currentAuth)) {
        if (process.env.ANTIGRAVITY_DEBUG === "1") {
          console.log("[antigravity-plugin] NOT OAuth auth, returning empty");
        }
        return {};
      }
      if (process.env.ANTIGRAVITY_DEBUG === "1") {
        console.log("[antigravity-plugin] OAuth auth detected, creating custom fetch");
      }
      let accountManager = null;
      try {
        const storedAccounts = await loadAccounts();
        if (storedAccounts) {
          accountManager = new AccountManager(currentAuth, storedAccounts);
          if (process.env.ANTIGRAVITY_DEBUG === "1") {
            console.log(`[antigravity-plugin] Loaded ${accountManager.getAccountCount()} accounts from storage`);
          }
        } else if (currentAuth.refresh.includes("|||")) {
          const tokens = currentAuth.refresh.split("|||");
          const firstToken = tokens[0];
          accountManager = new AccountManager({ refresh: firstToken, access: currentAuth.access || "", expires: currentAuth.expires || 0 }, null);
          for (let i = 1;i < tokens.length; i++) {
            const parts = parseStoredToken(tokens[i]);
            accountManager.addAccount(parts);
          }
          await accountManager.save();
          if (process.env.ANTIGRAVITY_DEBUG === "1") {
            console.log("[antigravity-plugin] Migrated multi-account auth to storage");
          }
        }
      } catch (error) {
        if (process.env.ANTIGRAVITY_DEBUG === "1") {
          console.error(`[antigravity-plugin] Failed to load accounts: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      cachedClientId = provider.options?.clientId || ANTIGRAVITY_CLIENT_ID;
      cachedClientSecret = provider.options?.clientSecret || ANTIGRAVITY_CLIENT_SECRET;
      if (process.env.ANTIGRAVITY_DEBUG === "1" && (cachedClientId !== ANTIGRAVITY_CLIENT_ID || cachedClientSecret !== ANTIGRAVITY_CLIENT_SECRET)) {
        console.log("[antigravity-plugin] Using custom credentials from provider.options");
      }
      const authClient = {
        set: async (providerId, authData) => {
          await client.auth.set({
            body: {
              type: "oauth",
              access: authData.access || "",
              refresh: authData.refresh || "",
              expires: authData.expires || 0
            },
            path: { id: providerId }
          });
        }
      };
      const getAuth = async () => {
        const authState = await auth();
        if (isOAuthAuth(authState)) {
          return {
            access: authState.access,
            refresh: authState.refresh,
            expires: authState.expires
          };
        }
        return {};
      };
      const antigravityFetch = createAntigravityFetch(getAuth, authClient, GOOGLE_PROVIDER_ID, cachedClientId, cachedClientSecret);
      return {
        fetch: antigravityFetch,
        apiKey: "antigravity-oauth",
        accountManager
      };
    },
    methods: [
      {
        type: "oauth",
        label: "OAuth with Google (Antigravity)",
        authorize: async () => {
          const serverHandle = startCallbackServer();
          const { url, state: expectedState } = await buildAuthURL(undefined, cachedClientId, serverHandle.port);
          const browserOpened = await openBrowserURL(url);
          return {
            url,
            instructions: browserOpened ? "Opening browser for sign-in. We'll automatically detect when you're done." : "Please open the URL above in your browser to sign in.",
            method: "auto",
            callback: async () => {
              try {
                const result = await serverHandle.waitForCallback();
                if (result.error) {
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.error(`[antigravity-plugin] OAuth error: ${result.error}`);
                  }
                  return { type: "failed" };
                }
                if (!result.code) {
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.error("[antigravity-plugin] No authorization code received");
                  }
                  return { type: "failed" };
                }
                if (result.state !== expectedState) {
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.error("[antigravity-plugin] State mismatch - possible CSRF attack");
                  }
                  return { type: "failed" };
                }
                const redirectUri = `http://localhost:${serverHandle.port}/oauth-callback`;
                const tokens = await exchangeCode(result.code, redirectUri, cachedClientId, cachedClientSecret);
                if (!tokens.refresh_token) {
                  serverHandle.close();
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.error("[antigravity-plugin] OAuth response missing refresh_token");
                  }
                  return { type: "failed" };
                }
                let email;
                try {
                  const userInfo = await fetchUserInfo(tokens.access_token);
                  email = userInfo.email;
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.log(`[antigravity-plugin] Authenticated as: ${email}`);
                  }
                } catch {}
                const projectContext = await fetchProjectContext(tokens.access_token);
                const projectId = projectContext.cloudaicompanionProject || "";
                const tier = await promptAccountTier();
                const expires = Date.now() + tokens.expires_in * 1000;
                const accounts = [{
                  parts: {
                    refreshToken: tokens.refresh_token,
                    projectId,
                    managedProjectId: projectContext.managedProjectId
                  },
                  access: tokens.access_token,
                  expires,
                  email,
                  tier,
                  projectId
                }];
                await client.tui.showToast({
                  body: {
                    message: `Account 1 authenticated${email ? ` (${email})` : ""}`,
                    variant: "success"
                  }
                });
                while (accounts.length < MAX_ACCOUNTS) {
                  const addAnother = await promptAddAnotherAccount(accounts.length);
                  if (!addAnother)
                    break;
                  const additionalServerHandle = startCallbackServer();
                  const { url: additionalUrl, state: expectedAdditionalState } = await buildAuthURL(undefined, cachedClientId, additionalServerHandle.port);
                  const additionalBrowserOpened = await openBrowserURL(additionalUrl);
                  if (!additionalBrowserOpened) {
                    await client.tui.showToast({
                      body: {
                        message: `Please open in browser: ${additionalUrl}`,
                        variant: "warning"
                      }
                    });
                  }
                  try {
                    const additionalResult = await additionalServerHandle.waitForCallback();
                    if (additionalResult.error || !additionalResult.code) {
                      additionalServerHandle.close();
                      await client.tui.showToast({
                        body: {
                          message: "Skipping this account...",
                          variant: "warning"
                        }
                      });
                      continue;
                    }
                    if (additionalResult.state !== expectedAdditionalState) {
                      additionalServerHandle.close();
                      await client.tui.showToast({
                        body: {
                          message: "State mismatch, skipping...",
                          variant: "warning"
                        }
                      });
                      continue;
                    }
                    const additionalRedirectUri = `http://localhost:${additionalServerHandle.port}/oauth-callback`;
                    const additionalTokens = await exchangeCode(additionalResult.code, additionalRedirectUri, cachedClientId, cachedClientSecret);
                    if (!additionalTokens.refresh_token) {
                      additionalServerHandle.close();
                      if (process.env.ANTIGRAVITY_DEBUG === "1") {
                        console.error("[antigravity-plugin] Additional account OAuth response missing refresh_token");
                      }
                      await client.tui.showToast({
                        body: {
                          message: "Account missing refresh token, skipping...",
                          variant: "warning"
                        }
                      });
                      continue;
                    }
                    let additionalEmail;
                    try {
                      const additionalUserInfo = await fetchUserInfo(additionalTokens.access_token);
                      additionalEmail = additionalUserInfo.email;
                    } catch {}
                    const additionalProjectContext = await fetchProjectContext(additionalTokens.access_token);
                    const additionalProjectId = additionalProjectContext.cloudaicompanionProject || "";
                    const additionalTier = await promptAccountTier();
                    const additionalExpires = Date.now() + additionalTokens.expires_in * 1000;
                    accounts.push({
                      parts: {
                        refreshToken: additionalTokens.refresh_token,
                        projectId: additionalProjectId,
                        managedProjectId: additionalProjectContext.managedProjectId
                      },
                      access: additionalTokens.access_token,
                      expires: additionalExpires,
                      email: additionalEmail,
                      tier: additionalTier,
                      projectId: additionalProjectId
                    });
                    additionalServerHandle.close();
                    await client.tui.showToast({
                      body: {
                        message: `Account ${accounts.length} authenticated${additionalEmail ? ` (${additionalEmail})` : ""}`,
                        variant: "success"
                      }
                    });
                  } catch (error) {
                    additionalServerHandle.close();
                    if (process.env.ANTIGRAVITY_DEBUG === "1") {
                      console.error(`[antigravity-plugin] Additional account OAuth failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                    await client.tui.showToast({
                      body: {
                        message: "Failed to authenticate additional account, skipping...",
                        variant: "warning"
                      }
                    });
                    continue;
                  }
                }
                const firstAccount = accounts[0];
                try {
                  const accountManager = new AccountManager({
                    refresh: formatTokenForStorage(firstAccount.parts.refreshToken, firstAccount.projectId, firstAccount.parts.managedProjectId),
                    access: firstAccount.access,
                    expires: firstAccount.expires
                  }, null);
                  for (let i = 1;i < accounts.length; i++) {
                    const acc = accounts[i];
                    accountManager.addAccount(acc.parts, acc.access, acc.expires, acc.email, acc.tier);
                  }
                  const currentAccount = accountManager.getCurrentAccount();
                  if (currentAccount) {
                    currentAccount.email = firstAccount.email;
                    currentAccount.tier = firstAccount.tier;
                  }
                  await accountManager.save();
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.log(`[antigravity-plugin] Saved ${accounts.length} accounts to storage`);
                  }
                } catch (error) {
                  if (process.env.ANTIGRAVITY_DEBUG === "1") {
                    console.error(`[antigravity-plugin] Failed to save accounts: ${error instanceof Error ? error.message : "Unknown error"}`);
                  }
                }
                const allRefreshTokens = accounts.map((acc) => formatTokenForStorage(acc.parts.refreshToken, acc.projectId, acc.parts.managedProjectId)).join("|||");
                return {
                  type: "success",
                  access: firstAccount.access,
                  refresh: allRefreshTokens,
                  expires: firstAccount.expires
                };
              } catch (error) {
                serverHandle.close();
                if (process.env.ANTIGRAVITY_DEBUG === "1") {
                  console.error(`[antigravity-plugin] OAuth flow failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
                return { type: "failed" };
              }
            }
          };
        }
      }
    ]
  };
  return {
    auth: authHook
  };
}
var GoogleAntigravityAuthPlugin = createGoogleAntigravityAuthPlugin;
export {
  wrapRequestBody,
  transformStreamingResponse,
  transformStreamingPayload,
  transformResponseThinking,
  transformResponse,
  transformRequest,
  transformCandidateThinking,
  transformAnthropicThinking,
  startCallbackServer,
  shouldIncludeThinking,
  setThoughtSignature,
  resolveThinkingConfig,
  refreshAccessToken,
  performOAuthFlow,
  parseStoredToken,
  parseErrorBody,
  normalizeToolsForGemini,
  normalizeToolResultsFromGemini,
  normalizeThinkingConfig,
  normalizeModelId,
  isTokenExpired,
  isThinkingCapableModel,
  isStreamingResponse,
  isStreamingRequest,
  isGenerativeLanguageRequest,
  invalidateProjectContextByRefreshToken,
  injectThoughtSignatureIntoFunctionCalls,
  injectSystemPrompt,
  hasOpenAIMessages,
  hasFunctionTools,
  getThoughtSignature,
  getOrCreateSessionId,
  getModelThinkingConfig,
  getDefaultEndpoint,
  generatePKCEChallenge,
  formatTokenForStorage,
  formatThinkingForOpenAI,
  filterUnsignedThinkingBlocks,
  fetchUserInfo,
  fetchProjectContext,
  extractUsageFromSsePayload,
  extractUsageFromHeaders,
  extractThinkingConfig,
  extractThinkingBlocks,
  extractSignatureFromSsePayload,
  extractRetryAfterMs,
  extractModelFromUrl,
  extractModelFromBody,
  extractFunctionDeclarations,
  extractActionFromUrl,
  exchangeCode,
  createGoogleAntigravityAuthPlugin,
  createAntigravityFetch,
  convertRequestBody,
  convertOpenAIToGemini,
  convertFunctionCallToToolCall,
  clearThoughtSignature,
  clearSessionId,
  clearProjectContextCache,
  clearFetchInstanceData,
  buildRequestHeaders,
  buildAuthURL,
  buildAntigravityUrl,
  budgetToLevel,
  applyThinkingConfigToRequest,
  alias2ModelName,
  addStreamingHeaders,
  SKIP_THOUGHT_SIGNATURE_VALIDATOR,
  REASONING_EFFORT_BUDGET_MAP,
  MODEL_FAMILIES,
  GoogleAntigravityAuthPlugin,
  GOOGLE_USERINFO_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_AUTH_URL,
  DEFAULT_THINKING_BUDGET,
  AntigravityTokenRefreshError,
  ANTIGRAVITY_TOKEN_REFRESH_BUFFER_MS,
  ANTIGRAVITY_SYSTEM_PROMPT,
  ANTIGRAVITY_SUPPORTED_MODELS,
  ANTIGRAVITY_SCOPES,
  ANTIGRAVITY_REDIRECT_URI,
  ANTIGRAVITY_MODEL_CONFIGS,
  ANTIGRAVITY_HEADERS,
  ANTIGRAVITY_ENDPOINT_FALLBACKS,
  ANTIGRAVITY_DEFAULT_PROJECT_ID,
  ANTIGRAVITY_CLIENT_SECRET,
  ANTIGRAVITY_CLIENT_ID,
  ANTIGRAVITY_CALLBACK_PORT,
  ANTIGRAVITY_API_VERSION
};
