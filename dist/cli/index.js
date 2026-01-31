#!/usr/bin/env bun
// @bun
var __require = import.meta.require;

// src/cli/index.ts
import { Command } from "commander";

// src/cli/doctor/constants.ts
import color from "picocolors";
var SYMBOLS = {
  check: color.green("\u2713"),
  cross: color.red("\u2717"),
  warn: color.yellow("\u26A0"),
  info: color.blue("\u2139"),
  arrow: color.cyan("\u2192"),
  bullet: color.dim("\u2022"),
  skip: color.dim("\u25CB")
};
var STATUS_COLORS = {
  pass: color.green,
  fail: color.red,
  warn: color.yellow,
  skip: color.dim
};
var CHECK_IDS = {
  OPENCODE_INSTALLATION: "opencode-installation",
  PLUGIN_REGISTRATION: "plugin-registration",
  CONFIG_VALIDATION: "config-validation",
  AUTH_ANTHROPIC: "auth-anthropic",
  AUTH_OPENAI: "auth-openai",
  AUTH_GOOGLE: "auth-google",
  DEP_AST_GREP_CLI: "dep-ast-grep-cli",
  DEP_AST_GREP_NAPI: "dep-ast-grep-napi",
  DEP_COMMENT_CHECKER: "dep-comment-checker",
  GH_CLI: "gh-cli",
  LSP_SERVERS: "lsp-servers",
  MCP_BUILTIN: "mcp-builtin",
  MCP_USER: "mcp-user",
  VERSION_STATUS: "version-status"
};
var CHECK_NAMES = {
  [CHECK_IDS.OPENCODE_INSTALLATION]: "OpenCode Installation",
  [CHECK_IDS.PLUGIN_REGISTRATION]: "Plugin Registration",
  [CHECK_IDS.CONFIG_VALIDATION]: "Configuration Validity",
  [CHECK_IDS.AUTH_ANTHROPIC]: "Anthropic (Claude) Auth",
  [CHECK_IDS.AUTH_OPENAI]: "OpenAI (ChatGPT) Auth",
  [CHECK_IDS.AUTH_GOOGLE]: "Google (Gemini) Auth",
  [CHECK_IDS.DEP_AST_GREP_CLI]: "AST-Grep CLI",
  [CHECK_IDS.DEP_AST_GREP_NAPI]: "AST-Grep NAPI",
  [CHECK_IDS.DEP_COMMENT_CHECKER]: "Comment Checker",
  [CHECK_IDS.GH_CLI]: "GitHub CLI",
  [CHECK_IDS.LSP_SERVERS]: "LSP Servers",
  [CHECK_IDS.MCP_BUILTIN]: "Built-in MCP Servers",
  [CHECK_IDS.MCP_USER]: "User MCP Configuration",
  [CHECK_IDS.VERSION_STATUS]: "Version Status"
};
var CATEGORY_NAMES = {
  installation: "Installation",
  configuration: "Configuration",
  authentication: "Authentication",
  dependencies: "Dependencies",
  tools: "Tools & Servers",
  updates: "Updates"
};
var EXIT_CODES = {
  SUCCESS: 0,
  FAILURE: 1
};
var MIN_OPENCODE_VERSION = "1.0.150";
var PACKAGE_NAME = "kraken-code";
var OPENCODE_BINARIES = ["opencode", "opencode-desktop"];

