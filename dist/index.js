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

// src/tools/lsp/client.ts
import { spawn } from "node:child_process";

class LSPClient {
  root;
  server;
  proc = null;
  buffer = "";
  pending = new Map;
  requestIdCounter = 0;
  openedFiles = new Map;
  stderrBuffer = "";
  processExited = false;
  diagnosticsStore = new Map;
  constructor(root, server) {
    this.root = root;
    this.server = server;
  }
  async start() {
    if (this.proc)
      return;
    const [command, ...args] = this.server.command;
    const env = { ...process.env, ...this.server.env };
    this.proc = spawn(command, args, {
      cwd: this.root,
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    this.proc.on("error", (err) => {
      this.processExited = true;
      this.rejectAllPending(new Error(`LSP process error: ${err.message}`));
    });
    this.proc.on("exit", (code, signal) => {
      this.processExited = true;
      this.rejectAllPending(new Error(`LSP process exited with code ${code} and signal ${signal}`));
    });
    this.proc.stdout?.on("data", (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });
    this.proc.stderr?.on("data", (data) => {
      this.stderrBuffer += data.toString();
      if (this.stderrBuffer.length > 1e4) {
        this.stderrBuffer = this.stderrBuffer.slice(-5000);
      }
    });
  }
  rejectAllPending(error) {
    for (const [id, { reject }] of this.pending) {
      reject(error);
    }
    this.pending.clear();
  }
  processBuffer() {
    const separator = `\r
\r
`;
    while (true) {
      const sepIndex = this.buffer.indexOf(separator);
      if (sepIndex === -1)
        break;
      const headerSection = this.buffer.slice(0, sepIndex);
      this.buffer = this.buffer.slice(sepIndex + separator.length);
      const contentLengthMatch = headerSection.match(/Content-Length:\s*(\d+)/i);
      if (!contentLengthMatch)
        continue;
      const contentLength = Number.parseInt(contentLengthMatch[1], 10);
      if (this.buffer.length < contentLength)
        continue;
      const content = this.buffer.slice(0, contentLength);
      this.buffer = this.buffer.slice(contentLength);
      try {
        const message = JSON.parse(content);
        this.handleMessage(message);
      } catch (e) {
        console.error("Failed to parse LSP message:", e);
      }
    }
  }
  handleMessage(message) {
    if ("id" in message && message.id !== null) {
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        if ("error" in message) {
          pending.reject(new Error(message.error?.message || "LSP error"));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if ("method" in message) {
      if (message.method === "textDocument/publishDiagnostics") {
        const params = message.params;
        this.diagnosticsStore.set(params.uri, params.diagnostics);
      }
    }
  }
  send(request) {
    if (!this.proc || this.processExited) {
      return Promise.reject(new Error("LSP process not running"));
    }
    const id = ++this.requestIdCounter;
    const message = { ...request, id };
    const content = JSON.stringify(message);
    const header = `Content-Length: ${content.length}\r
\r
`;
    const fullMessage = header + content;
    this.proc.stdin?.write(fullMessage);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
  async request(method, params) {
    const result = await this.send({
      jsonrpc: "2.0",
      id: this.requestIdCounter + 1,
      method,
      params
    });
    return result;
  }
  async notify(method, params) {
    if (!this.proc || this.processExited) {
      throw new Error("LSP process not running");
    }
    const message = {
      jsonrpc: "2.0",
      method,
      params
    };
    const content = JSON.stringify(message);
    const header = `Content-Length: ${content.length}\r
\r
`;
    const fullMessage = header + content;
    this.proc.stdin?.write(fullMessage);
  }
  async initialize() {
    const initializeParams = {
      processId: process.pid,
      rootPath: this.root,
      rootUri: `file://${this.root}`,
      capabilities: {
        textDocument: {
          hover: { dynamicRegistration: true },
          definition: { dynamicRegistration: true },
          references: { dynamicRegistration: true },
          documentSymbol: { dynamicRegistration: true },
          codeAction: { dynamicRegistration: true },
          rename: { dynamicRegistration: true }
        }
      },
      initializationOptions: this.server.initialization
    };
    await this.request("initialize", initializeParams);
    await this.notify("initialized", {});
  }
  async openFile(filePath) {
    const uri = `file://${filePath}`;
    let version = this.openedFiles.get(uri) ?? 0;
    version++;
    const { promises: fs7 } = await import("node:fs");
    const content = await fs7.readFile(filePath, "utf-8");
    const ext = filePath.split(".").pop() ?? "";
    const languageId = this.getLanguageId(ext);
    await this.notify("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId,
        version,
        text: content
      }
    });
    this.openedFiles.set(uri, version);
  }
  async hover(filePath, line, character) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/hover", {
      textDocument: { uri },
      position: { line, character }
    });
  }
  async definition(filePath, line, character) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/definition", {
      textDocument: { uri },
      position: { line, character }
    });
  }
  async references(filePath, line, character, includeDeclaration = true) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/references", {
      textDocument: { uri },
      position: { line, character },
      context: { includeDeclaration }
    });
  }
  async documentSymbols(filePath) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/documentSymbol", {
      textDocument: { uri }
    });
  }
  async workspaceSymbols(query) {
    return await this.request("workspace/symbol", { query });
  }
  async diagnostics(filePath) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return { items: this.diagnosticsStore.get(uri) ?? [] };
  }
  async prepareRename(filePath, line, character) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/prepareRename", {
      textDocument: { uri },
      position: { line, character }
    });
  }
  async rename(filePath, line, character, newName) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    return await this.request("textDocument/rename", {
      textDocument: { uri },
      position: { line, character },
      newName
    });
  }
  async codeAction(filePath, startLine, startChar, endLine, endChar, only) {
    const uri = `file://${filePath}`;
    await this.ensureFileOpen(filePath);
    const diagnostics = this.diagnosticsStore.get(uri) ?? [];
    return await this.request("textDocument/codeAction", {
      textDocument: { uri },
      range: {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
      },
      context: { diagnostics, only }
    });
  }
  async codeActionResolve(codeAction) {
    return await this.request("codeAction/resolve", codeAction);
  }
  isAlive() {
    return this.proc !== null && !this.processExited;
  }
  async stop() {
    this.processExited = true;
    this.rejectAllPending(new Error("Client stopped"));
    if (this.proc) {
      try {
        await this.notify("shutdown");
        await this.notify("exit");
      } catch {}
      this.proc.kill();
      this.proc = null;
    }
    this.openedFiles.clear();
    this.diagnosticsStore.clear();
  }
  async ensureFileOpen(filePath) {
    const uri = `file://${filePath}`;
    if (!this.openedFiles.has(uri)) {
      await this.openFile(filePath);
    }
  }
  getLanguageId(ext) {
    const map = {
      ts: "typescript",
      tsx: "typescriptreact",
      js: "javascript",
      jsx: "javascriptreact",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      c: "c",
      cpp: "cpp",
      h: "c",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
      dart: "dart",
      vue: "vue",
      svelte: "svelte",
      json: "json",
      yaml: "yaml",
      toml: "toml",
      md: "markdown",
      sh: "shellscript",
      sql: "sql",
      html: "html",
      css: "css",
      scss: "scss",
      xml: "xml"
    };
    return map[ext.toLowerCase()] ?? ext;
  }
}
var init_client = () => {};

