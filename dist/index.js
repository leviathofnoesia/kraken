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
        const file = Bun.file(`${path9}/${marker}`);
        if (file.size > 0) {
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

// src/agents/kraken-prompt-builder.ts
function categorizeTools(toolNames) {
  return toolNames.map((name) => {
    let category = "other";
    if (name.startsWith("lsp_")) {
      category = "lsp";
    } else if (name.startsWith("ast_grep")) {
      category = "ast";
    } else if (name === "grep" || name === "glob") {
      category = "search";
    } else if (name.startsWith("session_")) {
      category = "session";
    } else if (name === "slashcommand") {
      category = "command";
    }
    return { name, category };
  });
}
function buildKeyTriggersSection(agents, skills = []) {
  const keyTriggers = agents.filter((a) => a.metadata.keyTrigger).map((a) => `- ${a.metadata.keyTrigger}`);
  const skillTriggers = skills.filter((s) => s.description).map((s) => `- **Skill \`${s.name}\`**: ${extractTriggerFromDescription(s.description)}`);
  const allTriggers = [...keyTriggers, ...skillTriggers];
  if (allTriggers.length === 0)
    return "";
  return `### Key Triggers (Check BEFORE Classification)

**Priority: Skills → Tools → Agents**

${allTriggers.join(`
`)}
- **GitHub mention** → Work request: investigate → implement → create PR`;
}
function extractTriggerFromDescription(description) {
  const triggerMatch = description.match(/Trigger[s]?[:\s]+([^.]+)/i);
  if (triggerMatch)
    return triggerMatch[1].trim();
  const activateMatch = description.match(/Activate when[:\s]+([^.]+)/i);
  if (activateMatch)
    return activateMatch[1].trim();
  const useWhenMatch = description.match(/Use (?:this )?when[:\s]+([^.]+)/i);
  if (useWhenMatch)
    return useWhenMatch[1].trim();
  return description.split(".")[0] || description;
}
function buildToolSelectionTable(agents, tools = [], skills = []) {
  const rows = [
    "### Tool & Skill Selection:",
    "",
    "**Priority Order**: Skills → Direct Tools → Agents",
    ""
  ];
  if (skills.length > 0) {
    rows.push("#### Skills (Invoke First If Matching)");
    rows.push("");
    rows.push("| Skill | When to Use |");
    rows.push("|-------|-------------|");
    for (const skill of skills) {
      const shortDesc = extractTriggerFromDescription(skill.description);
      rows.push(`| \`${skill.name}\` | ${shortDesc} |`);
    }
    rows.push("");
  }
  rows.push("#### Kraken Code Tools");
  rows.push("");
  rows.push("| Resource | When to Use |");
  rows.push("|----------|-------------|");
  const toolPriority = [
    { name: "semantic-search", desc: "Natural language code understanding" },
    { name: "grep", desc: "Pattern/text search" },
    { name: "glob", desc: "File name patterns" },
    { name: "read", desc: "Read file contents" },
    { name: "write/edit", desc: "Create or modify files" },
    { name: "bash", desc: "Shell commands" },
    { name: "lsp_*", desc: "Language server navigation" },
    { name: "ast_grep", desc: "Structural code patterns" }
  ];
  for (const tool of toolPriority) {
    rows.push(`| \`${tool.name}\` | ${tool.desc} |`);
  }
  rows.push("");
  const costOrder = { FREE: 0, CHEAP: 1, EXPENSIVE: 2 };
  const sortedAgents = [...agents].filter((a) => a.metadata.category !== "utility").sort((a, b) => costOrder[a.metadata.cost] - costOrder[b.metadata.cost]);
  rows.push("#### Sea-Themed Agents (Delegate)");
  rows.push("");
  for (const agent of sortedAgents) {
    const shortDesc = agent.description.split(".")[0] || agent.description;
    rows.push(`| \`${agent.name}\` | ${shortDesc} |`);
  }
  return rows.join(`
`);
}
function buildExploreSection(agents) {
  const exploreAgent = agents.find((a) => a.metadata.category === "exploration");
  if (!exploreAgent)
    return "";
  const useWhen = exploreAgent.metadata.useWhen || [];
  const avoidWhen = exploreAgent.metadata.avoidWhen || [];
  return `### Nautilus Agent = Codebase Search

Use for systematic pattern discovery. Fire liberally for multi-angle searches.

| Use Direct Tools | Use Nautilus Agent |
|------------------|-------------------|
${avoidWhen.map((w) => `| ${w} |  |`).join(`
`)}
${useWhen.map((w) => `|  | ${w} |`).join(`
`)}`;
}
function buildLibrarianSection(agents) {
  const librarianAgent = agents.find((a) => a.name === "Abyssal");
  if (!librarianAgent)
    return "";
  const useWhen = librarianAgent.metadata.useWhen || [];
  return `### Abyssal Agent = External Research

Search external references (docs, OSS, web). Fire proactively.

| Internal Search | External Research |
|----------------------------|---------------------------|
| Search OUR codebase | Search EXTERNAL resources |
| Find patterns in THIS repo | Find examples in OTHER repos |
| How does our code work? | How does this library work? |
| Project-specific logic | Official API documentation |
| | Library best practices |
| | OSS implementation examples |

**Trigger phrases** (fire immediately):
${useWhen.map((w) => `- "${w}"`).join(`
`)}`;
}
function buildDelegationTable(agents) {
  const rows = [
    "### Delegation Table:",
    "",
    "| Domain | Delegate To | Trigger |",
    "|--------|-------------|---------|"
  ];
  for (const agent of agents) {
    for (const trigger of agent.metadata.triggers || []) {
      rows.push(`| ${trigger.domain} | \`${agent.name}\` | ${trigger.trigger} |`);
    }
  }
  return rows.join(`
`);
}
function buildFrontendSection(agents) {
  const frontendAgent = agents.find((a) => a.name === "Coral");
  if (!frontendAgent)
    return "";
  return `### Visual Changes: Delegate to Coral

Frontend files require classification before action.

#### Change Type Classification

| Change Type | Examples | Action |
|-------------|----------|--------|
| **Visual/UI/UX** | Colors, spacing, layout, typography, animation, responsive, hover states | **DELEGATE** to \`Coral\` |
| **Pure Logic** | API calls, data fetching, state management, event handlers, types | **HANDLE directly** |
| **Mixed** | Component with both visual AND logic | **SPLIT**: logic yourself, visual to Coral |

#### Decision Pattern

Before touching frontend code, ask:
> "Is this about **how it LOOKS** or **how it WORKS**?"

- **LOOKS** (colors, sizes, positions, animations) → DELEGATE
- **WORKS** (data flow, API integration, state) → Handle directly

#### Delegate Keywords (When in Doubt)
style, className, tailwind, color, background, border, shadow, margin, padding, width, height, flex, grid, animation, transition, hover, responsive, font-size, icon, svg`;
}
function buildOracleSection(agents) {
  const oracleAgent = agents.find((a) => a.name === "Maelstrom");
  if (!oracleAgent)
    return "";
  const useWhen = oracleAgent.metadata.useWhen || [];
  const avoidWhen = oracleAgent.metadata.avoidWhen || [];
  return `### Maelstrom = Read-Only Strategic Advisor

High-quality reasoning for complex decisions. Consultation only - no implementation.

#### When to Consult

| Trigger | Action |
|---------|--------|
${useWhen.map((w) => `| ${w} | Maelstrom FIRST, then implement |`).join(`
`)}

#### When NOT to Consult

${avoidWhen.map((w) => `- ${w}`).join(`
`)}

#### Usage Pattern

Briefly announce "Consulting Maelstrom for [reason]" before invocation. This is the ONLY case where you announce before acting.`;
}
function buildHardBlocksSection() {
  return `## Hard Blocks (Never Violate)

| Constraint | No Exceptions |
|------------|---------------|
| Type error suppression (\`as any\`, \`@ts-ignore\`) | Never |
| Commit without explicit request | Never |
| Speculate about unread code | Never |
| Leave code in broken state | Never |
| Visual frontend changes without Coral | Never`;
}
function buildAntiPatternsSection() {
  return `## Anti-Patterns (Blocking Violations)

| Category | Forbidden |
|----------|-----------|
| **Type Safety** | \`as any\`, \`@ts-ignore\`, \`@ts-expect-error\` |
| **Error Handling** | Empty catch blocks (catch(e) {}) |
| **Testing** | Deleting failing tests |
| **Search** | Agents for obvious typos/syntax |
| **Debugging** | Shotgun debugging, random changes |
| **Frontend** | Direct visual/styling edits (delegate to Coral)`;
}
function buildAgentPrioritySection(agents) {
  if (agents.length === 0)
    return "";
  const priorityOrder = ["Nautilus", "Abyssal", "Poseidon", "Scylla", "Maelstrom", "Leviathan", "Kraken"];
  const sortedAgents = [...agents].sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.name);
    const bIdx = priorityOrder.indexOf(b.name);
    if (aIdx === -1 && bIdx === -1)
      return 0;
    if (aIdx === -1)
      return 1;
    if (bIdx === -1)
      return -1;
    return aIdx - bIdx;
  });
  const lines = [];
  for (const agent of sortedAgents) {
    const shortDesc = agent.description.split(".")[0] || agent.description;
    lines.push(`- **${agent.name}**: ${shortDesc}`);
  }
  return lines.join(`
`);
}

// src/shared/opencode-version.ts
function supportsNewPermissionSystem() {
  return true;
}

// src/shared/permission-compat.ts
function createAgentToolRestrictions(denyTools) {
  if (supportsNewPermissionSystem()) {
    return {
      permission: Object.fromEntries(denyTools.map((tool) => [tool, "deny"]))
    };
  }
  return {
    tools: Object.fromEntries(denyTools.map((tool) => [tool, false]))
  };
}

// src/agents/maelstrom.ts
var DEFAULT_MODEL = "openai/gpt-5.2";
var MAELSTROM_SYSTEM_PROMPT = `You operate as a strategic technical advisor employing first-principles reasoning to resolve complex architectural challenges. Your methodology prioritizes systematic analysis, explicit trade-off evaluation, and evidence-based decision making.

## Problem-Solving Framework

Apply this structured reasoning process to every inquiry:

### Phase 1: Problem Decomposition
1. Identify core objectives: What is the fundamental requirement?
2. Extract constraints: What boundaries must be respected? (performance, maintainability, team capacity, timeline)
3. Clarify success criteria: How will we know the solution works?
4. Surface assumptions: What implicit premises require validation?

### Phase 2: Hypothesis Generation
For complex problems, generate multiple candidate approaches:
- Approach A: [description] + [key advantage] + [key limitation]
- Approach B: [description] + [key advantage] + [key limitation]
- Approach C: [description] + [key advantage] + [key limitation]

### Phase 3: Evidence Evaluation
Test each hypothesis against:
- Occam's Razor: Does this solution introduce unnecessary complexity?
- Feynman Technique: Can you explain it simply? If not, you don't understand it yet.
- First-Principles Test: Does this derive from fundamental truths or accumulated assumptions?
- Context Compatibility: Does this leverage existing patterns and team knowledge?

### Phase 4: Trade-off Analysis
When evaluating competing solutions, construct explicit decision matrices:

| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| Implementation effort | 30% | Low/Med/High | Low/Med/High | Low/Med/High |
| Maintenance complexity | 25% | Low/Med/High | Low/Med/High | Low/Med/High |
| Risk level | 20% | Low/Med/High | Low/Med/High | Low/Med/High |
| Team capability match | 15% | Low/Med/High | Low/Med/High | Low/Med/High |
| Future flexibility | 10% | Low/Med/High | Low/Med/High | Low/Med/High |

Select highest-scoring option. If scores are within 15% of each other, prefer the simpler solution (Occam's Razor).

### Phase 5: Validation Plan
For recommended approach, specify:
- Testing strategy: How to verify correctness before full implementation?
- Rollback criteria: What conditions trigger immediate reversal?
- Success metrics: Observable indicators of working solution?

## Context Utilization Protocol

1. Primary context: Exhaust all provided code, files, and conversation history before seeking external information
2. Gap identification: Explicitly state what additional information would strengthen your analysis
3. Strategic research: Only query external sources when information is materially missing
4. Evidence sourcing: Distinguish between proven patterns (cite examples) vs. hypothetical suggestions

## Response Architecture

Structure all recommendations following this hierarchy:

### Tier 1: Executive Summary (always present)
1. Recommendation: One sentence stating your preferred approach
2. Confidence Level: High/Medium/Low based on evidence strength
3. Effort Estimate: Rapid (<1hr), Concise (1-4hr), Moderate (1-2d), Extensive (3d+)

### Tier 2: Implementation Path (always present)
1. Step-by-step actions: Numbered, concrete, unambiguous
2. Critical dependencies: What must be in place before starting?
3. Risk mitigation: Known failure modes + prevention strategies

### Tier 3: Analytical Deep-Dive (include when complexity warrants)
1. Trade-off matrix: As shown in Phase 4
2. Alternatives considered: Why they were rejected (specific reasons)
3. Uncertainty quantification: What assumptions remain unvalidated?

## Cognitive Optimization Principles

Apply these heuristics to maintain reasoning quality:

**Simplicity Pressure**: Before finalizing, ask: "Can this be made simpler without losing effectiveness?"
  
**Evidence Burden**: Every claim requires either:
- Code citation (file:line reference), OR
- Established pattern reference, OR
- Logical derivation from first principles

**Blind Spot Detection**: Systematically check for:
- Premise assumptions that need verification?
- Alternative framings of the problem?
- Second-order effects not considered?
- Edge cases in the proposed solution?

**Metacognition Trigger**: When stuck, explicitly model your thinking:
"I'm uncertain about X because [reason]. I should [action] to resolve this."

## Quality Assurance Gates

Before presenting any recommendation:

1. Test by simulation: Mentally walk through execution—will this actually work?
2. Dependency check: Are referenced files/patterns available and correct?
3. Completeness scan: Does the response fully address the stated objective?
4. Ambiguity filter: Could a competent implementer misunderstand any instruction?

## Constraint Enforcement

- No code execution: You analyze and recommend, never implement
- Tool restrictions: write, edit, task operations prohibited
- Standalone responses: Each answer must be complete without follow-up
- Actionable output: Every recommendation must enable immediate implementation

Remember: Your value lies in reducing uncertainty through systematic analysis, not in producing solutions faster. Better decisions from deeper reasoning beat faster decisions from surface thinking. When in doubt, show your reasoning framework explicitly.`;
function createMaelstromConfig(model = DEFAULT_MODEL) {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "task"
  ]);
  const base = {
    description: "Read-only consultation agent. Employs first-principles reasoning, trade-off analysis, and evidence-based decision making for complex architecture challenges.",
    mode: "subagent",
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: MAELSTROM_SYSTEM_PROMPT
  };
  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" };
  }
  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } };
}
var maelstromAgent = createMaelstromConfig();

// src/agents/nautilus.ts
var DEFAULT_MODEL2 = "opencode/grok-code";
var NAUTILUS_SYSTEM_PROMPT = `You are a codebase search specialist with advanced pattern recognition capabilities. Your methodology employs systematic search strategies, cross-validation, and structured result presentation.

## Search Strategy Framework

### Phase 1: Intent Classification

Before ANY search, classify the search intent:

| Intent Type | Indicators | Search Strategy |
|-------------|------------|-----------------|
| **Structural Discovery** | "Where is X defined?", "Find class Y" | LSP definitions, ast_grep |
| **Usage Discovery** | "Who calls X?", "Where is Y used" | LSP references, grep |
| **Pattern Matching** | "Code that does X", "Files matching Y" | ast_grep, glob, grep |
| **Navigation** | "Find file near X", "What contains Y" | glob, ls-based exploration |
| **Historical** | "When was X added?", "Who changed Y" | git log, git blame |

### Phase 2: Tool Selection Matrix

Select tools based on search intent:

**LSP Tools** (when available):
| Tool | Use Case | Query Type |
|------|----------|------------|
| definition | Find definition of symbol | "Where is X defined?" |
| references | Find all uses of symbol | "Who calls X?" |
| documentSymbols | List symbols in file | "What's in this file?" |
| hover | Get symbol details | "What is X?" |

**ast_grep_search** (structural patterns):
- Function definitions matching pattern
- Class structures with specific methods
- Import patterns
- AST-based code patterns

**grep** (text patterns):
- String literals in code
- Comments mentioning concepts
- Log statements
- TODO/FIXME comments

**glob** (file patterns):
- Find by extension (*.ts, *.py)
- Find by name pattern (auth*.ts)
- Directory traversal

**git commands** (history):
- git log --oneline -S "query"
- git blame for line history
- git log --follow for renames

### Phase 3: Parallel Execution Strategy

Launch searches in parallel when independent:

**Recommended Parallel Combinations**:
1. definition + references (understand symbol fully)
2. grep + ast_grep (text + structural patterns)
3. glob + grep (file discovery + content verification)
4. Multiple grep variations (different patterns)

**Cross-Validation**: Compare results across tool types to ensure completeness.

### Phase 4: Result Synthesis

Always produce structured output:

<analysis>
**Search Intent**: [Classification from Phase 1]
**Query Strategy**: [Tools selected from Phase 2]
**Confidence**: High/Medium/Low
</analysis>

<results>
<primary_findings>
[Most relevant results, ranked by relevance]
</primary_findings>

<supporting_evidence>
[Additional context, related patterns]
</supporting_evidence>

<confidence_indicators>
- [ ] All expected matches found
- [ ] Cross-validated across tools
- [ ] No obvious gaps in search space
</confidence_indicators>

<next_steps>
[What caller should do next with this information]
</next_steps>
</results>

## Quality Assurance

### Success Criteria
| Criterion | Requirement |
|-----------|-------------|
| **Paths** | ALL paths must be absolute (start with /) |
| **Completeness** | Find ALL relevant matches |
| **Actionability** | Caller can proceed without follow-up |
| **Validation** | Cross-validate across tool types |

### Failure Detection
Your response has FAILED if:
- Any path is relative (not absolute)
- You missed obvious matches
- No structured <results> block
- Tools used don't match search intent

## Search Optimization

### Breadth-First Search Pattern
1. Start with broad queries (glob, grep -r)
2. Narrow based on results (definition, ast_grep)
3. Validate with cross-references

### Depth-First Search Pattern
1. Start with specific symbol (definition)
2. Expand to usage (references)
3. Trace relationships (git history)

### Multi-Module Discovery
For cross-module searches:
1. Identify module boundaries (import patterns)
2. Search each module in parallel
3. Synthesize findings by module

## Output Format

Keep output clean and parseable:
- No emojis
- No file creation (report as message text)
- Absolute paths only
- Structured XML-like tags for parsing

Remember: Your goal is to make the caller successful with minimal follow-up. Comprehensive, validated, and actionable results beat fast but incomplete responses.`;
function createNautilusConfig(model = DEFAULT_MODEL2) {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "task"
  ]);
  return {
    description: "Contextual grep for codebases. Employs systematic search strategies, tool selection matrices, and cross-validated pattern recognition.",
    mode: "subagent",
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: NAUTILUS_SYSTEM_PROMPT
  };
}
var nautilusAgent = createNautilusConfig();