// src/cli/doctor/checks/opencode.ts
async function findOpenCodeBinary() {
  for (const binary of OPENCODE_BINARIES) {
    try {
      const proc = Bun.spawn(["which", binary], { stdout: "pipe", stderr: "pipe" });
      const output = await new Response(proc.stdout).text();
      await proc.exited;
      if (proc.exitCode === 0) {
        return { binary, path: output.trim() };
      }
    } catch {
      continue;
    }
  }
  return null;
}
async function getOpenCodeVersion(binary) {
  try {
    const proc = Bun.spawn([binary, "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode === 0) {
      return output.trim();
    }
  } catch {
    return null;
  }
  return null;
}
function compareVersions(current, minimum) {
  const parseVersion = (v) => {
    const cleaned = v.replace(/^v/, "").split("-")[0];
    return cleaned.split(".").map((n) => parseInt(n, 10) || 0);
  };
  const curr = parseVersion(current);
  const min = parseVersion(minimum);
  for (let i = 0;i < Math.max(curr.length, min.length); i++) {
    const c = curr[i] ?? 0;
    const m = min[i] ?? 0;
    if (c > m)
      return true;
    if (c < m)
      return false;
  }
  return true;
}
async function getOpenCodeInfo() {
  const binaryInfo = await findOpenCodeBinary();
  if (!binaryInfo) {
    return {
      installed: false,
      version: null,
      path: null,
      binary: null
    };
  }
  const version = await getOpenCodeVersion(binaryInfo.binary);
  return {
    installed: true,
    version,
    path: binaryInfo.path,
    binary: binaryInfo.binary
  };
}
async function checkOpenCodeInstallation() {
  const info = await getOpenCodeInfo();
  if (!info.installed) {
    return {
      name: CHECK_NAMES[CHECK_IDS.OPENCODE_INSTALLATION],
      status: "fail",
      message: "OpenCode is not installed",
      details: [
        "Visit: https://opencode.ai/docs for installation instructions",
        "Run: npm install -g opencode"
      ]
    };
  }
  if (info.version && !compareVersions(info.version, MIN_OPENCODE_VERSION)) {
    return {
      name: CHECK_NAMES[CHECK_IDS.OPENCODE_INSTALLATION],
      status: "warn",
      message: `Version ${info.version} is below minimum ${MIN_OPENCODE_VERSION}`,
      details: [
        `Current: ${info.version}`,
        `Required: >= ${MIN_OPENCODE_VERSION}`,
        "Run: npm update -g opencode"
      ]
    };
  }
  return {
    name: CHECK_NAMES[CHECK_IDS.OPENCODE_INSTALLATION],
    status: "pass",
    message: info.version ?? "installed",
    details: info.path ? [`Path: ${info.path}`] : undefined
  };
}
function getOpenCodeCheckDefinition() {
  return {
    id: CHECK_IDS.OPENCODE_INSTALLATION,
    name: CHECK_NAMES[CHECK_IDS.OPENCODE_INSTALLATION],
    category: "installation",
    check: checkOpenCodeInstallation,
    critical: true
  };
}

// src/cli/doctor/checks/plugin.ts
import { existsSync, readFileSync } from "fs";
import * as jsoncParser from "jsonc-parser";
import path from "path";
import os from "os";
function getOpenCodeConfigPaths() {
  const crossPlatformDir = path.join(os.homedir(), ".config", "opencode");
  return {
    configJson: path.join(crossPlatformDir, "opencode.json"),
    configJsonc: path.join(crossPlatformDir, "opencode.jsonc")
  };
}
function parseJsonc(content) {
  const errors = [];
  const result = jsoncParser.parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    throw new Error(`JSONC parse error: ${errors[0].error}`);
  }
  return result;
}
function detectConfigPath() {
  const paths = getOpenCodeConfigPaths();
  if (existsSync(paths.configJsonc)) {
    return { path: paths.configJsonc, format: "jsonc" };
  }
  if (existsSync(paths.configJson)) {
    return { path: paths.configJson, format: "json" };
  }
  return null;
}
function findPluginEntry(plugins) {
  for (const plugin of plugins) {
    if (plugin === PACKAGE_NAME || plugin.startsWith(`${PACKAGE_NAME}@`)) {
      const isPinned = plugin.includes("@");
      const version = isPinned ? plugin.split("@")[1] : null;
      return { entry: plugin, isPinned, version };
    }
  }
  return null;
}
function getPluginInfo() {
  const configInfo = detectConfigPath();
  if (!configInfo) {
    return {
      registered: false,
      configPath: null,
      entry: null,
      isPinned: false,
      pinnedVersion: null
    };
  }
  try {
    const content = readFileSync(configInfo.path, "utf-8");
    const config = parseJsonc(content);
    const plugins = config.plugin ?? [];
    const pluginEntry = findPluginEntry(plugins);
    if (!pluginEntry) {
      return {
        registered: false,
        configPath: configInfo.path,
        entry: null,
        isPinned: false,
        pinnedVersion: null
      };
    }
    return {
      registered: true,
      configPath: configInfo.path,
      entry: pluginEntry.entry,
      isPinned: pluginEntry.isPinned,
      pinnedVersion: pluginEntry.version
    };
  } catch {
    return {
      registered: false,
      configPath: configInfo.path,
      entry: null,
      isPinned: false,
      pinnedVersion: null
    };
  }
}
async function checkPluginRegistration() {
  const info = getPluginInfo();
  if (!info.configPath) {
    const expectedPaths = getOpenCodeConfigPaths();
    return {
      name: CHECK_NAMES[CHECK_IDS.PLUGIN_REGISTRATION],
      status: "fail",
      message: "OpenCode config file not found",
      details: [
        "Run: kraken-code install",
        `Expected: ${expectedPaths.configJson} or ${expectedPaths.configJsonc}`
      ]
    };
  }
  if (!info.registered) {
    return {
      name: CHECK_NAMES[CHECK_IDS.PLUGIN_REGISTRATION],
      status: "fail",
      message: "Plugin not registered in config",
      details: [
        "Run: kraken-code install",
        `Config: ${info.configPath}`
      ]
    };
  }
  const message = info.isPinned ? `Registered (pinned: ${info.pinnedVersion})` : "Registered";
  return {
    name: CHECK_NAMES[CHECK_IDS.PLUGIN_REGISTRATION],
    status: "pass",
    message,
    details: [`Config: ${info.configPath}`]
  };
}
function getPluginCheckDefinition() {
  return {
    id: CHECK_IDS.PLUGIN_REGISTRATION,
    name: CHECK_NAMES[CHECK_IDS.PLUGIN_REGISTRATION],
    category: "installation",
    check: checkPluginRegistration,
    critical: true
  };
}