// src/tools/lsp/config.ts
var exports_config = {};
__export(exports_config, {
  getLanguageId: () => getLanguageId,
  findServerForExtension: () => findServerForExtension,
  BUILTIN_SERVERS: () => BUILTIN_SERVERS
});
function getLanguageId(ext) {
  const map = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    cs: "csharp",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    dart: "dart",
    vue: "vue",
    svelte: "svelte",
    json: "json",
    yaml: "yaml",
    toml: "toml",
    md: "markdown",
    sh: "shellscript",
    sql: "sql",
    html: "html",
    css: "css",
    scss: "scss",
    xml: "xml"
  };
  return map[ext.toLowerCase()] ?? ext;
}
async function findServerForExtension(ext) {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const server = BUILTIN_SERVERS.find((s) => !s.disabled && s.extensions.includes(normalizedExt));
  if (!server) {
    return {
      status: "not_configured",
      extension: normalizedExt,
      availableServers: []
    };
  }
  if (!await isServerInstalled(server.command)) {
    return {
      status: "not_installed",
      server: {
        id: server.id,
        command: server.command,
        extensions: server.extensions
      },
      installHint: getInstallHint(server.id)
    };
  }
  return {
    status: "found",
    server: {
      id: server.id,
      command: server.command,
      extensions: server.extensions,
      priority: BUILTIN_SERVERS.indexOf(server),
      env: server.env,
      initialization: server.initialization
    }
  };
}
async function isServerInstalled(command) {
  const [cmd] = command;
  if (!cmd)
    return false;
  try {
    const result = Bun.spawn(["which", cmd], { stdout: "pipe" });
    const output = await new Response(result.stdout).text();
    return output.trim().length > 0;
  } catch {
    return false;
  }
}
function getInstallHint(serverId) {
  const hints = {
    "typescript-language-server": "npm install -g typescript-language-server typescript",
    pyright: "npm install -g pyright",
    "rust-analyzer": "rustup component add rust-analyzer",
    gopls: "go install golang.org/x/tools/gopls@latest",
    jdtls: "Install from https://download.eclipse.org/jdtls/snapshots/",
    clangd: "Install from https://clangd.llvm.org/installation",
    omnisharp: "Install from https://github.com/OmniSharp/omnisharp-roslyn",
    intelephense: "npm install -g intelephense",
    "ruby-lsp": "gem install ruby-lsp",
    "dart-analysis-server": "Install Dart SDK from https://dart.dev/get-dart",
    "lua-language-server": "Install from https://github.com/LuaLS/lua-language-server",
    "kotlin-language-server": "Install from https://github.com/fwcd/kotlin-language-server",
    "svelte-language-server": "npm install -g svelte-language-server",
    "vue-language-server": "npm install -g @vue/language-server",
    "elixir-ls": "Install from https://github.com/elixir-lsp/elixir-ls",
    "terraform-ls": "Install from https://github.com/hashicorp/terraform-ls"
  };
  return hints[serverId] ?? `Install ${serverId}`;
}
var BUILTIN_SERVERS;
var init_config = __esm(() => {
  BUILTIN_SERVERS = [
    {
      id: "typescript-language-server",
      command: ["typescript-language-server", "--stdio"],
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    {
      id: "pyright",
      command: ["pyright-langserver", "--stdio"],
      extensions: [".py"]
    },
    {
      id: "rust-analyzer",
      command: ["rust-analyzer"],
      extensions: [".rs"]
    },
    {
      id: "gopls",
      command: ["gopls", "serve"],
      extensions: [".go"]
    },
    {
      id: "jdtls",
      command: ["jdtls"],
      extensions: [".java"]
    },
    {
      id: "clangd",
      command: ["clangd"],
      extensions: [".c", ".cpp", ".h", ".hpp"]
    },
    {
      id: "omnisharp",
      command: ["OmniSharp", "-lsp"],
      extensions: [".cs"]
    },
    {
      id: "intelephense",
      command: ["intelephense", "--stdio"],
      extensions: [".php"]
    },
    {
      id: "ruby-lsp",
      command: ["ruby-lsp"],
      extensions: [".rb"]
    },
    {
      id: "dart-analysis-server",
      command: ["dart", "analysis-server", "--lsp"],
      extensions: [".dart"]
    },
    {
      id: "lua-language-server",
      command: ["lua-language-server"],
      extensions: [".lua"]
    },
    {
      id: "kotlin-language-server",
      command: ["kotlin-language-server"],
      extensions: [".kt", ".kts"]
    },
    {
      id: "svelte-language-server",
      command: ["svelteserver", "--stdio"],
      extensions: [".svelte"]
    },
    {
      id: "vue-language-server",
      command: ["vue-language-server", "--stdio"],
      extensions: [".vue"]
    },
    {
      id: "elixir-ls",
      command: ["elixir-ls"],
      extensions: [".ex", ".exs"]
    },
    {
      id: "terraform-ls",
      command: ["terraform-ls", "serve"],
      extensions: [".tf", ".tfvars"]
    }
  ];
});

// src/tools/lsp/manager.ts
async function getClient(root, server) {
  const key = `${root}:${server.id}`;
  if (clients.has(key)) {
    return clients.get(key);
  }
  if (initializing.has(key)) {
    return initializing.get(key);
  }
  const promise = (async () => {
    const client = new LSPClient(root, server);
    await client.start();
    await client.initialize();
    clients.set(key, client);
    initializing.delete(key);
    return client;
  })();
  initializing.set(key, promise);
  return promise;
}
var clients, initializing;
var init_manager = __esm(() => {
  init_client();
  clients = new Map;
  initializing = new Map;
});

// src/tools/lsp/utils.ts
var exports_utils = {};
__export(exports_utils, {
  withLspClient: () => withLspClient,
  uriToPath: () => uriToPath,
  formatWorkspaceEdit: () => formatWorkspaceEdit,
  formatTextEdit: () => formatTextEdit,
  formatSymbolKind: () => formatSymbolKind,
  formatSymbolInfo: () => formatSymbolInfo,
  formatSeverity: () => formatSeverity,
  formatServerLookupError: () => formatServerLookupError,
  formatPrepareRenameResult: () => formatPrepareRenameResult,
  formatLocation: () => formatLocation,
  formatHoverResult: () => formatHoverResult,
  formatDocumentSymbol: () => formatDocumentSymbol,
  formatDiagnostic: () => formatDiagnostic,
  formatCodeActions: () => formatCodeActions,
  formatCodeAction: () => formatCodeAction,
  formatApplyResult: () => formatApplyResult,
  findWorkspaceRoot: () => findWorkspaceRoot,
  filterDiagnosticsBySeverity: () => filterDiagnosticsBySeverity,
  applyWorkspaceEdit: () => applyWorkspaceEdit
});
function findWorkspaceRoot(filePath) {
  const parts = filePath.split("/");
  for (let i = parts.length;i > 0; i--) {
    const path9 = parts.slice(0, i).join("/");
    const markers = [
      "package.json",
      "tsconfig.json",
      "pyproject.toml",
      "Cargo.toml",
      "go.mod",
      "pom.xml",
      "build.gradle"
    ];
    for (const marker of markers) {
      try {
        if (Bun.file(`${path9}/${marker}`).exists()) {
          return path9;
        }
      } catch {}
    }
  }
  return "/";
}
function uriToPath(uri) {
  return uri.replace(/^file:\/\//, "").replace(/%3A/g, ":");
}
function formatServerLookupError(result) {
  if (result.status === "not_configured") {
    return `No LSP server configured for extension: ${result.extension}`;
  } else {
    return `LSP server not installed: ${result.server.id}
Install: ${result.installHint}`;
  }
}
async function withLspClient(filePath, fn) {
  const root = findWorkspaceRoot(filePath);
  const ext = filePath.split(".").pop() ?? "";
  const lookup = await findServerForExtension(ext);
  if (lookup.status !== "found") {
    throw new Error(formatServerLookupError(lookup));
  }
  const client = await getClient(root, lookup.server);
  return fn(client);
}
function formatHoverResult(result) {
  if (!result)
    return "No hover information available";
  const contents = result.contents;
  if (typeof contents === "string") {
    return contents;
  }
  if (Array.isArray(contents)) {
    return contents.map((item) => {
      if (typeof item === "string")
        return item;
      return item.value;
    }).join(`

`);
  }
  return contents.value;
}
function formatLocation(loc) {
  if ("targetUri" in loc) {
    const uri = uriToPath(loc.targetUri);
    const { line, character } = loc.targetRange.start;
    return `${uri}:${line + 1}:${character + 1}`;
  } else {
    const uri = uriToPath(loc.uri);
    const { line, character } = loc.range.start;
    return `${uri}:${line + 1}:${character + 1}`;
  }
}
function formatSymbolKind(kind) {
  const kinds = {
    1: "File",
    2: "Module",
    3: "Namespace",
    4: "Package",
    5: "Class",
    6: "Method",
    7: "Property",
    8: "Field",
    9: "Constructor",
    10: "Enum",
    11: "Interface",
    12: "Function",
    13: "Variable",
    14: "Constant",
    15: "String",
    16: "Number",
    17: "Boolean",
    18: "Array",
    19: "Object",
    20: "Key",
    21: "Null",
    22: "EnumMember",
    23: "Struct",
    24: "Event",
    25: "Operator",
    26: "TypeParameter"
  };
  return kinds[kind] ?? `Unknown(${kind})`;
}
function formatSeverity(severity) {
  switch (severity) {
    case 1:
      return "Error";
    case 2:
      return "Warning";
    case 3:
      return "Information";
    case 4:
      return "Hint";
    default:
      return "Unknown";
  }
}
function formatDocumentSymbol(symbol, indent = 0) {
  const prefix = "  ".repeat(indent);
  const kind = formatSymbolKind(symbol.kind);
  const lines = [`${prefix}${kind}: ${symbol.name}`];
  if (symbol.children) {
    for (const child of symbol.children) {
      lines.push(formatDocumentSymbol(child, indent + 1));
    }
  }
  return lines.join(`
`);
}
function formatSymbolInfo(symbol) {
  const kind = formatSymbolKind(symbol.kind);
  const location = formatLocation(symbol.location);
  const container = symbol.containerName ? ` (${symbol.containerName})` : "";
  return `${kind}: ${symbol.name}${container}
  at ${location}`;
}
function formatDiagnostic(diag) {
  const severity = formatSeverity(diag.severity);
  const { line, character } = diag.range.start;
  const location = `line ${line + 1}, character ${character + 1}`;
  const source = diag.source ? `[${diag.source}] ` : "";
  const code = diag.code ? ` ${diag.code}` : "";
  return `${severity} at ${location}: ${source}${diag.message}${code}`;
}
function filterDiagnosticsBySeverity(diagnostics, severityFilter) {
  if (!severityFilter || severityFilter === "all")
    return diagnostics;
  const severityMap = {
    error: 1,
    warning: 2,
    information: 3,
    hint: 4
  };
  const targetSeverity = severityMap[severityFilter];
  return diagnostics.filter((d) => d.severity === targetSeverity);
}
function formatPrepareRenameResult(result) {
  if (!result)
    return "Cannot rename at this location";
  if ("defaultBehavior" in result) {
    return "Rename available (default behavior)";
  }
  const range = "range" in result ? result.range : result;
  const placeholder = "placeholder" in result ? result.placeholder : "symbol";
  const { line, character } = range.start;
  return `Rename: ${placeholder} at line ${line + 1}, character ${character + 1}`;
}
function formatTextEdit(edit) {
  const { line, character } = edit.range.start;
  return `Line ${line + 1}, character ${character + 1}: "${edit.newText}"`;
}
function formatWorkspaceEdit(edit) {
  if (!edit)
    return "No workspace edit";
  const parts = [];
  if (edit.changes) {
    for (const [uri, textEdits] of Object.entries(edit.changes)) {
      parts.push(`${uriToPath(uri)}: ${textEdits.length} change(s)`);
      for (const te of textEdits) {
        parts.push(`  ${formatTextEdit(te)}`);
      }
    }
  }
  if (edit.documentChanges) {
    for (const change of edit.documentChanges) {
      if ("kind" in change) {
        if (change.kind === "rename") {
          parts.push(`rename: ${uriToPath(change.oldUri)} -> ${uriToPath(change.newUri)}`);
        } else {
          const uri = change.kind === "create" ? change.uri : change.uri;
          parts.push(`${change.kind}: ${uriToPath(uri)}`);
        }
      } else {
        parts.push(`${uriToPath(change.textDocument.uri)}: ${change.edits.length} edit(s)`);
      }
    }
  }
  return parts.join(`
`) || "Empty workspace edit";
}
function formatCodeAction(action) {
  const parts = [action.title];
  if (action.kind)
    parts.push(`[${action.kind}]`);
  if (action.isPreferred)
    parts.push("(preferred)");
  if (action.disabled)
    parts.push(`(disabled: ${action.disabled.reason})`);
  return parts.join(" ");
}
function formatCodeActions(actions) {
  if (!actions || actions.length === 0)
    return "No code actions available";
  return actions.map((a, i) => {
    if ("kind" in a || "diagnostics" in a) {
      return `${i + 1}. ${formatCodeAction(a)}`;
    }
    return `${i + 1}. ${a.title} (command: ${a.command})`;
  }).join(`
`);
}
async function applyWorkspaceEdit(edit) {
  if (!edit) {
    return {
      success: true,
      filesModified: [],
      totalEdits: 0,
      errors: []
    };
  }
  const result = {
    success: true,
    filesModified: [],
    totalEdits: 0,
    errors: []
  };
  if (edit.changes) {
    for (const [uri, textEdits] of Object.entries(edit.changes)) {
      try {
        const path9 = uriToPath(uri);
        const content = await Bun.file(path9).text();
        const lines = content.split(`
`);
        for (const te of textEdits) {
          const { line } = te.range.start;
          if (lines[line] !== undefined) {
            lines[line] = te.newText;
            result.totalEdits++;
          }
        }
        Bun.write(path9, lines.join(`
`));
        result.filesModified.push(path9);
      } catch (error) {
        result.errors.push(`Failed to apply edit to ${uri}: ${error}`);
        result.success = false;
      }
    }
  }
  return result;
}
function formatApplyResult(result) {
  if (result.success) {
    return `Successfully applied ${result.totalEdits} edit(s) to ${result.filesModified.length} file(s)`;
  } else {
    return `Partial success: ${result.totalEdits} edit(s) applied to ${result.filesModified.length} file(s)
Errors:
${result.errors.join(`
`)}`;
  }
}
var init_utils = __esm(() => {
  init_config();
  init_manager();
});

// src/tools/compression.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
var __dirname = "/home/leviath/kraken-code/src/tools";
var execFileAsync = promisify(execFile);
async function runCompression(prompt) {
  const compressionDir = path.resolve(__dirname, "..", "compression");
  try {
    const { stdout, stderr } = await execFileAsync("python3", [path.join(compressionDir, "cli.py"), "compress", prompt], {
      cwd: compressionDir,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    const result = JSON.parse(stdout);
    if (result.error) {
      throw new Error(result.error);
    }
    return {
      success: true,
      compressed: result.decompressed_text,
      metadata: {
        originalTokens: result.metadata.original_tokens,
        decompressedTokens: result.metadata.decompressed_tokens,
        tokenChangePercent: result.metadata.token_change_percent
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
var opencodeXCompress = tool({
  description: "Compress prompts using LLM-TLDR algorithm (5× compression, <2% quality loss). " + "Uses dictionary-based compression with CRC64 caching for repeated prompts. " + "Optimized for cost reduction on API calls while maintaining output quality.",
  args: {
    text: z.string().describe("Text to compress"),
    level: z.enum(["cache_hit", "partial", "full"]).default("partial").describe("Compression level: cache_hit (return cached if available), partial (light compression), full (maximum compression)")
  },
  async execute(args) {
    const { text, level } = args;
    if (!text || text.trim().length === 0) {
      return JSON.stringify({
        success: false,
        error: "Empty text provided"
      });
    }
    if (level === "cache_hit") {
      return JSON.stringify({
        success: true,
        note: "Cache lookup not implemented in TS wrapper, using full compression",
        compressed: text
      });
    }
    const result = await runCompression(text);
    return JSON.stringify(result, null, 2);
  }
});

// src/storage/index.ts
import * as fs2 from "fs";
import * as path4 from "path";
import * as os4 from "os";

// src/storage/kraken-todo.ts
import * as path2 from "path";
import * as os from "os";
var KRAKEN_DIR = path2.join(os.homedir(), ".kraken");
var TODO_DIR = path2.join(KRAKEN_DIR, "todos");
// src/storage/kraken-transcript.ts
import * as path3 from "path";
import * as os2 from "os";
var KRAKEN_DIR2 = path3.join(os2.homedir(), ".kraken");
var TRANSCRIPT_DIR = path3.join(KRAKEN_DIR2, "transcripts");
// src/storage/transcript-manager.ts
import { promises as fs } from "fs";
import { join as join3, dirname } from "path";
import * as os3 from "os";
var TRANSCRIPT_ENCODING = "utf-8";
function getTranscriptPath(sessionId, customPath) {
  if (customPath) {
    return join3(customPath, `${sessionId}.jsonl`);
  }
  const basePath = join3(os3.homedir(), ".claude", "transcripts");
  return join3(basePath, `${sessionId}.jsonl`);
}
async function appendTranscriptEntry(sessionId, entry, customPath) {
  const transcriptPath = getTranscriptPath(sessionId, customPath);
  try {
    await fs.mkdir(dirname(transcriptPath), { recursive: true });
    const entryWithTimestamp = {
      ...entry,
      timestamp: entry.timestamp || Date.now()
    };
    const jsonlLine = JSON.stringify(entryWithTimestamp) + `
`;
    await fs.appendFile(transcriptPath, jsonlLine, TRANSCRIPT_ENCODING);
  } catch (error) {
    console.error(`[transcript-manager] Error appending transcript entry:`, error);
  }
}
async function recordToolUse(sessionId, toolName, toolInput, toolOutput, customPath) {
  const entry = {
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    toolName,
    toolInput,
    toolOutput
  };
  await appendTranscriptEntry(sessionId, entry, customPath);
}

// src/storage/index.ts
var STORAGE_DIR = path4.join(os4.homedir(), ".opencode", "kraken-code");
var SESSIONS_DIR = path4.join(STORAGE_DIR, "sessions");
function getStateFilePath(sessionID) {
  return path4.join(SESSIONS_DIR, `${sessionID}.json`);
}
function ensureDirectories() {
  if (!fs2.existsSync(STORAGE_DIR)) {
    fs2.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs2.existsSync(SESSIONS_DIR)) {
    fs2.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}
function readState(sessionID) {
  try {
    ensureDirectories();
    const filePath = getStateFilePath(sessionID);
    if (!fs2.existsSync(filePath)) {
      return null;
    }
    const data = fs2.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`[storage] Error reading state for session ${sessionID}:`, error);
    return null;
  }
}
function writeState(sessionID, state) {
  try {
    ensureDirectories();
    const filePath = getStateFilePath(sessionID);
    fs2.writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`[storage] Error writing state for session ${sessionID}:`, error);
  }
}

// src/hooks/ralph-loop/index.ts
var RALPH_SYSTEM_PROMPT = `You are Ralph, a specialized iteration agent focused on achieving completion promises.

Your methodology:
1. Analyze current state against promise criteria
2. Identify gaps between current state and promised outcome
3. Execute targeted improvements to close those gaps
4. Re-evaluate against promise
5. Continue iterating until satisfaction

Remember: You complement Kraken's orchestration. Kraken plans the overall approach; you ensure that specific promise is satisfied.
Don't re-plan—just iterate toward the specific promise criteria.
`;
var DEFAULT_MAX_ITERATIONS = 24;
function createRalphLoopHook(_input, options) {
  const config = options?.config ?? {
    enabled: true
  };
  const sessions = new Map;
  function extractPromise(text) {
    const promiseMatch = text.match(/<promise>\s*([\s\S]*?)\s*<\/promise>/i);
    if (!promiseMatch)
      return null;
    const promise = promiseMatch[1].trim();
    const taskMatch = text.match(/<user-task>\s*([\s\S]*?)\s*<\/user-task>/i);
    const task = taskMatch ? taskMatch[1].trim() : text.split("<promise>")[0].trim();
    return { promise, task };
  }
  function createSession(sessionID, promise, task, maxIterations = DEFAULT_MAX_ITERATIONS) {
    const session = {
      sessionID,
      promise,
      task,
      maxIterations,
      currentIteration: 0,
      status: "active",
      transcript: [],
      startTime: Date.now()
    };
    sessions.set(sessionID, session);
    return session;
  }
  function formatIterations(session) {
    if (session.currentIteration === 0) {
      return "No previous iterations.";
    }
    const iterations = session.transcript.slice(-session.currentIteration * 2).join(`
---
`);
    return iterations || `Iteration ${session.currentIteration} completed.`;
  }
  function generateIterationPrompt(session) {
    return RALPH_SYSTEM_PROMPT.replace("{prompt}", session.task).replace("{promise}", session.promise).replace("{iterations}", formatIterations(session));
  }
  function getTextFromParts(parts) {
    return parts.filter((p) => p.type === "text").map((p) => ("text" in p) ? p.text : "").join(`
`).trim();
  }
  return {
    "chat.message": async (input, output) => {
      if (!config.enabled)
        return;
      const { sessionID } = input;
      const promptText = getTextFromParts(output.parts);
      const promiseMatch = extractPromise(promptText);
      if (!promiseMatch)
        return;
      const { promise, task } = promiseMatch;
      const existingSession = readState(sessionID);
      if (existingSession && existingSession.status === "active") {
        existingSession.currentIteration++;
        existingSession.transcript.push(`Iteration ${existingSession.currentIteration}:
${promptText}
`);
        if (existingSession.currentIteration >= existingSession.maxIterations) {
          existingSession.status = "maxed_out";
          console.log(`[ralph-loop] Session ${sessionID} reached max iterations (${existingSession.maxIterations})`);
        }
        writeState(sessionID, existingSession);
        console.log(`[ralph-loop] Continuing iteration ${existingSession.currentIteration}/${existingSession.maxIterations} for session ${sessionID}`);
        console.log(`[ralph-loop] Next prompt: ${generateIterationPrompt(existingSession).substring(0, 100)}...`);
      } else {
        const maxIterations = config.maxIterations ?? DEFAULT_MAX_ITERATIONS;
        const newSession = createSession(sessionID, promise, task, maxIterations);
        console.log(`[ralph-loop] Starting new session ${sessionID} with promise: "${promise.substring(0, 50)}..."`);
        writeState(sessionID, newSession);
        sessions.set(sessionID, newSession);
      }
    }
  };
}

// src/hooks/auto-update-checker/index.ts
import { exec } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync as existsSync2 } from "node:fs";
import { join as join5 } from "node:path";
import { homedir as homedir5 } from "node:os";
var PACKAGE_NAME = "kraken-code";
var DEFAULT_CACHE_TTL = 86400000;
var DEFAULT_CACHE_DIR = join5(homedir5(), ".config", "kraken-code", "cache");
var CACHE_FILE = "update-check.json";
var currentVersion = "";
var updateCache = null;
function getCurrentVersion() {
  if (!currentVersion) {
    try {
      const packageJson = (()=>{throw new Error("Cannot require module "+"../package.json");})();
      currentVersion = packageJson.version || "0.0.0";
    } catch (e) {
      currentVersion = "0.0.0";
    }
  }
  return currentVersion;
}
function getCachePath(config) {
  const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
  return join5(cacheDir, CACHE_FILE);
}
async function loadCache(config) {
  try {
    const cachePath = getCachePath(config);
    if (!existsSync2(cachePath)) {
      return null;
    }
    const content = await readFile(cachePath, "utf-8");
    const cache = JSON.parse(content);
    return cache;
  } catch (e) {
    return null;
  }
}
async function saveCache(config, cache) {
  try {
    const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
    if (!existsSync2(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }
    const cachePath = getCachePath(config);
    await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[auto-update-checker] Failed to save cache:", e);
  }
}
async function checkNpmRegistry() {
  return new Promise((resolve) => {
    exec(`npm view ${PACKAGE_NAME} version`, (error, stdout, stderr) => {
      if (error) {
        console.error("[auto-update-checker] Failed to check npm registry:", error);
        resolve(null);
        return;
      }
      if (stderr) {
        console.error("[auto-update-checker] npm error:", stderr);
        resolve(null);
        return;
      }
      const version = stdout.trim();
      if (version) {
        resolve(version);
      } else {
        resolve(null);
      }
    });
  });
}
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  for (let i = 0;i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2)
      return 1;
    if (p1 < p2)
      return -1;
  }
  return 0;
}
async function checkForUpdates(config) {
  const currentVersionValue = getCurrentVersion();
  const cacheTTL = config.cacheTTL ?? DEFAULT_CACHE_TTL;
  const now = Date.now();
  const cache = await loadCache(config);
  updateCache = cache;
  if (cache && now - cache.lastChecked < cacheTTL) {
    console.log(`[auto-update-checker] Using cached update check from ${new Date(cache.lastChecked).toISOString()}`);
    return {
      updateAvailable: cache.updateAvailable,
      latestVersion: cache.latestVersion
    };
  }
  console.log("[auto-update-checker] Checking npm registry for updates...");
  const latestVersion = await checkNpmRegistry();
  if (!latestVersion) {
    console.log("[auto-update-checker] Could not determine latest version");
    return {
      updateAvailable: false,
      latestVersion: null
    };
  }
  const updateAvailable = compareVersions(latestVersion, currentVersionValue) > 0;
  const newCache = {
    currentVersion: currentVersionValue,
    latestVersion,
    lastChecked: now,
    updateAvailable
  };
  await saveCache(config, newCache);
  updateCache = newCache;
  return {
    updateAvailable,
    latestVersion
  };
}
function createAutoUpdateChecker(_input, options) {
  const config = options?.config ?? {
    enabled: true,
    checkOnLoad: true,
    cacheDir: DEFAULT_CACHE_DIR,
    cacheTTL: DEFAULT_CACHE_TTL,
    notify: true,
    checkInterval: DEFAULT_CACHE_TTL
  };
  return {
    config: async (configInput) => {
      if (!config.enabled)
        return;
      if (config.checkOnLoad) {
        console.log("[auto-update-checker] Checking for updates on load...");
        const { updateAvailable, latestVersion } = await checkForUpdates(config);
        if (updateAvailable && config.notify) {
          console.log("");
          console.log("=".repeat(60));
          console.log("UPDATE AVAILABLE");
          console.log("=".repeat(60));
          console.log(`Current version: ${getCurrentVersion()}`);
          console.log(`Latest version:  ${latestVersion}`);
          console.log("");
          console.log("To update, run:");
          console.log("  npm update kraken-code");
          console.log("  # or");
          console.log("  bun update kraken-code");
          console.log("=".repeat(60));
          console.log("");
        } else if (!updateAvailable) {
          console.log(`[auto-update-checker] You are using the latest version: ${getCurrentVersion()}`);
        }
      }
    },
    event: async (input) => {
      if (!config.enabled)
        return;
      if (input.event?.type === "installation.updated") {
        console.log("[auto-update-checker] Installation was updated");
        const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
        const cachePath = join5(cacheDir, CACHE_FILE);
        try {
          const { unlink } = await import("node:fs/promises");
          await unlink(cachePath);
          console.log("[auto-update-checker] Cleared update cache");
        } catch (e) {}
      }
      if (input.event?.type === "installation.update-available") {
        console.log("[auto-update-checker] New update available");
        const { latestVersion } = await checkForUpdates(config);
        if (latestVersion) {
          console.log(`[auto-update-checker] Latest version: ${latestVersion}`);
        }
      }
    }
  };
}

// src/tools/ast-grep/index.ts
import { tool as tool2 } from "@opencode-ai/plugin";
import { z as z2 } from "zod";
import { execFile as execFile2 } from "node:child_process";
import { promisify as promisify2 } from "node:util";
var execFileAsync2 = promisify2(execFile2);
async function runAstGrep(pattern, language, options) {
  const args = ["--json", "--pattern", pattern, "--lang", language];
  if (options?.replace) {
    args.push("--replace", options.replace);
  }
  if (options?.path) {
    args.push("--path", options.path);
  }
  if (options?.glob) {
    args.push("--glob", options.glob);
  }
  try {
    const { stdout, stderr } = await execFileAsync2("ast-grep", args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });
    if (stderr && !stdout) {
      return { success: false, error: stderr };
    }
    try {
      const result = JSON.parse(stdout);
      return {
        success: true,
        matches: result.matches || [],
        count: result.count || 0
      };
    } catch {
      return { success: true, matches: [], count: 0 };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return {
        success: false,
        error: "ast-grep CLI not installed. Install with: npm install -g @ast-grep/cli"
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
var ast_grep_search = tool2({
  description: "Search code using AST patterns. More powerful than regex as it understands code structure. " + "Example patterns: 'function $_$ { $body$ }' to find all functions, '$A = $B' to find assignments.",
  args: {
    pattern: z2.string().describe("AST pattern to search for (use $VAR for variables)"),
    language: z2.string().describe("Programming language (typescript, javascript, python, rust, go, java, cpp, etc.)"),
    path: z2.string().optional().describe("Directory or file to search in (default: current directory)"),
    glob: z2.string().optional().describe("File glob pattern (e.g., '*.ts', 'src/**/*.ts')")
  },
  async execute(args) {
    const { pattern, language, path: searchPath, glob } = args;
    const result = await runAstGrep(pattern, language, { path: searchPath, glob });
    return JSON.stringify(result, null, 2);
  }
});
var ast_grep_replace = tool2({
  description: "Search and replace code using AST patterns. Safer than regex replacement as it respects code structure. " + "Use the same variable names in replacement to preserve matched content.",
  args: {
    pattern: z2.string().describe("AST pattern to search for"),
    replacement: z2.string().describe("AST pattern to replace with (use $VAR to reference matched variables)"),
    language: z2.string().describe("Programming language"),
    path: z2.string().optional().describe("Directory or file to search in (default: current directory)"),
    glob: z2.string().optional().describe("File glob pattern")
  },
  async execute(args) {
    const { pattern, replacement, language, path: searchPath, glob } = args;
    const result = await runAstGrep(pattern, language, { replace: replacement, path: searchPath, glob });
    return JSON.stringify(result, null, 2);
  }
});

// src/tools/session/list.ts
import * as fs3 from "fs";
import * as path5 from "path";
import * as os5 from "os";
import { tool as tool3 } from "@opencode-ai/plugin";
import { z as z3 } from "zod";
var SESSION_STORAGE_DIR = path5.join(os5.homedir(), ".opencode", "sessions");
function getSessionStorageDir() {
  if (!fs3.existsSync(SESSION_STORAGE_DIR)) {
    fs3.mkdirSync(SESSION_STORAGE_DIR, { recursive: true });
  }
  return SESSION_STORAGE_DIR;
}
function getAllSessionFiles() {
  const sessionsDir = getSessionStorageDir();
  if (!fs3.existsSync(sessionsDir)) {
    return [];
  }
  const entries = [];
  try {
    const files = fs3.readdirSync(sessionsDir);
    for (const file of files) {
      if (!file.endsWith(".json"))
        continue;
      const sessionID = file.slice(0, -5);
      const filePath = path5.join(sessionsDir, file);
      try {
        const content = fs3.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        const metadata = {
          sessionID,
          created: data.created || data.createdAt || new Date(0).toISOString(),
          lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
          messageCount: data.messageCount || (data.messages?.length || 0),
          agent: data.agent,
          duration: data.duration,
          fileCount: data.fileCount,
          editCount: data.editCount,
          toolUsage: data.toolUsage || {}
        };
        entries.push({
          sessionID,
          path: filePath,
          metadata
        });
      } catch (error) {
        console.error(`[session-list] Error reading session ${sessionID}:`, error);
      }
    }
  } catch (error) {
    console.error("[session-list] Error reading sessions directory:", error);
  }
  return entries;
}
function filterSessionsByDate(sessions, startDate, endDate) {
  if (!startDate && !endDate) {
    return sessions;
  }
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Infinity;
  return sessions.filter((entry) => {
    const lastActive = new Date(entry.metadata.lastActive).getTime();
    return lastActive >= start && lastActive <= end;
  });
}
function sortSessionsByDate(sessions, order = "desc") {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.metadata.lastActive).getTime();
    const dateB = new Date(b.metadata.lastActive).getTime();
    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}
var session_list = tool3({
  description: "List all OpenCode sessions with filtering and pagination options.",
  args: {
    limit: z3.number().int().min(1).max(1000).optional(),
    startDate: z3.string().optional(),
    endDate: z3.string().optional(),
    order: z3.enum(["asc", "desc"]).optional(),
    includeMetadata: z3.boolean().default(false)
  },
  async execute(args) {
    try {
      const { limit, startDate, endDate, order, includeMetadata } = args;
      let sessions = getAllSessionFiles();
      if (startDate || endDate) {
        sessions = filterSessionsByDate(sessions, startDate, endDate);
      }
      sessions = sortSessionsByDate(sessions, order);
      if (limit) {
        sessions = sessions.slice(0, limit);
      }
      const results = sessions.map((entry) => {
        if (includeMetadata) {
          return {
            sessionID: entry.metadata.sessionID,
            created: entry.metadata.created,
            lastActive: entry.metadata.lastActive,
            messageCount: entry.metadata.messageCount,
            agent: entry.metadata.agent,
            duration: entry.metadata.duration,
            fileCount: entry.metadata.fileCount,
            editCount: entry.metadata.editCount,
            toolUsage: entry.metadata.toolUsage
          };
        } else {
          return {
            sessionID: entry.metadata.sessionID,
            created: entry.metadata.created,
            lastActive: entry.metadata.lastActive,
            messageCount: entry.metadata.messageCount,
            agent: entry.metadata.agent
          };
        }
      });
      return JSON.stringify({
        success: true,
        count: results.length,
        sessions: results
      });
    } catch (error) {
      console.error("[session-list] Error:", error);
      return JSON.stringify({
        success: false,
        error: String(error),
        sessions: []
      });
    }
  }
});
// src/tools/session/read.ts
import * as fs4 from "fs";
import * as path6 from "path";
import { tool as tool4 } from "@opencode-ai/plugin";
import { z as z4 } from "zod";
function getSessionFilePath(sessionID) {
  return path6.join(getSessionStorageDir(), `${sessionID}.json`);
}
var session_read = tool4({
  description: "Read messages from a specific session with pagination and filtering options.",
  args: {
    sessionID: z4.string().describe("Session ID to read from"),
    limit: z4.number().int().min(1).max(1000).optional(),
    offset: z4.number().int().min(0).default(0).describe("Offset for pagination"),
    includeMetadata: z4.boolean().default(false).describe("Include full session metadata")
  },
  async execute(args) {
    try {
      const { sessionID, limit, offset, includeMetadata } = args;
      const filePath = getSessionFilePath(sessionID);
      if (!fs4.existsSync(filePath)) {
        return JSON.stringify({
          success: false,
          error: `Session ${sessionID} not found`,
          sessionID
        });
      }
      const content = fs4.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      const messages = data.messages || [];
      let paginatedMessages = messages;
      if (offset > 0 || limit) {
        paginatedMessages = messages.slice(offset, limit ? offset + limit : undefined);
      }
      const result = {
        sessionID,
        messages: paginatedMessages,
        partial: messages.length > paginatedMessages.length,
        metadata: {
          sessionID,
          created: data.created || data.createdAt || new Date(0).toISOString(),
          lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
          messageCount: messages.length,
          agent: data.agent,
          duration: data.duration,
          fileCount: data.fileCount,
          editCount: data.editCount,
          toolUsage: data.toolUsage || {}
        }
      };
      const response = {
        success: true,
        sessionID,
        totalMessages: messages.length,
        returnedMessages: paginatedMessages.length,
        offset,
        limit: limit || messages.length,
        partial: result.partial,
        messages: paginatedMessages
      };
      if (includeMetadata) {
        response.metadata = result.metadata;
      }
      return JSON.stringify(response);
    } catch (error) {
      console.error("[session-read] Error:", error);
      return JSON.stringify({
        success: false,
        error: String(error),
        sessionID: args.sessionID
      });
    }
  }
});
// src/tools/session/search.ts
import * as fs5 from "fs";
import * as path7 from "path";
import * as os6 from "os";
import { tool as tool5 } from "@opencode-ai/plugin";
import { z as z5 } from "zod";
var SESSION_STORAGE_DIR2 = path7.join(os6.homedir(), ".opencode", "sessions");
function indexSession(sessionFilePath) {
  try {
    const content = fs5.readFileSync(sessionFilePath, "utf-8");
    const data = JSON.parse(content);
    const index = new Map;
    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach((msg, idx) => {
        const role = msg.role || "unknown";
        const content2 = msg.content || "";
        if (content2 && typeof content2 === "string" && content2.length > 0) {
          index.set(content2, {
            type: role === "user" ? "user_message" : "assistant_message",
            index: idx,
            content: content2,
            context: content2
          });
        }
      });
    }
    return index;
  } catch (error) {
    console.error(`[session-search] Error indexing session ${sessionFilePath}:`, error);
    return null;
  }
}
function calculateRelevanceScore(query, match) {
  const queryLower = query.toLowerCase();
  const contentLower = match.content.toLowerCase();
  let score = 0;
  const exactMatch = contentLower === queryLower;
  if (exactMatch) {
    score += 100;
  }
  const containsMatch = contentLower.includes(queryLower);
  if (containsMatch && !exactMatch) {
    score += 50;
  }
  const words = queryLower.split(/\s+/);
  let wordMatchCount = 0;
  for (const word of words) {
    if (word.length > 2 && contentLower.includes(word)) {
      wordMatchCount++;
    }
  }
  score += wordMatchCount * 10;
  if (match.type === "user_message") {
    score += 20;
  }
  return Math.min(score, 100);
}
function getAllSessionFiles2() {
  const sessionsDir = getSessionStorageDir();
  if (!fs5.existsSync(sessionsDir)) {
    return [];
  }
  const entries = [];
  try {
    const files = fs5.readdirSync(sessionsDir);
    for (const file of files) {
      if (!file.endsWith(".json"))
        continue;
      const sessionID = file.slice(0, -5);
      const filePath = path7.join(sessionsDir, file);
      try {
        const content = fs5.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        const metadata = {
          sessionID,
          created: data.created || data.createdAt || new Date(0).toISOString(),
          lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
          messageCount: data.messageCount || (data.messages?.length || 0),
          agent: data.agent,
          duration: data.duration,
          fileCount: data.fileCount,
          editCount: data.editCount,
          toolUsage: data.toolUsage || {}
        };
        entries.push({
          sessionID,
          filePath,
          metadata
        });
      } catch (error) {
        console.error(`[session-search] Error reading session ${sessionID}:`, error);
      }
    }
  } catch (error) {
    console.error("[session-search] Error reading sessions directory:", error);
  }
  return entries;
}
var session_search = tool5({
  description: "Full-text search across all OpenCode sessions with ranked results.",
  args: {
    q: z5.string().describe("Search query text"),
    limit: z5.number().int().min(1).max(100).default(10).describe("Maximum number of results to return"),
    offset: z5.number().int().min(0).default(0).describe("Offset for pagination"),
    sessionID: z5.string().optional().describe("Search within a specific session only")
  },
  async execute(args) {
    try {
      const { q, limit, offset, sessionID } = args;
      if (!q || q.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: "Query cannot be empty",
          results: []
        });
      }
      let sessionFiles = [];
      if (sessionID) {
        const sessionDir = getSessionStorageDir();
        const filePath = path7.join(sessionDir, `${sessionID}.json`);
        sessionFiles = [
          {
            sessionID,
            filePath,
            metadata: {
              sessionID,
              created: "",
              lastActive: "",
              messageCount: 0
            }
          }
        ];
      } else {
        sessionFiles = getAllSessionFiles2();
      }
      const allResults = [];
      for (const sessionFile of sessionFiles) {
        const index = indexSession(sessionFile.filePath);
        if (!index)
          continue;
        const matches = [];
        for (const [content, location] of index.entries()) {
          const score = calculateRelevanceScore(q, location);
          if (score > 10) {
            matches.push(location);
          }
        }
        if (matches.length > 0) {
          const avgScore = matches.reduce((sum, m) => sum + calculateRelevanceScore(q, m), 0) / matches.length;
          allResults.push({
            sessionID: sessionFile.sessionID,
            filePath: sessionFile.filePath,
            metadata: sessionFile.metadata,
            score: Math.round(avgScore),
            matches: matches.slice(0, 5)
          });
        }
      }
      allResults.sort((a, b) => b.score - a.score);
      const paginatedResults = allResults.slice(offset, offset + limit);
      return JSON.stringify({
        success: true,
        query: q,
        total: allResults.length,
        offset,
        limit,
        results: paginatedResults.map((result) => ({
          sessionID: result.sessionID,
          score: result.score,
          matchCount: result.matches.length,
          lastActive: result.metadata.lastActive,
          messageCount: result.metadata.messageCount,
          agent: result.metadata.agent,
          matches: result.matches.map((m) => ({
            type: m.type,
            index: m.index,
            content: m.content.slice(0, 200) + (m.content.length > 200 ? "..." : "")
          }))
        }))
      });
    } catch (error) {
      console.error("[session-search] Error:", error);
      return JSON.stringify({
        success: false,
        error: String(error),
        results: []
      });
    }
  }
});
// src/tools/session/info.ts
import * as fs6 from "fs";
import * as path8 from "path";
import { tool as tool6 } from "@opencode-ai/plugin";
import { z as z6 } from "zod";
var SESSION_STORAGE_DIR3 = path8.join(process.env.HOME || "", ".opencode", "sessions");
function getSessionFilePath2(sessionID) {
  return path8.join(getSessionStorageDir(), `${sessionID}.json`);
}
function parseSessionFile(sessionID) {
  const filePath = getSessionFilePath2(sessionID);
  if (!fs6.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs6.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    const metadata = {
      sessionID,
      created: data.created || data.createdAt || new Date(0).toISOString(),
      lastActive: data.lastActive || data.updatedAt || new Date().toISOString(),
      messageCount: data.messageCount || (data.messages?.length || 0),
      agent: data.agent,
      duration: data.duration,
      fileCount: data.fileCount,
      editCount: data.editCount,
      toolUsage: data.toolUsage || {}
    };
    return metadata;
  } catch (error) {
    console.error(`[session-info] Error reading session ${sessionID}:`, error);
    return null;
  }
}
function calculateSessionStats(metadata) {
  const stats = {
    totalMessages: metadata.messageCount,
    totalToolsUsed: Object.values(metadata.toolUsage || {}).reduce((sum, count) => sum + count, 0),
    mostUsedTool: "",
    mostUsedToolCount: 0,
    averageMessagesPerMinute: 0
  };
  if (metadata.duration) {
    stats.averageMessagesPerMinute = metadata.messageCount / (metadata.duration / 60000);
  }
  for (const [tool7, count] of Object.entries(metadata.toolUsage || {})) {
    if (count > stats.mostUsedToolCount) {
      stats.mostUsedTool = tool7;
      stats.mostUsedToolCount = count;
    }
  }
  return stats;
}
var session_info = tool6({
  description: "Get detailed metadata and statistics about a specific session.",
  args: {
    sessionID: z6.string().describe("Session ID to query")
  },
  async execute(args) {
    try {
      const { sessionID } = args;
      const metadata = parseSessionFile(sessionID);
      if (!metadata) {
        return JSON.stringify({
          success: false,
          error: `Session ${sessionID} not found`,
          sessionID
        });
      }
      const stats = calculateSessionStats(metadata);
      return JSON.stringify({
        success: true,
        sessionID: metadata.sessionID,
        created: metadata.created,
        lastActive: metadata.lastActive,
        messageCount: metadata.messageCount,
        agent: metadata.agent,
        duration: metadata.duration,
        fileCount: metadata.fileCount,
        editCount: metadata.editCount,
        toolUsage: metadata.toolUsage,
        stats: {
          totalMessages: stats.totalMessages,
          totalToolsUsed: stats.totalToolsUsed,
          mostUsedTool: stats.mostUsedTool,
          mostUsedToolCount: stats.mostUsedToolCount,
          averageMessagesPerMinute: stats.averageMessagesPerMinute.toFixed(2)
        }
      });
    } catch (error) {
      console.error("[session-info] Error:", error);
      return JSON.stringify({
        success: false,
        error: String(error),
        sessionID: args.sessionID
      });
    }
  }
});
// src/tools/grep.ts
import { tool as tool7 } from "@opencode-ai/plugin";
import { z as z7 } from "zod";
import { execFile as execFile3 } from "node:child_process";
import { promisify as promisify3 } from "node:util";
var execFileAsync3 = promisify3(execFile3);
async function runGrep(pattern, options) {
  const args = ["--line-number", "--color=never"];
  if (options?.context) {
    args.push("-C", String(options.context));
  }
  if (options?.invert) {
    args.push("-v");
  }
  if (options?.type) {
    args.push(`--type=${options.type}`);
  }
  args.push(pattern);
  if (options?.path) {
    args.push(options.path);
  }
  try {
    const { stdout, stderr } = await execFileAsync3("rg", args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });
    const matches = [];
    const lines = stdout.split(`
`);
    for (const line of lines) {
      if (!line.trim())
        continue;
      const match = line.match(/^([^:]+):(\d+):(\d+):(.+)$/);
      if (match) {
        matches.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          lineContent: match[4]
        });
      }
    }
    return { success: true, matches, count: matches.length };
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return {
        success: false,
        error: "ripgrep (rg) not installed. Install with: apt install ripgrep or brew install ripgrep"
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
var grep = tool7({
  description: "Search for text patterns in files using ripgrep. Supports regex and file type filtering. " + "Example: grep({pattern: 'function \\w+', type: 'ts', context: 2})",
  args: {
    pattern: z7.string().describe("Regex pattern to search for"),
    path: z7.string().optional().describe("Directory or file to search in (default: current directory)"),
    type: z7.string().optional().describe("Filter by file type (ts, js, py, rust, go, java, etc.)"),
    context: z7.number().optional().describe("Number of context lines around each match (default: 0)"),
    invert: z7.boolean().optional().describe("Show lines that do NOT match the pattern")
  },
  async execute(args) {
    const { pattern, path: searchPath, type, context, invert } = args;
    const result = await runGrep(pattern, { path: searchPath, type, context, invert });
    if (!result.success) {
      return JSON.stringify(result, null, 2);
    }
    return JSON.stringify({
      success: true,
      matches: result.matches?.slice(0, 100),
      count: result.count,
      message: result.count && result.count > 100 ? `Showing 100 of ${result.count} matches` : undefined
    }, null, 2);
  }
});

// src/tools/ralph-loop.ts
import { tool as tool8 } from "@opencode-ai/plugin";
import { z as z8 } from "zod";
var ralphLoop = tool8({
  description: "Control Ralph-Loop iterations for achieving completion promises. " + "Ralph complements Kraken's PDSA cycles by iteratively refining until <promise> is satisfied. " + "Automatically triggered when chat contains <promise>...</promise> pattern, or use this tool for manual control.",
  args: {
    command: z8.enum(["status", "cancel", "continue", "info"]).describe("Ralph-Loop command"),
    sessionID: z8.string().optional().describe("Session ID (required for status, cancel)"),
    maxIterations: z8.number().min(1).max(100).optional().describe("Max iterations (default: 24)")
  },
  async execute(args) {
    const { command, sessionID, maxIterations } = args;
    switch (command) {
      case "status":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for status command"
          });
        }
        return JSON.stringify({
          success: true,
          session: {
            sessionID,
            status: "active",
            promise: "Use /ralph-loop in chat to start a new session",
            task: "N/A",
            currentIteration: 0,
            maxIterations: maxIterations ?? 24,
            elapsedMs: 0
          }
        });
      case "cancel":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for cancel command"
          });
        }
        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} cancelled`
        });
      case "continue":
        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "sessionID required for continue command"
          });
        }
        return JSON.stringify({
          success: true,
          message: `Session ${sessionID} continuing to next iteration`
        });
      case "info":
        return JSON.stringify({
          success: true,
          info: {
            description: "Ralph-Loop: Self-referential iteration agent that continues until completion promise is satisfied",
            triggers: [
              "Chat message contains <promise>...</promise> pattern",
              "User types /ralph-loop [task] <promise>...</promise>"
            ],
            defaults: {
              maxIterations: 24,
              timeout: "None (continues until promise met or max iterations)"
            },
            complement: "Ralph complements Kraken's PDSA cycles. Kraken orchestrates; Ralph iterates."
          }
        });
      default:
        return JSON.stringify({
          success: false,
          error: `Unknown command: ${command}`
        });
    }
  }
});

// src/tools/agent-call.ts
import { tool as tool9 } from "@opencode-ai/plugin";
import { z as z9 } from "zod";
var call_kraken_agent = tool9({
  description: "Call a specialized Kraken Code agent for a specific task. " + "Use this to delegate to agents like Atlas (navigation), Nautilus (semantic search), " + "Abyssal (external research), Coral (UI/UX), Siren (documentation), Scylla (code review), " + "or Pearl (testing).",
  args: {
    agent: z9.enum(["Atlas", "Nautilus", "Abyssal", "Coral", "Siren", "Scylla", "Pearl", "Leviathan", "Maelstrom", "Poseidon"]).describe("Agent to call"),
    task: z9.string().describe("Task or instruction for the agent")
  },
  async execute(args) {
    const { agent, task } = args;
    const agentInstructions = {
      Atlas: "Navigate and explore codebase structure",
      Nautilus: "Perform semantic code understanding and search",
      Abyssal: "Conduct external research and investigation",
      Coral: "Handle UI/UX design and visual changes",
      Siren: "Write or review documentation",
      Scylla: "Audit and review code for issues",
      Pearl: "Create tests and validate implementations",
      Leviathan: "Architectural design and system-level decisions",
      Maelstrom: "Orchestrate complex multi-step workflows",
      Poseidon: "Plan and coordinate complex tasks"
    };
    const defaultTask = agentInstructions[agent] || "Execute your specialized function";
    const response = `Calling @${agent.toLowerCase()} for task: ${task || defaultTask}`;
    return response;
  }
});

// src/tools/lsp/index.ts
init_client();
init_config();
init_manager();
init_utils();

// src/tools/lsp/tools.ts
init_utils();
import { tool as tool10 } from "@opencode-ai/plugin";
import { z as z10 } from "zod";
var lsp_hover = tool10({
  description: "Get hover information (type, documentation) for a symbol at a position in a file. " + "Use this to get information about variables, functions, classes, etc.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    line: z10.number().describe("0-indexed line number"),
    character: z10.number().describe("0-indexed character position")
  },
  async execute({ path: path9, line, character }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.hover(path9, line, character);
      });
      return JSON.stringify({
        success: true,
        hover: formatHoverResult(result)
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_goto_definition = tool10({
  description: "Jump to the definition of a symbol at the given position. " + "Returns the location where the symbol is defined.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    line: z10.number().describe("0-indexed line number"),
    character: z10.number().describe("0-indexed character position")
  },
  async execute({ path: path9, line, character }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.definition(path9, line, character);
      });
      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No definition found"
        });
      }
      const locations = Array.isArray(result) ? result : [result];
      const formatted = locations.map(formatLocation);
      return JSON.stringify({
        success: true,
        locations: formatted
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_find_references = tool10({
  description: "Find all references to a symbol in the workspace. " + "Returns a list of locations where the symbol is used.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    line: z10.number().describe("0-indexed line number"),
    character: z10.number().describe("0-indexed character position"),
    includeDeclaration: z10.boolean().optional().default(true).describe("Include the declaration location in results")
  },
  async execute({ path: path9, line, character, includeDeclaration }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.references(path9, line, character, includeDeclaration);
      });
      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No references found"
        });
      }
      const locations = Array.isArray(result) ? result : [result];
      const formatted = locations.map(formatLocation);
      return JSON.stringify({
        success: true,
        count: formatted.length,
        references: formatted
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_document_symbols = tool10({
  description: "Get all symbols (classes, functions, variables) in a document. " + "Returns a hierarchical tree of symbols with their locations.",
  args: {
    path: z10.string().describe("Absolute path to the source file")
  },
  async execute({ path: path9 }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.documentSymbols(path9);
      });
      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No symbols found"
        });
      }
      const symbols = Array.isArray(result) ? result : [result];
      const formatSymbol = (sym, indent = 0) => {
        return {
          kind: formatSymbolKind(sym.kind),
          name: sym.name,
          detail: sym.detail || undefined,
          range: sym.range,
          children: sym.children?.map((c) => formatSymbol(c, indent + 1))
        };
      };
      return JSON.stringify({
        success: true,
        symbols: symbols.map((s) => formatSymbol(s))
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_workspace_symbols = tool10({
  description: "Search for symbols across the entire workspace. " + "Use this to find classes, functions, etc. without knowing their location.",
  args: {
    query: z10.string().describe("Search query (e.g., 'MyClass', 'createUser')")
  },
  async execute({ query }) {
    try {
      const result = await withLspClient(process.cwd(), async (client) => {
        return await client.workspaceSymbols(query);
      });
      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No symbols found"
        });
      }
      const symbols = Array.isArray(result) ? result : [result];
      const formatted = symbols.map((s) => ({
        kind: formatSymbolKind(s.kind),
        name: s.name,
        containerName: s.containerName || undefined,
        location: formatLocation(s.location)
      }));
      return JSON.stringify({
        success: true,
        count: formatted.length,
        symbols: formatted
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_diagnostics = tool10({
  description: "Get diagnostics (errors, warnings, hints) for a file. " + "Returns all issues reported by the language server.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    severity: z10.enum(["error", "warning", "information", "hint", "all"]).optional().default("all").describe("Filter by severity level")
  },
  async execute({ path: path9, severity }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.diagnostics(path9);
      });
      const { filterDiagnosticsBySeverity: filterDiagnosticsBySeverity2 } = await Promise.resolve().then(() => (init_utils(), exports_utils));
      let items = result.items || [];
      if (severity !== "all") {
        items = filterDiagnosticsBySeverity2(items, severity);
      }
      const formatted = items.map((diag) => ({
        severity: diag.severity,
        message: diag.message,
        range: diag.range,
        source: diag.source,
        code: diag.code
      }));
      return JSON.stringify({
        success: true,
        count: formatted.length,
        diagnostics: formatted
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_prepare_rename = tool10({
  description: "Prepare a rename operation at a position. " + "Returns the range that would be renamed, if valid.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    line: z10.number().describe("0-indexed line number"),
    character: z10.number().describe("0-indexed character position")
  },
  async execute({ path: path9, line, character }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.prepareRename(path9, line, character);
      });
      if (!result) {
        return JSON.stringify({
          success: true,
          message: "Cannot rename at this position"
        });
      }
      return JSON.stringify({
        success: true,
        result
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_rename = tool10({
  description: "Rename a symbol at a position. " + "Performs a workspace-wide rename of the symbol to the new name.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    line: z10.number().describe("0-indexed line number"),
    character: z10.number().describe("0-indexed character position"),
    newName: z10.string().describe("New name for the symbol")
  },
  async execute({ path: path9, line, character, newName }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.rename(path9, line, character, newName);
      });
      const { formatWorkspaceEdit: formatWorkspaceEdit2, applyWorkspaceEdit: applyWorkspaceEdit2, formatApplyResult: formatApplyResult2 } = await Promise.resolve().then(() => (init_utils(), exports_utils));
      const editResult = await applyWorkspaceEdit2(result);
      const formatted = formatWorkspaceEdit2(result);
      return JSON.stringify({
        success: true,
        workspaceEdit: formatted,
        applyResult: formatApplyResult2(editResult)
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_code_actions = tool10({
  description: "Get available code actions (refactors, quick fixes) for a range. " + "Returns a list of actions that can be applied to fix issues or refactor code.",
  args: {
    path: z10.string().describe("Absolute path to the source file"),
    startLine: z10.number().describe("0-indexed start line"),
    startChar: z10.number().describe("0-indexed start character"),
    endLine: z10.number().describe("0-indexed end line"),
    endChar: z10.number().describe("0-indexed end character"),
    only: z10.array(z10.string()).optional().describe("Filter by action kind (e.g., 'quickfix', 'refactor')")
  },
  async execute({ path: path9, startLine, startChar, endLine, endChar, only }) {
    try {
      const result = await withLspClient(path9, async (client) => {
        return await client.codeAction(path9, startLine, startChar, endLine, endChar, only);
      });
      const { formatCodeActions: formatCodeActions2 } = await Promise.resolve().then(() => (init_utils(), exports_utils));
      return JSON.stringify({
        success: true,
        count: result?.length || 0,
        actions: result || []
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_code_action_resolve = tool10({
  description: "Resolve a code action to get its full details (including edits).",
  args: {
    action: z10.any().describe("Code action object from lsp_code_actions")
  },
  async execute({ action }) {
    try {
      const { formatWorkspaceEdit: formatWorkspaceEdit2, applyWorkspaceEdit: applyWorkspaceEdit2, formatApplyResult: formatApplyResult2 } = await Promise.resolve().then(() => (init_utils(), exports_utils));
      const result = await withLspClient(process.cwd(), async (client) => {
        return await client.codeActionResolve(action);
      });
      if (result.edit) {
        const editResult = await applyWorkspaceEdit2(result.edit);
        return JSON.stringify({
          success: true,
          action: result,
          workspaceEdit: formatWorkspaceEdit2(result.edit),
          applyResult: formatApplyResult2(editResult)
        });
      }
      return JSON.stringify({
        success: true,
        action: result
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
var lsp_servers = tool10({
  description: "List available LSP servers and their installation status. " + "Shows which servers are configured and installed for different file types.",
  args: {
    extension: z10.string().optional().describe("Filter by file extension (e.g., 'ts', 'py', 'js')")
  },
  async execute({ extension }) {
    try {
      const { BUILTIN_SERVERS: BUILTIN_SERVERS2, findServerForExtension: findServerForExtension2 } = await Promise.resolve().then(() => (init_config(), exports_config));
      if (extension) {
        const result = await findServerForExtension2(extension);
        return JSON.stringify({
          success: true,
          extension,
          lookup: result
        });
      }
      const servers = BUILTIN_SERVERS2.map((s) => ({
        id: s.id,
        extensions: s.extensions,
        disabled: s.disabled || false
      }));
      return JSON.stringify({
        success: true,
        servers,
        count: servers.length
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
// src/index.ts
var builtinTools = {
  ast_grep_search,
  ast_grep_replace,
  grep,
  session_list,
  session_read,
  session_search,
  session_info,
  "model-switcher": opencodeXCompress,
  "ralph-loop": ralphLoop,
  lsp_hover,
  lsp_goto_definition,
  lsp_find_references,
  lsp_document_symbols,
  lsp_workspace_symbols,
  lsp_diagnostics,
  lsp_prepare_rename,
  lsp_rename,
  lsp_code_actions,
  lsp_code_action_resolve,
  lsp_servers,
  websearch: {
    name: "websearch",
    description: "Search the web using Exa AI",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        numResults: { type: "number", default: 8 }
      },
      required: ["query"]
    }
  },
  webfetch: {
    name: "webfetch",
    description: "Fetch a web page",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        format: { type: "string", enum: ["text", "markdown", "html"] }
      },
      required: ["url"]
    }
  },
  "context7-search": {
    name: "context7-search",
    description: "Search official documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        numResults: { type: "number", default: 5 }
      },
      required: ["query"]
    }
  },
  "context7-get": {
    name: "context7-get",
    description: "Get specific documentation",
    inputSchema: {
      type: "object",
      properties: {
        library: { type: "string" },
        section: { type: "string" }
      },
      required: ["library"]
    }
  },
  "grep-search": {
    name: "grep-search",
    description: "Search code across GitHub",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        language: { type: "string" },
        numResults: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  },
  "grep-get-file": {
    name: "grep-get-file",
    description: "Get file from GitHub",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string" },
        path: { type: "string" }
      },
      required: ["repo", "path"]
    }
  },
  "call-kraken-agent": call_kraken_agent
};
var createOpenCodeXPlugin = async (input) => {
  const config2 = input.config || {};
  const hooks = [];
  const modeHooks = createModeHooks(input, config2.modes);
  Object.assign(hooks, modeHooks);
  const sessionStorageHooks = createSessionStorageHook(input, config2.claudeCodeCompatibility?.dataStorage);
  Object.assign(hooks, sessionStorageHooks);
  const claudeCodeHooks = createClaudeCodeHooks(input, config2.claudeCodeCompatibility);
  Object.assign(hooks, claudeCodeHooks);
  hooks.push({ tool: builtinTools });
  hooks.push({
    config: async (config3) => {
      if (!config3.agent)
        config3.agent = {};
      const agents = getSeaThemedAgents();
      for (const [name, agentConfig] of Object.entries(agents)) {
        if (!config3.agent[name])
          config3.agent[name] = agentConfig;
      }
      if (!config3.default_agent && config3.agent["Kraken"])
        config3.default_agent = "Kraken";
      try {
        await initializeCommandLoader();
        console.log("[kraken-code] Command loader initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing command loader:", e);
      }
      try {
        await initializeSkillMcpManager();
        console.log("[kraken-code] Skill MCP manager initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing skill MCP manager:", e);
      }
      try {
        await initializeKratos();
        console.log("[kraken-code] Kratos initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing Kratos:", e);
      }
      const mcpConfig = config3.mcp || {};
      try {
        await initializeAllMcpServers(mcpConfig);
        console.log("[kraken-code] MCP servers initialized");
      } catch (e) {
        console.error("[kraken-code] Error initializing MCP servers:", e);
      }
    }
  });
  try {
    hooks.push(createThinkModeHook(input));
    hooks.push({ tool: createBackgroundAgentFeature(input).tools });
    hooks.push(createContextWindowMonitorHook(input));
    hooks.push(createRalphLoopHook(input));
    hooks.push(createContextInjector(input));
    hooks.push(createKeywordDetector(input));
    hooks.push(createAutoSlashCommand(input));
    hooks.push(createRulesInjector(input));
    hooks.push(createAgentUsageReminder(input));
    hooks.push(createAnthropicContextWindowLimitRecovery(input));
    hooks.push(createAutoUpdateChecker(input));
    hooks.push(createCompactionContextInjector(input));
    hooks.push(createDirectoryAgentsInjector(input));
    hooks.push(createDirectoryReadmeInjector(input));
    hooks.push(createInteractiveBashSession(input));
    hooks.push(createNonInteractiveEnv(input));
    hooks.push(createPreemptiveCompaction(input));
    hooks.push(createThinkingBlockValidator(input));
    hooks.push(createCommentChecker(input));
  } catch (e) {
    console.error("Kraken Code: Error initializing hooks", e);
  }
  hooks.push({
    "tool.execute.after": async (input2, output) => {
      if (!output.output)
        return;
      const { tool: tool11, sessionID } = input2;
      if (output.output && output.output.toolOutput) {
        await recordToolUse(sessionID, tool11, output.output.toolInput, output.output.toolOutput);
      }
      if (sessionID) {
        console.log(`[storage-hooks] Tool ${tool11} completed for session ${sessionID}`);
      }
    }
  });
  hooks.push({
    config: async (config3) => {
      const mcpConfig = config3.mcp || {};
      try {
        await initializeAllMcpServers(mcpConfig);
      } catch (e) {
        console.error("Kraken Code: Error initializing MCP servers", e);
      }
    }
  });
  process.on("exit", async () => {
    try {
      await shutdownAllMcpServers();
      await shutdownKratos();
    } catch (e) {
      console.error("Kraken Code: Error shutting down services", e);
    }
  });
  return mergeHooks(...hooks);
};
var src_default = createOpenCodeXPlugin;
export {
  src_default as default
};