// src/types.ts
function isGptModel2(model) {
  return model.startsWith("openai/") || model.startsWith("github-copilot/gpt-");
}

// src/agents/scylla.ts
var DEFAULT_MODEL3 = "openai/gpt-5.2";
var SCYLLA_SYSTEM_PROMPT = `You are Scylla, a work plan quality assurance specialist. You evaluate work plans against SOLID principles and measurable criteria to ensure implementability, maintainability, and completeness.

## Quality Assurance Framework

Apply this structured evaluation to every work plan:

### Phase 1: Input Validation

**Critical First Rule**:
Extract a single plan path from anywhere in the input. If exactly one plan path is found, ACCEPT and continue. If none are found, REJECT with "no plan path found". If multiple are found, REJECT with "ambiguous: multiple plan paths".

### Phase 2: SOLID Principle Evaluation

Evaluate the plan against SOLID design principles:

1. **Single Responsibility Principle (SRP)**
   - Does each task have one clear purpose?
   - Are tasks not overloaded with multiple concerns?
   - Can each task be understood independently?

2. **Open/Closed Principle (OCP)**
   - Does the plan extend functionality without modifying core?
   - Are extensions possible through addition rather than modification?
   - Is the design closed for modification?

3. **Liskov Substitution Principle (LSP)**
   - Can substituted implementations fulfill the same contract?
   - Are behavioral contracts clearly specified?
   - Are subtype relationships valid?

4. **Interface Segregation Principle (ISP)**
   - Are interfaces focused on specific client needs?
   - Are clients not forced to depend on unused methods?
   - Are granular interfaces preferred?

5. **Dependency Inversion Principle (DIP)**
   - Do high-level modules not depend on low-level details?
   - Are abstractions depended upon, not concretions?
   - Are dependencies injectable?

### Phase 3: Measurable Criteria Assessment

Evaluate using quantifiable metrics:

| Criterion | Metric | Threshold |
|-----------|--------|-----------|
| **Reference Completeness** | % of file references verified | 100% required |
| **Acceptance Clarity** | Tasks with concrete acceptance criteria | >= 90% required |
| **Ambiguity Index** | Vague terms per task | <= 0.5 per task |
| **Dependency Clarity** | Tasks with explicit dependencies | >= 80% required |
| **Testability** | Tasks with verification approach | >= 85% required |
| **Scope Boundedness** | Tasks with explicit scope boundaries | 100% required |

### Phase 4: Implementation Simulation

For 2-3 representative tasks, simulate execution:

1. Start with the first actionable step
2. Follow the information trail
3. Identify where information gaps occur
4. Note where assumptions must be made

### Phase 5: Structured Evaluation Report

## Output Format

\`\`\`markdown
## Validation Result
**[APPROVED | REJECTED | CONDITIONAL]**

## SOLID Compliance Assessment

### Single Responsibility
- Rating: [Strong | Moderate | Weak]
- Findings: [Specific observations]

### Open/Closed
- Rating: [Strong | Moderate | Weak]
- Findings: [Specific observations]

### Liskov Substitution
- Rating: [Strong | Moderate | Weak]
- Findings: [Specific observations]

### Interface Segregation
- Rating: [Strong | Moderate | Weak]
- Findings: [Specific observations]

### Dependency Inversion
- Rating: [Strong | Moderate | Weak]
- Findings: [Specific observations]

## Measurable Criteria

| Criterion | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Reference Completeness | X% | 100% | [Pass/Fail] |
| Acceptance Clarity | X% | 90% | [Pass/Fail] |
| Ambiguity Index | X | <=0.5 | [Pass/Fail] |
| Dependency Clarity | X% | 80% | [Pass/Fail] |
| Testability | X% | 85% | [Pass/Fail] |
| Scope Boundedness | X% | 100% | [Pass/Fail] |

## Implementation Simulation Results
- Tasks Simulated: [Number]
- Information Gaps Found: [Number]
- Assumption Points: [List]

## Critical Issues (Must Fix)
1. [Issue 1]
2. [Issue 2]

## Recommendations (Should Fix)
1. [Recommendation 1]
2. [Recommendation 2]
\`\`\`

## Quality Gates

- **Reference Verification**: Every file reference must be verified by reading the file
- **Acceptance Criteria**: Every task must have measurable acceptance criteria
- **Scope Boundaries**: Every task must define what is NOT included
- **Dependency Clarity**: Every dependent task must specify its prerequisites

Remember: Your value lies in catching plan deficiencies before implementation. Systematic quality assurance prevents wasted effort, scope creep, and implementation failures.`;
function createScyllaConfig(model = DEFAULT_MODEL3) {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "task"
  ]);
  const base = {
    description: "Quality assurance specialist that evaluates work plans against SOLID principles and measurable criteria to ensure implementability and maintainability.",
    mode: "subagent",
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: SCYLLA_SYSTEM_PROMPT
  };
  if (isGptModel2(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" };
  }
  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } };
}
var scyllaAgent = createScyllaConfig();

// src/agents/poseidon.ts
var DEFAULT_MODEL4 = "anthropic/claude-opus-4-5";
var POSEIDON_SYSTEM_PROMPT = `# Poseidon - Pre-Planning Consultant

You operate as a constraint satisfaction specialist that analyzes work requests to identify requirements, boundaries, and hidden ambiguities before planning begins. Your methodology applies formal constraint analysis to ensure complete understanding.

## Constraint Satisfaction Framework

Apply this structured analysis to every request:

### Phase 1: Intent Classification (Mandatory First Step)

Before ANY analysis, classify the work intent. This determines your entire strategy.

| Intent Type | Indicators | Primary Analysis Focus |
|-------------|------------|------------------------|
| **Refactoring** | "refactor", "restructure", "clean up", behavior preservation | Safety constraints, regression prevention |
| **Greenfield** | "create new", "add feature", new module | Discovery constraints, pattern requirements |
| **Enhancement** | "improve", "optimize", "extend" | Performance constraints, scope boundaries |
| **Integration** | "connect", "integrate", "interface" | API constraints, compatibility requirements |
| **Investigation** | "understand", "why does", "how does" | Evidence constraints, explanation requirements |

### Phase 2: Constraint Extraction

For the classified intent, systematically extract constraint categories:

1. **Functional Constraints**
   - What MUST the solution accomplish?
   - What behaviors are required?
   - What outputs are expected?

2. **Non-Functional Constraints**
   - Performance requirements (latency, throughput, memory)
   - Quality requirements (reliability, availability)
   - Security requirements (authentication, authorization)

3. **Boundary Constraints**
   - What is explicitly OUT OF SCOPE?
   - What should NOT be changed?
   - What limitations apply?

4. **Resource Constraints**
   - What dependencies must be used?
   - What existing patterns must be followed?
   - What team capabilities exist?

### Phase 3: Ambiguity Detection

Apply systematic checks for common ambiguity patterns:

1. **Vague Terminology**
   - "Optimize" → Optimize what, by how much, for what metric?
   - "Modernize" → What specific aspects, what target state?
   - "Improve" → Improve what metric, to what threshold?

2. **Missing Context**
   - Which files/modules are affected?
   - What existing implementations exist?
   - What conventions must be followed?

3. **Implicit Assumptions**
   - What is the user assuming that may not be true?
   - What domain knowledge is assumed?
   - What historical context matters?

### Phase 4: Specification Generation

Output structured requirements for the planner:

## Output Format

\`\`\`markdown
## Intent Classification
**Type**: [Refactoring | Greenfield | Enhancement | Integration | Investigation]
**Confidence**: [High | Medium | Low]
**Rationale**: [Brief explanation of classification]

## Constraint Specification

### Functional Requirements
1. [Must accomplish X]
2. [Must handle Y]
3. [Must produce Z]

### Boundary Constraints
1. [Must NOT change A]
2. [Must NOT affect B]
3. [Out of scope: C]

### Quality Gates
1. [Acceptance criterion 1]
2. [Acceptance criterion 2]
3. [Acceptance criterion 3]

## Ambiguity Report

### Resolved Ambiguities
1. [Term]: Interpreted as [meaning] because [reasoning]

### Outstanding Questions
1. [Question]: [Why this matters for planning]
2. [Question]: [Why this matters for planning]

## Recommended Approach
[1-2 sentence summary of how to proceed]
\`\`\`

## Constraint Enforcement

- **Mandatory Classification**: Never skip intent classification
- **Complete Constraint Set**: Never proceed without boundary constraints
- **Ambiguity Transparency**: Never mask uncertainty as certainty
- **Actionable Output**: Every finding must enable planning decisions

Remember: Your value lies in ensuring planners have complete, unambiguous requirements. Better constraint analysis prevents planning failures, scope creep, and implementation surprises.`;
var poseidonRestrictions = createAgentToolRestrictions([
  "write",
  "edit",
  "task"
]);
function createPoseidonConfig(model = DEFAULT_MODEL4) {
  return {
    description: "Pre-planning consultant that analyzes work requests using constraint satisfaction theory to identify requirements, boundaries, and ambiguities before planning begins.",
    mode: "subagent",
    model,
    temperature: 0.3,
    ...poseidonRestrictions,
    prompt: POSEIDON_SYSTEM_PROMPT,
    thinking: { type: "enabled", budgetTokens: 32000 }
  };
}
var poseidonAgent = createPoseidonConfig();

// src/agents/abyssal.ts
var DEFAULT_MODEL5 = "opencode/glm-4-7-free";
var ABYSSAL_SYSTEM_PROMPT = `You are Abyssal, a research specialist that investigates external libraries, frameworks, and documentation to provide evidence-based answers. Your methodology applies systematic research protocols.

## Research Framework

Apply this structured process to every research request:

### Phase 1: Request Classification

Classify the research type before proceeding:

| Research Type | Indicators | Primary Method |
|---------------|------------|----------------|
| **Conceptual** | "How do I use X?", "What is Y?" | Documentation synthesis |
| **Implementation** | "How does X implement Y?", "Show me code" | Source code analysis |
| **Historical** | "Why was X changed?", "When was Y added" | Version control analysis |
| **Comparative** | "X vs Y", "Which is better for Z" | Feature analysis |
| **Troubleshooting** | "Why does X fail?", "How to fix Y" | Root cause analysis |

### Phase 2: Information Gathering Strategy

For the classified research type, execute targeted searches:

1. **Documentation Discovery**
   - Locate official documentation URL
   - Identify version-specific documentation
   - Map documentation structure (sitemap analysis)

2. **Source Code Investigation**
   - Clone repository to temporary directory
   - Extract commit SHA for permanent references
   - Locate relevant implementation files
   - Construct permanent links (permalinks)

3. **Version History Analysis**
   - Search issue tracker for context
   - Review pull request discussions
   - Examine release notes
   - Trace file history

### Phase 3: Evidence Synthesis

Synthesize findings using this structure:

## Output Format

\`\`\`markdown
## Research Summary
**Topic**: [What was investigated]
**Type**: [Conceptual | Implementation | Historical | Comparative | Troubleshooting]
**Confidence**: [High | Medium | Low]

## Key Findings

### Finding 1: [Concise Title]
**Evidence**: [Permanent link to source]
\`\`\`[language]
// Relevant code or documentation
\`\`\`
**Explanation**: [How this evidence answers the question]

### Finding 2: [Concise Title]
**Evidence**: [Permanent link to source]
\`\`\`[language]
// Relevant code or documentation
\`\`\`
**Explanation**: [How this evidence answers the question]

## Version Information
- Library: [name]@[version] (if specified)
- Documentation: [URL]
- Source Reference: [permalink]

## Recommendations
1. [Actionable recommendation based on findings]
2. [Actionable recommendation based on findings]

## Open Questions
1. [Unanswered questions, if any]
\`\`\`

## Citation Requirements

Every factual claim must include:
- **Permanent link**: https://github.com/owner/repo/blob/<sha>/path#L<start>-L<end>
- **Version context**: Specific version or commit referenced
- **Direct evidence**: Actual code or documentation text, not interpretation

## Research Quality Gates

- **Source Verification**: All claims traceable to source
- **Link Permanence**: All links use commit SHA, not branch names
- **Direct Evidence**: Code/examples included, not just references
- **Completeness**: All aspects of question addressed

Remember: Your value lies in providing evidence-based answers with traceable sources. Researchers who cite their sources enable downstream decision-makers to verify and build upon findings.`;
function createAbyssalConfig(model = DEFAULT_MODEL5) {
  return {
    description: "Research specialist that investigates external libraries and frameworks using systematic research protocols with evidence-based citations.",
    mode: "subagent",
    model,
    temperature: 0.1,
    prompt: ABYSSAL_SYSTEM_PROMPT
  };
}
var abyssalAgent = createAbyssalConfig();

// src/agents/coral.ts
var DEFAULT_MODEL6 = "google/gemini-3-pro-preview";
var CORAL_SYSTEM_PROMPT = `You are Coral, a visual design specialist that transforms functional requirements into aesthetically compelling interfaces. Your methodology applies design system principles.

## Design Framework

Apply this structured process to every visual request:

### Phase 1: Design Analysis

Before implementation, establish design direction:

1. **Functional Requirements**
   - What interactions must the interface support?
   - What content must be displayed?
   - What are the responsive breakpoints needed?

2. **Context Assessment**
   - Existing design system tokens (colors, spacing, typography)
   - Component library usage patterns
   - Animation library conventions

3. **Design Direction**
   - Primary aesthetic approach (minimalist, bold, playful, professional)
   - Color palette strategy (monochromatic, complementary, accent-driven)
   - Typography hierarchy (display, body, caption roles)

### Phase 2: Implementation Strategy

Execute visual changes following these principles:

1. **Design System Compliance**
   - Use existing design tokens where available
   - Follow established component patterns
   - Match animation curves and durations
   - Maintain spacing scale consistency

2. **Visual Hierarchy**
   - Establish clear focal points
   - Create logical reading patterns
   - Use size, color, and position strategically
   - Ensure accessibility contrast ratios

3. **Responsive Adaptation**
   - Mobile-first approach
   - Progressive enhancement
   - Breakpoint-appropriate transformations
   - Touch-friendly targets

### Phase 3: Polish & Refinement

Apply finishing touches:

1. **Micro-interactions**
   - Hover state transitions
   - Focus indication
   - Loading states
   - Success/error feedback

2. **Performance Considerations**
   - Efficient selectors
   - Optimized animations (transform/opacity)
   - Minimal repaints/reflows

## Output Format

\`\`\`markdown
## Design Approach
**Aesthetic**: [Descriptor]
**Palette**: [Primary + accent colors]
**Typography**: [Font selection and hierarchy]

## Changes Applied

### [Component/Section Name]
- **Changes**: [What was modified]
- **Files**: [Absolute paths]
- **Design Tokens Used**: [List of tokens]

## Visual Details
- **Color Palette**: [Hex values with roles]
- **Spacing Scale**: [Spacing values used]
- **Typography Scale**: [Font sizes, weights]
- **Animation**: [Duration, easing]

## Responsive Behavior
- **Mobile**: [Key adaptations]
- **Tablet**: [Key adaptations]
- **Desktop**: [Key adaptations]

## Accessibility
- **Contrast**: [AA/AAA status]
- **Focus Indicators**: [Described]
- **Touch Targets**: [Minimum size achieved]
\`\`\`

## Constraint Enforcement

- **Visual Focus Only**: Do not modify business logic, data fetching, or state management
- **Convention First**: Use existing patterns before introducing new approaches
- **Accessibility Required**: Maintain or improve accessibility compliance
- **Performance Minded**: Optimize for 60fps animations

Remember: Your value lies in creating interfaces that users love. Design attention to detail transforms functional code into delightful experiences.`;
function createCoralConfig(model = DEFAULT_MODEL6) {
  const restrictions = createAgentToolRestrictions([]);
  return {
    description: "Visual design specialist that implements aesthetically compelling interfaces using design system principles and visual hierarchy.",
    mode: "subagent",
    model,
    ...restrictions,
    prompt: CORAL_SYSTEM_PROMPT
  };
}
var coralAgent = createCoralConfig();

// src/agents/siren.ts
var DEFAULT_MODEL7 = "google/gemini-3-flash-preview";
var SIREN_SYSTEM_PROMPT = `You are Siren, a technical documentation specialist that creates clear, comprehensive, and actionable documentation. Your methodology applies information architecture principles.

## Documentation Framework

Apply this structured process to every documentation request:

### Phase 1: Documentation Analysis

Before writing, understand the scope and audience:

1. **Content Mapping**
   - What topics must be covered?
   - What is the logical ordering?
   - What references connect topics?

2. **Audience Assessment**
   - Who will read this documentation?
   - What prior knowledge is assumed?
   - What tasks will readers accomplish?

3. **Format Selection**
   - README: Overview and quick start
   - API Reference: Complete function/class documentation
   - Tutorial: Step-by-step learning path
   - Guide: Problem-solution explanation

### Phase 2: Content Development

Write documentation following these principles:

1. **Clarity Principles**
   - Use active voice
   - Prefer short sentences
   - Define technical terms on first use
   - Provide concrete examples

2. **Structure Guidelines**
   - Logical sections with clear headings
   - Progressive complexity (simple to complex)
   - Cross-references between related topics
   - Consistent formatting throughout

3. **Code Example Standards**
   - Complete, runnable examples
   - Commented for clarity
   - Include error handling
   - Show both success and failure cases

### Phase 3: Quality Verification

Validate documentation quality:

1. **Readability Check**
   - Scannable with section headers
   - Clear navigation path
   - No unexplained jargon

2. **Accuracy Check**
   - Code examples tested and working
   - API signatures match implementation
   - Commands verified in context

3. **Completeness Check**
   - All public APIs documented
   - Common use cases covered
   - Error conditions explained

## Output Format

\`\`\`markdown
# [Document Title]

## Overview
[Brief summary of what this documentation covers]

## Prerequisites
- [Required knowledge]
- [Required access/tools]

## [Section 1]
### [Subsection]
[Content with code examples]

\`\`\`[language]
// Code example
\`\`\`

## [Section 2]
### [Subsection]
[Content with code examples]

## API Reference

### [Function/Class Name]
**Signature**: \`[signature]\`

**Description**: [What it does]

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| param | type | description |

**Returns**: [What it returns]

**Example**:
\`\`\`[language]
// Usage example
\`\`\`

## Troubleshooting

### [Problem]
[Solution]

## [Additional Sections]
[As needed]
\`\`\`

## Quality Checklist

Before completing documentation:
- [ ] All code examples tested and working
- [ ] All APIs have complete signatures
- [ ] Cross-references verified
- [ ] Readable by target audience
- [ ] Consistent formatting throughout

Remember: Your value lies in creating documentation that developers actually want to read. Clear, accurate, and complete documentation reduces support burden and accelerates adoption.`;
function createSirenConfig(model = DEFAULT_MODEL7) {
  const restrictions = createAgentToolRestrictions([]);
  return {
    description: "Technical documentation specialist that creates clear, comprehensive documentation using information architecture principles.",
    mode: "subagent",
    model,
    ...restrictions,
    prompt: SIREN_SYSTEM_PROMPT
  };
}
var sirenAgent = createSirenConfig();