// src/cli/doctor/checks/config.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
import * as jsoncParser2 from "jsonc-parser";
import path2 from "path";
import os2 from "os";
function getOpenCodeConfigPaths2() {
  const crossPlatformDir = path2.join(os2.homedir(), ".config", "opencode");
  return {
    configJson: path2.join(crossPlatformDir, "opencode.json"),
    configJsonc: path2.join(crossPlatformDir, "opencode.jsonc")
  };
}
function parseJsonc2(content) {
  const errors = [];
  const result = jsoncParser2.parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    throw new Error(`JSONC parse error: ${errors[0].error}`);
  }
  return result;
}
async function checkConfigValidity() {
  const paths = getOpenCodeConfigPaths2();
  const configPath = paths.configJsonc || paths.configJson;
  if (!existsSync2(configPath)) {
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: "fail",
      message: "OpenCode config file not found",
      details: [`Expected: ${configPath}`]
    };
  }
  try {
    const content = readFileSync2(configPath, "utf-8");
    parseJsonc2(content);
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: "pass",
      message: "Config file is valid JSONC",
      details: [`Config: ${configPath}`]
    };
  } catch (error) {
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: "fail",
      message: `Config parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: [`Config: ${configPath}`]
    };
  }
}
function getConfigCheckDefinition() {
  return {
    id: CHECK_IDS.CONFIG_VALIDATION,
    name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
    category: "configuration",
    check: checkConfigValidity,
    critical: false
  };
}

// src/cli/doctor/checks/auth.ts
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "fs";
import { homedir } from "os";
import { join } from "path";

// src/shared/index.ts
import * as jsoncParser3 from "jsonc-parser";
function parseJsonc3(content) {
  const errors = [];
  const result = jsoncParser3.parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    throw new Error(`JSONC parse error: ${errors[0].error}`);
  }
  return result;
}

// src/cli/doctor/checks/auth.ts
var OPENCODE_CONFIG_DIR = join(homedir(), ".config", "opencode");
var OPENCODE_JSON = join(OPENCODE_CONFIG_DIR, "opencode.json");
var OPENCODE_JSONC = join(OPENCODE_CONFIG_DIR, "opencode.jsonc");
var AUTH_PLUGINS = {
  anthropic: { plugin: "builtin", name: "Anthropic (Claude)" },
  openai: { plugin: "opencode-openai-codex-auth", name: "OpenAI (ChatGPT)" },
  google: { plugin: "opencode-antigravity-auth", name: "Google (Gemini)" }
};
function getOpenCodeConfig() {
  const configPath = existsSync3(OPENCODE_JSONC) ? OPENCODE_JSONC : OPENCODE_JSON;
  if (!existsSync3(configPath))
    return null;
  try {
    const content = readFileSync3(configPath, "utf-8");
    return parseJsonc3(content);
  } catch {
    return null;
  }
}
function isPluginInstalled(plugins, pluginName) {
  if (pluginName === "builtin")
    return true;
  return plugins.some((p) => p === pluginName || p.startsWith(`${pluginName}@`));
}
function getAuthProviderInfo(providerId) {
  const config = getOpenCodeConfig();
  const plugins = config?.plugin ?? [];
  const authConfig = AUTH_PLUGINS[providerId];
  const pluginInstalled = isPluginInstalled(plugins, authConfig.plugin);
  return {
    id: providerId,
    name: authConfig.name,
    pluginInstalled,
    configured: pluginInstalled
  };
}
async function checkAuthProvider(providerId) {
  const info = getAuthProviderInfo(providerId);
  const checkId = `auth-${providerId}`;
  const checkName = CHECK_NAMES[checkId] || info.name;
  if (!info.pluginInstalled) {
    return {
      name: checkName,
      status: "skip",
      message: "Auth plugin not installed",
      details: [
        `Plugin: ${AUTH_PLUGINS[providerId].plugin}`,
        "Run: kraken-code install"
      ]
    };
  }
  return {
    name: checkName,
    status: "pass",
    message: "Auth plugin available",
    details: [
      providerId === "anthropic" ? "Run: opencode auth login (select Anthropic)" : `Plugin: ${AUTH_PLUGINS[providerId].plugin}`
    ]
  };
}
async function checkAnthropicAuth() {
  return checkAuthProvider("anthropic");
}
async function checkOpenAIAuth() {
  return checkAuthProvider("openai");
}
async function checkGoogleAuth() {
  return checkAuthProvider("google");
}
function getAuthCheckDefinitions() {
  return [
    {
      id: CHECK_IDS.AUTH_ANTHROPIC,
      name: CHECK_NAMES[CHECK_IDS.AUTH_ANTHROPIC],
      category: "authentication",
      check: checkAnthropicAuth,
      critical: false
    },
    {
      id: CHECK_IDS.AUTH_OPENAI,
      name: CHECK_NAMES[CHECK_IDS.AUTH_OPENAI],
      category: "authentication",
      check: checkOpenAIAuth,
      critical: false
    },
    {
      id: CHECK_IDS.AUTH_GOOGLE,
      name: CHECK_NAMES[CHECK_IDS.AUTH_GOOGLE],
      category: "authentication",
      check: checkGoogleAuth,
      critical: false
    }
  ];
}

// src/cli/doctor/checks/dependencies.ts
async function checkBinaryExists(binary) {
  try {
    const proc = Bun.spawn(["which", binary], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode === 0) {
      return { exists: true, path: output.trim() };
    }
  } catch {}
  return { exists: false, path: null };
}
async function getBinaryVersion(binary) {
  try {
    const proc = Bun.spawn([binary, "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode === 0) {
      return output.trim().split(`
`)[0];
    }
  } catch {}
  return null;
}
async function checkAstGrepCli() {
  const binaryCheck = await checkBinaryExists("sg");
  const altBinaryCheck = !binaryCheck.exists ? await checkBinaryExists("ast-grep") : null;
  const binary = binaryCheck.exists ? binaryCheck : altBinaryCheck;
  if (!binary || !binary.exists) {
    return {
      name: "AST-Grep CLI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Install: npm install -g @ast-grep/cli"
    };
  }
  const version = await getBinaryVersion(binary.path);
  return {
    name: "AST-Grep CLI",
    required: false,
    installed: true,
    version,
    path: binary.path
  };
}
function checkAstGrepNapi() {
  try {
    __require.resolve("@ast-grep/napi");
    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: true,
      version: null,
      path: null
    };
  } catch {
    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Will use CLI fallback if available"
    };
  }
}
function dependencyToCheckResult(dep, checkName) {
  if (dep.installed) {
    return {
      name: checkName,
      status: "pass",
      message: dep.version ?? "installed",
      details: dep.path ? [`Path: ${dep.path}`] : undefined
    };
  }
  return {
    name: checkName,
    status: "warn",
    message: "Not installed (optional)",
    details: dep.installHint ? [dep.installHint] : undefined
  };
}
async function checkDependencyAstGrepCli() {
  const info = await checkAstGrepCli();
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_CLI]);
}
async function checkDependencyAstGrepNapi() {
  const info = checkAstGrepNapi();
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_NAPI]);
}
async function checkDependencyCommentChecker() {
  return {
    name: "Comment Checker",
    status: "pass",
    message: "Built-in hook, always available",
    details: ["Comment checking is handled by hooks/comment-checker"]
  };
}
function getDependencyCheckDefinitions() {
  return [
    {
      id: CHECK_IDS.DEP_AST_GREP_CLI,
      name: CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_CLI],
      category: "dependencies",
      check: checkDependencyAstGrepCli,
      critical: false
    },
    {
      id: CHECK_IDS.DEP_AST_GREP_NAPI,
      name: CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_NAPI],
      category: "dependencies",
      check: checkDependencyAstGrepNapi,
      critical: false
    },
    {
      id: CHECK_IDS.DEP_COMMENT_CHECKER,
      name: CHECK_NAMES[CHECK_IDS.DEP_COMMENT_CHECKER],
      category: "dependencies",
      check: checkDependencyCommentChecker,
      critical: false
    }
  ];
}

// src/cli/doctor/checks/gh.ts
async function checkBinaryExists2(binary) {
  try {
    const proc = Bun.spawn(["which", binary], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode === 0) {
      return { exists: true, path: output.trim() };
    }
  } catch {}
  return { exists: false, path: null };
}
async function getGhVersion() {
  try {
    const proc = Bun.spawn(["gh", "--version"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode === 0) {
      const match = output.match(/gh version (\S+)/);
      return match?.[1] ?? output.trim().split(`
`)[0];
    }
  } catch {}
  return null;
}
async function getGhAuthStatus() {
  try {
    const proc = Bun.spawn(["gh", "auth", "status"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, GH_NO_UPDATE_NOTIFIER: "1" }
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    const output = stderr || stdout;
    if (proc.exitCode === 0) {
      const usernameMatch = output.match(/Logged in to github\.com account (\S+)/);
      const username = usernameMatch?.[1]?.replace(/[()]/g, "") ?? null;
      const scopesMatch = output.match(/Token scopes?:\s*(.+)/i);
      const scopes = scopesMatch?.[1] ? scopesMatch[1].split(/,\s*/).map((s) => s.replace(/['"]/g, "").trim()).filter(Boolean) : [];
      return { authenticated: true, username, scopes, error: null };
    }
    const errorMatch = output.match(/error[:\s]+(.+)/i);
    return {
      authenticated: false,
      username: null,
      scopes: [],
      error: errorMatch?.[1]?.trim() ?? "Not authenticated"
    };
  } catch (err) {
    return {
      authenticated: false,
      username: null,
      scopes: [],
      error: err instanceof Error ? err.message : "Failed to check auth status"
    };
  }
}
async function getGhCliInfo() {
  const binaryCheck = await checkBinaryExists2("gh");
  if (!binaryCheck.exists) {
    return {
      installed: false,
      version: null,
      path: null,
      authenticated: false,
      username: null,
      scopes: [],
      error: null
    };
  }
  const [version, authStatus] = await Promise.all([getGhVersion(), getGhAuthStatus()]);
  return {
    installed: true,
    version,
    path: binaryCheck.path,
    authenticated: authStatus.authenticated,
    username: authStatus.username,
    scopes: authStatus.scopes,
    error: authStatus.error
  };
}
async function checkGhCli() {
  const info = await getGhCliInfo();
  const name = CHECK_NAMES[CHECK_IDS.GH_CLI];
  if (!info.installed) {
    return {
      name,
      status: "warn",
      message: "Not installed (optional)",
      details: [
        "GitHub CLI is used by librarian agent and scripts",
        "Install: https://cli.github.com/"
      ]
    };
  }
  if (!info.authenticated) {
    return {
      name,
      status: "warn",
      message: `${info.version ?? "installed"} - not authenticated`,
      details: [
        info.path ? `Path: ${info.path}` : null,
        "Authenticate: gh auth login",
        info.error ? `Error: ${info.error}` : null
      ].filter((d) => d !== null)
    };
  }
  const details = [];
  if (info.path)
    details.push(`Path: ${info.path}`);
  if (info.username)
    details.push(`Account: ${info.username}`);
  if (info.scopes.length > 0)
    details.push(`Scopes: ${info.scopes.join(", ")}`);
  return {
    name,
    status: "pass",
    message: `${info.version ?? "installed"} - authenticated as ${info.username ?? "unknown"}`,
    details: details.length > 0 ? details : undefined
  };
}
function getGhCliCheckDefinition() {
  return {
    id: CHECK_IDS.GH_CLI,
    name: CHECK_NAMES[CHECK_IDS.GH_CLI],
    category: "tools",
    check: checkGhCli,
    critical: false
  };
}

// src/cli/doctor/checks/lsp.ts
var DEFAULT_LSP_SERVERS = [
  { id: "typescript-language-server", binary: "typescript-language-server", extensions: [".ts", ".tsx", ".js", ".jsx"] },
  { id: "pyright", binary: "pyright-langserver", extensions: [".py"] },
  { id: "rust-analyzer", binary: "rust-analyzer", extensions: [".rs"] },
  { id: "gopls", binary: "gopls", extensions: [".go"] }
];
async function checkBinaryExists3(binary) {
  try {
    const proc = Bun.spawn(["which", binary], { stdout: "pipe", stderr: "pipe" });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}
async function getLspServersInfo() {
  const servers = [];
  for (const server of DEFAULT_LSP_SERVERS) {
    const installed = await checkBinaryExists3(server.binary);
    servers.push({
      id: server.id,
      installed,
      extensions: server.extensions,
      source: "builtin"
    });
  }
  return servers;
}
function getLspServerStats(servers) {
  const installed = servers.filter((s) => s.installed).length;
  return { installed, total: servers.length };
}
async function checkLspServers() {
  const servers = await getLspServersInfo();
  const stats = getLspServerStats(servers);
  const installedServers = servers.filter((s) => s.installed);
  const missingServers = servers.filter((s) => !s.installed);
  if (stats.installed === 0) {
    return {
      name: CHECK_NAMES[CHECK_IDS.LSP_SERVERS],
      status: "warn",
      message: "No LSP servers detected",
      details: [
        "LSP tools will have limited functionality",
        ...missingServers.map((s) => `Missing: ${s.id}`)
      ]
    };
  }
  const details = [
    ...installedServers.map((s) => `Installed: ${s.id}`),
    ...missingServers.map((s) => `Not found: ${s.id} (optional)`)
  ];
  return {
    name: CHECK_NAMES[CHECK_IDS.LSP_SERVERS],
    status: "pass",
    message: `${stats.installed}/${stats.total} servers available`,
    details
  };
}
function getLspCheckDefinition() {
  return {
    id: CHECK_IDS.LSP_SERVERS,
    name: CHECK_NAMES[CHECK_IDS.LSP_SERVERS],
    category: "tools",
    check: checkLspServers,
    critical: false
  };
}

// src/cli/doctor/checks/mcp.ts
import { existsSync as existsSync4, readFileSync as readFileSync4 } from "fs";
import { homedir as homedir2 } from "os";
import { join as join2 } from "path";
var BUILTIN_MCP_SERVERS = ["websearch", "context7", "grep_app"];
var MCP_CONFIG_PATHS = [
  join2(homedir2(), ".claude", ".mcp.json"),
  join2(process.cwd(), ".mcp.json"),
  join2(process.cwd(), ".claude", ".mcp.json")
];
function loadUserMcpConfig() {
  const servers = {};
  for (const configPath of MCP_CONFIG_PATHS) {
    if (!existsSync4(configPath))
      continue;
    try {
      const content = readFileSync4(configPath, "utf-8");
      const config = parseJsonc3(content);
      if (config.mcpServers) {
        Object.assign(servers, config.mcpServers);
      }
    } catch {}
  }
  return servers;
}
function getBuiltinMcpInfo() {
  return BUILTIN_MCP_SERVERS.map((id) => ({
    id,
    type: "builtin",
    enabled: true,
    valid: true
  }));
}
function getUserMcpInfo() {
  const userServers = loadUserMcpConfig();
  const servers = [];
  for (const [id, config] of Object.entries(userServers)) {
    const isValid = typeof config === "object" && config !== null;
    servers.push({
      id,
      type: "user",
      enabled: true,
      valid: isValid,
      error: isValid ? undefined : "Invalid configuration format"
    });
  }
  return servers;
}
async function checkBuiltinMcpServers() {
  const servers = getBuiltinMcpInfo();
  return {
    name: CHECK_NAMES[CHECK_IDS.MCP_BUILTIN],
    status: "pass",
    message: `${servers.length} built-in servers enabled`,
    details: servers.map((s) => `Enabled: ${s.id}`)
  };
}
async function checkUserMcpServers() {
  const servers = getUserMcpInfo();
  if (servers.length === 0) {
    return {
      name: CHECK_NAMES[CHECK_IDS.MCP_USER],
      status: "skip",
      message: "No user MCP configuration found",
      details: ["Optional: Add .mcp.json for custom MCP servers"]
    };
  }
  const invalidServers = servers.filter((s) => !s.valid);
  if (invalidServers.length > 0) {
    return {
      name: CHECK_NAMES[CHECK_IDS.MCP_USER],
      status: "warn",
      message: `${invalidServers.length} server(s) have configuration issues`,
      details: [
        ...servers.filter((s) => s.valid).map((s) => `Valid: ${s.id}`),
        ...invalidServers.map((s) => `Invalid: ${s.id} - ${s.error}`)
      ]
    };
  }
  return {
    name: CHECK_NAMES[CHECK_IDS.MCP_USER],
    status: "pass",
    message: `${servers.length} user server(s) configured`,
    details: servers.map((s) => `Configured: ${s.id}`)
  };
}
function getMcpCheckDefinitions() {
  return [
    {
      id: CHECK_IDS.MCP_BUILTIN,
      name: CHECK_NAMES[CHECK_IDS.MCP_BUILTIN],
      category: "tools",
      check: checkBuiltinMcpServers,
      critical: false
    },
    {
      id: CHECK_IDS.MCP_USER,
      name: CHECK_NAMES[CHECK_IDS.MCP_USER],
      category: "tools",
      check: checkUserMcpServers,
      critical: false
    }
  ];
}

// src/cli/doctor/checks/version.ts
async function checkVersion() {
  return {
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    status: "pass",
    message: "Kraken Code plugin version check bypassed (version tracking not implemented)",
    details: [
      `Minimum required: ${MIN_OPENCODE_VERSION}`,
      "Run 'bun run build' to build the plugin"
    ]
  };
}
function getVersionCheckDefinition() {
  return {
    id: CHECK_IDS.VERSION_STATUS,
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    category: "updates",
    check: checkVersion,
    critical: false
  };
}

// src/cli/doctor/checks/index.ts
function getAllCheckDefinitions() {
  return [
    getOpenCodeCheckDefinition(),
    getPluginCheckDefinition(),
    getConfigCheckDefinition(),
    ...getAuthCheckDefinitions(),
    ...getDependencyCheckDefinitions(),
    getGhCliCheckDefinition(),
    getLspCheckDefinition(),
    ...getMcpCheckDefinitions(),
    getVersionCheckDefinition()
  ];
}

// src/cli/doctor/formatter.ts
import color2 from "picocolors";
function formatStatusSymbol(status) {
  switch (status) {
    case "pass":
      return SYMBOLS.check;
    case "fail":
      return SYMBOLS.cross;
    case "warn":
      return SYMBOLS.warn;
    case "skip":
      return SYMBOLS.skip;
  }
}
function formatCheckResult(result, verbose) {
  const symbol = formatStatusSymbol(result.status);
  const colorFn = STATUS_COLORS[result.status];
  const name = colorFn(result.name);
  const message = color2.dim(result.message);
  let line = `  ${symbol} ${name}`;
  if (result.message) {
    line += ` ${SYMBOLS.arrow} ${message}`;
  }
  if (verbose && result.details && result.details.length > 0) {
    const detailLines = result.details.map((d) => `      ${SYMBOLS.bullet} ${color2.dim(d)}`).join(`
`);
    line += `
` + detailLines;
  }
  return line;
}
function formatCategoryHeader(category) {
  const name = CATEGORY_NAMES[category] || category;
  return `
${color2.bold(color2.white(name))}
${color2.dim("\u2500".repeat(40))}`;
}
function formatSummary(summary) {
  const lines = [];
  lines.push(color2.bold(color2.white("Summary")));
  lines.push(color2.dim("\u2500".repeat(40)));
  lines.push("");
  const passText = summary.passed > 0 ? color2.green(`${summary.passed} passed`) : color2.dim("0 passed");
  const failText = summary.failed > 0 ? color2.red(`${summary.failed} failed`) : color2.dim("0 failed");
  const warnText = summary.warnings > 0 ? color2.yellow(`${summary.warnings} warnings`) : color2.dim("0 warnings");
  const skipText = summary.skipped > 0 ? color2.dim(`${summary.skipped} skipped`) : "";
  const parts = [passText, failText, warnText];
  if (skipText)
    parts.push(skipText);
  lines.push(`  ${parts.join(", ")}`);
  lines.push(`  ${color2.dim(`Total: ${summary.total} checks in ${summary.duration}ms`)}`);
  return lines.join(`
`);
}
function formatHeader() {
  return `
${color2.bgBlue(color2.white(" Kraken Code Doctor "))}
`;
}
function formatFooter(summary) {
  if (summary.failed > 0) {
    return `
${SYMBOLS.cross} ${color2.red("Issues detected. Please review the errors above.")}
`;
  }
  if (summary.warnings > 0) {
    return `
${SYMBOLS.warn} ${color2.yellow("All systems operational with warnings.")}
`;
  }
  return `
${SYMBOLS.check} ${color2.green("All systems operational!")}
`;
}
function formatJsonOutput(result) {
  return JSON.stringify(result, null, 2);
}

// src/cli/doctor/runner.ts
async function runCheck(check) {
  const start = performance.now();
  try {
    const result = await check.check();
    result.duration = Math.round(performance.now() - start);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error(`[doctor] Check "${check.name}" failed:`, errorMessage);
    if (errorStack) {
      console.error(`[doctor] Stack trace:
${errorStack}`);
    }
    return {
      name: check.name,
      status: "fail",
      message: errorMessage,
      duration: Math.round(performance.now() - start)
    };
  }
}
function calculateSummary(results, duration) {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    warnings: results.filter((r) => r.status === "warn").length,
    skipped: results.filter((r) => r.status === "skip").length,
    duration: Math.round(duration)
  };
}
function determineExitCode(results) {
  const hasFailures = results.some((r) => r.status === "fail");
  return hasFailures ? EXIT_CODES.FAILURE : EXIT_CODES.SUCCESS;
}
function filterChecksByCategory(checks, category) {
  if (!category)
    return checks;
  return checks.filter((c) => c.category === category);
}
function groupChecksByCategory(checks) {
  const groups = new Map;
  for (const check of checks) {
    const existing = groups.get(check.category) ?? [];
    existing.push(check);
    groups.set(check.category, existing);
  }
  return groups;
}
var CATEGORY_ORDER = [
  "installation",
  "configuration",
  "authentication",
  "dependencies",
  "tools",
  "updates"
];
async function runDoctor(options) {
  const start = performance.now();
  const allChecks = getAllCheckDefinitions();
  const filteredChecks = filterChecksByCategory(allChecks, options.category);
  const groupedChecks = groupChecksByCategory(filteredChecks);
  const results = [];
  if (!options.json) {
    console.log(formatHeader());
  }
  for (const category of CATEGORY_ORDER) {
    const checks = groupedChecks.get(category);
    if (!checks || checks.length === 0)
      continue;
    if (!options.json) {
      console.log(formatCategoryHeader(category));
    }
    for (const check of checks) {
      const result = await runCheck(check);
      results.push(result);
      if (!options.json) {
        console.log(formatCheckResult(result, options.verbose ?? false));
      }
    }
  }
  const duration = performance.now() - start;
  const summary = calculateSummary(results, duration);
  const exitCode = determineExitCode(results);
  const doctorResult = {
    results,
    summary,
    exitCode
  };
  if (options.json) {
    console.log(formatJsonOutput(doctorResult));
  } else {
    console.log("");
    console.log(formatSummary(summary));
    console.log(formatFooter(summary));
  }
  return doctorResult;
}

// src/cli/install.ts
import { existsSync as existsSync5, readFileSync as readFileSync5, writeFileSync } from "fs";
import * as jsoncParser4 from "jsonc-parser";
import path3 from "path";
import os3 from "os";
import color3 from "picocolors";
function getOpenCodeConfigPaths3() {
  const crossPlatformDir = path3.join(os3.homedir(), ".config", "opencode");
  return {
    configJson: path3.join(crossPlatformDir, "opencode.json"),
    configJsonc: path3.join(crossPlatformDir, "opencode.jsonc")
  };
}
function detectConfigPath2() {
  const paths = getOpenCodeConfigPaths3();
  if (existsSync5(paths.configJsonc)) {
    return { path: paths.configJsonc, format: "jsonc" };
  }
  if (existsSync5(paths.configJson)) {
    return { path: paths.configJson, format: "json" };
  }
  return null;
}
function registerPluginInConfig(content, format) {
  const errors = [];
  const root = jsoncParser4.parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    throw new Error(`Failed to parse config: ${errors[0].error}`);
  }
  const plugins = Array.isArray(root.plugin) ? [...root.plugin] : [];
  const isRegistered = plugins.some((p) => p === PACKAGE_NAME || p.startsWith(`${PACKAGE_NAME}@`));
  if (isRegistered) {
    return content;
  }
  plugins.push(PACKAGE_NAME);
  const editOptions = {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
      insertFinalNewline: true
    }
  };
  if (root.plugin === undefined) {
    let insertPos = 0;
    const openBrace = content.indexOf("{");
    if (openBrace !== -1) {
      insertPos = openBrace + 1;
    }
    const indent = format === "jsonc" ? "  " : "  ";
    const newline = content.includes(`
`) ? `
` : "";
    const pluginText = `${newline}${indent}"plugin": ${JSON.stringify(plugins)},`;
    return content.slice(0, insertPos) + pluginText + content.slice(insertPos);
  }
  const edits = jsoncParser4.modify(content, ["plugin"], plugins, editOptions);
  return jsoncParser4.applyEdits(content, edits);
}
function createDefaultConfig() {
  return `{
  "plugin": [
    "${PACKAGE_NAME}"
  ]
}
`;
}
async function install() {
  const paths = getOpenCodeConfigPaths3();
  const configInfo = detectConfigPath2();
  let content;
  let format;
  if (configInfo) {
    try {
      content = readFileSync5(configInfo.path, "utf-8");
      format = configInfo.format;
    } catch (error) {
      return {
        success: false,
        message: `Failed to read config: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  } else {
    const dir = path3.dirname(paths.configJson);
    if (!existsSync5(dir)) {
      try {
        const { mkdirSync } = await import("fs");
        mkdirSync(dir, { recursive: true });
      } catch (error) {
        return {
          success: false,
          message: `Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
    content = createDefaultConfig();
    format = "json";
  }
  try {
    const updatedContent = registerPluginInConfig(content, format);
    writeFileSync(configInfo?.path ?? paths.configJson, updatedContent, "utf-8");
    const finalConfigPath = configInfo?.path ?? paths.configJson;
    if (updatedContent === content) {
      return {
        success: true,
        message: `Plugin "${PACKAGE_NAME}" is already registered`,
        configPath: finalConfigPath
      };
    }
    return {
      success: true,
      message: `Plugin "${PACKAGE_NAME}" registered successfully`,
      configPath: finalConfigPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to register plugin: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
function printResult(result) {
  if (result.success) {
    console.log(color3.green(`
${String.fromCodePoint(10003)} ${result.message}`));
    if (result.configPath) {
      console.log(color3.dim(`  Config: ${result.configPath}`));
    }
  } else {
    console.log(color3.red(`
${String.fromCodePoint(10007)} ${result.message}`));
  }
}
async function runInstall() {
  const result = await install();
  printResult(result);
  process.exit(result.success ? 0 : 1);
}
if (false) {}

// src/cli/init.ts
import { writeFileSync as writeFileSync2, existsSync as existsSync6, mkdirSync, readFileSync as readFileSync6 } from "fs";
import * as path4 from "path";
import * as os4 from "os";
import color4 from "picocolors";
var __dirname = "/home/ubuntu/kraken-code/src/cli";
async function runInit(options) {
  console.log(color4.cyan("\uD83D\uDC19 Initializing Kraken Code..."));
  const configDir = path4.join(os4.homedir(), ".config", "opencode");
  const opencodeConfigPath = path4.join(configDir, "opencode.json");
  const krakenConfigPath = path4.join(configDir, "kraken-code.json");
  if (!existsSync6(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  const isMinimal = options.minimal;
  const isFull = options.full;
  const krakenConfig = {
    default_agent: "Kraken",
    blitzkrieg: {
      enabled: true,
      testPlan: {
        requiredBeforeImplementation: true,
        minTestCases: 3,
        requireCoverageThreshold: true,
        coverageThresholdPercent: 80
      },
      tddWorkflow: {
        enforceWriteTestFirst: true,
        forbidCodeWithoutTest: true,
        allowRefactorWithoutTest: true
      },
      evidence: {
        requireTestExecutionEvidence: true,
        requireAssertionEvidence: true,
        requireEdgeCaseEvidence: true
      },
      plannerConstraints: {
        requireTestStep: true,
        requireVerificationStep: true,
        maxImplementationStepComplexity: 3
      }
    },
    kratos: {
      enabled: true,
      autoSave: true,
      storagePath: "~/.kratos"
    },
    modes: {
      blitzkrieg: {
        enabled: true
      },
      ultrathink: {
        enabled: true,
        thinkingBudget: 32000,
        autoVariantSwitch: true
      },
      ultrawork: {
        enabled: true,
        parallelAgents: 4
      },
      search: {
        enabled: true,
        maxResults: 50
      },
      analyze: {
        enabled: true,
        consultationPhases: 3
      }
    }
  };
  let existingKrakenConfig = {};
  if (existsSync6(krakenConfigPath)) {
    try {
      existingKrakenConfig = JSON.parse(readFileSync6(krakenConfigPath, "utf-8"));
    } catch {
      existingKrakenConfig = {};
    }
  }
  const mergedKrakenConfig = {
    ...krakenConfig,
    ...existingKrakenConfig
  };
  writeFileSync2(krakenConfigPath, JSON.stringify(mergedKrakenConfig, null, 2));
  console.log(color4.green(`\u2713 Kraken Code configuration written to ${krakenConfigPath}`));
  let existingOpencodeConfig = {};
  if (existsSync6(opencodeConfigPath)) {
    try {
      existingOpencodeConfig = JSON.parse(readFileSync6(opencodeConfigPath, "utf-8"));
    } catch {
      existingOpencodeConfig = {};
    }
  }
  const mergedOpencodeConfig = {
    ...existingOpencodeConfig,
    $schema: "https://opencode.ai/config.json",
    plugin: Array.from(new Set([
      ...existingOpencodeConfig.plugin || [],
      "kraken-code"
    ]))
  };
  writeFileSync2(opencodeConfigPath, JSON.stringify(mergedOpencodeConfig, null, 2));
  console.log(color4.green(`\u2713 OpenCode configuration updated at ${opencodeConfigPath}`));
  await installSkillTemplates();
  console.log(color4.green(`
\uD83C\uDF89 Kraken Code initialized!`));
  console.log(color4.dim(`
Next steps:`));
  console.log(color4.dim("  1. Run: opencode"));
  console.log(color4.dim("  2. Use 'blitz' or 'blz' to activate Blitzkrieg Mode"));
}
async function installSkillTemplates() {
  const skillDir = path4.join(os4.homedir(), ".config", "opencode", "skill");
  if (!existsSync6(skillDir)) {
    mkdirSync(skillDir, { recursive: true });
  }
  const sourceSkillsDir = path4.join(__dirname, "../../templates/skills");
  if (existsSync6(sourceSkillsDir)) {
    const { copyFile } = await import("fs/promises");
    const { readdir } = await import("fs/promises");
    try {
      const skillCategories = await readdir(sourceSkillsDir);
      for (const category of skillCategories) {
        const sourcePath = path4.join(sourceSkillsDir, category);
        const destPath = path4.join(skillDir, category);
        if (!existsSync6(destPath)) {
          mkdirSync(destPath, { recursive: true });
        }
        const skillFiles = await readdir(sourcePath);
        for (const skillFile of skillFiles) {
          const sourceFilePath = path4.join(sourcePath, skillFile);
          const destFilePath = path4.join(destPath, skillFile);
          await copyFile(sourceFilePath, destFilePath);
        }
      }
    } catch (error) {
      console.log(color4.dim(`  \u2713 Skill templates installed`));
    }
  } else {
    console.log(color4.dim("  \u2713 Skill templates ready (manual install)"));
  }
}

// src/cli/status.ts
import { readFileSync as readFileSync7, existsSync as existsSync7 } from "fs";
import * as path5 from "path";
import * as os5 from "os";
import color5 from "picocolors";
async function runStatus() {
  console.log(color5.cyan(`\uD83D\uDC19 Kraken Code Status
`));
  const opencodeConfigPath = path5.join(os5.homedir(), ".config", "opencode", "opencode.json");
  const krakenConfigPath = path5.join(os5.homedir(), ".config", "opencode", "kraken-code.json");
  if (!existsSync7(opencodeConfigPath)) {
    console.log(color5.red("\u2717 OpenCode configuration not found"));
    console.log(color5.dim("  Run: kraken-code init"));
    return;
  }
  const opencodeConfig = JSON.parse(readFileSync7(opencodeConfigPath, "utf-8"));
  const isPluginRegistered = opencodeConfig.plugin?.includes("kraken-code") || false;
  console.log(color5.bold("Plugin:"));
  if (isPluginRegistered) {
    console.log(color5.green("  \u2713 Registered: kraken-code"));
  } else {
    console.log(color5.red("  \u2717 Not registered"));
    console.log(color5.dim("  Run: kraken-code init"));
  }
  if (!existsSync7(krakenConfigPath)) {
    console.log(color5.yellow(`
\u26A0 Kraken Code configuration not found`));
    console.log(color5.dim("  Run: kraken-code init"));
    return;
  }
  const config2 = JSON.parse(readFileSync7(krakenConfigPath, "utf-8"));
  console.log(color5.bold("Plugin:"));
  console.log(color5.green("  \u2713 Registered: kraken-code"));
  if (config2.default_agent) {
    console.log(color5.bold(`
Default Agent:`));
    console.log(`  ${config2.default_agent}`);
  }
  if (config2.agents) {
    const enabledAgents = Object.entries(config2.agents).filter(([_, agent]) => !agent.disable).map(([name]) => name);
    if (enabledAgents.length > 0) {
      console.log(color5.bold(`
Enabled Agents:`));
      console.log(`  ${enabledAgents.join(", ")}`);
    }
  }
  if (config2.blitzkrieg) {
    const status = config2.blitzkrieg.enabled ? color5.green("\u2713 Enabled") : color5.red("\u2717 Disabled");
    console.log(color5.bold(`
Blitzkrieg Mode:`));
    console.log(`  Status: ${status}`);
    console.log(color5.dim("  Activate with: 'blitz' or 'blz'"));
  }
  if (config2.kratos) {
    const status = config2.kratos.enabled ? color5.green("\u2713 Enabled") : color5.red("\u2717 Disabled");
    console.log(color5.bold(`
Memory (Kratos):`));
    console.log(`  Status: ${status}`);
    console.log(`  Storage: ${config2.kratos.storagePath || config2.kratos.storagePath || "~/.kratos"}`);
  }
  if (config2.modes) {
    const modeNames = [];
    for (const [modeName, modeConfig] of Object.entries(config2.modes)) {
      if (typeof modeConfig === "object" && modeConfig && modeConfig.enabled) {
        modeNames.push(modeName);
      }
    }
    if (modeNames.length > 0) {
      console.log(color5.bold(`
Active Modes:`));
      console.log(`  ${modeNames.join(", ")}`);
    }
  }
}
// package.json
var version2 = "1.1.4";

// src/cli/index.ts
var program = new Command;
program.name("kraken-code").description("Kraken Code CLI - Unified OpenCode Plugin Manager").version(version2);
program.command("install").description("Install and register Kraken Code plugin").action(async () => {
  await runInstall();
});
program.command("init").description("Initialize Kraken Code with recommended configuration").option("--minimal", "Minimal setup (agents only)").option("--full", "Full setup (all features)").action(async (options) => {
  await runInit(options);
});
program.command("status").description("Show Kraken Code installation status").action(async () => {
  await runStatus();
});
program.command("doctor").description("Run system checks and diagnostics").option("-c, --category <category>", "Run checks for a specific category").option("--json", "Output results as JSON").option("-v, --verbose", "Show detailed output").action(async (options) => {
  await runDoctor({
    category: options.category,
    json: options.json,
    verbose: options.verbose
  });
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