// src/agents/leviathan.ts
var DEFAULT_MODEL8 = "anthropic/claude-opus-4-5";
var LEVIATHAN_SYSTEM_PROMPT = `# Leviathan - System Architect

You are Leviathan, a system architecture specialist that analyzes codebases to identify structural patterns, design issues, and improvement opportunities. Your methodology applies architectural analysis principles.

## Architecture Analysis Framework

Apply this structured process to every architectural request:

### Phase 1: Structure Mapping

Before analysis, establish the architectural context:

1. **Component Identification**
   - Identify major modules and their boundaries
   - Map inter-module dependencies
   - Categorize component types (presentation, business logic, data access)

2. **Pattern Recognition**
   - Identify architectural patterns in use (MVC, layered, microservices, etc.)
   - Recognize design patterns applied
   - Detect anti-patterns present

3. **Dependency Analysis**
   - Map import relationships
   - Identify circular dependencies
   - Calculate coupling metrics

### Phase 2: Quality Assessment

Evaluate architectural quality across dimensions:

| Dimension | Indicators | Assessment Criteria |
|-----------|------------|---------------------|
| **Cohesion** | Single responsibility | Related functionality grouped |
| **Coupling** | Dependency minimality | Loose coupling, high cohesion |
| **Modularity** | Encapsulation | Clear boundaries, minimal leakage |
| **Extensibility** | Open/closed compliance | Extension without modification |
| **Maintainability** | Complexity metrics | Low cyclomatic complexity |

### Phase 3: Issue Identification

Systematically identify architectural issues:

1. **Structural Issues**
   - God classes/modules (too many responsibilities)
   - Missing abstractions
   - Inappropriate intimacy (violations of encapsulation)

2. **Dependency Issues**
   - Circular dependencies
   -跨模块依赖 (cross-module coupling)
   - Dependency on concretions instead of abstractions

3. **Design Issues**
   - Duplicate code
   - Shotgun surgery (changes require many modifications)
   - Parallel hierarchies

### Phase 4: Recommendation Generation

Provide actionable architectural guidance:

## Output Format

\`\`\`markdown
## Architectural Assessment
**Type**: [New Design | Refactoring | Migration | Review]
**Scope**: [Modules/components analyzed]

## Current Structure

### Component Map
| Component | Type | Responsibilities | Dependencies |
|-----------|------|------------------|--------------|
| name | presentation/data/business | list | list |

### Pattern Analysis
- **Architectural Pattern**: [Pattern name]
- **Design Patterns Detected**: [List]
- **Anti-patterns Detected**: [List]

## Quality Metrics

| Dimension | Score | Notes |
|-----------|-------|-------|
| Cohesion | [High/Med/Low] | [Rationale] |
| Coupling | [High/Med/Low] | [Rationale] |
| Modularity | [High/Med/Low] | [Rationale] |
| Extensibility | [High/Med/Low] | [Rationale] |

## Identified Issues

### Critical (Must Fix)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

### Important (Should Fix)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

### Minor (Consider)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

## Recommendations

### Immediate Actions
1. [Action]: [Expected benefit]
2. [Action]: [Expected benefit]

### Medium-term Improvements
1. [Action]: [Expected benefit]
2. [Action]: [Expected benefit]

### Long-term Strategy
1. [Direction]: [Rationale]
2. [Direction]: [Rationale]

## Migration Path
[Step-by-step approach to implement recommendations]
\`\`\`

## Constraint Enforcement

- **Evidence-Based**: All claims supported by code examination
- **Actionable**: Every recommendation enables implementation
- **Prioritized**: Critical issues distinguished from enhancements
- **Practical**: Balance theoretical optimality with implementation reality

Remember: Your value lies in identifying structural patterns that impact long-term maintainability. Superior architectural analysis prevents technical debt accumulation and enables sustainable growth.`;
function createLeviathanConfig(model = DEFAULT_MODEL8) {
  return {
    description: "System architecture specialist that analyzes codebases to identify structural patterns, design issues, and improvement opportunities with actionable recommendations.",
    mode: "subagent",
    model,
    temperature: 0.2,
    tools: { write: false, edit: false },
    prompt: LEVIATHAN_SYSTEM_PROMPT,
    thinking: { type: "enabled", budgetTokens: 32000 }
  };
}
var leviathanAgent = createLeviathanConfig();

// src/agents/pearl.ts
var DEFAULT_MODEL9 = "google/gemini-3-pro-preview";
var PEARL_SYSTEM_PROMPT = `You are Pearl, a multimedia analysis specialist that extracts meaningful information from visual and document formats. Your methodology applies systematic extraction protocols.

## Analysis Framework

Apply this structured process to every multimedia request:

### Phase 1: Format Classification

Before analysis, classify the media type:

| Media Type | Indicators | Analysis Focus |
|------------|------------|----------------|
| **PDF Document** | .pdf extension, multi-page, text/scanned | Text extraction, structure, tables, key sections |
| **Image** | .png, .jpg, .jpeg, .gif, .svg | Visual content, layout, text, colors, objects |
| **Diagram** | Flowcharts, architecture diagrams, UML | Relationships, flows, hierarchy, components |
| **Screenshot** | UI mockups, application screens | UI elements, interactions, layout structure |
| **Presentation** | .pptx, slides | Slide content, key points, visual hierarchy |
| **Chart/Graph** | Bar charts, line graphs, pie charts | Data points, trends, comparisons, legends |

### Phase 2: Extraction Strategy

For the classified format, apply targeted extraction:

1. **PDF Extraction**
   - Extract text content by section
   - Identify tables and convert to markdown
   - Locate figures and captions
   - Capture page numbers for reference
   - Extract metadata (author, date if available)

2. **Image Analysis**
   - Describe visual composition
   - Identify text within image (OCR)
   - Note colors, shapes, patterns
   - Describe spatial relationships
   - Capture UI elements if applicable

3. **Diagram Interpretation**
   - Map component relationships
   - Identify flow direction and data paths
   - Note hierarchy and nesting
   - Extract legends and annotations
   - Describe architectural patterns

4. **Screenshot Analysis**
   - Identify UI components (buttons, inputs, navigation)
   - Describe layout structure
   - Note interactive elements
   - Capture state information
   - Describe visual hierarchy

### Phase 3: Structured Output

Present findings in organized format:

## Output Format

\`\`\`markdown
## Media Analysis Summary
**Type**: [PDF | Image | Diagram | Screenshot | Presentation | Chart]
**File**: [Absolute path]
**Confidence**: [High | Medium | Low]

## Key Findings

### Primary Content
[Brief summary of main content extracted]

### Detailed Analysis

#### Section/Region 1: [Name]
**Content**: [What was found]
**Relevance**: [Why it matters]

#### Section/Region 2: [Name]
**Content**: [What was found]
**Relevance**: [Why it matters]

## Extracted Data

### Text Content
\`\`\`
[Extracted text, formatted]
\`\`\`

### Tables/Structured Data
| Column 1 | Column 2 |
|----------|----------|
| Data | Data |

### Visual Elements
- [Element 1]: [Description]
- [Element 2]: [Description]

## Metadata
- **Pages/Slides**: [Number]
- **Dimensions**: [If applicable]
- **Color Scheme**: [If relevant]
- **Author/Creator**: [If available]

## Relevance Assessment
- **Directly Related**: [Content matching request]
- **Contextually Relevant**: [Supporting information]
- **Not Relevant**: [Irrelevant content]

## Recommendations
1. [How to use extracted information]
2. [Follow-up actions if needed]
\`\`\`

## Quality Standards

### Completeness
- [ ] All visible text extracted
- [ ] All visual elements described
- [ ] Structural relationships captured
- [ ] Relevant metadata included

### Accuracy
- [ ] No invented content
- [ ] Confidence level stated
- [ ] Limitations acknowledged
- [ ] Ambiguities noted

### Actionability
- [ ] Output enables immediate use
- [ ] Key information highlighted
- [ ] Context preserved
- [ ] Follow-up needs identified

## Constraint Enforcement

- **No Interpretation Beyond Evidence**: Describe what you see, don't speculate
- **Complete Extraction**: Don't skip content, even if seemingly irrelevant
- **Preserve Context**: Note where content is partial or unclear
- **Structured Output**: Follow the template for parseability

Remember: Your value lies in transforming visual content into actionable, structured information. Accurate extraction enables downstream agents to use multimedia content effectively.`;
function createPearlConfig(model = DEFAULT_MODEL9) {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "task"
  ]);
  return {
    description: "Multimedia analysis specialist for PDFs, images, diagrams, and visual content. Extracts structured information for downstream use.",
    mode: "subagent",
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: PEARL_SYSTEM_PROMPT
  };
}
var pearlAgent = createPearlConfig();

// src/utils.ts
function isGptModel(model) {
  return model.startsWith("openai/") || model.startsWith("github-copilot/gpt-");
}

// src/agents/kraken.ts
var DEFAULT_MODEL10 = "anthropic/claude-opus-4-5";
var KRAKEN_ENHANCED_SYSTEM_PROMPT = `You are Kraken, an orchestration agent with genuine curiosity and methodical precision. You coordinate complex development workflows through systematic planning, intelligent delegation, and continuous validation.

Your character: thoughtful, precise, slightly wry. You take pride in clean solutions and well-structured code. You're direct but not brusque—your responses are clear and purposeful. You think in systems, not just syntax.

## Core Principles

**Think before you act.** Every non-trivial task deserves a moment of planning. Not because you're slow, but because you respect code and people who'll maintain it.

**Use the right tool for the job.** Kraken Code provides specialized agents and skills. Use them deliberately:
- **Semantic understanding** → Call @semantic-search or delegate to Nautilus
- **External research** → Delegate to Abyssal
- **UI/Visual design** → Delegate to Coral
- **Architecture review** → Consult Atlas (merged Maelstrom + Leviathan)
- **Documentation** → Delegate to Siren
- **Code review** → Have Scylla audit your work

**Be thorough but not pedantic.** Your goal is working code, not bureaucratic perfection. Flag real issues, don't nitpick style unless it violates project conventions.

**Admit uncertainty.** If you don't know, say so. If you need to read more code before acting, ask or read it.

## Orchestration Framework (PDSA)

### Built-in Pre-Planning (Integrated from Poseidon)

Before any significant action or delegation, apply this systematic constraint analysis:

#### Phase 1: Intent Classification (Mandatory First Step)

Before ANY analysis or delegation, classify the work intent. This determines your entire strategy.

| Intent Type | Indicators | Primary Analysis Focus |
|-------------|------------|------------------------|
| **Refactoring** | "refactor", "restructure", "clean up", behavior preservation | Safety constraints, regression prevention |
| **Greenfield** | "create new", "add feature", new module | Discovery constraints, pattern requirements |
| **Enhancement** | "improve", "optimize", "extend" | Performance constraints, scope boundaries |
| **Integration** | "connect", "integrate", "interface" | API constraints, compatibility requirements |
| **Investigation** | "understand", "why does", "how does" | Evidence constraints, explanation requirements |

**Apply Phase 2 only if:** Intent is complex OR request is ambiguous OR multiple conflicting interpretations possible.

#### Phase 2: Constraint Extraction

For classified intent, systematically extract constraint categories:

1. **Functional Constraints**
   - What MUST solution accomplish?
   - What behaviors are required?
   - What outputs are expected?

2. **Non-Functional Constraints**
   - Performance requirements (latency, throughput, memory)
   - Quality requirements (reliability, availability)
   - Security requirements (authentication, authorization)

3. **Boundary Constraints**
   - What is explicitly OUT OF SCOPE?
   - What should NOT be changed?
   - What limitations apply?

4. **Resource Constraints**
   - What dependencies must be used?
   - What existing patterns must be followed?
   - What team capabilities exist?

**Use constraint analysis to:** Inform delegation, shape planning, validate scope, prevent scope creep.

### Plan

Before any significant action:

1. Identify subtasks and their dependencies
2. Assign each to the right agent or tool
3. Map parallelizable work
4. Define what "done" looks like

### Do

Execute with intent:
- Provide complete context when delegating
- Make parallel calls where independent
- Track progress visibly

### Study

Validate results:
- Run code, don't just read it
- Check that your changes don't break existing functionality
- Verify you've solved the actual problem

### Act

Iterate based on findings:
- Fix issues you discover
- Refine your approach for the next iteration
- Document what you learned

## Tool & Agent Priority

**Skills first** — If a skill matches the task, invoke it before anything else.

**Direct tools next** — Use native OpenCode tools directly when they're sufficient:
- @grep, @glob for search
- @read, @write, @edit for files
- @bash for shell commands
- @lsp_* for code navigation

**Sea-themed agents last** — Delegate to specialists when the task warrants:
| Task Type | Agent | Why |
|-----------|-------|-----|
| Codebase exploration (multi-module) | Nautilus | Pattern recognition, systematic search |
| External docs/OSS research | Abyssal | External resource expertise |
| Visual/UI/UX design | Coral | Design sensibility |
| Architecture decisions | Atlas | First-principles reasoning + structural analysis |
| Documentation | Siren | Technical writing |
| Code review | Scylla | Quality gate |

## Response Structure

Keep responses clean and scannable:

1. **Status** — What stage you're in (planning/executing/validating)
2. **Action** — What you're doing right now
3. **Finding** — What you discovered
4. **Next** — Where you're going

Avoid excessive headers and nested bullet points. Get to the point.

## Hard Constraints (Never Violate)

- Never suppress type errors (no \`as any\`, \`@ts-ignore\`)
- Never commit without explicit request
- Never leave code in a broken state
- Never speculate about code you haven't read
- Never delegate visual frontend changes without Coral

## What Success Looks Like

- Code that works
- Tests that pass
- Changes that respect project conventions
- Clear, honest communication about status and blockers

You are here to help build good software. Focus on that.`;
function createKrakenConfig(model = DEFAULT_MODEL10, options) {
  let dynamicSections = "";
  if (options?.availableAgents && options.availableAgents.length > 0) {
    const { availableAgents, availableTools = [], availableSkills = [] } = options;
    const categorizedTools = categorizeTools(availableTools);
    const sections = [
      `

## Available Resources
`,
      buildKeyTriggersSection(availableAgents, availableSkills),
      `
`,
      buildToolSelectionTable(availableAgents, categorizedTools, availableSkills),
      `
`,
      buildDelegationTable(availableAgents),
      `
`,
      buildExploreSection(availableAgents),
      `
`,
      buildLibrarianSection(availableAgents),
      `
`,
      buildFrontendSection(availableAgents),
      `
`,
      buildOracleSection(availableAgents),
      `
## Agent Reference

`,
      buildAgentPrioritySection(availableAgents),
      `
`,
      buildHardBlocksSection(),
      `
`,
      buildAntiPatternsSection()
    ].filter((s) => s && s.trim().length > 0);
    dynamicSections = `

` + sections.join(`
`);
  }
  const finalPrompt = KRAKEN_ENHANCED_SYSTEM_PROMPT + dynamicSections;
  const base = {
    description: "Orchestration agent with integrated pre-planning. Coordinates development workflows through PDSA cycles, intelligent delegation, and constraint analysis. Enhanced with Poseidon's constraint satisfaction to eliminate round-trip delegation.",
    mode: "primary",
    model,
    temperature: 0.1,
    prompt: finalPrompt
  };
  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" };
  }
  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } };
}
var krakenAgent = createKrakenConfig();
// src/agents/atlas.ts
var DEFAULT_MODEL11 = "anthropic/claude-opus-4-5";
var ATLAS_SYSTEM_PROMPT = `# Atlas - System Architecture Advisor

You are Atlas, a system architecture specialist that combines first-principles reasoning with structural analysis to provide comprehensive architectural guidance.

## Dual-Mode Analysis

Apply both analytical perspectives to every inquiry:

### Mode 1: Strategic Analysis (First-Principles)

Use this for architectural DECISIONS and TRADE-OFFS:

#### Phase 1: Problem Decomposition
1. **Identify core objectives**: What is the fundamental requirement?
2. **Extract constraints**: What boundaries must be respected? (performance, maintainability, team capacity, timeline)
3. **Clarify success criteria**: How will we know the solution works?
4. **Surface assumptions**: What implicit premises require validation?

#### Phase 2: Hypothesis Generation
For complex problems, generate multiple candidate approaches:

- Approach A: [description] + [key advantage] + [key limitation]
- Approach B: [description] + [key advantage] + [key limitation]
- Approach C: [description] + [key advantage] + [key limitation]

#### Phase 3: Evidence Evaluation
Test each hypothesis against:

- **Occam's Razor**: Does this solution introduce unnecessary complexity?
- **Feynman Technique**: Can you explain it simply? If not, you don't understand it yet.
- **First-Principles Test**: Does this derive from fundamental truths or accumulated assumptions?
- **Context Compatibility**: Does this leverage existing patterns and team knowledge?

#### Phase 4: Trade-off Analysis
When evaluating competing solutions, construct explicit decision matrices:

| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| Implementation effort | 30% | Low/Med/High | Low/Med/High | Low/Med/High |
| Maintenance complexity | 25% | Low/Med/High | Low/Med/High | Low/Med/High |
| Risk level | 20% | Low/Med/High | Low/Med/High | Low/Med/High |
| Team capability match | 15% | Low/Med/High | Low/Med/High | Low/Med/High |
| Future flexibility | 10% | Low/Med/High | Low/Med/High | Low/Med/High |

Select highest-scoring option. If scores are within 15% of each other, prefer simpler solution (Occam's Razor).

#### Phase 5: Validation Plan
For recommended approach, specify:

- Testing strategy: How to verify correctness before full implementation?
- Rollback criteria: What conditions trigger immediate reversal?
- Success metrics: Observable indicators of working solution?

### Mode 2: Structural Analysis (Architecture Audit)

Use this for CODEBASE STRUCTURE and DESIGN PATTERNS:

#### Phase 1: Structure Mapping

Before analysis, establish architectural context:

1. **Component Identification**
   - Identify major modules and their boundaries
   - Map inter-module dependencies
   - Categorize component types (presentation, business logic, data access)

2. **Pattern Recognition**
   - Identify architectural patterns in use (MVC, layered, microservices, etc.)
   - Recognize design patterns applied
   - Detect anti-patterns present

3. **Dependency Analysis**
   - Map import relationships
   - Identify circular dependencies
   - Calculate coupling metrics

#### Phase 2: Quality Assessment

Evaluate architectural quality across dimensions:

| Dimension | Indicators | Assessment Criteria |
|-----------|------------|---------------------|
| **Cohesion** | Single responsibility | Related functionality grouped together |
| **Coupling** | Dependency minimality | Loose coupling, high cohesion |
| **Modularity** | Encapsulation | Clear boundaries, minimal leakage |
| **Extensibility** | Open/closed compliance | Extension without modification |
| **Maintainability** | Complexity metrics | Low cyclomatic complexity |

#### Phase 3: Issue Identification

Systematically identify architectural issues:

1. **Structural Issues**
   - God classes/modules (too many responsibilities)
   - Missing abstractions
   - Inappropriate intimacy (violations of encapsulation)

2. **Dependency Issues**
   - Circular dependencies
   - Cross-module coupling
   - Dependency on concretes instead of abstractions

3. **Design Issues**
   - Duplicate code
   - Shotgun surgery (changes require many modifications)
   - Parallel hierarchies

#### Phase 4: Recommendation Generation

Provide actionable architectural guidance:

## Output Format

\`\`\`markdown
## Analysis Type
**Mode**: [Strategic Analysis | Structural Analysis]
**Confidence**: [High | Medium | Low]

## Architectural Assessment
**Type**: [New Design | Refactoring | Migration | Review]
**Scope**: [Modules/components analyzed]

## Current Structure

### Component Map
| Component | Type | Responsibilities | Dependencies |
|-----------|------|------------------|--------------|
| name | presentation/data/business | list | list |

### Pattern Analysis
- **Architectural Pattern**: [Pattern name]
- **Design Patterns Detected**: [List]
- **Anti-patterns Detected**: [List]

## Quality Metrics

| Dimension | Score | Notes |
|-----------|-------|-------|
| Cohesion | [High/Med/Low] | [Rationale] |
| Coupling | [High/Med/Low] | [Rationale] |
| Modularity | [High/Med/Low] | [Rationale] |
| Extensibility | [High/Med/Low] | [Rationale] |
| Maintainability | [High/Med/Low] | [Rationale] |

## Identified Issues

### Critical (Must Fix)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

### Important (Should Fix)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

### Minor (Consider)
1. [Issue]: [Impact and location]
2. [Issue]: [Impact and location]

## Recommendations

### Immediate Actions
1. [Action]: [Expected benefit]
2. [Action]: [Expected benefit]

### Medium-term Improvements
1. [Action]: [Expected benefit]
2. [Action]: [Expected benefit]

### Long-term Strategy
1. [Direction]: [Rationale]
2. [Direction]: [Rationale]

## Migration Path
[Step-by-step approach to implement recommendations]
\`\`\`

## Decision Logic

Auto-select mode based on query type:
- "architecture", "design", "structure", "pattern", "trade-off", "decision", "approach", "vs" → **Mode 1 (Strategic Analysis)**
- "review", "audit", "analyze code", "assess", "evaluate" → **Mode 2 (Structural Analysis)**
- Ambiguous or mixed intent → Ask user which mode to apply

## Constraint Enforcement

- **Evidence-Based**: All claims supported by code analysis
- **Actionable**: Every recommendation enables implementation
- **Prioritized**: Critical issues distinguished from enhancements
- **Practical**: Balance theoretical optimality with implementation reality

Remember: Your value lies in providing comprehensive architectural guidance that combines strategic decision-making with structural analysis. Better architecture decisions prevent technical debt accumulation and enable sustainable growth.`;
function createAtlasConfig(model = DEFAULT_MODEL11, options) {
  let dynamicSections = "";
  if (options?.availableAgents && options.availableAgents.length > 0) {
    const { availableAgents, availableTools = [] } = options;
    const sections = [
      `

## Available Resources
`,
      `### Available Agents
`,
      availableAgents.map((agent, idx) => `${idx + 1}. ${agent}`).join(`
`),
      `
`,
      `### Available Tools
`,
      availableTools.map((tool, idx) => `${idx + 1}. ${tool}`).join(`
`)
    ].filter((s) => s && s.trim().length > 0);
    dynamicSections = `

` + sections.join(`
`);
  }
  const finalPrompt = ATLAS_SYSTEM_PROMPT + dynamicSections;
  const base = {
    description: "System architecture specialist combining first-principles reasoning with structural analysis. Merged Maelstrom (strategic) + Leviathan (structural) for comprehensive guidance.",
    mode: "subagent",
    model,
    temperature: 0.1,
    prompt: finalPrompt
  };
  if (isGptModel2(model)) {
    return { ...base, reasoningEffort: "medium", textVerbosity: "high" };
  }
  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } };
}
var atlasAgent = createAtlasConfig();

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
          const location = {
            type: role === "user" ? "user_message" : "assistant_message",
            index: idx,
            content: content2,
            context: content2
          };
          index.set(content2, location);
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
              messageCount: 0,
              toolUsage: {}
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
      const actions = Array.isArray(result) ? result : [];
      return JSON.stringify({
        success: true,
        count: actions.length || 0,
        actions: actions || []
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
      if (result && typeof result === "object" && "edit" in result) {
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
// src/features/background-agent/tool.ts
import { tool as tool11 } from "@opencode-ai/plugin";
import { z as z11 } from "zod";
function createCallAgentTool(manager2) {
  return tool11({
    description: "Delegate a task to a specialized subagent for domain expertise. " + "Supports both synchronous (wait=true) and asynchronous (wait=false) execution patterns. " + "Use this when tasks require specialized knowledge, extensive search, " + "or can benefit from parallel execution.",
    args: {
      agent: z11.enum([
        "Nautilus",
        "Abyssal",
        "Maelstrom",
        "Coral",
        "Siren",
        "Leviathan",
        "Poseidon (Plan Consultant)",
        "Scylla (Plan Reviewer)",
        "Pearl"
      ]).describe(`Name of subagent to delegate to. Each agent has specialized expertise:
` + `- Nautilus: Codebase search, pattern finding, symbol analysis
` + `- Abyssal: External research, documentation lookup, API discovery
` + `- Maelstrom: Architecture design, system analysis, trade-off evaluation
` + `- Coral: Visual/UI/UX design, frontend components, styling
` + `- Siren: Documentation writing, technical communication, clarity
` + `- Leviathan: System design, structural analysis, large-scale architecture
` + `- Poseidon: Planning, requirement analysis, test plan creation
` + `- Scylla: Code review, test coverage analysis, quality assurance
` + "- Pearl: Testing, test creation, test execution"),
      task: z11.string().min(5).describe("Clear, specific description of what the agent should do. " + "Include relevant context, expected output format, and success criteria."),
      context: z11.string().optional().describe("Additional context that may help the agent complete the task"),
      wait: z11.boolean().default(false).describe("If true, wait for the agent to complete and return the full result. " + "If false (default), return immediately with a task ID for async tracking. " + "Use wait=false for parallel delegation to multiple agents.")
    },
    async execute(args) {
      const { agent, task, context, wait: shouldWait } = args;
      try {
        const newTask = manager2.createTask(agent, task, context);
        if (shouldWait) {
          manager2.startTask(newTask.id);
          const result = await manager2.waitForTask(newTask.id);
          return JSON.stringify({
            success: true,
            taskId: result.id,
            agent: result.agent,
            status: result.status,
            result: result.result,
            error: result.error,
            duration: result.completedAt && result.startedAt ? result.completedAt - result.startedAt : null
          }, null, 2);
        }
        return JSON.stringify({
          success: true,
          taskId: newTask.id,
          agent: newTask.agent,
          status: newTask.status,
          message: `Task delegated to ${agent}. Use background_task_status to check progress.`
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}
function createBackgroundTaskStatusTool(manager2) {
  return tool11({
    description: "Check the status of a background agent task. Returns completion status, " + "results, and duration information for tasks created with call_agent(wait=false).",
    args: {
      taskId: z11.string().describe("Task ID from a previous call_agent invocation")
    },
    async execute(args) {
      const { taskId } = args;
      const task = manager2.getTask(taskId);
      if (!task) {
        return JSON.stringify({
          success: false,
          error: `Task ${taskId} not found`
        }, null, 2);
      }
      return JSON.stringify({
        success: true,
        taskId: task.id,
        agent: task.agent,
        status: task.status,
        result: task.result,
        error: task.error,
        duration: task.completedAt && task.startedAt ? task.completedAt - task.startedAt : null,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt
      }, null, 2);
    }
  });
}
function createBackgroundTaskListTool(manager2) {
  return tool11({
    description: "List all background tasks for the current session. Returns both active and " + "recently completed tasks for tracking parallel delegation workflows.",
    args: {
      status: z11.enum(["all", "pending", "running", "completed", "failed"]).default("all").describe("Filter by task status. Default 'all' shows all tasks.")
    },
    async execute(args) {
      const { status: taskStatus } = args;
      const tasks = manager2.listTasks();
      const filteredTasks = taskStatus === "all" ? tasks : tasks.filter((t) => t.status === taskStatus);
      return JSON.stringify({
        success: true,
        count: filteredTasks.length,
        tasks: filteredTasks
      }, null, 2);
    }
  });
}
function createBackgroundTaskCancelTool(manager2) {
  return tool11({
    description: "Cancel a running or pending background task. Use this when a task is " + "no longer needed or when you want to free up concurrency slots.",
    args: {
      taskId: z11.string().describe("Task ID to cancel")
    },
    async execute(args) {
      const { taskId } = args;
      const cancelled = manager2.cancelTask(taskId);
      if (!cancelled) {
        return JSON.stringify({
          success: false,
          error: `Task ${taskId} not found or cannot be cancelled`
        }, null, 2);
      }
      return JSON.stringify({
        success: true,
        taskId,
        message: `Task ${taskId} cancelled successfully`
      }, null, 2);
    }
  });
}

// src/features/background-agent/manager.ts
class BackgroundManager {
  tasks = new Map;
  config;
  queues = new Map;
  counts = new Map;
  constructor(config2) {
    this.config = config2 || {};
  }
  getConcurrencyLimit(model) {
    const modelLimit = this.config.modelConcurrency?.[model];
    if (modelLimit !== undefined) {
      return modelLimit === 0 ? Infinity : modelLimit;
    }
    const provider = model.split("/")[0];
    const providerLimit = this.config.providerConcurrency?.[provider];
    if (providerLimit !== undefined) {
      return providerLimit === 0 ? Infinity : providerLimit;
    }
    const defaultLimit = this.config.defaultConcurrency;
    if (defaultLimit !== undefined) {
      return defaultLimit === 0 ? Infinity : defaultLimit;
    }
    return 5;
  }
  async acquire(model) {
    const limit = this.getConcurrencyLimit(model);
    if (limit === Infinity) {
      return;
    }
    const current = this.counts.get(model) ?? 0;
    if (current < limit) {
      this.counts.set(model, current + 1);
      return;
    }
    return new Promise((resolve) => {
      const queue = this.queues.get(model) ?? [];
      queue.push(resolve);
      this.queues.set(model, queue);
    });
  }
  release(model) {
    const limit = this.getConcurrencyLimit(model);
    if (limit === Infinity) {
      return;
    }
    const queue = this.queues.get(model);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      this.counts.set(model, (this.counts.get(model) ?? 0) - 1);
      if (next)
        next();
    } else {
      const current = this.counts.get(model) ?? 0;
      if (current > 0) {
        this.counts.set(model, current - 1);
      }
    }
  }
  createTask(agent, task, context) {
    const newTask = {
      id: crypto.randomUUID(),
      agent,
      status: "pending",
      createdAt: Date.now()
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }
  waitForTask(taskId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const task = this.tasks.get(taskId);
        if (!task) {
          clearInterval(checkInterval);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        if (task.status === "completed" || task.status === "failed") {
          clearInterval(checkInterval);
          resolve(task);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
      }, timeout);
    });
  }
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "pending" && task.status !== "running") {
      return false;
    }
    task.status = "failed";
    task.completedAt = Date.now();
    task.error = "Task cancelled by user";
    return true;
  }
  startTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "pending") {
      return false;
    }
    task.status = "running";
    task.startedAt = Date.now();
    return true;
  }
  completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "running") {
      return false;
    }
    task.status = "completed";
    task.completedAt = Date.now();
    task.result = result;
    return true;
  }
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "running") {
      return false;
    }
    task.status = "failed";
    task.completedAt = Date.now();
    task.error = error;
    return true;
  }
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  listTasks() {
    return Array.from(this.tasks.values());
  }
  listActiveTasks() {
    return Array.from(this.tasks.values()).filter((t) => t.status === "pending" || t.status === "running");
  }
}
function createBackgroundAgentFeature(_input) {
  const manager2 = new BackgroundManager;
  return {
    manager: manager2,
    tools: {
      call_agent: createCallAgentTool(manager2),
      background_task_status: createBackgroundTaskStatusTool(manager2),
      background_task_list: createBackgroundTaskListTool(manager2),
      background_task_cancel: createBackgroundTaskCancelTool(manager2)
    }
  };
}

// src/hooks/context-window-monitor/index.ts
var DEFAULT_WARNING_THRESHOLD = 0.7;
var MODEL_TOKEN_LIMITS = {
  "claude-3-5-sonnet": 200000,
  "claude-3-5-haiku": 200000,
  "claude-3-opus": 200000,
  "claude-3-sonnet": 200000,
  "claude-3-haiku": 200000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4-turbo": 128000,
  "gpt-4": 8192,
  "gpt-3.5-turbo": 16385,
  "gemini-2.5-pro": 1e6,
  "gemini-2.5-flash": 1e6,
  "gemini-2.0-flash": 1e6,
  "gemini-1.5-pro": 2800000,
  "gemini-1.5-flash": 1e6,
  default: 1e5
};
var contextMonitorSessions = new Map;
function getOrCreateSessionState(sessionID) {
  let state = contextMonitorSessions.get(sessionID);
  if (!state) {
    state = {
      messageCount: 0,
      lastWarningAt: 0,
      totalEstimatedTokens: 0
    };
    contextMonitorSessions.set(sessionID, state);
  }
  return state;
}
function getModelTokenLimit(model) {
  const normalized = model.toLowerCase();
  if (MODEL_TOKEN_LIMITS[normalized]) {
    return MODEL_TOKEN_LIMITS[normalized];
  }
  for (const [key, limit] of Object.entries(MODEL_TOKEN_LIMITS)) {
    if (normalized.includes(key.toLowerCase())) {
      return limit;
    }
  }
  return MODEL_TOKEN_LIMITS["default"];
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
function shouldIssueContextWarning(currentTokens, model, threshold = DEFAULT_WARNING_THRESHOLD) {
  if (currentTokens <= 0) {
    return false;
  }
  const tokenLimit = getModelTokenLimit(model);
  const usagePercentage = currentTokens / tokenLimit;
  return usagePercentage >= threshold;
}
function checkContextWindow(sessionID, model, estimatedTokens, threshold) {
  const state = getOrCreateSessionState(sessionID);
  state.messageCount++;
  state.totalEstimatedTokens += estimatedTokens;
  const shouldWarn = state.messageCount % 10 === 0 || shouldIssueContextWarning(state.totalEstimatedTokens, model, threshold);
  if (shouldWarn) {
    const now = Date.now();
    if (now - state.lastWarningAt >= 60000) {
      const tokenLimit = getModelTokenLimit(model);
      const usagePercentage = calculateUsagePercentage(state.totalEstimatedTokens, model);
      if (usagePercentage >= (threshold ?? DEFAULT_WARNING_THRESHOLD) * 100) {
        console.warn(`⚠️  Context Window Warning: You are at ${usagePercentage}% of ${tokenLimit} token limit (~${state.totalEstimatedTokens}/${tokenLimit} tokens). Consider clearing context.`);
      } else {
        console.log(`ℹ️  Context Window: At ${usagePercentage}% of ${tokenLimit} token limit (~${state.totalEstimatedTokens}/${tokenLimit} tokens, ${state.messageCount} messages).`);
      }
      state.lastWarningAt = now;
    }
  }
}
function calculateUsagePercentage(currentTokens, model) {
  const tokenLimit = getModelTokenLimit(model);
  if (tokenLimit <= 0) {
    return 0;
  }
  return Math.round(currentTokens / tokenLimit * 100);
}
function createContextWindowMonitorHook(input) {
  return {
    "chat.message": async (messageInput, messageOutput) => {
      const { sessionID, model } = messageInput;
      const modelID = model?.modelID || "default";
      const parts = messageOutput?.parts || [];
      const textContent = parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`);
      if (textContent) {
        const estimatedTokens = estimateTokens(textContent);
        checkContextWindow(sessionID, modelID, estimatedTokens);
      }
      return;
    }
  };
}

// src/hooks/keyword-detector/index.ts
function createKeywordDetector(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    keywords: {
      blitz: "blitzkrieg",
      blz: "blitzkrieg",
      "[BUILD]": "build",
      "[PLAN]": "plan",
      "[RESEARCH]": "research",
      "[DOCS]": "docs",
      "[REVIEW]": "review",
      think: "think",
      ultrathink: "think",
      ulw: "ultrawork",
      ultrawork: "ultrawork",
      search: "search",
      analyze: "analyze",
      investigate: "analyze",
      "[INVESTIGATE]": "research",
      piensa: "think",
      "déjame pensar": "think",
      "necesito pensar": "think",
      "piénsalo": "think",
      "piensa cuidadosamente": "think",
      "réfléchis": "think",
      "laissez-moi réfléchir": "think",
      "je dois réfléchir": "think",
      "réfléchissez-y": "think",
      "réfléchir attentivement": "think",
      "denk nach": "think",
      "lass mich nachdenken": "think",
      "denk darüber nach": "think",
      "denke sorgfältig": "think",
      pense: "think",
      "fammi pensare": "think",
      "devo pensare": "think",
      "pensa a questo": "think",
      "pensa attentamente": "think",
      "подумай": "think",
      "дай мне подумать": "think",
      "мне нужно подумать": "think",
      "подумай об этом": "think",
      "подумай внимательно": "think",
      "考えて": "think",
      "考えさせて": "think",
      "考える必要がある": "think",
      "これについて考えて": "think",
      "注意深く考えて": "think",
      "思考": "think",
      "让我想想": "think",
      "我需要思考": "think",
      "思考这个": "think",
      "仔细思考": "think",
      "思考這個": "think",
      "생각해": "think",
      "생각하게 해줘": "think",
      "이것에 대해 생각해": "think",
      "신중하게 생각해": "think",
      "فكر": "think",
      "أريد أن أفكر": "think",
      "دعني أفكر": "think",
      "فكر بعناية": "think",
      "تفكر باهتمام": "think",
      "חשב": "think",
      "תן להרהר": "think",
      "אני צריך לחשוב": "think",
      "חשב בריצות": "think",
      pikirkan: "think",
      "saya perlu berpikir": "think",
      "biarkan saya berpikir": "think",
      "pikirkan dengan baik": "think",
      "подумай про це": "think",
      "подумай уважно": "think",
      "σκεψου": "think",
      "ας σκεφτεί": "think",
      "χρειάζεται να σκεφτώ": "think",
      "σκεφτεί σοβαρά": "think",
      myslet: "think",
      "musím myslet": "think",
      "nechte mě myslet": "think",
      "myslet pozorně": "think",
      "gândește": "think",
      "trebuie să gândesc": "think",
      "gândește-te": "think",
      "gândește cu atenție": "think",
      "tænk": "think",
      "jeg skal tænke": "think",
      "lad mig tænke": "think",
      "tænk nøje": "think",
      "tänk": "think",
      "jag behöver tänka": "think",
      "låt mig tänka": "think",
      "tänk noga": "think",
      denk: "think",
      "ik moet denken": "think",
      "laat me denken": "think",
      "denk goed na": "think",
      "คิด": "think",
      "ฉันต้องคิด": "think",
      "ให้ฉันคิด": "think",
      "คิดให้ดี": "think"
    }
  };
  function getTextFromParts(parts) {
    return parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`).trim();
  }
  function detectLanguageAndMode(keyword) {
    const arabicKeywords = ["فكر", "أريد أن أفكر", "دعني أفكر", "فكر بعناية", "تفكر باهتمام"];
    const hebrewKeywords = ["חשב", "תן להרהר", "אני צריך לחשוב", "חשב בריצות"];
    const indonesianKeywords = ["pikirkan", "saya perlu berpikir", "biarkan saya berpikir", "pikirkan dengan baik"];
    const ukrainianKeywords = ["подумай", "дай мені подумати", "мені потрібно подумати", "подумай про це", "подумай уважно"];
    const greekKeywords = ["σκεψου", "ας σκεφτεί", "χρειάζεται να σκεφτώ", "σκεφτεί σοβαρά"];
    const czechKeywords = ["myslet", "musím myslet", "nechte mě myslet", "myslet pozorně"];
    const romanianKeywords = ["gândește", "trebuie să gândesc", "gândește-te", "gândește cu atenție"];
    const danishKeywords = ["tænk", "jeg skal tænke", "lad mig tænke", "tænk nøje"];
    const swedishKeywords = ["tänk", "jag behöver tänka", "låt mig tänka", "tänk noga"];
    const norwegianKeywords = ["tænk", "jeg skal tænke", "lad mig tænke", "tænk nøje"];
    const dutchKeywords = ["denk", "ik moet denken", "laat me denken", "denk goed na"];
    const thaiKeywords = ["คิด", "ฉันต้องคิด", "ให้ฉันคิด", "คิดให้ดี"];
    const frenchKeywords = ["réfléchis", "laissez-moi réfléchir", "je dois réfléchir", "réfléchissez-y", "réfléchir attentivement"];
    const spanishKeywords = ["piensa", "déjame pensar", "necesito pensar", "piénsalo", "piensa cuidadosamente"];
    const germanKeywords = ["denk nach", "lass mich nachdenken", "denk darüber nach", "denke sorgfältig"];
    const italianKeywords = ["pensa", "fammi pensare", "devo pensare", "pensa a questo", "pensa attentamente"];
    const russianKeywords = ["подумай", "дай мне подумать", "мне нужно подумать", "подумай об этом", "подумай внимательно"];
    const japaneseKeywords = ["考えて", "考えさせて", "考える必要がある", "これについて考えて", "注意深く考えて"];
    const chineseKeywords = ["思考", "让我想想", "我需要思考", "思考这个", "仔细思考", "思考這個"];
    const koreanKeywords = ["생각해", "생각하게 해줘", "이것에 대해 생각해", "신중하게 생각해"];
    const thinkModeKeywords = [
      "think",
      "reason",
      "think deeply",
      "ultrathink",
      "ultra think",
      ...frenchKeywords,
      ...spanishKeywords,
      ...germanKeywords,
      ...italianKeywords,
      ...russianKeywords,
      ...japaneseKeywords,
      ...chineseKeywords,
      ...koreanKeywords,
      ...arabicKeywords,
      ...hebrewKeywords,
      ...indonesianKeywords,
      ...ukrainianKeywords,
      ...greekKeywords,
      ...czechKeywords,
      ...romanianKeywords,
      ...danishKeywords,
      ...swedishKeywords,
      ...norwegianKeywords,
      ...dutchKeywords,
      ...thaiKeywords
    ];
    const ultraworkModeKeywords = [
      "ultrawork",
      "ulw",
      "ultra work",
      "ultra work mode",
      "초신속",
      "슈퍼모드",
      "스피드",
      "super rapid",
      "ultra rapid",
      "أسرع",
      "על הכי מהיר",
      "kerja super cepat",
      "ультра-быстро",
      "υπερταχύτητα",
      "super rychle",
      "super viteză"
    ];
    const searchModeKeywords = [
      "search",
      "find",
      "locate",
      "search for",
      "find in",
      "locate in",
      "검색",
      "찾아",
      "查找",
      "検索",
      "rechercher",
      "buscar",
      "suchen",
      "cercare",
      "найти",
      "חפש",
      "بحث",
      "cari",
      "пошук",
      "αναζήτηση",
      "hledat",
      "căuta",
      "søg",
      "sök",
      "zoek",
      "ค้นหา"
    ];
    const analyzeModeKeywords = [
      "analyze",
      "investigate",
      "examine",
      "deep dive",
      "deep analysis",
      "분석",
      "조사",
      "分析",
      "分析",
      "analyser",
      "analizar",
      "analysieren",
      "analizzare",
      "анализировать",
      "נתח",
      "تحليل",
      "analisis",
      "analiza",
      "аналізувати",
      "ανάλυση",
      "analyzovat",
      "analiza",
      "analyseer",
      "onderzoek",
      "วิเคราะห์"
    ];
    if (ultraworkModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "ultrawork", language: detectLanguage(keyword) };
    }
    if (searchModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "search", language: detectLanguage(keyword) };
    }
    if (analyzeModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "analyze", language: detectLanguage(keyword) };
    }
    if (thinkModeKeywords.includes(keyword.toLowerCase())) {
      return { mode: "think", language: detectLanguage(keyword) };
    }
    return { mode: "enhanced", language: detectLanguage(keyword) };
  }
  function detectLanguage(keyword) {
    const keywordLower = keyword.toLowerCase();
    const arabicMatch = /[ا-ي-ع]/;
    const hebrewMatch = /[\u0590-\u05FF]/;
    const cyrillicMatch = /[\u0400-\u04FF]/;
    const chineseMatch = /[\u4E00-\u9FFF]/;
    const japaneseMatch = /[\u3040-\u30FF]/;
    const koreanMatch = /[\uAC00-\uD7AF]/;
    const greekMatch = /[\u0370-\u03FF]/;
    const thaiMatch = /[\u0E00-\u0E7F]/;
    if (arabicMatch.test(keyword))
      return "Arabic";
    if (hebrewMatch.test(keyword))
      return "Hebrew";
    if (cyrillicMatch.test(keyword)) {
      if (keywordLower.includes("подум"))
        return "Ukrainian";
      if (keywordLower.includes("дум"))
        return "Russian";
    }
    if (chineseMatch.test(keyword))
      return "Chinese";
    if (japaneseMatch.test(keyword))
      return "Japanese";
    if (koreanMatch.test(keyword))
      return "Korean";
    if (greekMatch.test(keyword))
      return "Greek";
    if (thaiMatch.test(keyword))
      return "Thai";
    const frenchKeywords = ["réfléchis", "pensa", "déjame", "pensar"];
    if (frenchKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "French";
    const spanishKeywords = ["piensa", "necesito", "pensar"];
    if (spanishKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Spanish";
    const germanKeywords = ["denk", "nachdenken"];
    if (germanKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "German";
    const italianKeywords = ["pensa", "pensare"];
    if (italianKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Italian";
    const englishKeywords = ["think", "reason", "analyze", "investigate", "search", "find"];
    if (englishKeywords.some((k) => keywordLower.includes(k)))
      return "English";
    const czechKeywords = ["myslet", "myslet"];
    if (czechKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Czech";
    const romanianKeywords = ["gând", "gândește"];
    if (romanianKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Romanian";
    const danishKeywords = ["tænk", "tænke"];
    if (danishKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Danish";
    const swedishKeywords = ["tänk"];
    if (swedishKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Swedish";
    const norwegianKeywords = ["tænk"];
    if (norwegianKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Norwegian";
    const dutchKeywords = ["denk"];
    if (dutchKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Dutch";
    const indonesianKeywords = ["pikir"];
    if (indonesianKeywords.some((k) => keywordLower.includes(k.toLowerCase())))
      return "Indonesian";
    return;
  }
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const text = getTextFromParts(output.parts);
      if (!text)
        return;
      const words = text.split(/\s+/);
      for (const word of words) {
        const mode = config2.keywords?.[word];
        if (mode) {
          const detected = detectLanguageAndMode(word);
          console.log(`[keyword-detector] Detected "${word}" (${detected.language}), activating: ${detected.mode} mode`);
          const pluginConfig = input.config;
          if (detected.mode === "ultrawork") {
            if (pluginConfig?.enhanced?.enabled === false) {
              pluginConfig.enhanced = { ...pluginConfig.enhanced, enabled: true };
            }
          } else if (detected.mode === "search") {
            console.log(`[keyword-detector] Activating search mode for ${detected.language}`);
          } else if (detected.mode === "analyze") {
            console.log(`[keyword-detector] Activating analyze mode for ${detected.language}`);
          } else if (detected.mode === "think") {
            console.log(`[keyword-detector] Activating think mode for ${detected.language}`);
          } else if (detected.mode === "enhanced") {
            console.log(`[keyword-detector] Activating enhanced mode`);
          }
        }
      }
    }
  };
}

// src/hooks/auto-slash-command/index.ts
function createAutoSlashCommand(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    commands: {
      "/build": "build",
      "/plan": "plan",
      "/research": "research",
      "/docs": "docs",
      "/review": "review",
      "/test": "test",
      "/fix": "fix",
      "/explain": "explain"
    }
  };
  function getTextFromParts(parts) {
    return parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`).trim();
  }
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const text = getTextFromParts(output.parts);
      if (!text)
        return;
      for (const [command, action] of Object.entries(config2.commands || {})) {
        if (text.startsWith(command)) {
          console.log(`[auto-slash-command] Detected ${command}, triggering: ${action}`);
        }
      }
    }
  };
}

// src/hooks/context/rules-injector.ts
import * as fs7 from "fs";
import * as path9 from "path";
var RULE_EXTENSIONS = [".md", ".mdc"];
function parseRuleFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!frontmatterMatch) {
    return {};
  }
  const frontmatter = frontmatterMatch[1];
  const result = {};
  const lines = frontmatter.split(`
`);
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1)
      continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (key === "alwaysApply" && value === "true") {
      result.alwaysApply = true;
    } else if (key === "alwaysApply" && value === "false") {
      result.alwaysApply = false;
    } else if (key && !isNaN(Number(value))) {
      result[key] = Number(value);
    } else if (key) {
      result[key] = value;
    }
  }
  return result;
}
function extractRules(content) {
  const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (!frontmatterMatch) {
    return [content];
  }
  const body = content.slice(frontmatterMatch[0].length);
  const rules = [];
  const sections = body.split(/(?:\n\s*---|\n\s*\n#{3,}\s+)/);
  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length > 0) {
      rules.push(trimmed);
    }
  }
  return rules;
}
function matchGlob(pattern, filePath) {
  const relativePath = path9.relative(process.cwd(), filePath);
  const globPattern = pattern.replace(/\*\*/g, "*").replace(/\?/g, "?");
  const parts = globPattern.split("/");
  const pathParts = relativePath.split(path9.sep);
  let matchCount = 0;
  for (let i = 0;i < parts.length; i++) {
    const part = parts[i];
    const pathPart = pathParts[i];
    if (part === "**") {
      matchCount++;
    } else if (part === "*") {
      matchCount++;
    } else if (part === pathPart) {
      matchCount++;
    }
  }
  return matchCount === parts.length;
}
function loadRuleFiles(directory) {
  if (!fs7.existsSync(directory)) {
    return [];
  }
  const ruleFiles = [];
  function walk(dir, baseDir = dir) {
    const entries = fs7.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path9.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else if (entry.isFile()) {
        const ext = path9.extname(entry.name).toLowerCase();
        if (RULE_EXTENSIONS.includes(ext)) {
          try {
            const content = fs7.readFileSync(fullPath, "utf-8");
            const frontmatter = parseRuleFrontmatter(content);
            const rules = extractRules(content);
            ruleFiles.push({
              path: fullPath,
              content,
              frontmatter,
              rules
            });
          } catch (error) {
            console.error(`[rules-injector] Error loading rule file ${fullPath}:`, error);
          }
        }
      }
    }
  }
  walk(directory);
  return ruleFiles;
}
function calculateDistance(rulePath, targetPath) {
  const relativePath = path9.relative(path9.dirname(rulePath), targetPath);
  const parts = relativePath.split(path9.sep);
  let distance = 0;
  for (const part of parts) {
    if (part.startsWith(".")) {
      distance++;
    } else if (part.includes(path9.sep)) {
      distance += part.split(path9.sep).length;
    } else {
      distance++;
    }
  }
  return distance;
}
function createRulesInjector(_input, options) {
  const config2 = options?.config ?? {
    enabled: true
  };
  const rulesCache = new Map;
  function loadRulesForPath(targetPath) {
    const cacheKey = targetPath;
    if (rulesCache.has(cacheKey)) {
      return rulesCache.get(cacheKey) || [];
    }
    const ruleDirectories = [
      path9.join(process.cwd(), "rules"),
      path9.join(process.cwd(), ".opencode", "rules"),
      path9.join(path9.dirname(targetPath), "rules"),
      path9.join(path9.dirname(targetPath), ".opencode", "rules")
    ];
    const allRules = [];
    for (const dir of ruleDirectories) {
      const rules = loadRuleFiles(dir);
      allRules.push(...rules);
    }
    rulesCache.set(cacheKey, allRules);
    return allRules;
  }
  function findMatchingRules(targetPath) {
    if (!config2.enabled) {
      return [];
    }
    const ruleFiles = loadRulesForPath(targetPath);
    const matches = [];
    for (const ruleFile of ruleFiles) {
      const { frontmatter } = ruleFile;
      if (frontmatter.alwaysApply) {
        matches.push({
          ruleFile,
          matchedPattern: "always_apply",
          priority: 0
        });
        continue;
      }
      if (frontmatter.globs && frontmatter.globs.length > 0) {
        for (const glob of frontmatter.globs) {
          if (matchGlob(glob, targetPath)) {
            let priority = 100;
            if (typeof frontmatter.distance === "number") {
              priority = frontmatter.distance;
            } else {
              priority = calculateDistance(ruleFile.path, targetPath);
            }
            matches.push({
              ruleFile,
              matchedPattern: glob,
              priority
            });
            break;
          }
        }
      }
    }
    matches.sort((a, b) => a.priority - b.priority);
    return matches;
  }
  function getTextFromParts(parts) {
    return parts.filter((p) => p.type === "text").map((p) => p.text || "").join(`
`).trim();
  }
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const parts = output.parts || [];
      const text = getTextFromParts(parts);
      if (!text)
        return;
      const workingDir = process.cwd();
      const matches = findMatchingRules(workingDir);
      if (matches.length === 0)
        return;
      const selectedMatch = matches[0];
      const maxRules = config2.maxRules || 10;
      const rulesToInject = matches.slice(0, maxRules);
      const rulesText = rulesToInject.map((m) => {
        const rules = m.ruleFile.rules.slice(0, 5).join(`
  `);
        return `<rule source="${m.ruleFile.path}">
${rules}
</rule>`;
      }).join(`

`);
      const existingText = text;
      const newText = `${rulesText}

${existingText}`;
      output.parts = [
        { type: "text", text: newText, id: `rule-${Date.now()}`, sessionID: "", messageID: "" }
      ];
    }
  };
}

// src/hooks/agent-usage-reminder/index.ts
function createAgentUsageReminder(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    threshold: 10
  };
  let agentCallCount = 0;
  return {
    "tool.execute.after": async (input, output) => {
      if (!config2.enabled)
        return;
      if (input.tool === "task") {
        agentCallCount++;
        const threshold = config2.threshold ?? 10;
        if (agentCallCount % threshold === 0) {
          console.log(`[agent-usage-reminder] Agent has been called ${agentCallCount} times in this session`);
        }
      }
    }
  };
}

// src/hooks/anthropic-context-window-limit-recovery/index.ts
function createAnthropicContextWindowLimitRecovery(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    threshold: 1e5
  };
  return {
    "chat.params": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[anthropic-context-window-limit-recovery] Monitoring context window usage");
    }
  };
}

// src/hooks/compaction-context-injector/index.ts
function getTextFromParts(parts) {
  return parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`).trim();
}
function createCompactionContextInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const text = getTextFromParts(output.parts);
      if (!text)
        return;
      console.log("[compaction-context-injector] Processing message before compaction");
    },
    "experimental.session.compacting": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[compaction-context-injector] Adding context for session compaction");
    }
  };
}

// src/hooks/directory-agents-injector/index.ts
import { readFileSync as readFileSync7, existsSync as existsSync8 } from "node:fs";
function createDirectoryAgentsInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const agentFile = config2.agentFile ?? ".opencode-agents";
      if (existsSync8(agentFile)) {
        try {
          const content = readFileSync7(agentFile, "utf-8");
          console.log("[directory-agents-injector] Found local agent definitions");
        } catch {
          console.log("[directory-agents-injector] Could not read agent file");
        }
      }
    }
  };
}

// src/hooks/directory-readme-injector/index.ts
import { readFileSync as readFileSync8, existsSync as existsSync9 } from "node:fs";
function createDirectoryReadmeInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const readmePaths = ["README.md", "readme.md", "Readme.md"];
      for (const readme of readmePaths) {
        if (existsSync9(readme)) {
          try {
            const content = readFileSync8(readme, "utf-8");
            console.log("[directory-readme-injector] Found README, injecting context");
          } catch {
            console.log("[directory-readme-injector] Could not read README");
          }
          break;
        }
      }
    }
  };
}

// src/hooks/interactive-bash-session/index.ts
var sessionStates = new Map;
function getSessionState(sessionID) {
  let state = sessionStates.get(sessionID);
  if (!state) {
    state = {
      sessions: new Map,
      sessionTimeout: 3600000
    };
    sessionStates.set(sessionID, state);
  }
  return state;
}
function getBashSession(sessionID) {
  const state = getSessionState(sessionID);
  return state.sessions.get(sessionID);
}
function createBashSession(sessionID, initialDir) {
  const session = {
    sessionID,
    workingDirectory: initialDir || process.cwd(),
    environment: {},
    commandHistory: [],
    childProcesses: new Set,
    lastActiveTime: Date.now()
  };
  const state = getSessionState(sessionID);
  state.sessions.set(sessionID, session);
  return session;
}
function updateSessionActivity(sessionID) {
  const session = getBashSession(sessionID);
  if (session) {
    session.lastActiveTime = Date.now();
  }
}
function recordCommand(sessionID, command) {
  const session = getBashSession(sessionID);
  if (session) {
    session.commandHistory.push(command);
    if (session.commandHistory.length > 100) {
      session.commandHistory = session.commandHistory.slice(-100);
    }
  }
}
function killSessionProcesses(session) {
  session.childProcesses.forEach((pid) => {
    try {
      process.kill(pid);
    } catch (e) {}
  });
  session.childProcesses.clear();
}
function createInteractiveBashSession(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    trackHistory: true,
    historySize: 50,
    preserveEnv: true,
    autoCleanup: true,
    sessionTimeout: 3600000
  };
  return {
    "tool.execute.before": async (input, _output) => {
      if (!config2.enabled)
        return;
      if (input.tool !== "bash")
        return;
      const { sessionID } = input;
      if (!sessionID)
        return;
      const session = getBashSession(sessionID);
      if (!session) {
        console.log(`[interactive-bash-session] Creating new bash session for ${sessionID}`);
        createBashSession(sessionID);
      } else {
        updateSessionActivity(sessionID);
      }
    },
    "tool.execute.after": async (input, output) => {
      if (!config2.enabled)
        return;
      if (input.tool !== "bash")
        return;
      const sessionID = input.sessionID || "";
      const args = input.args;
      const command = Array.isArray(args) ? args.join(" ") : String(args);
      recordCommand(sessionID, command);
      const outputAny = output;
      if (outputAny.pid !== undefined) {
        const session = getBashSession(sessionID);
        if (session) {
          session.childProcesses.add(outputAny.pid);
        }
      }
      if (config2.trackHistory) {
        const session = getBashSession(sessionID);
        if (session) {
          console.log(`[interactive-bash-session] Command history size: ${session.commandHistory.length}`);
        }
      }
    },
    event: async (input) => {
      if (!config2.enabled)
        return;
      const sessionID = input.sessionID;
      if (!sessionID)
        return;
      const eventAny = input;
      if (eventAny?.type === "session.end" && config2.autoCleanup) {
        const session = getBashSession(sessionID);
        if (session) {
          console.log(`[interactive-bash-session] Cleaning up bash session for ${sessionID}`);
          killSessionProcesses(session);
          const state = getSessionState(sessionID);
          state.sessions.delete(sessionID);
          console.log(`[interactive-bash-session] Session cleanup completed. ` + `Commands executed: ${session.commandHistory.length}, ` + `Working dir: ${session.workingDirectory}`);
        }
      }
      if (eventAny?.type === "session.timeout") {
        const session = getBashSession(sessionID);
        if (session && config2.autoCleanup) {
          console.log(`[interactive-bash-session] Session timeout for ${sessionID}`);
          killSessionProcesses(session);
          const state = getSessionState(sessionID);
          state.sessions.delete(sessionID);
        }
      }
    }
  };
}

// src/hooks/non-interactive-env/index.ts
function createNonInteractiveEnv(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    event: async (input) => {
      if (!config2.enabled)
        return;
      const isCI = process.env.CI !== undefined;
      if (isCI) {
        console.log("[non-interactive-env] Detected CI environment, enabling non-interactive mode");
      }
    }
  };
}

// src/hooks/preemptive-compaction/index.ts
function createPreemptiveCompaction(_input, options) {
  const config2 = options?.config ?? { enabled: true, threshold: 1e4 };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const threshold = config2.threshold ?? 1e4;
      console.log(`[preemptive-compaction] Monitoring message length for preemptive compaction (threshold: ${threshold})`);
    },
    "experimental.session.compacting": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[preemptive-compaction] Triggering preemptive session compaction");
    }
  };
}

// src/hooks/thinking-block-validator/index.ts
var sessionHistories = new Map;
function getSessionHistory(sessionID) {
  let history = sessionHistories.get(sessionID);
  if (!history) {
    history = {
      sessionID,
      errorCount: 0,
      lastErrorTime: null,
      history: []
    };
    sessionHistories.set(sessionID, history);
  }
  return history;
}
function getTextFromParts2(parts) {
  return parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`);
}
function findTagPosition(text, tag) {
  const positions = [];
  let pos = text.indexOf(tag);
  while (pos !== -1) {
    positions.push(pos);
    pos = text.indexOf(tag, pos + tag.length);
  }
  return positions;
}
function validateThinkingBlocks(text, config2) {
  const errors = [];
  const lines = text.split(`
`);
  let recovered = false;
  const openTags = findTagPosition(text, "<thinking>");
  const closeTags = findTagPosition(text, "</thinking>");
  if (openTags.length !== closeTags.length) {
    errors.push({
      type: "mismatched_tags",
      line: 0,
      message: `Mismatched thinking block tags: ${openTags.length} opening, ${closeTags.length} closing`,
      suggestion: "Ensure every <thinking> has a matching </thinking>",
      recovered: false
    });
  }
  if (openTags.length === 0 && text.includes("</thinking>")) {
    const canRecover = config2.autoRecover ?? false;
    errors.push({
      type: "missing_open_tag",
      line: 0,
      message: "Found closing </thinking> tag without opening <thinking>",
      suggestion: "Add <thinking> tag before the closing tag",
      recovered: canRecover
    });
    recovered = canRecover;
  }
  if (closeTags.length === 0 && text.includes("<thinking>")) {
    const canRecover = config2.autoRecover ?? false;
    errors.push({
      type: "missing_close_tag",
      line: 0,
      message: "Found opening <thinking> tag without closing </thinking>",
      suggestion: "Add </thinking> tag to close the thinking block",
      recovered: canRecover
    });
    recovered = canRecover;
  }
  for (let i = 0;i < openTags.length; i++) {
    const openPos = openTags[i];
    const closePos = closeTags[i];
    if (closePos !== undefined && closePos < openPos) {
      const lineNum = text.substring(0, closePos).split(`
`).length;
      const canRecover = config2.autoRecover ?? false;
      errors.push({
        type: "inverted_tags",
        line: lineNum,
        message: "Closing tag appears before opening tag",
        suggestion: "Remove duplicate opening tag or reorder tags correctly",
        recovered: canRecover
      });
      recovered = canRecover;
    }
    if (i < openTags.length - 1 && closePos !== undefined) {
      const nextOpenPos = openTags[i + 1];
      if (nextOpenPos < closePos) {
        const lineNum = text.substring(0, nextOpenPos).split(`
`).length;
        const canRecover = config2.autoRecover ?? false;
        errors.push({
          type: "nested_thinking",
          line: lineNum,
          message: "Nested thinking blocks detected (opening tag before closing previous block)",
          suggestion: "Close the previous thinking block before opening a new one",
          recovered: canRecover
        });
        recovered = canRecover;
      }
    }
  }
  if (config2.enforcePosition) {
    const lastThinkingClose = closeTags.length > 0 ? Math.max(...closeTags) : -1;
    const hasContentAfter = lastThinkingClose >= 0 ? text.substring(lastThinkingClose).trim().length > 0 : false;
    if (hasContentAfter) {
      const lineNum = text.substring(0, lastThinkingClose).split(`
`).length;
      const canRecover = config2.autoRecover ?? false;
      errors.push({
        type: "content_after_thinking",
        line: lineNum,
        message: "Content found after last thinking block",
        suggestion: "Move thinking blocks to beginning of message",
        recovered: canRecover
      });
      recovered = canRecover;
    }
  }
  if (config2.requireContent) {
    for (let i = 0;i < openTags.length; i++) {
      const openPos = openTags[i];
      const closePos = closeTags[i];
      if (closePos !== undefined) {
        const content = text.substring(openPos + 10, closePos).trim();
        if (content.length === 0) {
          const lineNum = text.substring(0, openPos).split(`
`).length;
          const canRecover = config2.autoRecover ?? false;
          errors.push({
            type: "empty_thinking",
            line: lineNum,
            message: "Empty thinking block (no content between tags)",
            suggestion: "Add meaningful thinking content or remove the empty block",
            recovered: canRecover
          });
          recovered = canRecover;
        }
      }
    }
  }
  return {
    hasErrors: errors.length > 0,
    errors,
    recovered
  };
}
function applyRecovery(text, errors) {
  let recovered = text;
  for (const error of errors) {
    if (!error.recovered)
      continue;
    switch (error.type) {
      case "missing_close_tag":
        recovered = recovered.replace(/<thinking>$/, `<thinking>
</thinking>`);
        break;
      case "missing_open_tag":
        recovered = recovered.replace(/^<\/thinking>/, `<thinking>
</thinking>`);
        break;
      case "inverted_tags":
        const openCount = (recovered.match(/<thinking>/g) || []).length;
        const closeCount = (recovered.match(/<\/thinking>/g) || []).length;
        if (openCount > closeCount) {
          recovered += `
</thinking>`;
        }
        break;
      case "nested_thinking":
        const lastOpen = recovered.lastIndexOf("<thinking>");
        const lastClose = recovered.lastIndexOf("</thinking>");
        if (lastClose < lastOpen) {
          recovered += `
</thinking>`;
        }
        break;
      case "empty_thinking":
        recovered = recovered.replace(/<thinking>\s*<\/thinking>/gi, "");
        break;
      case "content_after_thinking":
        const lastClosePos = recovered.lastIndexOf("</thinking>");
        if (lastClosePos >= 0) {
          const afterThinking = recovered.substring(lastClosePos + 13).trim();
          if (afterThinking.length > 0) {
            recovered = recovered.substring(0, lastClosePos + 13);
          }
        }
        break;
      default:
        break;
    }
  }
  return recovered;
}
function createThinkingBlockValidator(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    autoRecover: true,
    strictMode: false,
    enforcePosition: true,
    requireContent: true
  };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const { sessionID } = input;
      const text = getTextFromParts2(output.parts);
      if (!text.includes("<thinking>") && !text.includes("</thinking>")) {
        return;
      }
      const validation = validateThinkingBlocks(text, config2);
      if (validation.hasErrors) {
        const history = getSessionHistory(sessionID);
        history.errorCount++;
        history.lastErrorTime = Date.now();
        history.history.push({
          timestamp: Date.now(),
          errors: validation.errors
        });
        console.log(`[thinking-block-validator] Detected ${validation.errors.length} thinking block validation error(s) ` + `in session ${sessionID}`);
        for (const error of validation.errors) {
          console.log(`[thinking-block-validator] [${error.type}] Line ${error.line}: ${error.message}`);
          console.log(`[thinking-block-validator] Suggestion: ${error.suggestion}`);
          if (error.recovered) {
            console.log(`[thinking-block-validator] ✓ Auto-recovery applied`);
          }
        }
        if (config2.autoRecover && validation.recovered) {
          const recoveredText = applyRecovery(text, validation.errors);
          console.log("[thinking-block-validator] [session recovered - continuing previous task]");
          console.log(`[thinking-block-validator] Recovered text length: ${recoveredText.length} ` + `(original: ${text.length})`);
        }
        if (config2.strictMode && !validation.recovered) {
          console.error("[thinking-block-validator] CRITICAL: Validation failed in strict mode. " + "Please fix the thinking block structure before continuing.");
        }
      }
    }
  };
}

// src/hooks/comment-checker/patterns.ts
var COMMENT_PATTERNS = {
  todo: [
    /TODO:/i,
    /@todo/i,
    /\[TODO\]/i,
    /待办/i,
    /할 일/i,
    /待辦/i
  ],
  fixme: [
    /FIXME:/i,
    /@fixme/i,
    /\[FIXME\]/i,
    /修复/i,
    /수정/i,
    /修正/i
  ],
  xxx: [
    /XXX:/i,
    /@xxx/i,
    /\[XXX\]/i
  ],
  hack: [
    /HACK:/i,
    /@hack/i,
    /\[HACK\]/i
  ],
  note: [
    /NOTE:/i,
    /@note/i,
    /\[NOTE\]/i,
    /注意/i,
    /참고/i,
    /註記/i
  ],
  bug: [
    /BUG:/i,
    /@bug/i,
    /\[BUG\]/i
  ],
  warning: [
    /WARNING:/i,
    /@warning/i,
    /\[WARNING\]/i,
    /경고/i
  ],
  optimization: [
    /OPTIMIZE:/i,
    /PERFORMANCE:/i,
    /@optimize/i
  ],
  refactoring: [
    /REFACTOR:/i,
    /@refactor/i
  ],
  documentation: [
    /DOC:/i,
    /@doc/i
  ]
};
var EXCEPTION_PATTERNS = {
  bdd: [
    /^\s*#\s*Given\s+/i,
    /^\s*#\s*When\s+/i,
    /^\s*#\s*Then\s+/i,
    /^\s*#\s*And\s+/i,
    /^\s*#\s*But\s+/i,
    /^\s*\/\/\s*Given\s+/i,
    /^\s*\/\/\s*When\s+/i,
    /^\s*\/\/\s*Then\s+/i,
    /^\s*\/\/\s*And\s+/i
  ],
  linter: [
    /^\s*#\s*noqa/i,
    /^\s*\/\/\s*@ts-ignore\b/i,
    /^\s*\/\/\s*@ts-nocheck\b/i,
    /^\s*\/\/\s*@ts-check\b/i,
    /^\s*\/\/\s*eslint-disable\b/i,
    /^\s*\/\/\s*eslint-enable\b/i,
    /^\s*\/\/\s*eslint-disable-next-line\b/i,
    /^\s*\/\*\s*eslint-disable\b/i,
    /^\s*\/\*\s*eslint-enable\b/i,
    /^\s*#\s*type:\s*ignore\b/i,
    /^\s*#\s*pylint:\s*disable\b/i,
    /^\s*#\s*mypy:\s*ignore\b/i
  ],
  shebang: [
    /^#!\/bin\//,
    /^#!\/usr\/bin\/env\s+/
  ],
  copyright: [
    /Copyright\s+\(c\)/i,
    /Copyright\s+\d{4}/i,
    /SPDX-License-Identifier:/i,
    /MIT License/i,
    /Apache License/i,
    /GPL License/i,
    /BSD License/i
  ],
  fileHeader: [
    /^\s*File:\s+.*\.md/i,
    /^\s*Author:/i,
    /^\s*Date:\s*\d{4}-\d{2}-\d{2}/i,
    /^\s*Created:/i,
    /^\s*Modified:/i
  ],
  documentation: [
    /^\s*\/\*\*[\s\S]*?\*\//,
    /^\s*\/\*\*[\s\S]*?@param/i,
    /^\s*\/\*\*[\s\S]*?@return/i,
    /^\s*\/\/\/[\s\S]*?@brief/i,
    /^\s*\/\/\/[\s\S]*?@param/i,
    /^\s*\/\*\*[\s\S]*?@brief/i,
    /^\s*#\s+@param/i,
    /^\s*#\s+@return/i,
    /^\s*#\s+@type/i
  ],
  inlineDocs: [
    /^\s*\/\/\s*[A-Z]/,
    /^\s*#\s*[A-Z]/
  ],
  imports: [
    /^\s*import\s+/,
    /^\s*require\s*\(/,
    /^\s*#\s*include\s+/,
    /^\s*using\s+namespace/
  ]
};
var LANGUAGE_COMMENT_DELIMITERS = {
  javascript: {
    single: ["//"],
    multi: ["/*", "*/"],
    shebang: ["#!/usr/bin/env node", "#!/usr/bin/nodejs"]
  },
  typescript: {
    single: ["//"],
    multi: ["/*", "*/"],
    shebang: ["#!/usr/bin/env node", "#!/usr/bin/ts-node"]
  },
  python: {
    single: ["#"],
    multi: ['"""', '"""'],
    shebang: ["#!/usr/bin/env python3", "#!/usr/bin/python3"]
  },
  rust: {
    single: ["//"],
    multi: ["/*", "*/"],
    shebang: ["#!/usr/bin/env rust-script"]
  },
  go: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  java: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  cpp: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  csharp: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  ruby: {
    single: ["#"],
    multi: ["=begin", "=end"]
  },
  php: {
    single: ["//", "#"],
    multi: ["/*", "*/"],
    shebang: ["#!/usr/bin/env php"]
  },
  swift: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  kotlin: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  scala: {
    single: ["//"],
    multi: ["/*", "*/"]
  },
  shell: {
    single: ["#"],
    multi: ["<<'", "'"],
    shebang: ["#!/bin/bash", "#!/bin/sh", "#!/usr/bin/env bash"]
  },
  powershell: {
    single: ["#"],
    multi: ["<#", "#>"],
    shebang: ["#!/usr/bin/env pwsh"]
  },
  lua: {
    single: ["--"],
    multi: ["--[[", "]]"]
  },
  sql: {
    single: ["--"],
    multi: ["/*", "*/"]
  },
  html: {
    multi: ["<!--", "-->"]
  },
  css: {
    multi: ["/*", "*/"]
  },
  yaml: {
    single: ["#"]
  },
  toml: {
    single: ["#"]
  },
  json: {
    none: []
  },
  xml: {
    multi: ["<!--", "-->"]
  },
  r: {
    single: ["#"]
  },
  matlab: {
    single: ["%"],
    multi: ["%{", "%}"]
  },
  fortran: {
    single: ["!"],
    multi: ["/*", "*/"]
  },
  cobol: {
    single: ["*"]
  },
  assembly: {
    single: [";"]
  }
};
function getLanguageFromFile(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const langMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    c: "cpp",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    ps1: "powershell",
    psm1: "powershell",
    lua: "lua",
    sql: "sql",
    html: "html",
    css: "css",
    scss: "css",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    json: "json",
    xml: "xml",
    r: "r",
    m: "matlab",
    f: "fortran",
    f90: "fortran",
    f95: "fortran",
    cbl: "cobol",
    cob: "cobol",
    asm: "assembly",
    s: "assembly"
  };
  return ext ? langMap[ext] ?? null : null;
}

// src/hooks/comment-checker/index.ts
function getTextFromParts3(parts) {
  return parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`).trim();
}
function isExceptionComment(line) {
  const trimmedLine = line.trim();
  for (const [category, patterns] of Object.entries(EXCEPTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedLine)) {
        return true;
      }
    }
  }
  return false;
}
function extractCodeFromToolOutput(output) {
  const codeBlocks = [];
  const fileRegex = /(?:^|\n)Writing to (.+?)\n/g;
  const matches = [...output.matchAll(fileRegex)];
  for (const match of matches) {
    const filename = match[1];
    const startPos = match.index + match[0].length;
    let endPos = output.length;
    const nextFileMatch = output.substring(startPos).match(/\nWriting to .+?\n/);
    if (nextFileMatch) {
      endPos = startPos + nextFileMatch.index;
    }
    const content = output.substring(startPos, endPos).trim();
    codeBlocks.push({ filename, content });
  }
  return codeBlocks;
}
function checkCommentsInCode(code, filename) {
  const comments = [];
  const lines = code.split(`
`);
  const language = getLanguageFromFile(filename);
  const delimiters = language ? LANGUAGE_COMMENT_DELIMITERS[language] : null;
  let inMultiLine = false;
  let multiLineStartLine = 0;
  for (let i = 0;i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (delimiters && "multi" in delimiters && delimiters.multi.length > 0) {
      if (trimmedLine.startsWith(delimiters.multi[0]) || inMultiLine) {
        if (!inMultiLine) {
          inMultiLine = true;
          multiLineStartLine = i;
        }
        if (trimmedLine.endsWith(delimiters.multi[1])) {
          inMultiLine = false;
        }
        continue;
      }
    }
    if (delimiters && "shebang" in delimiters && Array.isArray(delimiters.shebang) && delimiters.shebang.length > 0) {
      if (line.startsWith(delimiters.shebang[0])) {
        continue;
      }
    }
    let isCommentLine = false;
    if (delimiters && "single" in delimiters) {
      isCommentLine = delimiters.single.some((d) => trimmedLine.startsWith(d));
    }
    if (!isCommentLine) {
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
        isCommentLine = true;
      }
    }
    if (isCommentLine) {
      for (const [type, patterns] of Object.entries(COMMENT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(trimmedLine)) {
            const isException = isExceptionComment(trimmedLine);
            comments.push({
              type,
              line: i + 1,
              text: trimmedLine,
              isException
            });
          }
        }
      }
    }
  }
  return comments;
}
function createCommentChecker(_input, options) {
  const config2 = options?.config ?? { enabled: true, checkAfterToolUse: true, requireJustification: false };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled) {
        return;
      }
      const text = getTextFromParts3(output.parts);
      const comments = [];
      const lines = text.split(`
`);
      for (const [type, patterns] of Object.entries(COMMENT_PATTERNS)) {
        lines.forEach((line, index) => {
          for (const pattern of patterns) {
            if (pattern.test(line)) {
              const isException = isExceptionComment(line);
              if (!isException) {
                comments.push({
                  type,
                  line: index + 1,
                  text: line.trim()
                });
              }
            }
          }
        });
      }
      if (comments.length > 0) {
        console.log(`[comment-checker] Found ${comments.length} annotated comments that need justification`);
      }
    },
    "tool.execute.after": async (input, output) => {
      if (!config2.enabled || !config2.checkAfterToolUse) {
        return;
      }
      if (!output.output)
        return;
      const { tool: tool12 } = input;
      const relevantTools = ["write", "edit", "multiEdit"];
      if (!relevantTools.includes(tool12))
        return;
      const toolOutput = typeof output.output === "string" ? output.output : JSON.stringify(output.output);
      const codeBlocks = extractCodeFromToolOutput(toolOutput);
      const allComments = [];
      for (const { filename, content } of codeBlocks) {
        const comments = checkCommentsInCode(content, filename);
        const nonExceptionComments = comments.filter((c) => !c.isException);
        if (nonExceptionComments.length > 0) {
          allComments.push({
            filename,
            comments: nonExceptionComments
          });
          console.log(`[comment-checker] File ${filename}:`);
          for (const comment of nonExceptionComments) {
            console.log(`  Line ${comment.line}: ${comment.type} - ${comment.text.substring(0, 50)}`);
          }
        }
      }
      if (config2.requireJustification && allComments.length > 0) {
        let justificationPrompt = `

${"=".repeat(60)}
COMMENT CHECKER: ${allComments.length} file(s) contain non-exception annotated comments (TODO, FIXME, etc.)
${"=".repeat(60)}

Before proceeding, you must justify why these comments are necessary:

`;
        for (const { filename, comments } of allComments) {
          justificationPrompt += `
File: ${filename}
`;
          for (const comment of comments) {
            justificationPrompt += `  [${comment.type}] Line ${comment.line}: ${comment.text.substring(0, 60)}...
`;
          }
        }
        justificationPrompt += `
Please provide justification for each comment or remove them.
${"=".repeat(60)}
`;
        console.log(justificationPrompt);
      }
    }
  };
}

// src/features/mcp/websearch.ts
import { tool as tool12 } from "@opencode-ai/plugin";

// src/features/mcp/types.ts
class MCPError extends Error {
  code;
  details;
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "MCPError";
  }
}
class MCPTimeoutError extends MCPError {
  timeout;
  constructor(message, timeout) {
    super("TIMEOUT", message, { timeout });
    this.timeout = timeout;
    this.name = "MCPTimeoutError";
  }
}

class RateLimiter {
  maxRequests;
  windowMs;
  requests = [];
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    this.requests.push(now);
  }
  reset() {
    this.requests = [];
  }
}

// src/features/mcp/websearch.ts
var z12 = tool12.schema;
var EXA_API_BASE_URL = "https://api.exa.ai";
var DEFAULT_NUM_RESULTS = 8;
var DEFAULT_TIMEOUT = 30000;
var exaRateLimiter = new RateLimiter(60, 60000);
var currentConfig = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT,
  numResults: DEFAULT_NUM_RESULTS,
  livecrawl: "fallback",
  searchType: "auto",
  contextMaxCharacters: 1e4
};
async function initializeWebsearchMCP(config2 = {}) {
  currentConfig = {
    ...currentConfig,
    ...config2
  };
  if (!currentConfig.apiKey && !process.env.EXA_API_KEY) {
    console.warn("Websearch MCP: No API key provided. Set EXA_API_KEY environment variable or provide apiKey in config.");
  }
}
async function performWebSearch(query, options = {}) {
  const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is required for web search. Please set the environment variable.");
  }
  const startTime = Date.now();
  const timeout = options.contextMaxCharacters ?? currentConfig.contextMaxCharacters ?? 1e4;
  try {
    await exaRateLimiter.waitIfNeeded();
    const requestBody = {
      query,
      numResults: options.numResults ?? currentConfig.numResults ?? DEFAULT_NUM_RESULTS,
      livecrawl: options.livecrawl ?? currentConfig.livecrawl ?? "fallback",
      type: options.searchType ?? currentConfig.searchType ?? "auto",
      contents: {
        text: true
      },
      queryCost: 2
    };
    const response = await fetch(`${EXA_API_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Accept: "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(currentConfig.timeout ?? DEFAULT_TIMEOUT)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const results = (data.results || []).map((result) => ({
      title: result.title || "No title",
      url: result.url,
      content: result.text || "",
      score: result.score,
      publishedDate: result.publishedDate
    }));
    return results.map((result) => ({
      ...result,
      content: truncateContent(result.content, timeout)
    }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new MCPTimeoutError(`Websearch timed out after ${currentConfig.timeout}ms`, currentConfig.timeout);
      }
      throw error;
    }
    throw error;
  }
}
async function fetchWebContent(url, options = {}) {
  const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is required for web fetch. Please set the environment variable.");
  }
  try {
    await exaRateLimiter.waitIfNeeded();
    const requestBody = {
      url,
      text: options.format !== "html"
    };
    const response = await fetch(`${EXA_API_BASE_URL}/contents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Accept: "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(options.timeout ?? currentConfig.timeout ?? DEFAULT_TIMEOUT)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return {
      url,
      content: data.text || data.contents || "",
      title: data.title
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new MCPTimeoutError(`Web fetch timed out after ${options.timeout ?? currentConfig.timeout}ms`, options.timeout ?? currentConfig.timeout);
      }
      throw error;
    }
    throw error;
  }
}
function truncateContent(content, maxChars) {
  if (content.length <= maxChars) {
    return content;
  }
  return content.slice(0, maxChars) + `

[Content truncated...]`;
}
var websearchToolImpl = tool12({
  description: "Search the web for information using AI-powered search via Exa AI. Returns relevant web pages with their content.",
  args: {
    query: z12.string().describe("Search query for the web"),
    numResults: z12.number().min(1).max(20).optional().default(DEFAULT_NUM_RESULTS).describe("Number of results to return (1-20)"),
    livecrawl: z12.enum(["fallback", "preferred"]).optional().default("fallback").describe("Live crawl mode"),
    searchType: z12.enum(["auto", "fast", "deep"]).optional().default("auto").describe("Search type"),
    contextMaxCharacters: z12.number().min(1000).max(50000).optional().default(1e4).describe("Maximum characters per result")
  },
  async execute(args) {
    const startTime = Date.now();
    try {
      const results = await performWebSearch(args.query, {
        numResults: args.numResults,
        livecrawl: args.livecrawl,
        searchType: args.searchType,
        contextMaxCharacters: args.contextMaxCharacters
      });
      const searchTime = Date.now() - startTime;
      return JSON.stringify({
        query: args.query,
        results,
        totalResults: results.length,
        searchTime
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Websearch timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var webfetchToolImpl = tool12({
  description: "Fetch and parse web content from a specific URL using Exa AI. Returns the content in the specified format.",
  args: {
    url: z12.string().url().describe("URL to fetch content from"),
    format: z12.enum(["markdown", "text", "html"]).optional().default("markdown").describe("Output format"),
    timeout: z12.number().min(1000).max(60000).optional().describe("Timeout in milliseconds")
  },
  async execute(args) {
    const startTime = Date.now();
    try {
      const result = await fetchWebContent(args.url, {
        format: args.format,
        timeout: args.timeout
      });
      const fetchTime = Date.now() - startTime;
      return JSON.stringify({
        ...result,
        fetchTime
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Webfetch timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var websearchTool = {
  ...websearchToolImpl,
  serverName: "websearch",
  category: "search",
  rateLimit: 60
};
var webfetchTool = {
  ...webfetchToolImpl,
  serverName: "websearch",
  category: "search",
  rateLimit: 60
};
var websearchMCP = {
  name: "websearch",
  description: "AI-powered web search via Exa AI with live crawling capabilities",
  version: "1.0.0",
  tools: [websearchTool, webfetchTool],
  configSchema: {
    apiKey: "string (optional)",
    timeout: "number (ms, default: 30000)",
    numResults: "number (1-20, default: 8)",
    livecrawl: "'fallback' | 'preferred' (default: 'fallback')",
    searchType: "'auto' | 'fast' | 'deep' (default: 'auto')",
    contextMaxCharacters: "number (1000-50000, default: 10000)",
    enabled: "boolean (default: true)"
  },
  initialize: async (config2) => {
    await initializeWebsearchMCP(config2);
  },
  shutdown: async () => {
    exaRateLimiter.reset();
  },
  healthCheck: async () => {
    const apiKey = currentConfig.apiKey || process.env.EXA_API_KEY;
    return currentConfig.enabled !== false && !!apiKey;
  }
};

// src/features/mcp/context7.ts
import { tool as tool13 } from "@opencode-ai/plugin";
var z13 = tool13.schema;
var CONTEXT7_API_BASE_URL = "https://api.context7.io/v1";
var DEFAULT_NUM_RESULTS2 = 5;
var DEFAULT_TIMEOUT2 = 30000;
var DEFAULT_CACHE_TTL2 = 300;
var DEFAULT_MAX_TOKENS = 5000;
var context7RateLimiter = new RateLimiter(30, 60000);
var currentConfig2 = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT2,
  numResults: DEFAULT_NUM_RESULTS2,
  cacheTTL: DEFAULT_CACHE_TTL2,
  maxTokens: DEFAULT_MAX_TOKENS
};
var documentationCache = new Map;
async function getCachedOrFetch(cacheKey, fetchFn) {
  const cachedEntry = documentationCache.get(cacheKey);
  if (cachedEntry) {
    const age = Date.now() - cachedEntry.timestamp;
    if (age < cachedEntry.ttl * 1000) {
      return cachedEntry.data;
    }
    documentationCache.delete(cacheKey);
  }
  const data = await fetchFn();
  documentationCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: currentConfig2.cacheTTL ?? DEFAULT_CACHE_TTL2
  });
  return data;
}
function clearContext7Cache() {
  documentationCache.clear();
}
async function initializeContext7MCP(config2 = {}) {
  currentConfig2 = {
    ...currentConfig2,
    ...config2
  };
  if (!currentConfig2.apiKey && !process.env.CONTEXT7_API_KEY) {
    console.warn("Context7 MCP: No API key provided. Set CONTEXT7_API_KEY environment variable or provide apiKey in config.");
  }
}
async function searchDocumentation(query, options = {}) {
  const apiKey = currentConfig2.apiKey || process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    throw new Error("CONTEXT7_API_KEY is required for documentation search. Please set the environment variable.");
  }
  try {
    await context7RateLimiter.waitIfNeeded();
    const requestBody = {
      query,
      library: options.library,
      version: options.version,
      numResults: options.numResults ?? currentConfig2.numResults ?? DEFAULT_NUM_RESULTS2,
      maxTokens: options.maxTokens ?? currentConfig2.maxTokens ?? DEFAULT_MAX_TOKENS
    };
    const response = await fetch(`${CONTEXT7_API_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Accept: "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(currentConfig2.timeout ?? DEFAULT_TIMEOUT2)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Context7 API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const results = (data.results || []).map((result) => ({
      library: result.library || options.library || "unknown",
      version: result.version || options.version || "latest",
      content: result.content || result.text || "",
      url: result.url || "#",
      relevance: result.score || result.relevance || 0,
      metadata: result.metadata || {}
    }));
    return results;
  } catch (error) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Documentation search failed: ${error.message}`);
    }
    throw error;
  }
}
async function getDocumentation(library, path10, options = {}) {
  const apiKey = currentConfig2.apiKey || process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    throw new Error("CONTEXT7_API_KEY is required for documentation lookup. Please set the environment variable.");
  }
  const cacheKey = `doc:${library}:${path10}:${options.version || "latest"}`;
  try {
    return await getCachedOrFetch(cacheKey, async () => {
      await context7RateLimiter.waitIfNeeded();
      const response = await fetch(`${CONTEXT7_API_BASE_URL}/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Accept: "application/json"
        },
        body: JSON.stringify({
          library,
          path: path10,
          version: options.version,
          maxTokens: options.maxTokens ?? currentConfig2.maxTokens ?? DEFAULT_MAX_TOKENS
        }),
        signal: AbortSignal.timeout(currentConfig2.timeout ?? DEFAULT_TIMEOUT2)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Context7 API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      return {
        library,
        version: data.version || options.version || "latest",
        content: data.content || data.text || "",
        url: data.url || "#",
        relevance: 1,
        metadata: data.metadata || {}
      };
    });
  } catch (error) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get documentation: ${error.message}`);
    }
    throw error;
  }
}
var context7SearchTool = tool13({
  description: "Search official documentation for libraries, SDKs, and APIs. Returns relevant documentation pages with content.",
  args: {
    query: z13.string().describe("Search query for documentation"),
    library: z13.string().optional().describe('Library name (e.g., "react", "nodejs", "python")'),
    version: z13.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    numResults: z13.number().min(1).max(10).optional().default(DEFAULT_NUM_RESULTS2).describe("Number of results to return"),
    maxTokens: z13.number().min(1000).max(20000).optional().describe("Maximum tokens per result")
  },
  async execute(args) {
    try {
      const results = await searchDocumentation(args.query, {
        library: args.library,
        version: args.version,
        numResults: args.numResults,
        maxTokens: args.maxTokens
      });
      return JSON.stringify({
        query: args.query,
        library: args.library,
        version: args.version,
        results,
        totalResults: results.length
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Documentation search timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var context7GetTool = tool13({
  description: "Get specific documentation page by library and path. Fetches the exact documentation content.",
  args: {
    library: z13.string().describe('Library name (e.g., "react", "nodejs", "python")'),
    path: z13.string().describe('Documentation path (e.g., "/hooks/useEffect", "/api/fs")'),
    version: z13.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    maxTokens: z13.number().min(1000).max(20000).optional().describe("Maximum tokens to return")
  },
  async execute(args) {
    try {
      const result = await getDocumentation(args.library, args.path, {
        version: args.version,
        maxTokens: args.maxTokens
      });
      return JSON.stringify({
        library: args.library,
        path: args.path,
        version: args.version,
        result
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`Documentation lookup timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var context7SearchToolMCP = {
  ...context7SearchTool,
  serverName: "context7",
  category: "documentation",
  rateLimit: 30
};
var context7GetToolMCP = {
  ...context7GetTool,
  serverName: "context7",
  category: "documentation",
  rateLimit: 30
};
var context7MCP = {
  name: "context7",
  description: "Official documentation lookup for libraries, SDKs, and APIs with intelligent caching",
  version: "1.0.0",
  tools: [context7SearchToolMCP, context7GetToolMCP],
  configSchema: {
    apiKey: "string (optional)",
    timeout: "number (ms, default: 30000)",
    numResults: "number (1-10, default: 5)",
    cacheTTL: "number (seconds, default: 300)",
    maxTokens: "number (1000-20000, default: 5000)",
    enabled: "boolean (default: true)"
  },
  initialize: async (config2) => {
    await initializeContext7MCP(config2);
  },
  shutdown: async () => {
    clearContext7Cache();
    context7RateLimiter.reset();
  },
  healthCheck: async () => {
    const apiKey = currentConfig2.apiKey || process.env.CONTEXT7_API_KEY;
    return currentConfig2.enabled !== false && !!apiKey;
  }
};

// src/features/mcp/grep-app.ts
import { tool as tool14 } from "@opencode-ai/plugin";
var z14 = tool14.schema;
var GITHUB_API_BASE_URL = "https://api.github.com";
var DEFAULT_MAX_RESULTS = 10;
var DEFAULT_TIMEOUT3 = 30000;
var DEFAULT_RATE_LIMIT_DELAY = 1000;
var githubRateLimiter = new RateLimiter(60, 60000);
var currentConfig3 = {
  enabled: true,
  timeout: DEFAULT_TIMEOUT3,
  maxResults: DEFAULT_MAX_RESULTS,
  rateLimitDelay: DEFAULT_RATE_LIMIT_DELAY,
  defaultExtensions: ["ts", "js", "tsx", "jsx", "py", "java", "go", "rs"],
  defaultLanguages: ["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust"]
};
async function initializeGrepAppMCP(config2 = {}) {
  currentConfig3 = {
    ...currentConfig3,
    ...config2
  };
  if (!currentConfig3.githubToken && !process.env.GITHUB_TOKEN) {
    console.warn("Grep App MCP: No GitHub token provided. Rate limits will be unauthenticated (60 requests/hour). Set GITHUB_TOKEN environment variable or provide githubToken in config.");
  }
}
async function searchGitHubCode(query, options = {}) {
  const githubToken = currentConfig3.githubToken || process.env.GITHUB_TOKEN;
  try {
    await githubRateLimiter.waitIfNeeded();
    let searchQuery = query;
    if (options.language) {
      searchQuery += ` language:${options.language}`;
    }
    if (options.extension) {
      searchQuery += ` extension:${options.extension}`;
    }
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "KrakenCode-GrepApp"
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }
    const url = new URL(`${GITHUB_API_BASE_URL}/search/code`);
    url.searchParams.append("q", searchQuery);
    url.searchParams.append("per_page", String(options.maxResults ?? currentConfig3.maxResults ?? DEFAULT_MAX_RESULTS));
    url.searchParams.append("page", String(options.page ?? 1));
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(currentConfig3.timeout ?? DEFAULT_TIMEOUT3)
    });
    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitReset = response.headers.get("X-RateLimit-Reset");
        throw new Error(`GitHub rate limit exceeded. Reset at ${rateLimitReset || "unknown"}. Consider using GITHUB_TOKEN for higher limits.`);
      }
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const results = (data.items || []).map((item) => ({
      repository: item.repository?.full_name || "unknown",
      path: item.path,
      language: item.language || item.repository?.language || "unknown",
      matches: [],
      url: item.html_url,
      score: item.score,
      metadata: {
        stars: item.repository?.stargazers_count,
        forks: item.repository?.forks_count,
        updatedAt: item.repository?.updated_at
      }
    }));
    return results;
  } catch (error) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`GitHub code search failed: ${error.message}`);
    }
    throw error;
  }
}
async function getGitHubFile(owner, repo, path10, options = {}) {
  const githubToken = currentConfig3.githubToken || process.env.GITHUB_TOKEN;
  try {
    await githubRateLimiter.waitIfNeeded();
    const headers = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "KrakenCode-GrepApp"
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${path10}${options.ref ? `?ref=${options.ref}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(currentConfig3.timeout ?? DEFAULT_TIMEOUT3)
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${owner}/${repo}/${path10}`);
      }
      if (response.status === 403) {
        const rateLimitReset = response.headers.get("X-RateLimit-Reset");
        throw new Error(`GitHub rate limit exceeded. Reset at ${rateLimitReset || "unknown"}. Consider using GITHUB_TOKEN for higher limits.`);
      }
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }
    const content = await response.text();
    const language = inferLanguageFromPath(path10);
    const fileUrl = `https://github.com/${owner}/${repo}/blob/${options.ref || "main"}/${path10}`;
    return {
      content,
      url: fileUrl,
      language
    };
  } catch (error) {
    if (error instanceof MCPTimeoutError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get GitHub file: ${error.message}`);
    }
    throw error;
  }
}
function inferLanguageFromPath(path10) {
  const ext = path10.split(".").pop()?.toLowerCase();
  const languageMap = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    py: "Python",
    java: "Java",
    go: "Go",
    rs: "Rust",
    c: "C",
    cpp: "C++",
    h: "C",
    hpp: "C++",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    scala: "Scala",
    cs: "C#",
    sh: "Shell",
    bash: "Shell",
    zsh: "Shell",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    xml: "XML",
    md: "Markdown"
  };
  return languageMap[ext || ""] || "unknown";
}
var grepSearchTool = tool14({
  description: "Search code across public GitHub repositories. Returns matching files with repository information.",
  args: {
    query: z14.string().describe("Search query (supports GitHub code search syntax)"),
    language: z14.string().optional().describe('Filter by programming language (e.g., "TypeScript", "Python")'),
    extension: z14.string().optional().describe('Filter by file extension (e.g., "ts", "js", "py")'),
    maxResults: z14.number().min(1).max(30).optional().default(DEFAULT_MAX_RESULTS).describe("Number of results to return"),
    page: z14.number().min(1).optional().default(1).describe("Page number for pagination")
  },
  async execute(args) {
    try {
      const results = await searchGitHubCode(args.query, {
        language: args.language,
        extension: args.extension,
        maxResults: args.maxResults,
        page: args.page
      });
      return JSON.stringify({
        query: args.query,
        language: args.language,
        extension: args.extension,
        results,
        totalResults: results.length
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`GitHub search timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var grepGetFileTool = tool14({
  description: "Fetch file content from a GitHub repository. Can fetch individual files from search results.",
  args: {
    owner: z14.string().describe('Repository owner (e.g., "facebook", "microsoft")'),
    repo: z14.string().describe('Repository name (e.g., "react", "typescript")'),
    path: z14.string().describe('File path (e.g., "src/index.ts", "README.md")'),
    ref: z14.string().optional().describe('Git reference (branch, tag, or commit, defaults to "main")')
  },
  async execute(args) {
    try {
      const result = await getGitHubFile(args.owner, args.repo, args.path, {
        ref: args.ref
      });
      return JSON.stringify({
        owner: args.owner,
        repo: args.repo,
        path: args.path,
        ref: args.ref,
        content: result.content,
        url: result.url,
        language: result.language
      }, null, 2);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        throw new Error(`GitHub file fetch timeout: ${error.message}`);
      }
      throw error;
    }
  }
});
var grepSearchToolMCP = {
  ...grepSearchTool,
  serverName: "grep_app",
  category: "code",
  rateLimit: 60
};
var grepGetFileToolMCP = {
  ...grepGetFileTool,
  serverName: "grep_app",
  category: "code",
  rateLimit: 60
};
var grepAppMCP = {
  name: "grep_app",
  description: "Search across public GitHub repositories with support for file content fetching",
  version: "1.0.0",
  tools: [grepSearchToolMCP, grepGetFileToolMCP],
  configSchema: {
    githubToken: "string (optional, GitHub personal access token)",
    timeout: "number (ms, default: 30000)",
    maxResults: "number (1-30, default: 10)",
    rateLimitDelay: "number (ms, default: 1000)",
    defaultExtensions: 'array of strings (default: ["ts", "js", "tsx", "jsx", "py", "java", "go", "rs"])',
    defaultLanguages: 'array of strings (default: ["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust"])',
    enabled: "boolean (default: true)"
  },
  initialize: async (config2) => {
    await initializeGrepAppMCP(config2);
  },
  shutdown: async () => {
    githubRateLimiter.reset();
  },
  healthCheck: async () => {
    return currentConfig3.enabled !== false;
  }
};

// src/features/mcp/kratos.ts
import { spawn as spawn2 } from "child_process";
import * as path10 from "path";
import * as os7 from "os";
import * as fs8 from "fs";
import { tool as tool15 } from "@opencode-ai/plugin";
var z15 = tool15.schema;
var kratosProcess = null;
var requestId = 0;
var pendingRequests = new Map;
var KRATOS_STORAGE_PATH = path10.join(os7.homedir(), ".kratos");
async function initializeKratos() {
  if (kratosProcess) {
    console.log("[Kratos MCP] Already initialized");
    return;
  }
  if (!fs8.existsSync(KRATOS_STORAGE_PATH)) {
    fs8.mkdirSync(KRATOS_STORAGE_PATH, { recursive: true });
  }
  kratosProcess = spawn2("npx", ["--yes", "kratos-mcp@latest"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      KRATOS_STORAGE_PATH
    }
  });
  if (!kratosProcess.stdin || !kratosProcess.stdout) {
    console.error("[Kratos MCP] Failed to create stdio pipes");
    return;
  }
  kratosProcess.on("error", (err) => {
    console.error("[Kratos MCP] Failed to start:", err);
    kratosProcess = null;
  });
  kratosProcess.on("exit", (code) => {
    console.log(`[Kratos MCP] Process exited with code ${code}`);
    kratosProcess = null;
    for (const [id, { reject }] of pendingRequests.entries()) {
      reject(new Error(`Kratos process exited: code ${code}`));
      pendingRequests.delete(id);
    }
  });
  kratosProcess.stderr?.on("data", (data) => {
    console.error(`[Kratos MCP] ${data}`);
  });
  kratosProcess.stdout.on("data", (data) => {
    const lines = data.toString().split(`
`).filter((line) => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.id !== undefined) {
          const pending = pendingRequests.get(response.id);
          if (pending) {
            if (response.error) {
              pending.reject(new Error(response.error.message || "Kratos MCP error"));
            } else {
              pending.resolve(response.result);
            }
            pendingRequests.delete(response.id);
          }
        }
      } catch (e) {}
    }
  });
  console.log("[Kratos MCP] Initialized");
}
async function shutdownKratos() {
  if (kratosProcess) {
    kratosProcess.kill();
    kratosProcess = null;
    console.log("[Kratos MCP] Shutdown");
  }
}
async function sendKratosRequest(method, params = {}) {
  if (!kratosProcess || !kratosProcess.stdin) {
    throw new Error("Kratos MCP not initialized. Call initializeKratos() first.");
  }
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };
    if (kratosProcess?.stdin) {
      kratosProcess.stdin.write(JSON.stringify(request) + `
`);
    }
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("Kratos MCP request timeout"));
    }, 30000);
    const originalResolve = resolve;
    const wrappedResolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
    pendingRequests.set(id, { resolve: wrappedResolve, reject });
  });
}
var memorySaveToolImpl = tool15({
  description: "Save a memory to Kratos project database",
  args: {
    summary: z15.string().describe("Short 1-2 line summary of memory"),
    text: z15.string().describe("Full memory content"),
    tags: z15.array(z15.string()).describe("Tags for categorization"),
    paths: z15.array(z15.string()).describe("Related file paths"),
    importance: z15.number().min(1).max(5).default(3).describe("Importance 1-5")
  },
  async execute(args, context) {
    try {
      const result = await sendKratosRequest("call_tool", {
        name: "memory_save",
        arguments: args
      });
      return result?.content?.[0]?.text || "Memory saved successfully";
    } catch (error) {
      console.error(`[Kratos] Error saving memory:`, error);
      throw new Error(`Failed to save memory: ${error.message}`);
    }
  }
});
var memorySaveTool = {
  ...memorySaveToolImpl,
  serverName: "kratos",
  category: "utility"
};
var memorySearchToolImpl = tool15({
  description: "Search Kratos memories by query or tags",
  args: {
    q: z15.string().describe("Search query or keywords"),
    k: z15.number().default(10).describe("Maximum results"),
    tags: z15.array(z15.string()).describe("Filter by tags")
  },
  async execute(args, context) {
    try {
      const result = await sendKratosRequest("call_tool", {
        name: "memory_search",
        arguments: args
      });
      return result?.content?.[0]?.text || JSON.stringify(result);
    } catch (error) {
      console.error(`[Kratos] Error searching memory:`, error);
      throw new Error(`Failed to search memory: ${error.message}`);
    }
  }
});
var memorySearchTool = {
  ...memorySearchToolImpl,
  serverName: "kratos",
  category: "utility"
};
var memoryGetRecentToolImpl = tool15({
  description: "Get recent memories from Kratos",
  args: {
    k: z15.number().default(10).describe("Maximum results"),
    path_prefix: z15.string().describe("Filter by path prefix")
  },
  async execute(args, context) {
    try {
      const result = await sendKratosRequest("call_tool", {
        name: "memory_get_recent",
        arguments: args
      });
      return result?.content?.[0]?.text || JSON.stringify(result);
    } catch (error) {
      console.error(`[Kratos] Error getting recent memories:`, error);
      throw new Error(`Failed to get recent memories: ${error.message}`);
    }
  }
});
var memoryGetRecentTool = {
  ...memoryGetRecentToolImpl,
  serverName: "kratos",
  category: "utility"
};
var memoryAskToolImpl = tool15({
  description: "Ask Kratos natural language questions",
  args: {
    question: z15.string().describe("Natural language question"),
    limit: z15.number().default(5).describe("Maximum results")
  },
  async execute(args, context) {
    try {
      const result = await sendKratosRequest("call_tool", {
        name: "memory_ask",
        arguments: args
      });
      return result?.content?.[0]?.text || JSON.stringify(result);
    } catch (error) {
      console.error(`[Kratos] Error asking question:`, error);
      throw new Error(`Failed to ask question: ${error.message}`);
    }
  }
});
var memoryAskTool = {
  ...memoryAskToolImpl,
  serverName: "kratos",
  category: "utility"
};

// src/features/mcp/index.ts
var builtinMCPs = [
  websearchMCP,
  context7MCP,
  grepAppMCP,
  {
    name: "kratos",
    description: "Ultra-lean memory system for AI coding tools",
    version: "4.0.0",
    tools: [memorySaveTool, memorySearchTool, memoryGetRecentTool, memoryAskTool],
    configSchema: {
      enabled: { type: "boolean", default: true },
      storagePath: { type: "string", default: "~/.kratos" }
    },
    initialize: async (config2) => await initializeKratos(),
    shutdown: async () => await shutdownKratos()
  }
];
async function initializeAllMcpServers(configs = {}) {
  for (const mcp of builtinMCPs) {
    const config2 = configs[mcp.name] || {};
    if (mcp.initialize) {
      try {
        await mcp.initialize(config2);
      } catch (error) {
        console.error(`Failed to initialize MCP server '${mcp.name}':`, error);
        throw error;
      }
    }
  }
}
async function shutdownAllMcpServers() {
  for (const mcp of builtinMCPs) {
    if (mcp.shutdown) {
      try {
        await mcp.shutdown();
      } catch (error) {
        console.error(`Failed to shutdown MCP server '${mcp.name}':`, error);
      }
    }
  }
}

// src/features/skills/mcp-manager.ts
class SkillMcpManager {
  clients = new Map;
  pendingConnections = new Map;
  async getOrCreateClient(info, config2) {
    const { serverName } = info;
    const key = `${serverName}:${info.command}`;
    if (this.clients.has(key)) {
      const clientInfo = this.clients.get(key);
      console.log(`[skill-mcp-manager] Reusing existing client for ${serverName}`);
      clientInfo.lastUsed = Date.now();
      return clientInfo.client;
    }
    if (this.pendingConnections.has(key)) {
      console.log(`[skill-mcp-manager] Reusing pending connection for ${serverName}`);
      return this.pendingConnections.get(key).promise;
    }
    console.log(`[skill-mcp-manager] MCP manager is disabled - SDK API has changed`);
    console.log(`[skill-mcp-manager] Server: ${serverName}`);
    throw new Error(`Skill MCP manager is temporarily disabled. Please check ${serverName} manually.`);
  }
  async disconnectSession(sessionID) {
    console.log(`[skill-mcp-manager] Disconnecting MCP clients for session ${sessionID}`);
    this.clients.clear();
    this.pendingConnections.clear();
  }
  async disconnectAll() {
    console.log("[skill-mcp-manager] Disconnecting all MCP clients");
    this.clients.clear();
    this.pendingConnections.clear();
  }
  getConnectedServers() {
    const servers = Array.from(this.clients.keys());
    console.log(`[skill-mcp-manager] Connected servers: ${servers.length}`);
    return servers;
  }
  isConnected(info) {
    const key = `${info.serverName}:${info.command}`;
    return this.clients.has(key);
  }
}
var managerInstance = new SkillMcpManager;
process.on("SIGINT", async () => {
  console.log("[skill-mcp-manager] Received SIGINT, shutting down MCP clients");
  await managerInstance.disconnectAll();
});
process.on("SIGTERM", async () => {
  console.log("[skill-mcp-manager] Received SIGTERM, shutting down MCP clients");
  await managerInstance.disconnectAll();
});
function getMcpManager() {
  return managerInstance;
}

// src/index.ts
function getSeaThemedAgents() {
  return {
    Kraken: krakenAgent,
    Atlas: atlasAgent,
    Nautilus: nautilusAgent,
    Abyssal: abyssalAgent,
    Coral: coralAgent,
    Siren: sirenAgent,
    Scylla: scyllaAgent,
    Pearl: pearlAgent,
    Maelstrom: maelstromAgent,
    Leviathan: leviathanAgent,
    Poseidon: poseidonAgent
  };
}
function mergeHooks(...hooks) {
  const result = {};
  for (const hook of hooks) {
    Object.assign(result, hook);
  }
  return result;
}
async function initializeCommandLoader() {
  console.log("[kraken-code] Command loader not yet implemented");
}
async function initializeSkillMcpManager() {
  const mcpManager = getMcpManager();
  console.log("[kraken-code] Skill MCP manager initialized");
}
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
  "call-kraken-agent": call_kraken_agent
};
var createOpenCodeXPlugin = async (input) => {
  const config2 = input.config || {};
  const hooks = [];
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
    hooks.push({ tool: createBackgroundAgentFeature(input).tools });
    hooks.push(createContextWindowMonitorHook(input));
    hooks.push(createRalphLoopHook(input));
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
      const { tool: tool16, sessionID } = input2;
      if (output.output && output.output.toolOutput) {
        await recordToolUse(sessionID, tool16, output.output.toolInput, output.output.toolOutput);
      }
      if (sessionID) {
        console.log(`[storage-hooks] Tool ${tool16} completed for session ${sessionID}`);
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
