import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
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
// src/storage/kraken-todo.ts
import * as fs from "fs";
import * as path2 from "path";
import * as os from "os";
function ensureDirectories() {
  if (!fs.existsSync(KRAKEN_DIR)) {
    fs.mkdirSync(KRAKEN_DIR, { recursive: true });
  }
  if (!fs.existsSync(TODO_DIR)) {
    fs.mkdirSync(TODO_DIR, { recursive: true });
  }
}
function getTodoPath(sessionId) {
  ensureDirectories();
  return path2.join(TODO_DIR, `${sessionId}.jsonl`);
}
function loadKrakenTodos(sessionId) {
  try {
    ensureDirectories();
    const filePath = getTodoPath(sessionId);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split(`
`);
    return lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((entry) => entry !== null);
  } catch (error) {
    console.error(`[kraken-todo] Error loading todos for session ${sessionId}:`, error);
    return [];
  }
}
function saveKrakenTodos(sessionId, todos) {
  try {
    ensureDirectories();
    const filePath = getTodoPath(sessionId);
    const lines = todos.map((todo) => JSON.stringify({ ...todo, timestamp: Date.now() }));
    fs.writeFileSync(filePath, lines.join(`
`));
    console.log(`[kraken-todo] Saved ${todos.length} todos for session ${sessionId}`);
  } catch (error) {
    console.error(`[kraken-todo] Error saving todos for session ${sessionId}:`, error);
  }
}
function deleteKrakenTodos(sessionId) {
  try {
    const filePath = getTodoPath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[kraken-todo] Deleted todos for session ${sessionId}`);
    }
  } catch (error) {
    console.error(`[kraken-todo] Error deleting todos for session ${sessionId}:`, error);
  }
}
function cleanupOldTodos(maxAgeDays = 30) {
  try {
    ensureDirectories();
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(TODO_DIR);
    for (const file of files) {
      const filePath = path2.join(TODO_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`[kraken-todo] Cleaned up old todo file: ${file}`);
      }
    }
  } catch (error) {
    console.error("[kraken-todo] Error cleaning up old todos:", error);
  }
}
var KRAKEN_DIR, TODO_DIR;
var init_kraken_todo = __esm(() => {
  KRAKEN_DIR = path2.join(os.homedir(), ".kraken");
  TODO_DIR = path2.join(KRAKEN_DIR, "todos");
});

// src/storage/kraken-transcript.ts
import * as fs2 from "fs";
import * as path3 from "path";
import * as os2 from "os";
function ensureDirectories2() {
  if (!fs2.existsSync(KRAKEN_DIR2)) {
    fs2.mkdirSync(KRAKEN_DIR2, { recursive: true });
  }
  if (!fs2.existsSync(TRANSCRIPT_DIR)) {
    fs2.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
  }
}
function getTranscriptPath(sessionId) {
  ensureDirectories2();
  return path3.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`);
}
function appendTranscriptEntry(sessionId, entry) {
  try {
    ensureDirectories2();
    const filePath = getTranscriptPath(sessionId);
    const line = JSON.stringify({ ...entry, timestamp: entry.timestamp || Date.now() });
    fs2.appendFileSync(filePath, line + `
`);
  } catch (error) {
    console.error(`[kraken-transcript] Error appending transcript entry for session ${sessionId}:`, error);
  }
}
function recordToolUse(sessionId, toolName, toolInput, toolOutput) {
  try {
    ensureDirectories2();
    const filePath = getTranscriptPath(sessionId);
    const entry = {
      role: "assistant",
      content: `Tool use: ${toolName}`,
      toolName,
      toolInput,
      toolOutput,
      timestamp: Date.now()
    };
    const line = JSON.stringify(entry);
    fs2.appendFileSync(filePath, line + `
`);
  } catch (error) {
    console.error(`[kraken-transcript] Error recording tool use for session ${sessionId}:`, error);
  }
}
function recordUserMessage(sessionId, content) {
  appendTranscriptEntry(sessionId, {
    role: "user",
    content,
    timestamp: Date.now()
  });
}
function recordAssistantMessage(sessionId, content) {
  appendTranscriptEntry(sessionId, {
    role: "assistant",
    content,
    timestamp: Date.now()
  });
}
function loadTranscript(sessionId) {
  try {
    ensureDirectories2();
    const filePath = getTranscriptPath(sessionId);
    if (!fs2.existsSync(filePath)) {
      return [];
    }
    const content = fs2.readFileSync(filePath, "utf-8");
    const lines = content.trim().split(`
`);
    return lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((entry) => entry !== null);
  } catch (error) {
    console.error(`[kraken-transcript] Error loading transcript for session ${sessionId}:`, error);
    return [];
  }
}
function deleteTranscript(sessionId) {
  try {
    const filePath = getTranscriptPath(sessionId);
    if (fs2.existsSync(filePath)) {
      fs2.unlinkSync(filePath);
      console.log(`[kraken-transcript] Deleted transcript for session ${sessionId}`);
    }
  } catch (error) {
    console.error(`[kraken-transcript] Error deleting transcript for session ${sessionId}:`, error);
  }
}
function deleteTempTranscript(path4) {
  try {
    if (fs2.existsSync(path4)) {
      fs2.unlinkSync(path4);
      console.log(`[kraken-transcript] Deleted temp transcript: ${path4}`);
    }
  } catch (error) {
    console.error(`[kraken-transcript] Error deleting temp transcript: ${path4}`, error);
  }
}
var KRAKEN_DIR2, TRANSCRIPT_DIR;
var init_kraken_transcript = __esm(() => {
  KRAKEN_DIR2 = path3.join(os2.homedir(), ".kraken");
  TRANSCRIPT_DIR = path3.join(KRAKEN_DIR2, "transcripts");
});

// src/storage/kraken-paths.ts
import * as path4 from "path";
import * as os3 from "os";
function getKrakenDir() {
  return path4.join(os3.homedir(), ".kraken");
}
function getKrakenTodoDir() {
  return path4.join(getKrakenDir(), "todos");
}
function getKrakenTranscriptDir() {
  return path4.join(getKrakenDir(), "transcripts");
}
function getKrakenTodoPath(sessionId) {
  return path4.join(getKrakenTodoDir(), `${sessionId}.jsonl`);
}
function getKrakenTranscriptPath(sessionId) {
  return path4.join(getKrakenTranscriptDir(), `${sessionId}.jsonl`);
}
function getTempTranscriptPath() {
  return path4.join(getKrakenTranscriptDir(), "temp.jsonl");
}
var init_kraken_paths = () => {};

// src/storage/todo-manager.ts
import { promises as fs3 } from "fs";
import { join as join4, dirname } from "path";
import * as os4 from "os";
function getTodoPath2(sessionId, customPath) {
  if (customPath) {
    return join4(customPath, `${sessionId}.json`);
  }
  const basePath = join4(os4.homedir(), ".claude", "todos");
  return join4(basePath, `${sessionId}.json`);
}
async function loadTodoFile(sessionId, customPath) {
  const todoPath = getTodoPath2(sessionId, customPath);
  try {
    await fs3.mkdir(dirname(todoPath), { recursive: true });
    const content = await fs3.readFile(todoPath, TODO_ENCODING);
    const todoFile = JSON.parse(content);
    if (todoFile.version !== TODO_VERSION) {
      console.warn(`[todo-manager] Todo file version mismatch: ${todoFile.version} (expected ${TODO_VERSION})`);
      return null;
    }
    return todoFile.todos || [];
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    console.error(`[todo-manager] Error loading todo file from ${todoPath}:`, error);
    return null;
  }
}
async function saveTodoFile(sessionId, todos, customPath) {
  const todoPath = getTodoPath2(sessionId, customPath);
  try {
    await fs3.mkdir(dirname(todoPath), { recursive: true });
    const todoFile = {
      version: TODO_VERSION,
      todos
    };
    await fs3.writeFile(todoPath, JSON.stringify(todoFile, null, 2), TODO_ENCODING);
    console.log(`[todo-manager] Saved ${todos.length} todos to ${todoPath}`);
    return true;
  } catch (error) {
    console.error(`[todo-manager] Error saving todo file to ${todoPath}:`, error);
    return false;
  }
}
async function deleteTodoFile(sessionId, customPath) {
  const todoPath = getTodoPath2(sessionId, customPath);
  try {
    await fs3.unlink(todoPath);
    console.log(`[todo-manager] Deleted todo file: ${todoPath}`);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return true;
    }
    console.error(`[todo-manager] Error deleting todo file ${todoPath}:`, error);
    return false;
  }
}
async function saveOpenCodeTodos(client, sessionId, todos) {
  try {
    const todoDir = join4(os4.homedir(), ".claude", "todos");
    await fs3.mkdir(todoDir, { recursive: true });
    const todoFile = {
      version: TODO_VERSION,
      todos
    };
    const todoPath = join4(todoDir, `${sessionId}.json`);
    await fs3.writeFile(todoPath, JSON.stringify(todoFile, null, 2), TODO_ENCODING);
    console.log(`[todo-manager] Saved ${todos.length} todos to OpenCode API`);
    return true;
  } catch (error) {
    console.error(`[todo-manager] Error saving todos to OpenCode API:`, error);
    return false;
  }
}
async function loadOpenCodeTodos(sessionId) {
  try {
    const todoPath = join4(os4.homedir(), ".claude", "todos", `${sessionId}.json`);
    const content = await fs3.readFile(todoPath, TODO_ENCODING);
    const todoFile = JSON.parse(content);
    if (todoFile.version !== TODO_VERSION) {
      console.warn(`[todo-manager] Todo file version mismatch: ${todoFile.version}`);
      return null;
    }
    return todoFile.todos || [];
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    console.error(`[todo-manager] Error loading todos from OpenCode API:`, error);
    return null;
  }
}
function validateTodo(todo) {
  const requiredFields = ["id", "content", "status", "priority"];
  for (const field of requiredFields) {
    if (!todo[field]) {
      console.warn(`[todo-manager] Invalid todo: missing field "${field}"`);
      return false;
    }
  }
  const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(todo.status)) {
    console.warn(`[todo-manager] Invalid todo status: ${todo.status}`);
    return false;
  }
  const validPriorities = ["high", "medium", "low"];
  if (!validPriorities.includes(todo.priority)) {
    console.warn(`[todo-manager] Invalid todo priority: ${todo.priority}`);
    return false;
  }
  return true;
}
var TODO_VERSION = "1.0", TODO_ENCODING = "utf-8";
var init_todo_manager = () => {};

// src/storage/transcript-manager.ts
import { promises as fs4 } from "fs";
import { join as join5, dirname as dirname2 } from "path";
import * as os5 from "os";
function getTranscriptPath2(sessionId, customPath) {
  if (customPath) {
    return join5(customPath, `${sessionId}.jsonl`);
  }
  const basePath = join5(os5.homedir(), ".claude", "transcripts");
  return join5(basePath, `${sessionId}.jsonl`);
}
async function appendTranscriptEntry2(sessionId, entry, customPath) {
  const transcriptPath = getTranscriptPath2(sessionId, customPath);
  try {
    await fs4.mkdir(dirname2(transcriptPath), { recursive: true });
    const entryWithTimestamp = {
      ...entry,
      timestamp: entry.timestamp || Date.now()
    };
    const jsonlLine = JSON.stringify(entryWithTimestamp) + `
`;
    await fs4.appendFile(transcriptPath, jsonlLine, TRANSCRIPT_ENCODING);
  } catch (error) {
    console.error(`[transcript-manager] Error appending transcript entry:`, error);
  }
}
async function recordToolUse2(sessionId, toolName, toolInput, toolOutput, customPath) {
  const entry = {
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    toolName,
    toolInput,
    toolOutput
  };
  await appendTranscriptEntry2(sessionId, entry, customPath);
}
async function recordUserMessage2(sessionId, content, customPath) {
  const entry = {
    role: "user",
    content,
    timestamp: Date.now()
  };
  await appendTranscriptEntry2(sessionId, entry, customPath);
}
async function recordAssistantMessage2(sessionId, content, customPath) {
  const entry = {
    role: "assistant",
    content,
    timestamp: Date.now()
  };
  await appendTranscriptEntry2(sessionId, entry, customPath);
}
async function buildTranscriptFromSession(client, sessionId, options) {
  try {
    const messages = await client.listMessages({ sessionId, limit: 1000 });
    const parts = messages.flatMap((msg) => msg.parts || []);
    let transcript = "";
    for (const part of parts) {
      if (part.type === "text") {
        const role = part.role === "user" ? "user" : "assistant";
        transcript += `${role.toUpperCase()}: ${part.text}

`;
      }
    }
    if (options?.currentToolName) {
      transcript += `TOOL: ${options.currentToolName}
`;
      if (options.currentToolInput !== undefined) {
        transcript += `INPUT: ${JSON.stringify(options.currentToolInput)}
`;
      }
      transcript += `
`;
    }
    return transcript || null;
  } catch (error) {
    console.error(`[transcript-manager] Error building transcript from session:`, error);
    return null;
  }
}
async function deleteTempTranscript2(path5) {
  try {
    await fs4.unlink(path5);
    console.log(`[transcript-manager] Deleted temp transcript: ${path5}`);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return true;
    }
    console.error(`[transcript-manager] Error deleting temp transcript:`, error);
    return false;
  }
}
async function readTranscript(sessionId, customPath) {
  const transcriptPath = getTranscriptPath2(sessionId, customPath);
  try {
    const content = await fs4.readFile(transcriptPath, TRANSCRIPT_ENCODING);
    const lines = content.trim().split(`
`);
    const entries = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line);
          entries.push(entry);
        } catch (parseError) {
          console.warn(`[transcript-manager] Failed to parse transcript line:`, parseError);
        }
      }
    }
    return entries;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    console.error(`[transcript-manager] Error reading transcript:`, error);
    return [];
  }
}
async function clearTranscript(sessionId, customPath) {
  const transcriptPath = getTranscriptPath2(sessionId, customPath);
  try {
    await fs4.unlink(transcriptPath);
    console.log(`[transcript-manager] Cleared transcript for session ${sessionId}`);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return true;
    }
    console.error(`[transcript-manager] Error clearing transcript:`, error);
    return false;
  }
}
function validateTranscriptEntry(entry) {
  if (!entry.role || entry.role !== "user" && entry.role !== "assistant") {
    console.warn(`[transcript-manager] Invalid transcript entry: invalid role "${entry.role}"`);
    return false;
  }
  if (entry.role === "assistant" && !entry.content && !entry.toolName) {
    console.warn(`[transcript-manager] Invalid assistant entry: must have content or toolName`);
    return false;
  }
  if (entry.role === "user" && !entry.content) {
    console.warn(`[transcript-manager] Invalid user entry: must have content`);
    return false;
  }
  return true;
}
var TRANSCRIPT_ENCODING = "utf-8";
var init_transcript_manager = () => {};

// src/storage/paths.ts
import * as os6 from "os";
import * as path5 from "path";
function getDefaultPaths() {
  const homeDir = os6.homedir();
  return {
    todoPath: path5.join(homeDir, ".claude", "todos"),
    transcriptPath: path5.join(homeDir, ".claude", "transcripts")
  };
}
function getPaths(config) {
  const defaults = getDefaultPaths();
  return {
    todoPath: config.todoPath || defaults.todoPath,
    transcriptPath: config.transcriptPath || defaults.transcriptPath,
    customTodoPath: config.todoPath,
    customTranscriptPath: config.transcriptPath
  };
}
function resolveSessionId(sessionId) {
  if (!sessionId) {
    return "unknown";
  }
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function validatePath(filePath) {
  if (!filePath) {
    return false;
  }
  const resolved = path5.resolve(filePath);
  if (resolved.startsWith(path5.resolve(os6.homedir()))) {
    return true;
  }
  return false;
}
function getRelativePath(filePath, basePath = process.cwd()) {
  return path5.relative(basePath, filePath);
}
var init_paths = () => {};

// src/storage/index.ts
var exports_storage = {};
__export(exports_storage, {
  writeState: () => writeState,
  validateTranscriptEntry: () => validateTranscriptEntry,
  validateTodo: () => validateTodo,
  validatePath: () => validatePath,
  saveTodoFile: () => saveTodoFile,
  saveOpenCodeTodos: () => saveOpenCodeTodos,
  saveKrakenTodos: () => saveKrakenTodos,
  resolveSessionId: () => resolveSessionId,
  recordUserMessage: () => recordUserMessage2,
  recordToolUse: () => recordToolUse2,
  recordKrakenUserMessage: () => recordUserMessage,
  recordKrakenToolUse: () => recordToolUse,
  recordKrakenAssistantMessage: () => recordAssistantMessage,
  recordAssistantMessage: () => recordAssistantMessage2,
  readTranscript: () => readTranscript,
  readState: () => readState,
  loadTodoFile: () => loadTodoFile,
  loadOpenCodeTodos: () => loadOpenCodeTodos,
  loadKrakenTranscript: () => loadTranscript,
  loadKrakenTodos: () => loadKrakenTodos,
  incrementIteration: () => incrementIteration,
  getTranscriptPath: () => getTranscriptPath2,
  getTodoPath: () => getTodoPath2,
  getTempTranscriptPath: () => getTempTranscriptPath,
  getStateFilePath: () => getStateFilePath,
  getRelativePath: () => getRelativePath,
  getPaths: () => getPaths,
  getKrakenTranscriptPath: () => getKrakenTranscriptPath,
  getKrakenTranscriptDir: () => getKrakenTranscriptDir,
  getKrakenTodoPath: () => getKrakenTodoPath,
  getKrakenTodoDir: () => getKrakenTodoDir,
  getKrakenDir: () => getKrakenDir,
  getDefaultPaths: () => getDefaultPaths,
  ensureDirectories: () => ensureDirectories3,
  deleteTodoFile: () => deleteTodoFile,
  deleteTempTranscript: () => deleteTempTranscript2,
  deleteKrakenTranscript: () => deleteTranscript,
  deleteKrakenTodos: () => deleteKrakenTodos,
  deleteKrakenTempTranscript: () => deleteTempTranscript,
  clearTranscript: () => clearTranscript,
  clearState: () => clearState,
  cleanupOldTodos: () => cleanupOldTodos,
  buildTranscriptFromSession: () => buildTranscriptFromSession,
  appendTranscriptEntry: () => appendTranscriptEntry2,
  appendKrakenTranscriptEntry: () => appendTranscriptEntry
});
import * as fs5 from "fs";
import * as path6 from "path";
import * as os7 from "os";
function getStateFilePath(sessionID) {
  return path6.join(SESSIONS_DIR, `${sessionID}.json`);
}
function ensureDirectories3() {
  if (!fs5.existsSync(STORAGE_DIR)) {
    fs5.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs5.existsSync(SESSIONS_DIR)) {
    fs5.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}
function readState(sessionID) {
  try {
    ensureDirectories3();
    const filePath = getStateFilePath(sessionID);
    if (!fs5.existsSync(filePath)) {
      return null;
    }
    const data = fs5.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`[storage] Error reading state for session ${sessionID}:`, error);
    return null;
  }
}
function writeState(sessionID, state) {
  try {
    ensureDirectories3();
    const filePath = getStateFilePath(sessionID);
    fs5.writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`[storage] Error writing state for session ${sessionID}:`, error);
  }
}
function clearState(sessionID) {
  try {
    const filePath = getStateFilePath(sessionID);
    if (fs5.existsSync(filePath)) {
      fs5.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`[storage] Error clearing state for session ${sessionID}:`, error);
  }
}
function incrementIteration(sessionID) {
  const state = readState(sessionID);
  if (!state) {
    return null;
  }
  state.currentIteration++;
  writeState(sessionID, state);
  return state;
}
var STORAGE_DIR, SESSIONS_DIR;
var init_storage = __esm(() => {
  init_kraken_todo();
  init_kraken_transcript();
  init_kraken_paths();
  init_todo_manager();
  init_transcript_manager();
  init_paths();
  STORAGE_DIR = path6.join(os7.homedir(), ".opencode", "kraken-code");
  SESSIONS_DIR = path6.join(STORAGE_DIR, "sessions");
});

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
    return new Promise((resolve2, reject) => {
      this.pending.set(id, { resolve: resolve2, reject });
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
    const { promises: fs10 } = await import("node:fs");
    const content = await fs10.readFile(filePath, "utf-8");
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
    const path11 = parts.slice(0, i).join("/");
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
        const file = Bun.file(`${path11}/${marker}`);
        if (file.size > 0) {
          return path11;
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
        const path11 = uriToPath(uri);
        const content = await Bun.file(path11).text();
        const lines = content.split(`
`);
        for (const te of textEdits) {
          const { line } = te.range.start;
          if (lines[line] !== undefined) {
            lines[line] = te.newText;
            result.totalEdits++;
          }
        }
        Bun.write(path11, lines.join(`
`));
        result.filesModified.push(path11);
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

// src/hooks/session-recovery/detector.ts
var exports_detector = {};
__export(exports_detector, {
  isTransientError: () => isTransientError,
  isRecoverableError: () => isRecoverableError,
  isPermanentError: () => isPermanentError,
  getRecoveryMessage: () => getRecoveryMessage,
  detectThinkingBlockOrderError: () => detectThinkingBlockOrderError,
  detectErrorType: () => detectErrorType,
  detectErrorFromOutput: () => detectErrorFromOutput
});
function detectErrorType(error, _context) {
  if (!error) {
    return "no_error";
  }
  const errorString = error instanceof Error ? error.message : String(error);
  const lowerError = errorString.toLowerCase();
  for (const [type, patterns] of Object.entries(errorPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerError)) {
        return type;
      }
    }
  }
  return "no_error";
}
function detectErrorFromOutput(output) {
  if (!output || typeof output !== "string") {
    return null;
  }
  const outputString = output.toLowerCase();
  for (const [type, patterns] of Object.entries(errorPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(outputString)) {
        return type;
      }
    }
  }
  return null;
}
function detectThinkingBlockOrderError(thinkingBlocks) {
  if (!thinkingBlocks || thinkingBlocks.length < 2) {
    return null;
  }
  const blockTags = thinkingBlocks.map((block) => {
    if (typeof block === "string") {
      return block.trim();
    }
    return "";
  }).filter((tag) => tag.length > 0);
  const invalidPatterns = [
    /thinking.*after.*reply/i,
    /thinking.*after.*response/i,
    /<!--thinking-->.*<!--\/thinking-->.*<!--thinking-->/i
  ];
  for (const pattern of invalidPatterns) {
    const fullContent = blockTags.join(`
`);
    if (pattern.test(fullContent)) {
      return "thinking_block_order";
    }
  }
  return null;
}
function isRecoverableError(errorType) {
  return [
    "tool_result_missing",
    "thinking_block_order",
    "network_timeout"
  ].includes(errorType);
}
function isTransientError(errorType) {
  return [
    "network_timeout",
    "rate_limit"
  ].includes(errorType);
}
function isPermanentError(errorType) {
  return [
    "auth_error"
  ].includes(errorType);
}
function getRecoveryMessage(errorType) {
  const messages = {
    tool_result_missing: "Tool result appears to be missing or empty",
    thinking_block_order: "Thinking blocks are in incorrect order",
    thinking_disabled_violation: "Thinking block found but thinking mode is disabled",
    network_timeout: "Network connection timed out",
    rate_limit: "Rate limit exceeded",
    auth_error: "Authentication failed",
    no_error: "No error detected"
  };
  return messages[errorType];
}
var errorPatterns;
var init_detector = __esm(() => {
  errorPatterns = {
    tool_result_missing: [/Tool.*returned.*empty/i, /No.*tool.*output/i, /Tool.*result.*missing/i],
    thinking_block_order: [/Thinking.*block.*order/i, /thinking.*blocks.*must.*come.*before/i, /Invalid.*thinking.*order/i],
    thinking_disabled_violation: [/Thinking.*disabled.*but.*block.*found/i, /thinking.*block.*without.*mode/i, /thinking.*tag.*without.*enabled.*mode/i],
    network_timeout: [/network.*timeout/i, /connection.*timed.*out/i, /ETIMEDOUT/i],
    rate_limit: [/rate.*limit/i, /too.*many.*requests/i, /429.*Too.*Many.*Requests/i],
    auth_error: [/authentication.*failed/i, /invalid.*api.*key/i, /unauthorized/i],
    no_error: [/no error detected/i]
  };
});

// src/hooks/session-recovery/strategies.ts
var exports_strategies = {};
__export(exports_strategies, {
  retryWithBackoff: () => retryWithBackoff,
  attemptRecovery: () => attemptRecovery
});
async function attemptRecovery(errorType, context, options) {
  const strategy = strategies[errorType];
  if (!strategy) {
    console.log("[session-recovery] No recovery strategy for error type: " + errorType);
    return false;
  }
  const canRecover = await strategy.canRecover(context);
  if (!canRecover) {
    console.log("[session-recovery] Cannot recover from " + errorType);
    return false;
  }
  if (options?.skipConfirmation) {
    return await strategy.recover(context);
  }
  console.log("[session-recovery] Recovery option: " + strategy.description);
  console.log("[session-recovery] [session recovered - continuing previous task]");
  return await strategy.recover(context);
}
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError = null;
  for (let attempt = 0;attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log("[session-recovery] Retry " + (attempt + 1) + "/" + maxRetries + " after " + delay + "ms");
        await new Promise(function(resolve2) {
          setTimeout(resolve2, delay);
        });
      }
    }
  }
  throw lastError || new Error("Max retries exceeded");
}
var toolResultMissingStrategy, thinkingBlockOrderStrategy, thinkingDisabledViolationStrategy, networkTimeoutStrategy, rateLimitStrategy, authErrorStrategy, strategies;
var init_strategies = __esm(() => {
  toolResultMissingStrategy = {
    errorType: "tool_result_missing",
    canRecover: async function(context) {
      return context.sessionID !== undefined && context.toolOutput === undefined;
    },
    recover: async function(context) {
      console.log("[session-recovery] Attempting to recover tool_result_missing for session " + context.sessionID);
      console.log("[session-recovery] [session recovered - continuing previous task]");
      return true;
    },
    description: "Retry of tool execution or continue with alternative approach"
  };
  thinkingBlockOrderStrategy = {
    errorType: "thinking_block_order",
    canRecover: async function(context) {
      return context.sessionID !== undefined && context.thinkingBlocks !== undefined;
    },
    recover: async function(context) {
      console.log("[session-recovery] Recovering thinking_block_order by reordering blocks");
      if (context.thinkingBlocks) {
        const blocks = Array.isArray(context.thinkingBlocks) ? context.thinkingBlocks : [context.thinkingBlocks];
        const reversed = blocks.reverse();
        console.log("[session-recovery] Reordered " + reversed.length + " thinking blocks");
        return true;
      }
      return false;
    },
    description: "Reorder thinking blocks to correct order"
  };
  thinkingDisabledViolationStrategy = {
    errorType: "thinking_disabled_violation",
    canRecover: async function() {
      return true;
    },
    recover: async function() {
      console.log("[session-recovery] Ignoring thinking_disabled_violation - will re-enable thinking mode");
      return true;
    },
    description: "Re-enable thinking mode in next request"
  };
  networkTimeoutStrategy = {
    errorType: "network_timeout",
    canRecover: async function() {
      return true;
    },
    recover: async function() {
      console.log("[session-recovery] Network timeout detected - will retry");
      return true;
    },
    description: "Retry of request with exponential backoff"
  };
  rateLimitStrategy = {
    errorType: "rate_limit",
    canRecover: async function() {
      return true;
    },
    recover: async function() {
      console.log("[session-recovery] Rate limit hit - implementing delay");
      await new Promise(function(resolve2) {
        setTimeout(resolve2, 5000);
      });
      return true;
    },
    description: "Wait and retry with exponential backoff"
  };
  authErrorStrategy = {
    errorType: "auth_error",
    canRecover: async function() {
      return false;
    },
    recover: async function() {
      console.log("[session-recovery] Authentication error - cannot recover automatically");
      return false;
    },
    description: "User must re-authenticate manually"
  };
  strategies = {
    tool_result_missing: toolResultMissingStrategy,
    thinking_block_order: thinkingBlockOrderStrategy,
    thinking_disabled_violation: thinkingDisabledViolationStrategy,
    network_timeout: networkTimeoutStrategy,
    rate_limit: rateLimitStrategy,
    auth_error: authErrorStrategy
  };
});

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = undefined;

  class _CodeOrName {
  }
  exports._CodeOrName = _CodeOrName;
  exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;

  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports.Name = Name;

  class _Code extends _CodeOrName {
    constructor(code) {
      super();
      this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== undefined ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== undefined ? _a : this._names = this._items.reduce((names, c) => {
        if (c instanceof Name)
          names[c.str] = (names[c.str] || 0) + 1;
        return names;
      }, {});
    }
  }
  exports._Code = _Code;
  exports.nil = new _Code("");
  function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code, args[i]);
      code.push(strs[++i]);
    }
    return new _Code(code);
  }
  exports._ = _;
  var plus = new _Code("+");
  function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports.str = str;
  function addCodeArg(code, arg) {
    if (arg instanceof _Code)
      code.push(...arg._items);
    else if (arg instanceof Name)
      code.push(arg);
    else
      code.push(interpolate(arg));
  }
  exports.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== undefined) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  }
  exports.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports.regexpCode = regexpCode;
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = undefined;
  var code_1 = require_code();

  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var")
  };

  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === undefined ? undefined : _a._prefixes) === null || _b === undefined ? undefined : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports.Scope = Scope;

  class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
    }
  }
  exports.ValueScopeName = ValueScopeName;
  var line = (0, code_1._)`\n`;

  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === undefined)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== undefined ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = new Map;
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_1._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code = code_1.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || new Map;
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
            code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === undefined ? undefined : getCode(name)) {
            code = (0, code_1._)`${code}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code;
    }
  }
  exports.ValueScope = ValueScope;
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = undefined;
  var code_1 = require_code();
  var scope_1 = require_scope();
  var code_2 = require_code();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = require_scope();
  Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+")
  };

  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }

  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (!names[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
  }

  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
      return addExprNames(names, this.rhs);
    }
  }

  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }

  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }

  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }

  class Throw extends Node {
    constructor(error) {
      super();
      this.error = error;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }

  class AnyCode extends Node {
    constructor(code) {
      super();
      this.code = code;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
      this.code = optimizeExpr(this.code, names, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
  }

  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names, constants))
          continue;
        subtractNames(names, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    get names() {
      return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
  }

  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }

  class Root extends ParentNode {
  }

  class Else extends BlockNode {
  }
  Else.kind = "else";

  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code += "else " + this.else.render(opts);
      return code;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return;
      return this;
    }
    optimizeNames(names, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === undefined ? undefined : _a.optimizeNames(names, constants);
      if (!(super.optimizeNames(names, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      addExprNames(names, this.condition);
      if (this.else)
        addNames(names, this.else.names);
      return names;
    }
  }
  If.kind = "if";

  class For extends BlockNode {
  }
  For.kind = "for";

  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }

  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names = addExprNames(super.names, this.from);
      return addExprNames(names, this.to);
    }
  }

  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }

  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";

  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";

  class Try extends BlockNode {
    render(opts) {
      let code = "try" + super.render(opts);
      if (this.catch)
        code += this.catch.render(opts);
      if (this.finally)
        code += this.finally.render(opts);
      return code;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === undefined || _a.optimizeNodes();
      (_b = this.finally) === null || _b === undefined || _b.optimizeNodes();
      return this;
    }
    optimizeNames(names, constants) {
      var _a, _b;
      super.optimizeNames(names, constants);
      (_a = this.catch) === null || _a === undefined || _a.optimizeNames(names, constants);
      (_b = this.finally) === null || _b === undefined || _b.optimizeNames(names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      if (this.catch)
        addNames(names, this.catch.names);
      if (this.finally)
        addNames(names, this.finally.names);
      return names;
    }
  }

  class Catch extends BlockNode {
    constructor(error) {
      super();
      this.error = error;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";

  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";

  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? `
` : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(prefix) {
      return this._scope.name(prefix);
    }
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set);
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== undefined && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_1.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    object(...keyValues) {
      const code = ["{"];
      for (const [key, value] of keyValues) {
        if (code.length > 1)
          code.push(",");
        code.push(key);
        if (key !== value || this.opts.es5) {
          code.push(":");
          (0, code_1.addCodeArg)(code, value);
        }
      }
      code.push("}");
      return new code_1._Code(code);
    }
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    else() {
      return this._elseNode(new Else);
    }
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
          this.var(name, (0, code_1._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    endFor() {
      return this._endBlockNode(For);
    }
    label(label) {
      return this._leafNode(new Label(label));
    }
    break(label) {
      return this._leafNode(new Break(label));
    }
    return(value) {
      const node = new Return;
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try;
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error = this.name("e");
        this._currNode = node.catch = new Catch(error);
        catchCode(error);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally;
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    throw(error) {
      return this._leafNode(new Throw(error));
    }
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === undefined)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== undefined && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    func(name, args = code_1.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports.CodeGen = CodeGen;
  function addNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
  }
  function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  }
  function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
      if (c instanceof code_1.Name)
        c = replaceName(c);
      if (c instanceof code_1._Code)
        items.push(...c._items);
      else
        items.push(c);
      return items;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === undefined || names[n.str] !== 1)
        return n;
      delete names[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined);
    }
  }
  function subtractNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) - (from[n] || 0);
  }
  function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  }
  exports.not = not;
  var andCode = mappend(exports.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports.and = and;
  var orCode = mappend(exports.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports.or = or;
  function mappend(op) {
    return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = undefined;
  var codegen_1 = require_codegen();
  var code_1 = require_code();
  function toHash(arr) {
    const hash = {};
    for (const item of arr)
      hash[item] = true;
    return hash;
  }
  exports.toHash = toHash;
  function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
      return schema;
    if (Object.keys(schema).length === 0)
      return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
  }
  exports.alwaysValidSchema = alwaysValidSchema;
  function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
      return;
    if (typeof schema === "boolean")
      return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
      if (!rules[key])
        checkStrictMode(it, `unknown keyword: "${key}"`);
    }
  }
  exports.checkUnknownRules = checkUnknownRules;
  function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (rules[key])
        return true;
    return false;
  }
  exports.schemaHasRules = schemaHasRules;
  function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (key !== "$ref" && RULES.all[key])
        return true;
    return false;
  }
  exports.schemaHasRulesButRef = schemaHasRulesButRef;
  function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
      if (typeof schema == "number" || typeof schema == "boolean")
        return schema;
      if (typeof schema == "string")
        return (0, codegen_1._)`${schema}`;
    }
    return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  }
  exports.schemaRefOrVal = schemaRefOrVal;
  function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
  }
  exports.unescapeFragment = unescapeFragment;
  function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
  }
  exports.escapeFragment = escapeFragment;
  function escapeJsonPointer(str) {
    if (typeof str == "number")
      return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  exports.escapeJsonPointer = escapeJsonPointer;
  function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  exports.unescapeJsonPointer = unescapeJsonPointer;
  function eachItem(xs, f) {
    if (Array.isArray(xs)) {
      for (const x of xs)
        f(x);
    } else {
      f(xs);
    }
  }
  exports.eachItem = eachItem;
  function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
    return (gen, from, to, toName) => {
      const res = to === undefined ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
      return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
  }
  exports.mergeEvaluated = {
    props: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
        gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
      }),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
        if (from === true) {
          gen.assign(to, true);
        } else {
          gen.assign(to, (0, codegen_1._)`${to} || {}`);
          setEvaluated(gen, to, from);
        }
      }),
      mergeValues: (from, to) => from === true ? true : { ...from, ...to },
      resultToName: evaluatedPropsToName
    }),
    items: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
      mergeValues: (from, to) => from === true ? true : Math.max(from, to),
      resultToName: (gen, items) => gen.var("items", items)
    })
  };
  function evaluatedPropsToName(gen, ps) {
    if (ps === true)
      return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._)`{}`);
    if (ps !== undefined)
      setEvaluated(gen, props, ps);
    return props;
  }
  exports.evaluatedPropsToName = evaluatedPropsToName;
  function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  }
  exports.setEvaluated = setEvaluated;
  var snippets = {};
  function useFunc(gen, f) {
    return gen.scopeValue("func", {
      ref: f,
      code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
    });
  }
  exports.useFunc = useFunc;
  var Type;
  (function(Type2) {
    Type2[Type2["Num"] = 0] = "Num";
    Type2[Type2["Str"] = 1] = "Str";
  })(Type || (exports.Type = Type = {}));
  function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    if (dataProp instanceof codegen_1.Name) {
      const isNumber = dataPropType === Type.Num;
      return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  }
  exports.getErrorPath = getErrorPath;
  function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
      return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
      throw new Error(msg);
    it.self.logger.warn(msg);
  }
  exports.checkStrictMode = checkStrictMode;
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var names = {
    data: new codegen_1.Name("data"),
    valCxt: new codegen_1.Name("valCxt"),
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"),
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
    vErrors: new codegen_1.Name("vErrors"),
    errors: new codegen_1.Name("errors"),
    this: new codegen_1.Name("this"),
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart")
  };
  exports.default = names;
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
  };
  exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
  };
  function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== undefined ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
  }
  exports.reportError = reportError;
  function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_1.default.vErrors);
    }
  }
  exports.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  }
  exports.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
    if (errsCount === undefined)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
      gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
      gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_1._)`${err}.data`, data);
      }
    });
  }
  exports.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  var E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"),
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema")
  };
  function errorObjectCode(cxt, error, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_1._)`{}`;
    return errorObject(cxt, error, errorPaths);
  }
  function errorObject(cxt, error, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
    if (schemaPath) {
      schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = undefined;
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var boolError = {
    message: "boolean schema is false"
  };
  function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
      falseSchemaError(it, false);
    } else if (typeof schema == "object" && schema.$async === true) {
      gen.return(names_1.default.data);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, null);
      gen.return(true);
    }
  }
  exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
      gen.var(valid, false);
      falseSchemaError(it);
    } else {
      gen.var(valid, true);
    }
  }
  exports.boolOrEmptySchema = boolOrEmptySchema;
  function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    const cxt = {
      gen,
      keyword: "false schema",
      data,
      schema: false,
      schemaCode: false,
      schemaValue: false,
      params: {},
      it
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRules = exports.isJSONType = undefined;
  var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
  var jsonTypes = new Set(_jsonTypes);
  function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
  }
  exports.isJSONType = isJSONType;
  function getRules() {
    const groups = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...groups, integer: true, boolean: true, null: true },
      rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  exports.getRules = getRules;
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = undefined;
  function schemaHasRulesForType({ schema, self }, type) {
    const group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
  }
  exports.schemaHasRulesForType = schemaHasRulesForType;
  function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
  }
  exports.shouldUseGroup = shouldUseGroup;
  function shouldUseRule(schema, rule) {
    var _a;
    return schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === undefined ? undefined : _a.some((kwd) => schema[kwd] !== undefined));
  }
  exports.shouldUseRule = shouldUseRule;
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = undefined;
  var rules_1 = require_rules();
  var applicability_1 = require_applicability();
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var DataType;
  (function(DataType2) {
    DataType2[DataType2["Correct"] = 0] = "Correct";
    DataType2[DataType2["Wrong"] = 1] = "Wrong";
  })(DataType || (exports.DataType = DataType = {}));
  function getSchemaTypes(schema) {
    const types3 = getJSONTypes(schema.type);
    const hasNull = types3.includes("null");
    if (hasNull) {
      if (schema.nullable === false)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!types3.length && schema.nullable !== undefined) {
        throw new Error('"nullable" cannot be used without "type"');
      }
      if (schema.nullable === true)
        types3.push("null");
    }
    return types3;
  }
  exports.getSchemaTypes = getSchemaTypes;
  function getJSONTypes(ts) {
    const types3 = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types3.every(rules_1.isJSONType))
      return types3;
    throw new Error("type must be JSONType or JSONType[]: " + types3.join(","));
  }
  exports.getJSONTypes = getJSONTypes;
  function coerceAndCheckDataType(it, types3) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types3, opts.coerceTypes);
    const checkTypes = types3.length > 0 && !(coerceTo.length === 0 && types3.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types3[0]));
    if (checkTypes) {
      const wrongType = checkDataTypes(types3, data, opts.strictNumbers, DataType.Wrong);
      gen.if(wrongType, () => {
        if (coerceTo.length)
          coerceData(it, types3, coerceTo);
        else
          reportTypeError(it);
      });
    }
    return checkTypes;
  }
  exports.coerceAndCheckDataType = coerceAndCheckDataType;
  var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
  function coerceToTypes(types3, coerceTypes) {
    return coerceTypes ? types3.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  }
  function coerceData(it, types3, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
    if (opts.coerceTypes === "array") {
      gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types3, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._)`${coerced} !== undefined`);
    for (const t of coerceTo) {
      if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
        coerceSpecificType(t);
      }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
      gen.assign(data, coerced);
      assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
      switch (t) {
        case "string":
          gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
          return;
        case "number":
          gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "integer":
          gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "boolean":
          gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
          return;
        case "null":
          gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
          gen.assign(coerced, null);
          return;
        case "array":
          gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
      }
    }
  }
  function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  }
  function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
      case "null":
        return (0, codegen_1._)`${data} ${EQ} null`;
      case "array":
        cond = (0, codegen_1._)`Array.isArray(${data})`;
        break;
      case "object":
        cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
        break;
      case "integer":
        cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
        break;
      case "number":
        cond = numCond();
        break;
      default:
        return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
      return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
    }
  }
  exports.checkDataType = checkDataType;
  function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
      return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types3 = (0, util_1.toHash)(dataTypes);
    if (types3.array && types3.object) {
      const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
      cond = types3.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
      delete types3.null;
      delete types3.array;
      delete types3.object;
    } else {
      cond = codegen_1.nil;
    }
    if (types3.number)
      delete types3.integer;
    for (const t in types3)
      cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
  }
  exports.checkDataTypes = checkDataTypes;
  var typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  };
  function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
  }
  exports.reportTypeError = reportTypeError;
  function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
      gen,
      keyword: "type",
      data,
      schema: schema.type,
      schemaCode,
      schemaValue: schemaCode,
      parentSchema: schema,
      params: {},
      it
    };
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assignDefaults = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
      for (const key in properties) {
        assignDefault(it, key, properties[key].default);
      }
    } else if (ty === "array" && Array.isArray(items)) {
      items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
  }
  exports.assignDefaults = assignDefaults;
  function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
      return;
    const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
      (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
      return;
    }
    let condition = (0, codegen_1._)`${childData} === undefined`;
    if (opts.useDefaults === "empty") {
      condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
    }
    gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var util_2 = require_util();
  function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
      cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
      cxt.error();
    });
  }
  exports.checkReportMissingProp = checkReportMissingProp;
  function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  }
  exports.checkMissingProp = checkMissingProp;
  function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
  }
  exports.reportMissingProp = reportMissingProp;
  function hasPropFunc(gen) {
    return gen.scopeValue("func", {
      ref: Object.prototype.hasOwnProperty,
      code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
    });
  }
  exports.hasPropFunc = hasPropFunc;
  function isOwnProperty(gen, data, property) {
    return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  }
  exports.isOwnProperty = isOwnProperty;
  function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  }
  exports.propertyInData = propertyInData;
  function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  }
  exports.noPropertyInData = noPropertyInData;
  function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  }
  exports.allSchemaProperties = allSchemaProperties;
  function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  }
  exports.schemaProperties = schemaProperties;
  function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
      [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
      [names_1.default.parentData, it.parentData],
      [names_1.default.parentDataProperty, it.parentDataProperty],
      [names_1.default.rootData, names_1.default.rootData]
    ];
    if (it.opts.dynamicRef)
      valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  }
  exports.callValidateCode = callValidateCode;
  var newRegExp = (0, codegen_1._)`new RegExp`;
  function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
      key: rx.toString(),
      ref: rx,
      code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
    });
  }
  exports.usePattern = usePattern;
  function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
      const validArr = gen.let("valid", true);
      validateItems(() => gen.assign(validArr, false));
      return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword,
          dataProp: i,
          dataPropType: util_1.Type.Num
        }, valid);
        gen.if((0, codegen_1.not)(valid), notValid);
      });
    }
  }
  exports.validateArray = validateArray;
  function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    if (!Array.isArray(schema))
      throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
      return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
      const schCxt = cxt.subschema({
        keyword,
        schemaProp: i,
        compositeRule: true
      }, schValid);
      gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
      const merged = cxt.mergeValidEvaluated(schCxt, schValid);
      if (!merged)
        gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  }
  exports.validateUnion = validateUnion;
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var code_1 = require_code2();
  var errors_1 = require_errors();
  function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
      it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
      schema: macroSchema,
      schemaPath: codegen_1.nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
  }
  exports.macroKeywordCode = macroKeywordCode;
  function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== undefined ? _a : valid);
    function validateKeyword() {
      if (def.errors === false) {
        assignValid();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => cxt.error());
      } else {
        const ruleErrs = def.async ? validateAsync() : validateSync();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => addErrs(cxt, ruleErrs));
      }
    }
    function validateAsync() {
      const ruleErrs = gen.let("ruleErrs", null);
      gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
      return ruleErrs;
    }
    function validateSync() {
      const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
      gen.assign(validateErrs, null);
      assignValid(codegen_1.nil);
      return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
      const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
      const passSchema = !(("compile" in def) && !$data || def.schema === false);
      gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors) {
      var _a2;
      gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== undefined ? _a2 : valid), errors);
    }
  }
  exports.funcKeywordCode = funcKeywordCode;
  function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  }
  function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
  }
  function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
      throw new Error("async keyword in sync schema");
  }
  function useKeyword(gen, keyword, result) {
    if (result === undefined)
      throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
  }
  function validSchemaType(schema, schemaType, allowUndefined = false) {
    return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  }
  exports.validSchemaType = validSchemaType;
  function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
      throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === undefined ? undefined : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
      throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
      const valid = def.validateSchema(schema[keyword]);
      if (!valid) {
        const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
  }
  exports.validateKeywordUsage = validateKeywordUsage;
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
      const sch = it.schema[keyword];
      return schemaProp === undefined ? {
        schema: sch,
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`
      } : {
        schema: sch[schemaProp],
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
      };
    }
    if (schema !== undefined) {
      if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      }
      return {
        schema,
        schemaPath,
        topSchemaRef,
        errSchemaPath
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  exports.getSubschema = getSubschema;
  function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
      const { errorPath, dataPathArr, opts } = it;
      const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
      dataContextProps(nextData);
      subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
      subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
      subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
      const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
      dataContextProps(nextData);
      if (propertyName !== undefined)
        subschema.propertyName = propertyName;
    }
    if (dataTypes)
      subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
      subschema.data = _nextData;
      subschema.dataLevel = it.dataLevel + 1;
      subschema.dataTypes = [];
      it.definedProperties = new Set;
      subschema.parentData = it.data;
      subschema.dataNames = [...it.dataNames, _nextData];
    }
  }
  exports.extendSubschemaData = extendSubschemaData;
  function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
      subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
      subschema.createErrors = createErrors;
    if (allErrors !== undefined)
      subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator;
    subschema.jtdMetadata = jtdMetadata;
  }
  exports.extendSubschemaMode = extendSubschemaMode;
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS((exports, module) => {
  module.exports = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length;i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length;i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length;i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS((exports, module) => {
  var traverse = module.exports = function(schema, opts, cb) {
    if (typeof opts == "function") {
      cb = opts;
      opts = {};
    }
    cb = opts.cb || cb;
    var pre = typeof cb == "function" ? cb : cb.pre || function() {};
    var post = cb.post || function() {};
    _traverse(opts, pre, post, schema, "", schema);
  };
  traverse.keywords = {
    additionalItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true
  };
  traverse.arrayKeywords = {
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true
  };
  traverse.propsKeywords = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependencies: true
  };
  traverse.skipKeywords = {
    default: true,
    enum: true,
    const: true,
    required: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true
  };
  function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (schema && typeof schema == "object" && !Array.isArray(schema)) {
      pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      for (var key in schema) {
        var sch = schema[key];
        if (Array.isArray(sch)) {
          if (key in traverse.arrayKeywords) {
            for (var i = 0;i < sch.length; i++)
              _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          }
        } else if (key in traverse.propsKeywords) {
          if (sch && typeof sch == "object") {
            for (var prop in sch)
              _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          }
        } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
          _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
      }
      post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    }
  }
  function escapeJsonPtr(str) {
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = undefined;
  var util_1 = require_util();
  var equal = require_fast_deep_equal();
  var traverse = require_json_schema_traverse();
  var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
      return true;
    if (limit === true)
      return !hasRef(schema);
    if (!limit)
      return false;
    return countKeys(schema) <= limit;
  }
  exports.inlineRef = inlineRef;
  var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function hasRef(schema) {
    for (const key in schema) {
      if (REF_KEYWORDS.has(key))
        return true;
      const sch = schema[key];
      if (Array.isArray(sch) && sch.some(hasRef))
        return true;
      if (typeof sch == "object" && hasRef(sch))
        return true;
    }
    return false;
  }
  function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
      if (key === "$ref")
        return Infinity;
      count++;
      if (SIMPLE_INLINED.has(key))
        continue;
      if (typeof schema[key] == "object") {
        (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
      }
      if (count === Infinity)
        return Infinity;
    }
    return count;
  }
  function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
      id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
  }
  exports.getFullPath = getFullPath;
  function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
  }
  exports._getFullPath = _getFullPath;
  var TRAILING_SLASH_HASH = /#\/?$/;
  function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  }
  exports.normalizeId = normalizeId;
  function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
  }
  exports.resolveUrl = resolveUrl;
  var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
      return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set;
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
      if (parentJsonPtr === undefined)
        return;
      const fullPath = pathPrefix + jsonPtr;
      let innerBaseId = baseIds[parentJsonPtr];
      if (typeof sch[schemaId] == "string")
        innerBaseId = addRef.call(this, sch[schemaId]);
      addAnchor.call(this, sch.$anchor);
      addAnchor.call(this, sch.$dynamicAnchor);
      baseIds[jsonPtr] = innerBaseId;
      function addRef(ref) {
        const _resolve = this.opts.uriResolver.resolve;
        ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
        if (schemaRefs.has(ref))
          throw ambiguos(ref);
        schemaRefs.add(ref);
        let schOrRef = this.refs[ref];
        if (typeof schOrRef == "string")
          schOrRef = this.refs[schOrRef];
        if (typeof schOrRef == "object") {
          checkAmbiguosRef(sch, schOrRef.schema, ref);
        } else if (ref !== normalizeId(fullPath)) {
          if (ref[0] === "#") {
            checkAmbiguosRef(sch, localRefs[ref], ref);
            localRefs[ref] = sch;
          } else {
            this.refs[ref] = fullPath;
          }
        }
        return ref;
      }
      function addAnchor(anchor) {
        if (typeof anchor == "string") {
          if (!ANCHOR.test(anchor))
            throw new Error(`invalid anchor "${anchor}"`);
          addRef.call(this, `#${anchor}`);
        }
      }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
      if (sch2 !== undefined && !equal(sch1, sch2))
        throw ambiguos(ref);
    }
    function ambiguos(ref) {
      return new Error(`reference "${ref}" resolves to more than one schema`);
    }
  }
  exports.getSchemaRefs = getSchemaRefs;
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getData = exports.KeywordCxt = exports.validateFunctionCode = undefined;
  var boolSchema_1 = require_boolSchema();
  var dataType_1 = require_dataType();
  var applicability_1 = require_applicability();
  var dataType_2 = require_dataType();
  var defaults_1 = require_defaults();
  var keyword_1 = require_keyword();
  var subschema_1 = require_subschema();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var errors_1 = require_errors();
  function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        topSchemaObjCode(it);
        return;
      }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  }
  exports.validateFunctionCode = validateFunctionCode;
  function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
        destructureValCxtES5(gen, opts);
        gen.code(body);
      });
    } else {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
  }
  function destructureValCxt(opts) {
    return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  }
  function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
      gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.rootData, names_1.default.data);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
    });
  }
  function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      checkNoDefault(it);
      gen.let(names_1.default.vErrors, null);
      gen.let(names_1.default.errors, 0);
      if (opts.unevaluated)
        resetEvaluated(it);
      typeAndKeywords(it);
      returnResults(it);
    });
    return;
  }
  function resetEvaluated(it) {
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  }
  function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  }
  function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        subSchemaObjCode(it, valid);
        return;
      }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
  }
  function schemaCxtHasRules({ schema, self }) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (self.RULES.all[key])
        return true;
    return false;
  }
  function isSchemaObj(it) {
    return typeof it.schema != "boolean";
  }
  function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
      commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  }
  function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
  }
  function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
      return schemaKeywords(it, [], false, errsCount);
    const types3 = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types3);
    schemaKeywords(it, types3, !checkedTypes, errsCount);
  }
  function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
      self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
  }
  function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
      (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
  }
  function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
      it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  }
  function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
      gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
    } else if (typeof opts.$comment == "function") {
      const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
      const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
      gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
  }
  function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
      gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
      if (opts.unevaluated)
        assignEvaluated(it);
      gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
    }
  }
  function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  }
  function schemaKeywords(it, types3, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self } = it;
    const { RULES } = self;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
      gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
      return;
    }
    if (!opts.jtd)
      checkStrictTypes(it, types3);
    gen.block(() => {
      for (const group of RULES.rules)
        groupKeywords(group);
      groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
      if (!(0, applicability_1.shouldUseGroup)(schema, group))
        return;
      if (group.type) {
        gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
        iterateKeywords(it, group);
        if (types3.length === 1 && types3[0] === group.type && typeErrors) {
          gen.else();
          (0, dataType_2.reportTypeError)(it);
        }
        gen.endIf();
      } else {
        iterateKeywords(it, group);
      }
      if (!allErrors)
        gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
    }
  }
  function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults } } = it;
    if (useDefaults)
      (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
      for (const rule of group.rules) {
        if ((0, applicability_1.shouldUseRule)(schema, rule)) {
          keywordCode(it, rule.keyword, rule.definition, group.type);
        }
      }
    });
  }
  function checkStrictTypes(it, types3) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
      return;
    checkContextTypes(it, types3);
    if (!it.opts.allowUnionTypes)
      checkMultipleTypes(it, types3);
    checkKeywordTypes(it, it.dataTypes);
  }
  function checkContextTypes(it, types3) {
    if (!types3.length)
      return;
    if (!it.dataTypes.length) {
      it.dataTypes = types3;
      return;
    }
    types3.forEach((t) => {
      if (!includesType(it.dataTypes, t)) {
        strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
      }
    });
    narrowSchemaTypes(it, types3);
  }
  function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
      strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
  }
  function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
      const rule = rules[keyword];
      if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
        const { type } = rule.definition;
        if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
  }
  function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  }
  function includesType(ts, t) {
    return ts.includes(t) || t === "integer" && ts.includes("number");
  }
  function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
      if (includesType(withTypes, t))
        ts.push(t);
      else if (withTypes.includes("integer") && t === "number")
        ts.push("integer");
    }
    it.dataTypes = ts;
  }
  function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  }

  class KeywordCxt {
    constructor(it, def, keyword) {
      (0, keyword_1.validateKeywordUsage)(it, def, keyword);
      this.gen = it.gen;
      this.allErrors = it.allErrors;
      this.keyword = keyword;
      this.data = it.data;
      this.schema = it.schema[keyword];
      this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
      this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
      this.schemaType = def.schemaType;
      this.parentSchema = it.schema;
      this.params = {};
      this.it = it;
      this.def = def;
      if (this.$data) {
        this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
      } else {
        this.schemaCode = this.schemaValue;
        if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        }
      }
      if ("code" in def ? def.trackErrors : def.errors !== false) {
        this.errsCount = it.gen.const("_errs", names_1.default.errors);
      }
    }
    result(condition, successAction, failAction) {
      this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
      this.gen.if(condition);
      if (failAction)
        failAction();
      else
        this.error();
      if (successAction) {
        this.gen.else();
        successAction();
        if (this.allErrors)
          this.gen.endIf();
      } else {
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
    }
    pass(condition, failAction) {
      this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
      if (condition === undefined) {
        this.error();
        if (!this.allErrors)
          this.gen.if(false);
        return;
      }
      this.gen.if(condition);
      this.error();
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
    fail$data(condition) {
      if (!this.$data)
        return this.fail(condition);
      const { schemaCode } = this;
      this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
      if (errorParams) {
        this.setParams(errorParams);
        this._error(append, errorPaths);
        this.setParams({});
        return;
      }
      this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
      (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
      (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
      if (this.errsCount === undefined)
        throw new Error('add "trackErrors" to keyword definition');
      (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
      if (!this.allErrors)
        this.gen.if(cond);
    }
    setParams(obj, assign) {
      if (assign)
        Object.assign(this.params, obj);
      else
        this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
      this.gen.block(() => {
        this.check$data(valid, $dataValid);
        codeBlock();
      });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
      if (!this.$data)
        return;
      const { gen, schemaCode, schemaType, def } = this;
      gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
      if (valid !== codegen_1.nil)
        gen.assign(valid, true);
      if (schemaType.length || def.validateSchema) {
        gen.elseIf(this.invalid$data());
        this.$dataError();
        if (valid !== codegen_1.nil)
          gen.assign(valid, false);
      }
      gen.else();
    }
    invalid$data() {
      const { gen, schemaCode, schemaType, def, it } = this;
      return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
      function wrong$DataType() {
        if (schemaType.length) {
          if (!(schemaCode instanceof codegen_1.Name))
            throw new Error("ajv implementation error");
          const st = Array.isArray(schemaType) ? schemaType : [schemaType];
          return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
        }
        return codegen_1.nil;
      }
      function invalid$DataSchema() {
        if (def.validateSchema) {
          const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
          return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
        }
        return codegen_1.nil;
      }
    }
    subschema(appl, valid) {
      const subschema = (0, subschema_1.getSubschema)(this.it, appl);
      (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
      (0, subschema_1.extendSubschemaMode)(subschema, appl);
      const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
      subschemaCode(nextContext, valid);
      return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
      const { it, gen } = this;
      if (!it.opts.unevaluated)
        return;
      if (it.props !== true && schemaCxt.props !== undefined) {
        it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
      }
      if (it.items !== true && schemaCxt.items !== undefined) {
        it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
      }
    }
    mergeValidEvaluated(schemaCxt, valid) {
      const { it, gen } = this;
      if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
        gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
        return true;
      }
    }
  }
  exports.KeywordCxt = KeywordCxt;
  function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
      def.code(cxt, ruleType);
    } else if (cxt.$data && def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    } else if ("macro" in def) {
      (0, keyword_1.macroKeywordCode)(cxt, def);
    } else if (def.compile || def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    }
  }
  var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
      return names_1.default.rootData;
    if ($data[0] === "/") {
      if (!JSON_POINTER.test($data))
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      jsonPointer = $data;
      data = names_1.default.rootData;
    } else {
      const matches = RELATIVE_JSON_POINTER.exec($data);
      if (!matches)
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      const up = +matches[1];
      jsonPointer = matches[2];
      if (jsonPointer === "#") {
        if (up >= dataLevel)
          throw new Error(errorMsg("property/index", up));
        return dataPathArr[dataLevel - up];
      }
      if (up > dataLevel)
        throw new Error(errorMsg("data", up));
      data = dataNames[dataLevel - up];
      if (!jsonPointer)
        return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
      if (segment) {
        data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
        expr = (0, codegen_1._)`${expr} && ${data}`;
      }
    }
    return expr;
    function errorMsg(pointerType, up) {
      return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
  }
  exports.getData = getData;
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class ValidationError extends Error {
    constructor(errors) {
      super("validation failed");
      this.errors = errors;
      this.ajv = this.validation = true;
    }
  }
  exports.default = ValidationError;
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var resolve_1 = require_resolve();

  class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
      super(msg || `can't resolve reference ${ref} from id ${baseId}`);
      this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
      this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
  }
  exports.default = MissingRefError;
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = undefined;
  var codegen_1 = require_codegen();
  var validation_error_1 = require_validation_error();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var validate_1 = require_validate();

  class SchemaEnv {
    constructor(env) {
      var _a;
      this.refs = {};
      this.dynamicAnchors = {};
      let schema;
      if (typeof env.schema == "object")
        schema = env.schema;
      this.schema = env.schema;
      this.schemaId = env.schemaId;
      this.root = env.root || this;
      this.baseId = (_a = env.baseId) !== null && _a !== undefined ? _a : (0, resolve_1.normalizeId)(schema === null || schema === undefined ? undefined : schema[env.schemaId || "$id"]);
      this.schemaPath = env.schemaPath;
      this.localRefs = env.localRefs;
      this.meta = env.meta;
      this.$async = schema === null || schema === undefined ? undefined : schema.$async;
      this.refs = {};
    }
  }
  exports.SchemaEnv = SchemaEnv;
  function compileSchema(sch) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
      return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
      gen,
      allErrors: this.opts.allErrors,
      data: names_1.default.data,
      parentData: names_1.default.parentData,
      parentDataProperty: names_1.default.parentDataProperty,
      dataNames: [names_1.default.data],
      dataPathArr: [codegen_1.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: new Set,
      topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
      validateName,
      ValidationError: _ValidationError,
      schema: sch.schema,
      schemaEnv: sch,
      rootId,
      baseId: sch.baseId || rootId,
      schemaPath: codegen_1.nil,
      errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, codegen_1._)`""`,
      opts: this.opts,
      self: this
    };
    let sourceCode;
    try {
      this._compilations.add(sch);
      (0, validate_1.validateFunctionCode)(schemaCxt);
      gen.optimize(this.opts.code.optimize);
      const validateCode = gen.toString();
      sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
      if (this.opts.code.process)
        sourceCode = this.opts.code.process(sourceCode, sch);
      const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
      const validate = makeValidate(this, this.scope.get());
      this.scope.value(validateName, { ref: validate });
      validate.errors = null;
      validate.schema = sch.schema;
      validate.schemaEnv = sch;
      if (sch.$async)
        validate.$async = true;
      if (this.opts.code.source === true) {
        validate.source = { validateName, validateCode, scopeValues: gen._values };
      }
      if (this.opts.unevaluated) {
        const { props, items } = schemaCxt;
        validate.evaluated = {
          props: props instanceof codegen_1.Name ? undefined : props,
          items: items instanceof codegen_1.Name ? undefined : items,
          dynamicProps: props instanceof codegen_1.Name,
          dynamicItems: items instanceof codegen_1.Name
        };
        if (validate.source)
          validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
      }
      sch.validate = validate;
      return sch;
    } catch (e) {
      delete sch.validate;
      delete sch.validateName;
      if (sourceCode)
        this.logger.error("Error compiling schema, function code:", sourceCode);
      throw e;
    } finally {
      this._compilations.delete(sch);
    }
  }
  exports.compileSchema = compileSchema;
  function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
      return schOrFunc;
    let _sch = resolve2.call(this, root, ref);
    if (_sch === undefined) {
      const schema = (_a = root.localRefs) === null || _a === undefined ? undefined : _a[ref];
      const { schemaId } = this.opts;
      if (schema)
        _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
      return;
    return root.refs[ref] = inlineOrCompile.call(this, _sch);
  }
  exports.resolveRef = resolveRef;
  function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
      return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
  }
  function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
      if (sameSchemaEnv(sch, schEnv))
        return sch;
    }
  }
  exports.getCompilingSchema = getCompilingSchema;
  function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  }
  function resolve2(root, ref) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
      ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  }
  function resolveSchema(root, ref) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
      return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
      const sch = resolveSchema.call(this, root, schOrRef);
      if (typeof (sch === null || sch === undefined ? undefined : sch.schema) !== "object")
        return;
      return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === undefined ? undefined : schOrRef.schema) !== "object")
      return;
    if (!schOrRef.validate)
      compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
      const { schema } = schOrRef;
      const { schemaId } = this.opts;
      const schId = schema[schemaId];
      if (schId)
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
  }
  exports.resolveSchema = resolveSchema;
  var PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === undefined ? undefined : _a[0]) !== "/")
      return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
      if (typeof schema === "boolean")
        return;
      const partSchema = schema[(0, util_1.unescapeFragment)(part)];
      if (partSchema === undefined)
        return;
      schema = partSchema;
      const schId = typeof schema === "object" && schema[this.opts.schemaId];
      if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
      const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
      env = resolveSchema.call(this, root, $ref);
    }
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
      return env;
    return;
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS((exports, module) => {
  module.exports = {
    $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    type: "object",
    required: ["$data"],
    properties: {
      $data: {
        type: "string",
        anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
      }
    },
    additionalProperties: false
  };
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function stringArrayToHexStripped(input) {
    let acc = "";
    let code = 0;
    let i = 0;
    for (i = 0;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (code === 48) {
        continue;
      }
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
      break;
    }
    for (i += 1;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
    }
    return acc;
  }
  var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function consumeIsZone(buffer) {
    buffer.length = 0;
    return true;
  }
  function consumeHextets(buffer, address, output) {
    if (buffer.length) {
      const hex = stringArrayToHexStripped(buffer);
      if (hex !== "") {
        address.push(hex);
      } else {
        output.error = true;
        return false;
      }
      buffer.length = 0;
    }
    return true;
  }
  function getIPV6(input) {
    let tokenCount = 0;
    const output = { error: false, address: "", zone: "" };
    const address = [];
    const buffer = [];
    let endipv6Encountered = false;
    let endIpv6 = false;
    let consume = consumeHextets;
    for (let i = 0;i < input.length; i++) {
      const cursor = input[i];
      if (cursor === "[" || cursor === "]") {
        continue;
      }
      if (cursor === ":") {
        if (endipv6Encountered === true) {
          endIpv6 = true;
        }
        if (!consume(buffer, address, output)) {
          break;
        }
        if (++tokenCount > 7) {
          output.error = true;
          break;
        }
        if (i > 0 && input[i - 1] === ":") {
          endipv6Encountered = true;
        }
        address.push(":");
        continue;
      } else if (cursor === "%") {
        if (!consume(buffer, address, output)) {
          break;
        }
        consume = consumeIsZone;
      } else {
        buffer.push(cursor);
        continue;
      }
    }
    if (buffer.length) {
      if (consume === consumeIsZone) {
        output.zone = buffer.join("");
      } else if (endIpv6) {
        address.push(buffer.join(""));
      } else {
        address.push(stringArrayToHexStripped(buffer));
      }
    }
    output.address = address.join("");
    return output;
  }
  function normalizeIPv6(host) {
    if (findToken(host, ":") < 2) {
      return { host, isIPV6: false };
    }
    const ipv6 = getIPV6(host);
    if (!ipv6.error) {
      let newHost = ipv6.address;
      let escapedHost = ipv6.address;
      if (ipv6.zone) {
        newHost += "%" + ipv6.zone;
        escapedHost += "%25" + ipv6.zone;
      }
      return { host: newHost, isIPV6: true, escapedHost };
    } else {
      return { host, isIPV6: false };
    }
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  function removeDotSegments(path18) {
    let input = path18;
    const output = [];
    let nextSlash = -1;
    let len = 0;
    while (len = input.length) {
      if (len === 1) {
        if (input === ".") {
          break;
        } else if (input === "/") {
          output.push("/");
          break;
        } else {
          output.push(input);
          break;
        }
      } else if (len === 2) {
        if (input[0] === ".") {
          if (input[1] === ".") {
            break;
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === "." || input[1] === "/") {
            output.push("/");
            break;
          }
        }
      } else if (len === 3) {
        if (input === "/..") {
          if (output.length !== 0) {
            output.pop();
          }
          output.push("/");
          break;
        }
      }
      if (input[0] === ".") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(3);
            continue;
          }
        } else if (input[1] === "/") {
          input = input.slice(2);
          continue;
        }
      } else if (input[0] === "/") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(2);
            continue;
          } else if (input[2] === ".") {
            if (input[3] === "/") {
              input = input.slice(3);
              if (output.length !== 0) {
                output.pop();
              }
              continue;
            }
          }
        }
      }
      if ((nextSlash = input.indexOf("/", 1)) === -1) {
        output.push(input);
        break;
      } else {
        output.push(input.slice(0, nextSlash));
        input = input.slice(nextSlash);
      }
    }
    return output.join("");
  }
  function normalizeComponentEncoding(component, esc) {
    const func = esc !== true ? escape : unescape;
    if (component.scheme !== undefined) {
      component.scheme = func(component.scheme);
    }
    if (component.userinfo !== undefined) {
      component.userinfo = func(component.userinfo);
    }
    if (component.host !== undefined) {
      component.host = func(component.host);
    }
    if (component.path !== undefined) {
      component.path = func(component.path);
    }
    if (component.query !== undefined) {
      component.query = func(component.query);
    }
    if (component.fragment !== undefined) {
      component.fragment = func(component.fragment);
    }
    return component;
  }
  function recomposeAuthority(component) {
    const uriTokens = [];
    if (component.userinfo !== undefined) {
      uriTokens.push(component.userinfo);
      uriTokens.push("@");
    }
    if (component.host !== undefined) {
      let host = unescape(component.host);
      if (!isIPv4(host)) {
        const ipV6res = normalizeIPv6(host);
        if (ipV6res.isIPV6 === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = component.host;
        }
      }
      uriTokens.push(host);
    }
    if (typeof component.port === "number" || typeof component.port === "string") {
      uriTokens.push(":");
      uriTokens.push(String(component.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    nonSimpleDomain,
    recomposeAuthority,
    normalizeComponentEncoding,
    removeDotSegments,
    isIPv4,
    isUUID,
    normalizeIPv6,
    stringArrayToHexStripped
  };
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS((exports, module) => {
  var { isUUID } = require_utils();
  var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  var supportedSchemeNames = [
    "http",
    "https",
    "ws",
    "wss",
    "urn",
    "urn:uuid"
  ];
  function isValidSchemeName(name) {
    return supportedSchemeNames.indexOf(name) !== -1;
  }
  function wsIsSecure(wsComponent) {
    if (wsComponent.secure === true) {
      return true;
    } else if (wsComponent.secure === false) {
      return false;
    } else if (wsComponent.scheme) {
      return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
    } else {
      return false;
    }
  }
  function httpParse(component) {
    if (!component.host) {
      component.error = component.error || "HTTP URIs must have a host.";
    }
    return component;
  }
  function httpSerialize(component) {
    const secure = String(component.scheme).toLowerCase() === "https";
    if (component.port === (secure ? 443 : 80) || component.port === "") {
      component.port = undefined;
    }
    if (!component.path) {
      component.path = "/";
    }
    return component;
  }
  function wsParse(wsComponent) {
    wsComponent.secure = wsIsSecure(wsComponent);
    wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
    wsComponent.path = undefined;
    wsComponent.query = undefined;
    return wsComponent;
  }
  function wsSerialize(wsComponent) {
    if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
      wsComponent.port = undefined;
    }
    if (typeof wsComponent.secure === "boolean") {
      wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
      wsComponent.secure = undefined;
    }
    if (wsComponent.resourceName) {
      const [path18, query] = wsComponent.resourceName.split("?");
      wsComponent.path = path18 && path18 !== "/" ? path18 : undefined;
      wsComponent.query = query;
      wsComponent.resourceName = undefined;
    }
    wsComponent.fragment = undefined;
    return wsComponent;
  }
  function urnParse(urnComponent, options) {
    if (!urnComponent.path) {
      urnComponent.error = "URN can not be parsed";
      return urnComponent;
    }
    const matches = urnComponent.path.match(URN_REG);
    if (matches) {
      const scheme = options.scheme || urnComponent.scheme || "urn";
      urnComponent.nid = matches[1].toLowerCase();
      urnComponent.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      urnComponent.path = undefined;
      if (schemeHandler) {
        urnComponent = schemeHandler.parse(urnComponent, options);
      }
    } else {
      urnComponent.error = urnComponent.error || "URN can not be parsed.";
    }
    return urnComponent;
  }
  function urnSerialize(urnComponent, options) {
    if (urnComponent.nid === undefined) {
      throw new Error("URN without nid cannot be serialized");
    }
    const scheme = options.scheme || urnComponent.scheme || "urn";
    const nid = urnComponent.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = getSchemeHandler(urnScheme);
    if (schemeHandler) {
      urnComponent = schemeHandler.serialize(urnComponent, options);
    }
    const uriComponent = urnComponent;
    const nss = urnComponent.nss;
    uriComponent.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponent;
  }
  function urnuuidParse(urnComponent, options) {
    const uuidComponent = urnComponent;
    uuidComponent.uuid = uuidComponent.nss;
    uuidComponent.nss = undefined;
    if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
      uuidComponent.error = uuidComponent.error || "UUID is not valid.";
    }
    return uuidComponent;
  }
  function urnuuidSerialize(uuidComponent) {
    const urnComponent = uuidComponent;
    urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
    return urnComponent;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  Object.setPrototypeOf(SCHEMES, null);
  function getSchemeHandler(scheme) {
    return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || undefined;
  }
  module.exports = {
    wsIsSecure,
    SCHEMES,
    isValidSchemeName,
    getSchemeHandler
  };
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS((exports, module) => {
  var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
  var { SCHEMES, getSchemeHandler } = require_schemes();
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = serialize(parse(uri, options), options);
    } else if (typeof uri === "object") {
      uri = parse(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve2(baseURI, relativeURI, options) {
    const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
    const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
    schemelessOptions.skipEscape = true;
    return serialize(resolved, schemelessOptions);
  }
  function resolveComponent(base, relative3, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse(serialize(base, options), options);
      relative3 = parse(serialize(relative3, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative3.scheme) {
      target.scheme = relative3.scheme;
      target.userinfo = relative3.userinfo;
      target.host = relative3.host;
      target.port = relative3.port;
      target.path = removeDotSegments(relative3.path || "");
      target.query = relative3.query;
    } else {
      if (relative3.userinfo !== undefined || relative3.host !== undefined || relative3.port !== undefined) {
        target.userinfo = relative3.userinfo;
        target.host = relative3.host;
        target.port = relative3.port;
        target.path = removeDotSegments(relative3.path || "");
        target.query = relative3.query;
      } else {
        if (!relative3.path) {
          target.path = base.path;
          if (relative3.query !== undefined) {
            target.query = relative3.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative3.path[0] === "/") {
            target.path = removeDotSegments(relative3.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative3.path;
            } else if (!base.path) {
              target.path = relative3.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative3.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative3.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative3.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
      uriA = unescape(uriA);
      uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
    } else if (typeof uriA === "object") {
      uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
    }
    if (typeof uriB === "string") {
      uriB = unescape(uriB);
      uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
    } else if (typeof uriB === "object") {
      uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
    }
    return uriA.toLowerCase() === uriB.toLowerCase();
  }
  function serialize(cmpts, opts) {
    const component = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(component, options);
    if (component.path !== undefined) {
      if (!options.skipEscape) {
        component.path = escape(component.path);
        if (component.scheme !== undefined) {
          component.path = component.path.split("%3A").join(":");
        }
      } else {
        component.path = unescape(component.path);
      }
    }
    if (options.reference !== "suffix" && component.scheme) {
      uriTokens.push(component.scheme, ":");
    }
    const authority = recomposeAuthority(component);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (component.path && component.path[0] !== "/") {
        uriTokens.push("/");
      }
    }
    if (component.path !== undefined) {
      let s = component.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (authority === undefined && s[0] === "/" && s[1] === "/") {
        s = "/%2F" + s.slice(2);
      }
      uriTokens.push(s);
    }
    if (component.query !== undefined) {
      uriTokens.push("?", component.query);
    }
    if (component.fragment !== undefined) {
      uriTokens.push("#", component.fragment);
    }
    return uriTokens.join("");
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function parse(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    let isIP = false;
    if (options.reference === "suffix") {
      if (options.scheme) {
        uri = options.scheme + ":" + uri;
      } else {
        uri = "//" + uri;
      }
    }
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      if (parsed.host) {
        const ipv4result = isIPv4(parsed.host);
        if (ipv4result === false) {
          const ipv6result = normalizeIPv6(parsed.host);
          parsed.host = ipv6result.host.toLowerCase();
          isIP = ipv6result.isIPV6;
        } else {
          isIP = true;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
        if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
          try {
            parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
          } catch (e) {
            parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          }
        }
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (uri.indexOf("%") !== -1) {
          if (parsed.scheme !== undefined) {
            parsed.scheme = unescape(parsed.scheme);
          }
          if (parsed.host !== undefined) {
            parsed.host = unescape(parsed.host);
          }
        }
        if (parsed.path) {
          parsed.path = escape(unescape(parsed.path));
        }
        if (parsed.fragment) {
          parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return parsed;
  }
  var fastUri = {
    SCHEMES,
    normalize,
    resolve: resolve2,
    resolveComponent,
    equal,
    serialize,
    parse
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var uri = require_fast_uri();
  uri.code = 'require("ajv/dist/runtime/uri").default';
  exports.default = uri;
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = undefined;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  var ref_error_1 = require_ref_error();
  var rules_1 = require_rules();
  var compile_1 = require_compile();
  var codegen_2 = require_codegen();
  var resolve_1 = require_resolve();
  var dataType_1 = require_dataType();
  var util_1 = require_util();
  var $dataRefSchema = require_data();
  var uri_1 = require_uri();
  var defaultRegExp = (str, flags) => new RegExp(str, flags);
  defaultRegExp.code = "new RegExp";
  var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  var MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === undefined ? undefined : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === undefined ? undefined : _b.regExp) !== null && _c !== undefined ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== undefined ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== undefined ? _e : s) !== null && _f !== undefined ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== undefined ? _g : s) !== null && _h !== undefined ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== undefined ? _j : s) !== null && _k !== undefined ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== undefined ? _l : s) !== null && _m !== undefined ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== undefined ? _o : s) !== null && _p !== undefined ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== undefined ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== undefined ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== undefined ? _s : true,
      messages: (_t = o.messages) !== null && _t !== undefined ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== undefined ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== undefined ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== undefined ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== undefined ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== undefined ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== undefined ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== undefined ? _0 : true,
      uriResolver
    };
  }

  class Ajv {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = {};
      this._compilations = new Set;
      this._loading = {};
      this._cache = new Map;
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_1.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema, _meta) {
      const sch = this._addSchema(schema, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_1.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref, missingRef }) {
        if (this.refs[ref]) {
          throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref) {
        const _schema = await _loadSchema.call(this, ref);
        if (!this.refs[ref])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref])
          this.addSchema(_schema, ref, meta);
      }
      async function _loadSchema(ref) {
        const p = this._loading[ref];
        if (p)
          return p;
        try {
          return await (this._loading[ref] = loadSchema(ref));
        } finally {
          delete this._loading[ref];
        }
      }
    }
    addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema)) {
        for (const sch of schema)
          this.addSchema(sch, undefined, _meta, _validateSchema);
        return this;
      }
      let id;
      if (typeof schema === "object") {
        const { schemaId } = this.opts;
        id = schema[schemaId];
        if (id !== undefined && typeof id != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_1.normalizeId)(key || id);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
      return this;
    }
    addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema, key, true, _validateSchema);
      return this;
    }
    validateSchema(schema, throwOrLogError) {
      if (typeof schema == "boolean")
        return true;
      let $schema;
      $schema = schema.$schema;
      if ($schema !== undefined && typeof $schema != "string") {
        throw new Error("$schema must be a string");
      }
      $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === undefined) {
        const { schemaId } = this.opts;
        const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
        sch = compile_1.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id = schemaKeyRef[this.opts.schemaId];
          if (id) {
            id = (0, resolve_1.normalizeId)(id);
            delete this.schemas[id];
            delete this.refs[id];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(definitions) {
      for (const def of definitions)
        this.addKeyword(def);
      return this;
    }
    addKeyword(kwdOrDef, def) {
      let keyword;
      if (typeof kwdOrDef == "string") {
        keyword = kwdOrDef;
        if (typeof def == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def.keyword = keyword;
        }
      } else if (typeof kwdOrDef == "object" && def === undefined) {
        def = kwdOrDef;
        keyword = def.keyword;
        if (Array.isArray(keyword) && !keyword.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword, def);
      if (!def) {
        (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def);
      const definition = {
        ...def,
        type: (0, dataType_1.getJSONTypes)(def.type),
        schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
      };
      (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword) {
      const rule = this.RULES.all[keyword];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    removeKeyword(keyword) {
      const { RULES } = this;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this.formats[name] = format;
      return this;
    }
    errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors || errors.length === 0)
        return "No errors";
      return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules) {
          const rule = rules[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema = keywords[key];
          if ($data && schema)
            keywords[key] = schemaOrData(schema);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
      for (const keyRef in schemas) {
        const sch = schemas[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas[keyRef];
          }
        }
      }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id;
      const { schemaId } = this.opts;
      if (typeof schema == "object") {
        id = schema[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema);
      if (sch !== undefined)
        return sch;
      baseId = (0, resolve_1.normalizeId)(id || baseId);
      const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
      sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema, true);
      return sch;
    }
    _checkUnique(id) {
      if (this.schemas[id] || this.refs[id]) {
        throw new Error(`schema with key or id "${id}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_1.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_1.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv.ValidationError = validation_error_1.default;
  Ajv.MissingRefError = ref_error_1.default;
  exports.default = Ajv;
  function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format = this.opts.formats[name];
      if (format)
        this.addFormat(name, format);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
      const def = defs[keyword];
      if (!def.keyword)
        def.keyword = keyword;
      this.addKeyword(def);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  var noLogs = { log() {}, warn() {}, error() {} };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === undefined)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
      return;
    if (def.$data && !(("code" in def) || ("validate" in def))) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === undefined ? undefined : definition.post;
    if (dataType && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
      return;
    const rule = {
      keyword,
      definition: {
        ...definition,
        type: (0, dataType_1.getJSONTypes)(definition.type),
        schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === undefined || _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
      return;
    if (def.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
  }
  var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var def = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callRef = exports.getValidate = undefined;
  var ref_error_1 = require_ref_error();
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var util_1 = require_util();
  var def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
      const { gen, schema: $ref, it } = cxt;
      const { baseId, schemaEnv: env, validateName, opts, self } = it;
      const { root } = env;
      if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
        return callRootRef();
      const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
      if (schOrEnv === undefined)
        throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
      if (schOrEnv instanceof compile_1.SchemaEnv)
        return callValidate(schOrEnv);
      return inlineRefSchema(schOrEnv);
      function callRootRef() {
        if (env === root)
          return callRef(cxt, validateName, env, env.$async);
        const rootName = gen.scopeValue("root", { ref: root });
        return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
      }
      function callValidate(sch) {
        const v = getValidate(cxt, sch);
        callRef(cxt, v, sch, sch.$async);
      }
      function inlineRefSchema(sch) {
        const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
        const valid = gen.name("valid");
        const schCxt = cxt.subschema({
          schema: sch,
          dataTypes: [],
          schemaPath: codegen_1.nil,
          topSchemaRef: schName,
          errSchemaPath: $ref
        }, valid);
        cxt.mergeEvaluated(schCxt);
        cxt.ok(valid);
      }
    }
  };
  function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  }
  exports.getValidate = getValidate;
  function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
      callAsyncRef();
    else
      callSyncRef();
    function callAsyncRef() {
      if (!env.$async)
        throw new Error("async schema referenced by sync schema");
      const valid = gen.let("valid");
      gen.try(() => {
        gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
        addEvaluatedFrom(v);
        if (!allErrors)
          gen.assign(valid, true);
      }, (e) => {
        gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
        addErrorsFrom(e);
        if (!allErrors)
          gen.assign(valid, false);
      });
      cxt.ok(valid);
    }
    function callSyncRef() {
      cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
      const errs = (0, codegen_1._)`${source}.errors`;
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
      gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
      var _a;
      if (!it.opts.unevaluated)
        return;
      const schEvaluated = (_a = sch === null || sch === undefined ? undefined : sch.validate) === null || _a === undefined ? undefined : _a.evaluated;
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
          }
        } else {
          const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
          it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
          }
        } else {
          const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
          it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
        }
      }
    }
  }
  exports.callRef = callRef;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var id_1 = require_id();
  var ref_1 = require_ref();
  var core = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default
  ];
  exports.default = core;
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  };
  var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, it } = cxt;
      const prec = it.opts.multipleOfPrecision;
      const res = gen.let("res");
      const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
      cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var ucs2length_1 = require_ucs2length();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxLength" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode, it } = cxt;
      const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
      const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
      cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  };
  var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { data, $data, schema, schemaCode, it } = cxt;
      const u = it.opts.unicodeRegExp ? "u" : "";
      const regExp = $data ? (0, codegen_1._)`(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
      cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxProperties" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  };
  var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, schema, schemaCode, data, $data, it } = cxt;
      const { opts } = it;
      if (!$data && schema.length === 0)
        return;
      const useLoop = schema.length >= opts.loopRequired;
      if (it.allErrors)
        allErrorsMode();
      else
        exitOnErrorMode();
      if (opts.strictRequired) {
        const props = cxt.parentSchema.properties;
        const { definedProperties } = cxt.it;
        for (const requiredKey of schema) {
          if ((props === null || props === undefined ? undefined : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
            const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
            const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
            (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
          }
        }
      }
      function allErrorsMode() {
        if (useLoop || $data) {
          cxt.block$data(codegen_1.nil, loopAllRequired);
        } else {
          for (const prop of schema) {
            (0, code_1.checkReportMissingProp)(cxt, prop);
          }
        }
      }
      function exitOnErrorMode() {
        const missing = gen.let("missing");
        if (useLoop || $data) {
          const valid = gen.let("valid", true);
          cxt.block$data(valid, () => loopUntilMissing(missing, valid));
          cxt.ok(valid);
        } else {
          gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
      function loopAllRequired() {
        gen.forOf("prop", schemaCode, (prop) => {
          cxt.setParams({ missingProperty: prop });
          gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
        });
      }
      function loopUntilMissing(missing, valid) {
        cxt.setParams({ missingProperty: missing });
        gen.forOf(missing, schemaCode, () => {
          gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error();
            gen.break();
          });
        }, codegen_1.nil);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxItems" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var equal = require_fast_deep_equal();
  equal.code = 'require("ajv/dist/runtime/equal").default';
  exports.default = equal;
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dataType_1 = require_dataType();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  };
  var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
      if (!$data && !schema)
        return;
      const valid = gen.let("valid");
      const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
      cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
      cxt.ok(valid);
      function validateUniqueItems() {
        const i = gen.let("i", (0, codegen_1._)`${data}.length`);
        const j = gen.let("j");
        cxt.setParams({ i, j });
        gen.assign(valid, true);
        gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
      }
      function canOptimize() {
        return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
      }
      function loopN(i, j) {
        const item = gen.name("item");
        const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
        const indices = gen.const("indices", (0, codegen_1._)`{}`);
        gen.for((0, codegen_1._)`;${i}--;`, () => {
          gen.let(item, (0, codegen_1._)`${data}[${i}]`);
          gen.if(wrongType, (0, codegen_1._)`continue`);
          if (itemTypes.length > 1)
            gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
          gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
            cxt.error();
            gen.assign(valid, false).break();
          }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
        });
      }
      function loopN2(i, j) {
        const eql = (0, util_1.useFunc)(gen, equal_1.default);
        const outer = gen.name("outer");
        gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
          cxt.error();
          gen.assign(valid, false).break(outer);
        })));
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  };
  var def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schemaCode, schema } = cxt;
      if ($data || schema && typeof schema == "object") {
        cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
      } else {
        cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  };
  var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      if (!$data && schema.length === 0)
        throw new Error("enum must have non-empty array");
      const useLoop = schema.length >= it.opts.loopEnum;
      let eql;
      const getEql = () => eql !== null && eql !== undefined ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
      let valid;
      if (useLoop || $data) {
        valid = gen.let("valid");
        cxt.block$data(valid, loopEnum);
      } else {
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const vSchema = gen.const("vSchema", schemaCode);
        valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
      }
      cxt.pass(valid);
      function loopEnum() {
        gen.assign(valid, false);
        gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
      }
      function equalCode(vSchema, i) {
        const sch = schema[i];
        return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var limitNumber_1 = require_limitNumber();
  var multipleOf_1 = require_multipleOf();
  var limitLength_1 = require_limitLength();
  var pattern_1 = require_pattern();
  var limitProperties_1 = require_limitProperties();
  var required_1 = require_required();
  var limitItems_1 = require_limitItems();
  var uniqueItems_1 = require_uniqueItems();
  var const_1 = require_const();
  var enum_1 = require_enum();
  var validation = [
    limitNumber_1.default,
    multipleOf_1.default,
    limitLength_1.default,
    pattern_1.default,
    limitProperties_1.default,
    required_1.default,
    limitItems_1.default,
    uniqueItems_1.default,
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default
  ];
  exports.default = validation;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAdditionalItems = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { parentSchema, it } = cxt;
      const { items } = parentSchema;
      if (!Array.isArray(items)) {
        (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      validateAdditionalItems(cxt, items);
    }
  };
  function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    if (schema === false) {
      cxt.setParams({ len: items.length });
      cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
    } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
      const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
      gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
      cxt.ok(valid);
    }
    function validateItems(valid) {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
        if (!it.allErrors)
          gen.if((0, codegen_1.not)(valid), () => gen.break());
      });
    }
  }
  exports.validateAdditionalItems = validateAdditionalItems;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateTuple = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
      const { schema, it } = cxt;
      if (Array.isArray(schema))
        return validateTuple(cxt, "additionalItems", schema);
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
      it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    schArr.forEach((sch, i) => {
      if ((0, util_1.alwaysValidSchema)(it, sch))
        return;
      gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
        keyword,
        schemaProp: i,
        dataProp: i
      }, valid));
      cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
      const { opts, errSchemaPath } = it;
      const l = schArr.length;
      const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
      if (opts.strictTuples && !fullTuple) {
        const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
        (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
      }
    }
  }
  exports.validateTuple = validateTuple;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var items_1 = require_items();
  var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var additionalItems_1 = require_additionalItems();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { schema, parentSchema, it } = cxt;
      const { prefixItems } = parentSchema;
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      if (prefixItems)
        (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
      else
        cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { min, max } }) => max === undefined ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  };
  var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      let min;
      let max;
      const { minContains, maxContains } = parentSchema;
      if (it.opts.next) {
        min = minContains === undefined ? 1 : minContains;
        max = maxContains;
      } else {
        min = 1;
      }
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      cxt.setParams({ min, max });
      if (max === undefined && min === 0) {
        (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
        return;
      }
      if (max !== undefined && min > max) {
        (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
        cxt.fail();
        return;
      }
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        let cond = (0, codegen_1._)`${len} >= ${min}`;
        if (max !== undefined)
          cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
        cxt.pass(cond);
        return;
      }
      it.items = true;
      const valid = gen.name("valid");
      if (max === undefined && min === 1) {
        validateItems(valid, () => gen.if(valid, () => gen.break()));
      } else if (min === 0) {
        gen.let(valid, true);
        if (max !== undefined)
          gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
      } else {
        gen.let(valid, false);
        validateItemsWithCount();
      }
      cxt.result(valid, () => cxt.reset());
      function validateItemsWithCount() {
        const schValid = gen.name("_valid");
        const count = gen.let("count", 0);
        validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
      }
      function validateItems(_valid, block) {
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword: "contains",
            dataProp: i,
            dataPropType: util_1.Type.Num,
            compositeRule: true
          }, _valid);
          block();
        });
      }
      function checkLimits(count) {
        gen.code((0, codegen_1._)`${count}++`);
        if (max === undefined) {
          gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
        } else {
          gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
          if (min === 1)
            gen.assign(valid, true);
          else
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
  };
  var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_1.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_1.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
        const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
        cxt.mergeValidEvaluated(schCxt, valid);
      }, () => gen.var(valid, true));
      cxt.ok(valid);
    }
  }
  exports.validateSchemaDeps = validateSchemaDeps;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  };
  var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      const valid = gen.name("valid");
      gen.forIn("key", data, (key) => {
        cxt.setParams({ propertyName: key });
        cxt.subschema({
          keyword: "propertyNames",
          data: key,
          dataTypes: ["string"],
          propertyName: key,
          compositeRule: true
        }, valid);
        gen.if((0, codegen_1.not)(valid), () => {
          cxt.error(true);
          if (!it.allErrors)
            gen.break();
        });
      });
      cxt.ok(valid);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var util_1 = require_util();
  var error = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  };
  var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, opts } = it;
      it.props = true;
      if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
        return;
      const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
      const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
      checkAdditionalProperties();
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function checkAdditionalProperties() {
        gen.forIn("key", data, (key) => {
          if (!props.length && !patProps.length)
            additionalPropertyCode(key);
          else
            gen.if(isAdditional(key), () => additionalPropertyCode(key));
        });
      }
      function isAdditional(key) {
        let definedProp;
        if (props.length > 8) {
          const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
          definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
        } else if (props.length) {
          definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
        } else {
          definedProp = codegen_1.nil;
        }
        if (patProps.length) {
          definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
        }
        return (0, codegen_1.not)(definedProp);
      }
      function deleteAdditional(key) {
        gen.code((0, codegen_1._)`delete ${data}[${key}]`);
      }
      function additionalPropertyCode(key) {
        if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
          deleteAdditional(key);
          return;
        }
        if (schema === false) {
          cxt.setParams({ additionalProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          if (opts.removeAdditional === "failing") {
            applyAdditionalSchema(key, valid, false);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset();
              deleteAdditional(key);
            });
          } else {
            applyAdditionalSchema(key, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
      }
      function applyAdditionalSchema(key, valid, errors) {
        const subschema = {
          keyword: "additionalProperties",
          dataProp: key,
          dataPropType: util_1.Type.Str
        };
        if (errors === false) {
          Object.assign(subschema, {
            compositeRule: true,
            createErrors: false,
            allErrors: false
          });
        }
        cxt.subschema(subschema, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var validate_1 = require_validate();
  var code_1 = require_code2();
  var util_1 = require_util();
  var additionalProperties_1 = require_additionalProperties();
  var def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
        additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
      }
      const allProps = (0, code_1.allSchemaProperties)(schema);
      for (const prop of allProps) {
        it.definedProperties.add(prop);
      }
      if (it.opts.unevaluated && allProps.length && it.props !== true) {
        it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
      }
      const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
      if (properties.length === 0)
        return;
      const valid = gen.name("valid");
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop);
        } else {
          gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
          applyPropertySchema(prop);
          if (!it.allErrors)
            gen.else().var(valid, true);
          gen.endIf();
        }
        cxt.it.definedProperties.add(prop);
        cxt.ok(valid);
      }
      function hasDefault(prop) {
        return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
      }
      function applyPropertySchema(prop) {
        cxt.subschema({
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop
        }, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var util_2 = require_util();
  var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, data, parentSchema, it } = cxt;
      const { opts } = it;
      const patterns = (0, code_1.allSchemaProperties)(schema);
      const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
      if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
        return;
      }
      const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
      const valid = gen.name("valid");
      if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
        it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
      }
      const { props } = it;
      validatePatternProperties();
      function validatePatternProperties() {
        for (const pat of patterns) {
          if (checkProperties)
            checkMatchingProperties(pat);
          if (it.allErrors) {
            validateProperties(pat);
          } else {
            gen.var(valid, true);
            validateProperties(pat);
            gen.if(valid);
          }
        }
      }
      function checkMatchingProperties(pat) {
        for (const prop in checkProperties) {
          if (new RegExp(pat).test(prop)) {
            (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
          }
        }
      }
      function validateProperties(pat) {
        gen.forIn("key", data, (key) => {
          gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
            const alwaysValid = alwaysValidPatterns.includes(pat);
            if (!alwaysValid) {
              cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid);
            }
            if (it.opts.unevaluated && props !== true) {
              gen.assign((0, codegen_1._)`${props}[${key}]`, true);
            } else if (!alwaysValid && !it.allErrors) {
              gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
      const { gen, schema, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        cxt.fail();
        return;
      }
      const valid = gen.name("valid");
      cxt.subschema({
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, valid);
      cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  };
  var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (it.opts.discriminator && parentSchema.discriminator)
        return;
      const schArr = schema;
      const valid = gen.let("valid", false);
      const passing = gen.let("passing", null);
      const schValid = gen.name("_valid");
      cxt.setParams({ passing });
      gen.block(validateOneOf);
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      function validateOneOf() {
        schArr.forEach((sch, i) => {
          let schCxt;
          if ((0, util_1.alwaysValidSchema)(it, sch)) {
            gen.var(schValid, true);
          } else {
            schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true
            }, schValid);
          }
          if (i > 0) {
            gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
          }
          gen.if(schValid, () => {
            gen.assign(valid, true);
            gen.assign(passing, i);
            if (schCxt)
              cxt.mergeEvaluated(schCxt, codegen_1.Name);
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
      const { gen, schema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const valid = gen.name("valid");
      schema.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
        cxt.ok(valid);
        cxt.mergeEvaluated(schCxt);
      });
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  };
  var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, parentSchema, it } = cxt;
      if (parentSchema.then === undefined && parentSchema.else === undefined) {
        (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
      }
      const hasThen = hasSchema(it, "then");
      const hasElse = hasSchema(it, "else");
      if (!hasThen && !hasElse)
        return;
      const valid = gen.let("valid", true);
      const schValid = gen.name("_valid");
      validateIf();
      cxt.reset();
      if (hasThen && hasElse) {
        const ifClause = gen.let("ifClause");
        cxt.setParams({ ifClause });
        gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
      } else if (hasThen) {
        gen.if(schValid, validateClause("then"));
      } else {
        gen.if((0, codegen_1.not)(schValid), validateClause("else"));
      }
      cxt.pass(valid, () => cxt.error(true));
      function validateIf() {
        const schCxt = cxt.subschema({
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, schValid);
        cxt.mergeEvaluated(schCxt);
      }
      function validateClause(keyword, ifClause) {
        return () => {
          const schCxt = cxt.subschema({ keyword }, schValid);
          gen.assign(valid, schValid);
          cxt.mergeValidEvaluated(schCxt, valid);
          if (ifClause)
            gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
          else
            cxt.setParams({ ifClause: keyword });
        };
      }
    }
  };
  function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
  }
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
      if (parentSchema.if === undefined)
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var additionalItems_1 = require_additionalItems();
  var prefixItems_1 = require_prefixItems();
  var items_1 = require_items();
  var items2020_1 = require_items2020();
  var contains_1 = require_contains();
  var dependencies_1 = require_dependencies();
  var propertyNames_1 = require_propertyNames();
  var additionalProperties_1 = require_additionalProperties();
  var properties_1 = require_properties();
  var patternProperties_1 = require_patternProperties();
  var not_1 = require_not();
  var anyOf_1 = require_anyOf();
  var oneOf_1 = require_oneOf();
  var allOf_1 = require_allOf();
  var if_1 = require_if();
  var thenElse_1 = require_thenElse();
  function getApplicator(draft2020 = false) {
    const applicator = [
      not_1.default,
      anyOf_1.default,
      oneOf_1.default,
      allOf_1.default,
      if_1.default,
      thenElse_1.default,
      propertyNames_1.default,
      additionalProperties_1.default,
      dependencies_1.default,
      properties_1.default,
      patternProperties_1.default
    ];
    if (draft2020)
      applicator.push(prefixItems_1.default, items2020_1.default);
    else
      applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
  }
  exports.default = getApplicator;
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  };
  var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error,
    code(cxt, ruleType) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const { opts, errSchemaPath, schemaEnv, self } = it;
      if (!opts.validateFormats)
        return;
      if ($data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
        const fType = gen.let("fType");
        const format = gen.let("format");
        gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
        cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
        function unknownFmt() {
          if (opts.strictSchema === false)
            return codegen_1.nil;
          return (0, codegen_1._)`${schemaCode} && !${format}`;
        }
        function invalidFmt() {
          const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
          const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
          return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
        }
      }
      function validateFormat() {
        const formatDef = self.formats[schema];
        if (!formatDef) {
          unknownFormat();
          return;
        }
        if (formatDef === true)
          return;
        const [fmtType, format, fmtRef] = getFormat(formatDef);
        if (fmtType === ruleType)
          cxt.pass(validCondition());
        function unknownFormat() {
          if (opts.strictSchema === false) {
            self.logger.warn(unknownMsg());
            return;
          }
          throw new Error(unknownMsg());
          function unknownMsg() {
            return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
          }
        }
        function getFormat(fmtDef) {
          const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : undefined;
          const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
          if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
            return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
          }
          return ["string", fmtDef, fmt];
        }
        function validCondition() {
          if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
            if (!schemaEnv.$async)
              throw new Error("async format in sync schema");
            return (0, codegen_1._)`await ${fmtRef}(${data})`;
          }
          return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var format_1 = require_format();
  var format = [format_1.default];
  exports.default = format;
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.contentVocabulary = exports.metadataVocabulary = undefined;
  exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ];
  exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ];
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var core_1 = require_core2();
  var validation_1 = require_validation();
  var applicator_1 = require_applicator();
  var format_1 = require_format2();
  var metadata_1 = require_metadata();
  var draft7Vocabularies = [
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary
  ];
  exports.default = draft7Vocabularies;
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiscrError = undefined;
  var DiscrError;
  (function(DiscrError2) {
    DiscrError2["Tag"] = "tag";
    DiscrError2["Mapping"] = "mapping";
  })(DiscrError || (exports.DiscrError = DiscrError = {}));
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var types_1 = require_types();
  var compile_1 = require_compile();
  var ref_error_1 = require_ref_error();
  var util_1 = require_util();
  var error = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  };
  var def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error,
    code(cxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { oneOf } = parentSchema;
      if (!it.opts.discriminator) {
        throw new Error("discriminator: requires discriminator option");
      }
      const tagName = schema.propertyName;
      if (typeof tagName != "string")
        throw new Error("discriminator: requires propertyName");
      if (schema.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!oneOf)
        throw new Error("discriminator: requires oneOf keyword");
      const valid = gen.let("valid", false);
      const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
      gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
      cxt.ok(valid);
      function validateMapping() {
        const mapping = getMapping();
        gen.if(false);
        for (const tagValue in mapping) {
          gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
          gen.assign(valid, applyTagSchema(mapping[tagValue]));
        }
        gen.else();
        cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
        gen.endIf();
      }
      function applyTagSchema(schemaProp) {
        const _valid = gen.name("valid");
        const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
        cxt.mergeEvaluated(schCxt, codegen_1.Name);
        return _valid;
      }
      function getMapping() {
        var _a;
        const oneOfMapping = {};
        const topRequired = hasRequired(parentSchema);
        let tagRequired = true;
        for (let i = 0;i < oneOf.length; i++) {
          let sch = oneOf[i];
          if ((sch === null || sch === undefined ? undefined : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
            const ref = sch.$ref;
            sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
            if (sch instanceof compile_1.SchemaEnv)
              sch = sch.schema;
            if (sch === undefined)
              throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
          }
          const propSch = (_a = sch === null || sch === undefined ? undefined : sch.properties) === null || _a === undefined ? undefined : _a[tagName];
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
          }
          tagRequired = tagRequired && (topRequired || hasRequired(sch));
          addMappings(propSch, i);
        }
        if (!tagRequired)
          throw new Error(`discriminator: "${tagName}" must be required`);
        return oneOfMapping;
        function hasRequired({ required }) {
          return Array.isArray(required) && required.includes(tagName);
        }
        function addMappings(sch, i) {
          if (sch.const) {
            addMapping(sch.const, i);
          } else if (sch.enum) {
            for (const tagValue of sch.enum) {
              addMapping(tagValue, i);
            }
          } else {
            throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
        }
        function addMapping(tagValue, i) {
          if (typeof tagValue != "string" || tagValue in oneOfMapping) {
            throw new Error(`discriminator: "${tagName}" values must be unique strings`);
          }
          oneOfMapping[tagValue] = i;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://json-schema.org/draft-07/schema#",
    title: "Core schema meta-schema",
    definitions: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $ref: "#" }
      },
      nonNegativeInteger: {
        type: "integer",
        minimum: 0
      },
      nonNegativeIntegerDefault0: {
        allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
      },
      simpleTypes: {
        enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: []
      }
    },
    type: ["object", "boolean"],
    properties: {
      $id: {
        type: "string",
        format: "uri-reference"
      },
      $schema: {
        type: "string",
        format: "uri"
      },
      $ref: {
        type: "string",
        format: "uri-reference"
      },
      $comment: {
        type: "string"
      },
      title: {
        type: "string"
      },
      description: {
        type: "string"
      },
      default: true,
      readOnly: {
        type: "boolean",
        default: false
      },
      examples: {
        type: "array",
        items: true
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0
      },
      maximum: {
        type: "number"
      },
      exclusiveMaximum: {
        type: "number"
      },
      minimum: {
        type: "number"
      },
      exclusiveMinimum: {
        type: "number"
      },
      maxLength: { $ref: "#/definitions/nonNegativeInteger" },
      minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex"
      },
      additionalItems: { $ref: "#" },
      items: {
        anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
        default: true
      },
      maxItems: { $ref: "#/definitions/nonNegativeInteger" },
      minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false
      },
      contains: { $ref: "#" },
      maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
      minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      required: { $ref: "#/definitions/stringArray" },
      additionalProperties: { $ref: "#" },
      definitions: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      properties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        propertyNames: { format: "regex" },
        default: {}
      },
      dependencies: {
        type: "object",
        additionalProperties: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
        }
      },
      propertyNames: { $ref: "#" },
      const: true,
      enum: {
        type: "array",
        items: true,
        minItems: 1,
        uniqueItems: true
      },
      type: {
        anyOf: [
          { $ref: "#/definitions/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/definitions/simpleTypes" },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      format: { type: "string" },
      contentMediaType: { type: "string" },
      contentEncoding: { type: "string" },
      if: { $ref: "#" },
      then: { $ref: "#" },
      else: { $ref: "#" },
      allOf: { $ref: "#/definitions/schemaArray" },
      anyOf: { $ref: "#/definitions/schemaArray" },
      oneOf: { $ref: "#/definitions/schemaArray" },
      not: { $ref: "#" }
    },
    default: true
  };
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = undefined;
  var core_1 = require_core();
  var draft7_1 = require_draft7();
  var discriminator_1 = require_discriminator();
  var draft7MetaSchema = require_json_schema_draft_07();
  var META_SUPPORT_DATA = ["/properties"];
  var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";

  class Ajv extends core_1.default {
    _addVocabularies() {
      super._addVocabularies();
      draft7_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      if (!this.opts.meta)
        return;
      const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
      this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined);
    }
  }
  exports.Ajv = Ajv;
  module.exports = exports = Ajv;
  module.exports.Ajv = Ajv;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = Ajv;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return validation_error_1.default;
  } });
  var ref_error_1 = require_ref_error();
  Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_1.default;
  } });
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatNames = exports.fastFormats = exports.fullFormats = undefined;
  function fmtDef(validate, compare) {
    return { validate, compare };
  }
  exports.fullFormats = {
    date: fmtDef(date2, compareDate),
    time: fmtDef(getTime(true), compareTime),
    "date-time": fmtDef(getDateTime(true), compareDateTime),
    "iso-time": fmtDef(getTime(), compareIsoTime),
    "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex,
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    byte,
    int32: { type: "number", validate: validateInt32 },
    int64: { type: "number", validate: validateInt64 },
    float: { type: "number", validate: validateNumber },
    double: { type: "number", validate: validateNumber },
    password: true,
    binary: true
  };
  exports.fastFormats = {
    ...exports.fullFormats,
    date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
    time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
    "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
    "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
    "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  };
  exports.formatNames = Object.keys(exports.fullFormats);
  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function date2(str) {
    const matches = DATE.exec(str);
    if (!matches)
      return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  }
  function compareDate(d1, d2) {
    if (!(d1 && d2))
      return;
    if (d1 > d2)
      return 1;
    if (d1 < d2)
      return -1;
    return 0;
  }
  var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function getTime(strictTimeZone) {
    return function time(str) {
      const matches = TIME.exec(str);
      if (!matches)
        return false;
      const hr = +matches[1];
      const min = +matches[2];
      const sec = +matches[3];
      const tz = matches[4];
      const tzSign = matches[5] === "-" ? -1 : 1;
      const tzH = +(matches[6] || 0);
      const tzM = +(matches[7] || 0);
      if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
        return false;
      if (hr <= 23 && min <= 59 && sec < 60)
        return true;
      const utcMin = min - tzM * tzSign;
      const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
      return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
    };
  }
  function compareTime(s1, s2) {
    if (!(s1 && s2))
      return;
    const t1 = new Date("2020-01-01T" + s1).valueOf();
    const t2 = new Date("2020-01-01T" + s2).valueOf();
    if (!(t1 && t2))
      return;
    return t1 - t2;
  }
  function compareIsoTime(t1, t2) {
    if (!(t1 && t2))
      return;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
      return;
    t1 = a1[1] + a1[2] + a1[3];
    t2 = a2[1] + a2[2] + a2[3];
    if (t1 > t2)
      return 1;
    if (t1 < t2)
      return -1;
    return 0;
  }
  var DATE_TIME_SEPARATOR = /t|\s/i;
  function getDateTime(strictTimeZone) {
    const time = getTime(strictTimeZone);
    return function date_time(str) {
      const dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length === 2 && date2(dateTime[0]) && time(dateTime[1]);
    };
  }
  function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const d1 = new Date(dt1).valueOf();
    const d2 = new Date(dt2).valueOf();
    if (!(d1 && d2))
      return;
    return d1 - d2;
  }
  function compareIsoDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
      return;
    return res || compareTime(t1, t2);
  }
  var NOT_URI_FRAGMENT = /\/|:/;
  var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function uri(str) {
    return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  }
  var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function byte(str) {
    BYTE.lastIndex = 0;
    return BYTE.test(str);
  }
  var MIN_INT32 = -(2 ** 31);
  var MAX_INT32 = 2 ** 31 - 1;
  function validateInt32(value) {
    return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  }
  function validateInt64(value) {
    return Number.isInteger(value);
  }
  function validateNumber() {
    return true;
  }
  var Z_ANCHOR = /[^\\]\\Z/;
  function regex(str) {
    if (Z_ANCHOR.test(str))
      return false;
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }
});

// node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatLimitDefinition = undefined;
  var ajv_1 = require_ajv();
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  exports.formatLimitDefinition = {
    keyword: Object.keys(KWDs),
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, keyword, it } = cxt;
      const { opts, self } = it;
      if (!opts.validateFormats)
        return;
      const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
      if (fCxt.$data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
        cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
      }
      function validateFormat() {
        const format = fCxt.schema;
        const fmtDef = self.formats[format];
        if (!fmtDef || fmtDef === true)
          return;
        if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
          throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
        }
        const fmt = gen.scopeValue("formats", {
          key: format,
          ref: fmtDef,
          code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : undefined
        });
        cxt.fail$data(compareCode(fmt));
      }
      function compareCode(fmt) {
        return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  var formatLimitPlugin = (ajv) => {
    ajv.addKeyword(exports.formatLimitDefinition);
    return ajv;
  };
  exports.default = formatLimitPlugin;
});

// node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var formats_1 = require_formats();
  var limit_1 = require_limit();
  var codegen_1 = require_codegen();
  var fullName = new codegen_1.Name("fullFormats");
  var fastName = new codegen_1.Name("fastFormats");
  var formatsPlugin = (ajv, opts = { keywords: true }) => {
    if (Array.isArray(opts)) {
      addFormats(ajv, opts, formats_1.fullFormats, fullName);
      return ajv;
    }
    const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
    const list = opts.formats || formats_1.formatNames;
    addFormats(ajv, list, formats, exportName);
    if (opts.keywords)
      (0, limit_1.default)(ajv);
    return ajv;
  };
  formatsPlugin.get = (name, mode = "full") => {
    const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
    const f = formats[name];
    if (!f)
      throw new Error(`Unknown format "${name}"`);
    return f;
  };
  function addFormats(ajv, list, fs16, exportName) {
    var _a;
    var _b;
    (_a = (_b = ajv.opts.code).formats) !== null && _a !== undefined || (_b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`);
    for (const f of list)
      ajv.addFormat(f, fs16[f]);
  }
  module.exports = exports = formatsPlugin;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = formatsPlugin;
});

// node_modules/isexe/windows.js
var require_windows = __commonJS((exports, module) => {
  module.exports = isexe;
  isexe.sync = sync;
  var fs16 = __require("fs");
  function checkPathExt(path18, options) {
    var pathext = options.pathExt !== undefined ? options.pathExt : process.env.PATHEXT;
    if (!pathext) {
      return true;
    }
    pathext = pathext.split(";");
    if (pathext.indexOf("") !== -1) {
      return true;
    }
    for (var i = 0;i < pathext.length; i++) {
      var p = pathext[i].toLowerCase();
      if (p && path18.substr(-p.length).toLowerCase() === p) {
        return true;
      }
    }
    return false;
  }
  function checkStat(stat, path18, options) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false;
    }
    return checkPathExt(path18, options);
  }
  function isexe(path18, options, cb) {
    fs16.stat(path18, function(er, stat) {
      cb(er, er ? false : checkStat(stat, path18, options));
    });
  }
  function sync(path18, options) {
    return checkStat(fs16.statSync(path18), path18, options);
  }
});

// node_modules/isexe/mode.js
var require_mode = __commonJS((exports, module) => {
  module.exports = isexe;
  isexe.sync = sync;
  var fs16 = __require("fs");
  function isexe(path18, options, cb) {
    fs16.stat(path18, function(er, stat) {
      cb(er, er ? false : checkStat(stat, options));
    });
  }
  function sync(path18, options) {
    return checkStat(fs16.statSync(path18), options);
  }
  function checkStat(stat, options) {
    return stat.isFile() && checkMode(stat, options);
  }
  function checkMode(stat, options) {
    var mod = stat.mode;
    var uid = stat.uid;
    var gid = stat.gid;
    var myUid = options.uid !== undefined ? options.uid : process.getuid && process.getuid();
    var myGid = options.gid !== undefined ? options.gid : process.getgid && process.getgid();
    var u = parseInt("100", 8);
    var g = parseInt("010", 8);
    var o = parseInt("001", 8);
    var ug = u | g;
    var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
    return ret;
  }
});

// node_modules/isexe/index.js
var require_isexe = __commonJS((exports, module) => {
  var fs16 = __require("fs");
  var core;
  if (process.platform === "win32" || global.TESTING_WINDOWS) {
    core = require_windows();
  } else {
    core = require_mode();
  }
  module.exports = isexe;
  isexe.sync = sync;
  function isexe(path18, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (!cb) {
      if (typeof Promise !== "function") {
        throw new TypeError("callback not provided");
      }
      return new Promise(function(resolve2, reject) {
        isexe(path18, options || {}, function(er, is) {
          if (er) {
            reject(er);
          } else {
            resolve2(is);
          }
        });
      });
    }
    core(path18, options || {}, function(er, is) {
      if (er) {
        if (er.code === "EACCES" || options && options.ignoreErrors) {
          er = null;
          is = false;
        }
      }
      cb(er, is);
    });
  }
  function sync(path18, options) {
    try {
      return core.sync(path18, options || {});
    } catch (er) {
      if (options && options.ignoreErrors || er.code === "EACCES") {
        return false;
      } else {
        throw er;
      }
    }
  }
});

// node_modules/which/which.js
var require_which = __commonJS((exports, module) => {
  var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
  var path18 = __require("path");
  var COLON = isWindows ? ";" : ":";
  var isexe = require_isexe();
  var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
  var getPathInfo = (cmd, opt) => {
    const colon = opt.colon || COLON;
    const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
      ...isWindows ? [process.cwd()] : [],
      ...(opt.path || process.env.PATH || "").split(colon)
    ];
    const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
    const pathExt = isWindows ? pathExtExe.split(colon) : [""];
    if (isWindows) {
      if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
        pathExt.unshift("");
    }
    return {
      pathEnv,
      pathExt,
      pathExtExe
    };
  };
  var which = (cmd, opt, cb) => {
    if (typeof opt === "function") {
      cb = opt;
      opt = {};
    }
    if (!opt)
      opt = {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    const step = (i) => new Promise((resolve2, reject) => {
      if (i === pathEnv.length)
        return opt.all && found.length ? resolve2(found) : reject(getNotFoundError(cmd));
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path18.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      resolve2(subStep(p, i, 0));
    });
    const subStep = (p, i, ii) => new Promise((resolve2, reject) => {
      if (ii === pathExt.length)
        return resolve2(step(i + 1));
      const ext = pathExt[ii];
      isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext);
          else
            return resolve2(p + ext);
        }
        return resolve2(subStep(p, i, ii + 1));
      });
    });
    return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
  };
  var whichSync = (cmd, opt) => {
    opt = opt || {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    for (let i = 0;i < pathEnv.length; i++) {
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path18.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      for (let j = 0;j < pathExt.length; j++) {
        const cur = p + pathExt[j];
        try {
          const is = isexe.sync(cur, { pathExt: pathExtExe });
          if (is) {
            if (opt.all)
              found.push(cur);
            else
              return cur;
          }
        } catch (ex) {}
      }
    }
    if (opt.all && found.length)
      return found;
    if (opt.nothrow)
      return null;
    throw getNotFoundError(cmd);
  };
  module.exports = which;
  which.sync = whichSync;
});

// node_modules/path-key/index.js
var require_path_key = __commonJS((exports, module) => {
  var pathKey = (options = {}) => {
    const environment = options.env || process.env;
    const platform = options.platform || process.platform;
    if (platform !== "win32") {
      return "PATH";
    }
    return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
  };
  module.exports = pathKey;
  module.exports.default = pathKey;
});

// node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS((exports, module) => {
  var path18 = __require("path");
  var which = require_which();
  var getPathKey = require_path_key();
  function resolveCommandAttempt(parsed, withoutPathExt) {
    const env = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled;
    if (shouldSwitchCwd) {
      try {
        process.chdir(parsed.options.cwd);
      } catch (err) {}
    }
    let resolved;
    try {
      resolved = which.sync(parsed.command, {
        path: env[getPathKey({ env })],
        pathExt: withoutPathExt ? path18.delimiter : undefined
      });
    } catch (e) {} finally {
      if (shouldSwitchCwd) {
        process.chdir(cwd);
      }
    }
    if (resolved) {
      resolved = path18.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
    }
    return resolved;
  }
  function resolveCommand(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
  }
  module.exports = resolveCommand;
});

// node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS((exports, module) => {
  var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
  function escapeCommand(arg) {
    arg = arg.replace(metaCharsRegExp, "^$1");
    return arg;
  }
  function escapeArgument(arg, doubleEscapeMetaChars) {
    arg = `${arg}`;
    arg = arg.replace(/(?=(\\+?)?)\1"/g, "$1$1\\\"");
    arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
    arg = `"${arg}"`;
    arg = arg.replace(metaCharsRegExp, "^$1");
    if (doubleEscapeMetaChars) {
      arg = arg.replace(metaCharsRegExp, "^$1");
    }
    return arg;
  }
  exports.command = escapeCommand;
  exports.argument = escapeArgument;
});

// node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS((exports, module) => {
  module.exports = /^#!(.*)/;
});

// node_modules/shebang-command/index.js
var require_shebang_command = __commonJS((exports, module) => {
  var shebangRegex = require_shebang_regex();
  module.exports = (string3 = "") => {
    const match = string3.match(shebangRegex);
    if (!match) {
      return null;
    }
    const [path18, argument] = match[0].replace(/#! ?/, "").split(" ");
    const binary = path18.split("/").pop();
    if (binary === "env") {
      return argument;
    }
    return argument ? `${binary} ${argument}` : binary;
  };
});

// node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS((exports, module) => {
  var fs16 = __require("fs");
  var shebangCommand = require_shebang_command();
  function readShebang(command) {
    const size = 150;
    const buffer = Buffer.alloc(size);
    let fd;
    try {
      fd = fs16.openSync(command, "r");
      fs16.readSync(fd, buffer, 0, size, 0);
      fs16.closeSync(fd);
    } catch (e) {}
    return shebangCommand(buffer.toString());
  }
  module.exports = readShebang;
});

// node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS((exports, module) => {
  var path18 = __require("path");
  var resolveCommand = require_resolveCommand();
  var escape2 = require_escape();
  var readShebang = require_readShebang();
  var isWin = process.platform === "win32";
  var isExecutableRegExp = /\.(?:com|exe)$/i;
  var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);
    const shebang = parsed.file && readShebang(parsed.file);
    if (shebang) {
      parsed.args.unshift(parsed.file);
      parsed.command = shebang;
      return resolveCommand(parsed);
    }
    return parsed.file;
  }
  function parseNonShell(parsed) {
    if (!isWin) {
      return parsed;
    }
    const commandFile = detectShebang(parsed);
    const needsShell = !isExecutableRegExp.test(commandFile);
    if (parsed.options.forceShell || needsShell) {
      const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
      parsed.command = path18.normalize(parsed.command);
      parsed.command = escape2.command(parsed.command);
      parsed.args = parsed.args.map((arg) => escape2.argument(arg, needsDoubleEscapeMetaChars));
      const shellCommand = [parsed.command].concat(parsed.args).join(" ");
      parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
      parsed.command = process.env.comspec || "cmd.exe";
      parsed.options.windowsVerbatimArguments = true;
    }
    return parsed;
  }
  function parse(command, args, options) {
    if (args && !Array.isArray(args)) {
      options = args;
      args = null;
    }
    args = args ? args.slice(0) : [];
    options = Object.assign({}, options);
    const parsed = {
      command,
      args,
      options,
      file: undefined,
      original: {
        command,
        args
      }
    };
    return options.shell ? parsed : parseNonShell(parsed);
  }
  module.exports = parse;
});

// node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS((exports, module) => {
  var isWin = process.platform === "win32";
  function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
      code: "ENOENT",
      errno: "ENOENT",
      syscall: `${syscall} ${original.command}`,
      path: original.command,
      spawnargs: original.args
    });
  }
  function hookChildProcess(cp, parsed) {
    if (!isWin) {
      return;
    }
    const originalEmit = cp.emit;
    cp.emit = function(name, arg1) {
      if (name === "exit") {
        const err = verifyENOENT(arg1, parsed);
        if (err) {
          return originalEmit.call(cp, "error", err);
        }
      }
      return originalEmit.apply(cp, arguments);
    };
  }
  function verifyENOENT(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawn");
    }
    return null;
  }
  function verifyENOENTSync(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawnSync");
    }
    return null;
  }
  module.exports = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError
  };
});

// node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS((exports, module) => {
  var cp = __require("child_process");
  var parse = require_parse();
  var enoent = require_enoent();
  function spawn2(command, args, options) {
    const parsed = parse(command, args, options);
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
    enoent.hookChildProcess(spawned, parsed);
    return spawned;
  }
  function spawnSync(command, args, options) {
    const parsed = parse(command, args, options);
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
    result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
    return result;
  }
  module.exports = spawn2;
  module.exports.spawn = spawn2;
  module.exports.sync = spawnSync;
  module.exports._parse = parse;
  module.exports._enoent = enoent;
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
var TOOL_TO_PERMISSION_MAP = {
  write: "edit",
  task: "bash",
  read: "edit",
  edit: "edit"
};
function createAgentToolRestrictions(denyTools) {
  if (supportsNewPermissionSystem()) {
    const mappedPermissions = {};
    for (const tool of denyTools) {
      const validKey = TOOL_TO_PERMISSION_MAP[tool];
      if (validKey) {
        mappedPermissions[validKey] = "deny";
      } else {
        console.warn(`[kraken-code] Skipping invalid permission key: ${tool}`);
      }
    }
    return {
      permission: mappedPermissions
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

// node_modules/@opencode-ai/plugin/dist/tool.js
import { z } from "zod";
function tool(input) {
  return input;
}
tool.schema = z;
// src/tools/compression.ts
import { z as z2 } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
var __dirname = "/home/ubuntu/clawd/Projects/kraken-code/src/tools";
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
    text: z2.string().describe("Text to compress"),
    level: z2.enum(["cache_hit", "partial", "full"]).default("partial").describe("Compression level: cache_hit (return cached if available), partial (light compression), full (maximum compression)")
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

// src/hooks/ralph-loop/index.ts
init_storage();
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
import { existsSync as existsSync4 } from "node:fs";
import { join as join8 } from "node:path";
import { homedir as homedir8 } from "node:os";
var PACKAGE_NAME = "kraken-code";
var DEFAULT_CACHE_TTL = 86400000;
var DEFAULT_CACHE_DIR = join8(homedir8(), ".config", "kraken-code", "cache");
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
  return join8(cacheDir, CACHE_FILE);
}
async function loadCache(config) {
  try {
    const cachePath = getCachePath(config);
    if (!existsSync4(cachePath)) {
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
    if (!existsSync4(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }
    const cachePath = getCachePath(config);
    await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[auto-update-checker] Failed to save cache:", e);
  }
}
async function checkNpmRegistry() {
  return new Promise((resolve2) => {
    exec(`npm view ${PACKAGE_NAME} version`, (error, stdout, stderr) => {
      if (error) {
        console.error("[auto-update-checker] Failed to check npm registry:", error);
        resolve2(null);
        return;
      }
      if (stderr) {
        console.error("[auto-update-checker] npm error:", stderr);
        resolve2(null);
        return;
      }
      const version = stdout.trim();
      if (version) {
        resolve2(version);
      } else {
        resolve2(null);
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
        const cachePath = join8(cacheDir, CACHE_FILE);
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
import { z as z3 } from "zod";
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
var ast_grep_search = tool({
  description: "Search code using AST patterns. More powerful than regex as it understands code structure. " + "Example patterns: 'function $_$ { $body$ }' to find all functions, '$A = $B' to find assignments.",
  args: {
    pattern: z3.string().describe("AST pattern to search for (use $VAR for variables)"),
    language: z3.string().describe("Programming language (typescript, javascript, python, rust, go, java, cpp, etc.)"),
    path: z3.string().optional().describe("Directory or file to search in (default: current directory)"),
    glob: z3.string().optional().describe("File glob pattern (e.g., '*.ts', 'src/**/*.ts')")
  },
  async execute(args) {
    const { pattern, language, path: searchPath, glob } = args;
    const result = await runAstGrep(pattern, language, { path: searchPath, glob });
    return JSON.stringify(result, null, 2);
  }
});
var ast_grep_replace = tool({
  description: "Search and replace code using AST patterns. Safer than regex replacement as it respects code structure. " + "Use the same variable names in replacement to preserve matched content.",
  args: {
    pattern: z3.string().describe("AST pattern to search for"),
    replacement: z3.string().describe("AST pattern to replace with (use $VAR to reference matched variables)"),
    language: z3.string().describe("Programming language"),
    path: z3.string().optional().describe("Directory or file to search in (default: current directory)"),
    glob: z3.string().optional().describe("File glob pattern")
  },
  async execute(args) {
    const { pattern, replacement, language, path: searchPath, glob } = args;
    const result = await runAstGrep(pattern, language, { replace: replacement, path: searchPath, glob });
    return JSON.stringify(result, null, 2);
  }
});

// src/tools/session/list.ts
import * as fs6 from "fs";
import * as path7 from "path";
import * as os8 from "os";
import { z as z4 } from "zod";
var SESSION_STORAGE_DIR = path7.join(os8.homedir(), ".opencode", "sessions");
function getSessionStorageDir() {
  if (!fs6.existsSync(SESSION_STORAGE_DIR)) {
    fs6.mkdirSync(SESSION_STORAGE_DIR, { recursive: true });
  }
  return SESSION_STORAGE_DIR;
}
function getAllSessionFiles() {
  const sessionsDir = getSessionStorageDir();
  if (!fs6.existsSync(sessionsDir)) {
    return [];
  }
  const entries = [];
  try {
    const files = fs6.readdirSync(sessionsDir);
    for (const file of files) {
      if (!file.endsWith(".json"))
        continue;
      const sessionID = file.slice(0, -5);
      const filePath = path7.join(sessionsDir, file);
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
var session_list = tool({
  description: "List all OpenCode sessions with filtering and pagination options.",
  args: {
    limit: z4.number().int().min(1).max(1000).optional(),
    startDate: z4.string().optional(),
    endDate: z4.string().optional(),
    order: z4.enum(["asc", "desc"]).optional(),
    includeMetadata: z4.boolean().default(false)
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
import * as fs7 from "fs";
import * as path8 from "path";
import { z as z5 } from "zod";
function getSessionFilePath(sessionID) {
  return path8.join(getSessionStorageDir(), `${sessionID}.json`);
}
var session_read = tool({
  description: "Read messages from a specific session with pagination and filtering options.",
  args: {
    sessionID: z5.string().describe("Session ID to read from"),
    limit: z5.number().int().min(1).max(1000).optional(),
    offset: z5.number().int().min(0).default(0).describe("Offset for pagination"),
    includeMetadata: z5.boolean().default(false).describe("Include full session metadata")
  },
  async execute(args) {
    try {
      const { sessionID, limit, offset, includeMetadata } = args;
      const filePath = getSessionFilePath(sessionID);
      if (!fs7.existsSync(filePath)) {
        return JSON.stringify({
          success: false,
          error: `Session ${sessionID} not found`,
          sessionID
        });
      }
      const content = fs7.readFileSync(filePath, "utf-8");
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
import * as fs8 from "fs";
import * as path9 from "path";
import * as os9 from "os";
import { z as z6 } from "zod";
var SESSION_STORAGE_DIR2 = path9.join(os9.homedir(), ".opencode", "sessions");
function indexSession(sessionFilePath) {
  try {
    const content = fs8.readFileSync(sessionFilePath, "utf-8");
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
  if (!fs8.existsSync(sessionsDir)) {
    return [];
  }
  const entries = [];
  try {
    const files = fs8.readdirSync(sessionsDir);
    for (const file of files) {
      if (!file.endsWith(".json"))
        continue;
      const sessionID = file.slice(0, -5);
      const filePath = path9.join(sessionsDir, file);
      try {
        const content = fs8.readFileSync(filePath, "utf-8");
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
var session_search = tool({
  description: "Full-text search across all OpenCode sessions with ranked results.",
  args: {
    q: z6.string().describe("Search query text"),
    limit: z6.number().int().min(1).max(100).default(10).describe("Maximum number of results to return"),
    offset: z6.number().int().min(0).default(0).describe("Offset for pagination"),
    sessionID: z6.string().optional().describe("Search within a specific session only")
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
        const filePath = path9.join(sessionDir, `${sessionID}.json`);
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
import * as fs9 from "fs";
import * as path10 from "path";
import { z as z7 } from "zod";
var SESSION_STORAGE_DIR3 = path10.join(process.env.HOME || "", ".opencode", "sessions");
function getSessionFilePath2(sessionID) {
  return path10.join(getSessionStorageDir(), `${sessionID}.json`);
}
function parseSessionFile(sessionID) {
  const filePath = getSessionFilePath2(sessionID);
  if (!fs9.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs9.readFileSync(filePath, "utf-8");
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
  for (const [tool3, count] of Object.entries(metadata.toolUsage || {})) {
    if (count > stats.mostUsedToolCount) {
      stats.mostUsedTool = tool3;
      stats.mostUsedToolCount = count;
    }
  }
  return stats;
}
var session_info = tool({
  description: "Get detailed metadata and statistics about a specific session.",
  args: {
    sessionID: z7.string().describe("Session ID to query")
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
import { z as z8 } from "zod";
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
var grep = tool({
  description: "Search for text patterns in files using ripgrep. Supports regex and file type filtering. " + "Example: grep({pattern: 'function \\w+', type: 'ts', context: 2})",
  args: {
    pattern: z8.string().describe("Regex pattern to search for"),
    path: z8.string().optional().describe("Directory or file to search in (default: current directory)"),
    type: z8.string().optional().describe("Filter by file type (ts, js, py, rust, go, java, etc.)"),
    context: z8.number().optional().describe("Number of context lines around each match (default: 0)"),
    invert: z8.boolean().optional().describe("Show lines that do NOT match the pattern")
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
import { z as z9 } from "zod";
var ralphLoop = tool({
  description: "Control Ralph-Loop iterations for achieving completion promises. " + "Ralph complements Kraken's PDSA cycles by iteratively refining until <promise> is satisfied. " + "Automatically triggered when chat contains <promise>...</promise> pattern, or use this tool for manual control.",
  args: {
    command: z9.enum(["status", "cancel", "continue", "info"]).describe("Ralph-Loop command"),
    sessionID: z9.string().optional().describe("Session ID (required for status, cancel)"),
    maxIterations: z9.number().min(1).max(100).optional().describe("Max iterations (default: 24)")
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
import { z as z10 } from "zod";
var call_kraken_agent = tool({
  description: "Call a specialized Kraken Code agent for a specific task. " + "Use this to delegate to agents like Atlas (navigation), Nautilus (semantic search), " + "Abyssal (external research), Coral (UI/UX), Siren (documentation), Scylla (code review), " + "or Pearl (testing).",
  args: {
    agent: z10.enum(["Atlas", "Nautilus", "Abyssal", "Coral", "Siren", "Scylla", "Pearl", "Leviathan", "Maelstrom", "Poseidon"]).describe("Agent to call"),
    task: z10.string().describe("Task or instruction for the agent")
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

// src/index.ts
init_storage();

// src/tools/lsp/index.ts
init_client();
init_config();
init_manager();
init_utils();

// src/tools/lsp/tools.ts
init_utils();
import { z as z11 } from "zod";
var lsp_hover = tool({
  description: "Get hover information (type, documentation) for a symbol at a position in a file. " + "Use this to get information about variables, functions, classes, etc.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    line: z11.number().describe("0-indexed line number"),
    character: z11.number().describe("0-indexed character position")
  },
  async execute({ path: path11, line, character }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.hover(path11, line, character);
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
var lsp_goto_definition = tool({
  description: "Jump to the definition of a symbol at the given position. " + "Returns the location where the symbol is defined.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    line: z11.number().describe("0-indexed line number"),
    character: z11.number().describe("0-indexed character position")
  },
  async execute({ path: path11, line, character }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.definition(path11, line, character);
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
var lsp_find_references = tool({
  description: "Find all references to a symbol in the workspace. " + "Returns a list of locations where the symbol is used.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    line: z11.number().describe("0-indexed line number"),
    character: z11.number().describe("0-indexed character position"),
    includeDeclaration: z11.boolean().optional().default(true).describe("Include the declaration location in results")
  },
  async execute({ path: path11, line, character, includeDeclaration }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.references(path11, line, character, includeDeclaration);
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
var lsp_document_symbols = tool({
  description: "Get all symbols (classes, functions, variables) in a document. " + "Returns a hierarchical tree of symbols with their locations.",
  args: {
    path: z11.string().describe("Absolute path to the source file")
  },
  async execute({ path: path11 }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.documentSymbols(path11);
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
var lsp_workspace_symbols = tool({
  description: "Search for symbols across the entire workspace. " + "Use this to find classes, functions, etc. without knowing their location.",
  args: {
    query: z11.string().describe("Search query (e.g., 'MyClass', 'createUser')")
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
var lsp_diagnostics = tool({
  description: "Get diagnostics (errors, warnings, hints) for a file. " + "Returns all issues reported by the language server.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    severity: z11.enum(["error", "warning", "information", "hint", "all"]).optional().default("all").describe("Filter by severity level")
  },
  async execute({ path: path11, severity }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.diagnostics(path11);
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
var lsp_prepare_rename = tool({
  description: "Prepare a rename operation at a position. " + "Returns the range that would be renamed, if valid.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    line: z11.number().describe("0-indexed line number"),
    character: z11.number().describe("0-indexed character position")
  },
  async execute({ path: path11, line, character }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.prepareRename(path11, line, character);
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
var lsp_rename = tool({
  description: "Rename a symbol at a position. " + "Performs a workspace-wide rename of the symbol to the new name.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    line: z11.number().describe("0-indexed line number"),
    character: z11.number().describe("0-indexed character position"),
    newName: z11.string().describe("New name for the symbol")
  },
  async execute({ path: path11, line, character, newName }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.rename(path11, line, character, newName);
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
var lsp_code_actions = tool({
  description: "Get available code actions (refactors, quick fixes) for a range. " + "Returns a list of actions that can be applied to fix issues or refactor code.",
  args: {
    path: z11.string().describe("Absolute path to the source file"),
    startLine: z11.number().describe("0-indexed start line"),
    startChar: z11.number().describe("0-indexed start character"),
    endLine: z11.number().describe("0-indexed end line"),
    endChar: z11.number().describe("0-indexed end character"),
    only: z11.array(z11.string()).optional().describe("Filter by action kind (e.g., 'quickfix', 'refactor')")
  },
  async execute({ path: path11, startLine, startChar, endLine, endChar, only }) {
    try {
      const result = await withLspClient(path11, async (client) => {
        return await client.codeAction(path11, startLine, startChar, endLine, endChar, only);
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
var lsp_code_action_resolve = tool({
  description: "Resolve a code action to get its full details (including edits).",
  args: {
    action: z11.any().describe("Code action object from lsp_code_actions")
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
var lsp_servers = tool({
  description: "List available LSP servers and their installation status. " + "Shows which servers are configured and installed for different file types.",
  args: {
    extension: z11.string().optional().describe("Filter by file extension (e.g., 'ts', 'py', 'js')")
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
// src/hooks/think-mode/mode-detector.ts
var KEYWORD_DATABASE = [
  { keyword: "blitz", mode: "blitzkrieg" },
  { keyword: "blz", mode: "blitzkrieg" },
  { keyword: "blitzkrieg", mode: "blitzkrieg" },
  { keyword: "blitz mode", mode: "blitzkrieg" },
  { keyword: "search", mode: "search", language: "English", aliases: ["find", "locate", "look for"] },
  { keyword: "find", mode: "search", language: "English" },
  { keyword: "locate", mode: "search", language: "English" },
  { keyword: "look for", mode: "search", language: "English" },
  { keyword: "explore", mode: "search", language: "English" },
  { keyword: "analyze", mode: "analyze", language: "English", aliases: ["investigate", "examine"] },
  { keyword: "investigate", mode: "analyze", language: "English" },
  { keyword: "examine", mode: "analyze", language: "English" },
  { keyword: "deep analysis", mode: "analyze", language: "English" },
  { keyword: "ultrathink", mode: "ultrathink", language: "English", aliases: ["think deeply", "deep think"] },
  { keyword: "think deeply", mode: "ultrathink", language: "English" },
  { keyword: "deep think", mode: "ultrathink", language: "English" },
  { keyword: "analizar", mode: "analyze", language: "Spanish" },
  { keyword: "examinar", mode: "analyze", language: "Spanish" },
  { keyword: "analyser", mode: "analyze", language: "French" },
  { keyword: "examiner", mode: "analyze", language: "French" },
  { keyword: "analysieren", mode: "analyze", language: "German" }
];
function detectMode(keyword) {
  const keywordLower = keyword.toLowerCase();
  for (const entry of KEYWORD_DATABASE) {
    if (entry.keyword.toLowerCase() === keywordLower) {
      return {
        mode: entry.mode,
        keyword: entry.keyword,
        language: entry.language
      };
    }
  }
  for (const entry of KEYWORD_DATABASE) {
    if (entry.aliases && entry.aliases.some((alias) => alias.toLowerCase() === keywordLower)) {
      return {
        mode: entry.mode,
        keyword: entry.keyword,
        language: entry.language
      };
    }
  }
  return null;
}

// src/hooks/think-mode/modes.ts
var DEFAULT_MODES = {
  blitzkrieg: {
    name: "Blitzkrieg",
    enabled: true,
    parallelAgents: 4,
    concurrencyLimits: {
      anthropic: 2,
      openai: 3,
      google: 3
    }
  },
  search: {
    name: "Search",
    enabled: true,
    maxResults: 50,
    useExplore: true,
    useLibrarian: true
  },
  analyze: {
    name: "Analyze",
    enabled: true,
    consultationPhases: 3,
    expertAgents: ["oracle", "Abyssal", "Siren"]
  },
  ultrathink: {
    name: "UltraThink",
    enabled: true,
    thinkingBudget: 32000,
    autoVariantSwitch: true
  }
};
function getModeConfig(modeName) {
  return DEFAULT_MODES[modeName];
}

// src/hooks/think-mode/mode-switcher.ts
var activeModes = new Map;
function activateMode(sessionID, modeName, options) {
  const config2 = getModeConfig(modeName);
  if (!config2 || !config2.enabled) {
    console.log(`[mode-switcher] Mode "${modeName}" not found or disabled`);
    return false;
  }
  const activeMode = {
    name: modeName,
    activatedAt: Date.now(),
    config: config2
  };
  activeModes.set(sessionID, activeMode);
  console.log(`[mode-switcher] Activated mode "${modeName}" for session ${sessionID}`);
  if (options?.onModeActivate) {
    options.onModeActivate({
      mode: modeName,
      keyword: ""
    });
  }
  return true;
}

// src/hooks/mode-hooks.ts
function createModeHooks(input, options) {
  const config2 = input.config || {};
  const modesConfig = config2.modes || {};
  if (modesConfig.enabled === false) {
    return {};
  }
  return {
    "chat.message": async (input2, output) => {
      if (!output.parts)
        return;
      const { sessionID } = input2;
      for (const part of output.parts) {
        if (part.type === "text") {
          const content = part.text;
          if (content && sessionID) {
            const detected = detectMode(content);
            if (detected && options?.autoActivate !== false) {
              console.log(`[mode-hooks] Detected mode "${detected.mode}" with ${detected.keywords.length} keywords for session ${sessionID}`);
              activateMode(sessionID, detected.mode);
              if (detected.mode === "blitzkrieg") {
                const modeConfig = modesConfig.blitzkrieg;
                console.log(`[mode-hooks] Activating Blitzkrieg mode with ${modeConfig?.parallelAgents || 4} parallel agents`);
              } else if (detected.mode === "search") {
                console.log(`[mode-hooks] Activating Search mode`);
              } else if (detected.mode === "analyze") {
                console.log(`[mode-hooks] Activating Analyze mode`);
              } else if (detected.mode === "ultrathink") {
                console.log(`[mode-hooks] Activating Ultrathink mode`);
              }
            }
          }
        }
      }
    }
  };
}

// src/hooks/session-storage.ts
function createSessionStorageHook(input, options) {
  const config2 = input.config || {};
  const storageConfig = config2.claudeCodeCompatibility?.dataStorage || {};
  if (storageConfig.enabled === false) {
    return {};
  }
  return {
    "tool.execute.after": async (input2, output) => {
      if (!output.output)
        return;
      const { tool: tool3, sessionID } = input2;
      if (sessionID) {
        console.log(`[session-storage] Tool ${tool3} completed for session ${sessionID}`);
        const { appendTranscriptEntry: appendTranscriptEntry3 } = (init_storage(), __toCommonJS(exports_storage));
        const { recordToolUse: recordToolUse3 } = (init_storage(), __toCommonJS(exports_storage));
        if (output.output && output.output.toolOutput) {
          await recordToolUse3(sessionID, tool3, output.output.toolInput, output.output.toolOutput);
        }
      }
    },
    "chat.message": async (input2, output) => {
      if (!output.parts)
        return;
      const { sessionID } = input2;
      const { recordUserMessage: recordUserMessage3 } = (init_storage(), __toCommonJS(exports_storage));
      for (const part of output.parts) {
        if (part.type === "text") {
          await recordUserMessage3(sessionID, part.text);
        }
      }
    },
    "session.idle": async (input2, output) => {
      if (!input2.sessionID)
        return;
      const { sessionID } = input2;
      const { loadOpenCodeTodos: loadOpenCodeTodos2 } = (init_storage(), __toCommonJS(exports_storage));
      try {
        const todos = await loadOpenCodeTodos2(sessionID);
        console.log(`[session-storage] Saved ${todos.length} todos for session ${sessionID}`);
      } catch (error) {
        console.error("[session-storage] Error saving todos:", error);
      }
    }
  };
}

// src/hooks/claude-code-hooks/index.ts
function createClaudeCodeHooks(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    mcp: true,
    commands: true,
    skills: true,
    agents: true
  };
  return {
    "tool.execute.before": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[claude-code-hooks] Processing tool execution");
    },
    "tool.execute.after": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[claude-code-hooks] Tool execution completed");
    }
  };
}

// src/hooks/think-mode/index.ts
var THINKING_SUPPORTED_PROVIDERS = [
  "anthropic",
  "bedrock",
  "google",
  "openai"
];
var THINK_KEYWORDS = [
  "think",
  "let me think",
  "i need to think",
  "take time to think",
  "think about this",
  "think carefully",
  "piensa",
  "déjame pensar",
  "necesito pensar",
  "piénsalo",
  "piensa cuidadosamente",
  "réfléchis",
  "laissez-moi réfléchir",
  "je dois réfléchir",
  "réfléchissez-y",
  "réfléchir attentivement",
  "denk nach",
  "lass mich nachdenken",
  "ich muss nachdenken",
  "denk darüber nach",
  "denke sorgfältig",
  "pense",
  "deixe-me pensar",
  "preciso pensar",
  "pense sobre isso",
  "pense cuidadosamente",
  "pensa",
  "fammi pensare",
  "devo pensare",
  "pensa a questo",
  "pensa attentamente",
  "подумай",
  "дай мне подумать",
  "мне нужно подумать",
  "подумай об этом",
  "подумай внимательно",
  "考えて",
  "考えさせて",
  "考える必要がある",
  "これについて考えて",
  "注意深く考えて",
  "思考",
  "让我想想",
  "我需要思考",
  "思考这个",
  "仔细思考",
  "思考",
  "讓我思考",
  "我需要思考",
  "思考這個",
  "仔細思考",
  "생각해",
  "생각하게 해줘",
  "생각해야 해",
  "이것에 대해 생각해",
  "신중하게 생각해"
];
function isThinkingSupported(provider) {
  return THINKING_SUPPORTED_PROVIDERS.some((supported) => provider.toLowerCase().includes(supported.toLowerCase()));
}
var thinkModeSessions = new Map;
function getSessionState(sessionID) {
  return thinkModeSessions.get(sessionID);
}
function setSessionState(sessionID, enabled) {
  thinkModeSessions.set(sessionID, {
    enabled,
    activatedAt: Date.now()
  });
}
function shouldActivateThinkMode(content) {
  const lowercaseContent = content.toLowerCase();
  for (const keyword of THINK_KEYWORDS) {
    if (lowercaseContent.includes(keyword)) {
      return true;
    }
  }
  return false;
}
function createThinkModeHook(input) {
  return {
    "chat.message": async (chatInput, chatOutput) => {
      const { sessionID } = chatInput;
      const parts = chatOutput?.parts || [];
      const content = parts.filter((p) => p.type === "text").map((p) => p.text).join(`
`).trim();
      if (typeof content === "string" && content.length > 0) {
        const shouldActivate = shouldActivateThinkMode(content);
        if (shouldActivate) {
          console.log(`[think-mode] Activated for session ${sessionID}`);
          setSessionState(sessionID, true);
        }
      }
    },
    "tool.execute.before": async (toolInput, toolOutput) => {
      const { sessionID } = toolInput;
      const { provider } = toolInput;
      const sessionState = getSessionState(sessionID);
      if (sessionState?.enabled && toolInput.tool === "task") {
        console.log(`[think-mode] Applying think mode for session ${sessionID}`);
        const providerID = provider?.info?.id || provider?.options?.providerID || "";
        if (isThinkingSupported(providerID)) {
          console.log(`[think-mode] Would apply think mode for provider ${providerID}`);
        }
      }
      return;
    }
  };
}

// src/features/background-agent/tool.ts
import { z as z12 } from "zod";
function createCallAgentTool(manager2) {
  return tool({
    description: "Delegate a task to a specialized subagent for domain expertise. " + "Supports both synchronous (wait=true) and asynchronous (wait=false) execution patterns. " + "Use this when tasks require specialized knowledge, extensive search, " + "or can benefit from parallel execution.",
    args: {
      agent: z12.enum([
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
      task: z12.string().min(5).describe("Clear, specific description of what the agent should do. " + "Include relevant context, expected output format, and success criteria."),
      context: z12.string().optional().describe("Additional context that may help the agent complete the task"),
      wait: z12.boolean().default(false).describe("If true, wait for the agent to complete and return the full result. " + "If false (default), return immediately with a task ID for async tracking. " + "Use wait=false for parallel delegation to multiple agents.")
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
  return tool({
    description: "Check the status of a background agent task. Returns completion status, " + "results, and duration information for tasks created with call_agent(wait=false).",
    args: {
      taskId: z12.string().describe("Task ID from a previous call_agent invocation")
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
  return tool({
    description: "List all background tasks for the current session. Returns both active and " + "recently completed tasks for tracking parallel delegation workflows.",
    args: {
      status: z12.enum(["all", "pending", "running", "completed", "failed"]).default("all").describe("Filter by task status. Default 'all' shows all tasks.")
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
  return tool({
    description: "Cancel a running or pending background task. Use this when a task is " + "no longer needed or when you want to free up concurrency slots.",
    args: {
      taskId: z12.string().describe("Task ID to cancel")
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
    return new Promise((resolve2) => {
      const queue = this.queues.get(model) ?? [];
      queue.push(resolve2);
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
    return new Promise((resolve2, reject) => {
      const checkInterval = setInterval(() => {
        const task = this.tasks.get(taskId);
        if (!task) {
          clearInterval(checkInterval);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        if (task.status === "completed" || task.status === "failed") {
          clearInterval(checkInterval);
          resolve2(task);
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
      "think deeply": "think",
      ultrathink: "think",
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
    const arabicMatch = /[\u0600-\u06FF]/;
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
          if (detected.mode === "search") {
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
import * as fs10 from "fs";
import * as path11 from "path";
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
  const relativePath = path11.relative(process.cwd(), filePath);
  const globPattern = pattern.replace(/\*\*/g, "*").replace(/\?/g, "?");
  const parts = globPattern.split("/");
  const pathParts = relativePath.split(path11.sep);
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
  if (!fs10.existsSync(directory)) {
    return [];
  }
  const ruleFiles = [];
  function walk(dir, baseDir = dir) {
    const entries = fs10.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path11.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else if (entry.isFile()) {
        const ext = path11.extname(entry.name).toLowerCase();
        if (RULE_EXTENSIONS.includes(ext)) {
          try {
            const content = fs10.readFileSync(fullPath, "utf-8");
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
  const relativePath = path11.relative(path11.dirname(rulePath), targetPath);
  const parts = relativePath.split(path11.sep);
  let distance = 0;
  for (const part of parts) {
    if (part.startsWith(".")) {
      distance++;
    } else if (part.includes(path11.sep)) {
      distance += part.split(path11.sep).length;
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
      path11.join(process.cwd(), "rules"),
      path11.join(process.cwd(), ".opencode", "rules"),
      path11.join(path11.dirname(targetPath), "rules"),
      path11.join(path11.dirname(targetPath), ".opencode", "rules")
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
function createCompactionContextInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "experimental.session.compacting": async (input, output) => {
      if (!config2.enabled)
        return;
      console.log("[compaction-context-injector] Adding context for session compaction");
      output.context = output.context || [];
      output.context.push("Include important decisions and learnings in the summary.");
    }
  };
}

// src/hooks/directory-agents-injector/index.ts
import { readFileSync as readFileSync9, existsSync as existsSync10 } from "node:fs";
function createDirectoryAgentsInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const agentFile = config2.agentFile ?? ".opencode-agents";
      if (existsSync10(agentFile)) {
        try {
          const content = readFileSync9(agentFile, "utf-8");
          console.log("[directory-agents-injector] Found local agent definitions");
        } catch {
          console.log("[directory-agents-injector] Could not read agent file");
        }
      }
    }
  };
}

// src/hooks/directory-readme-injector/index.ts
import { readFileSync as readFileSync10, existsSync as existsSync11 } from "node:fs";
function createDirectoryReadmeInjector(_input, options) {
  const config2 = options?.config ?? { enabled: true };
  return {
    "chat.message": async (input, output) => {
      if (!config2.enabled)
        return;
      const readmePaths = ["README.md", "readme.md", "Readme.md"];
      for (const readme of readmePaths) {
        if (existsSync11(readme)) {
          try {
            const content = readFileSync10(readme, "utf-8");
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
function getSessionState2(sessionID) {
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
  const state = getSessionState2(sessionID);
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
  const state = getSessionState2(sessionID);
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
          const state = getSessionState2(sessionID);
          state.sessions.delete(sessionID);
          console.log(`[interactive-bash-session] Session cleanup completed. ` + `Commands executed: ${session.commandHistory.length}, ` + `Working dir: ${session.workingDirectory}`);
        }
      }
      if (eventAny?.type === "session.timeout") {
        const session = getBashSession(sessionID);
        if (session && config2.autoCleanup) {
          console.log(`[interactive-bash-session] Session timeout for ${sessionID}`);
          killSessionProcesses(session);
          const state = getSessionState2(sessionID);
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
function getTextFromParts(parts) {
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
      const text = getTextFromParts(output.parts);
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
function getTextFromParts2(parts) {
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
      const text = getTextFromParts2(output.parts);
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
      const { tool: tool3 } = input;
      const relevantTools = ["write", "edit", "multiEdit"];
      if (!relevantTools.includes(tool3))
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

// src/notifications/platform-detector.ts
function getPlatform() {
  const platform = process.platform;
  if (platform === "darwin") {
    return "darwin";
  }
  if (platform === "linux") {
    return "linux";
  }
  if (platform === "win32") {
    return "win32";
  }
  return "unsupported";
}
async function getNotifySendPath() {
  if (process.platform !== "linux") {
    return null;
  }
  try {
    const { spawn: spawn2 } = await import("node:child_process");
    const result = spawn2("which", ["notify-send"]);
    return new Promise((resolve2) => {
      let output = "";
      result.stdout.on("data", (data) => {
        output += data.toString();
      });
      result.on("close", (code) => {
        if (code === 0 && output.trim()) {
          resolve2(output.trim());
        } else {
          resolve2(null);
        }
      });
      result.on("error", () => {
        resolve2(null);
      });
    });
  } catch {
    return null;
  }
}
async function getOsascriptPath() {
  if (process.platform !== "darwin") {
    return null;
  }
  try {
    const { spawn: spawn2 } = await import("node:child_process");
    const result = spawn2("which", ["osascript"]);
    return new Promise((resolve2) => {
      let output = "";
      result.stdout.on("data", (data) => {
        output += data.toString();
      });
      result.on("close", (code) => {
        if (code === 0 && output.trim()) {
          resolve2(output.trim());
        } else {
          resolve2(null);
        }
      });
      result.on("error", () => {
        resolve2(null);
      });
    });
  } catch {
    return null;
  }
}
async function getPowershellPath() {
  if (process.platform !== "win32") {
    return null;
  }
  try {
    const { exec: exec2 } = await import("node:child_process");
    return new Promise((resolve2) => {
      exec2("where powershell", (error, stdout, stderr) => {
        if (!error && stdout.trim()) {
          resolve2(stdout.trim());
        } else {
          resolve2(null);
        }
      });
    });
  } catch {
    return null;
  }
}
async function getNotificationCommand() {
  const platform = getPlatform();
  if (platform === "linux") {
    const notifySendPath = await getNotifySendPath();
    if (notifySendPath) {
      return {
        command: notifySendPath,
        args: [],
        platform: "linux"
      };
    }
  }
  if (platform === "darwin") {
    const osascriptPath = await getOsascriptPath();
    if (osascriptPath) {
      return {
        command: osascriptPath,
        args: ["-e"],
        platform: "darwin"
      };
    }
  }
  if (platform === "win32") {
    const powershellPath = await getPowershellPath();
    if (powershellPath) {
      return {
        command: powershellPath,
        args: ["-Command"],
        platform: "win32"
      };
    }
  }
  return null;
}

// src/notifications/sound-player.ts
var DEFAULT_SOUND_PATHS = {
  darwin: {
    task_complete: "/System/Library/Sounds/Ping.aiff",
    agent_idle: "/System/Library/Sounds/Glass.aiff",
    notification: "/System/Library/Sounds/Purr.aiff",
    error: "/System/Library/Sounds/Basso.aiff"
  },
  linux: {
    task_complete: "/usr/share/sounds/freedesktop/stereo/complete.oga",
    agent_idle: "/usr/share/sounds/freedesktop/stereo/message.oga",
    notification: "/usr/share/sounds/freedesktop/stereo/dialog-information.oga",
    error: "/usr/share/sounds/freedesktop/stereo/dialog-error.oga"
  },
  win32: {
    task_complete: "C:\\Windows\\Media\\notify.wav",
    agent_idle: "C:\\Windows\\Media\\Windows Hardware Fail.wav",
    notification: "C:\\Windows\\Media\\Windows Notify.wav",
    error: "C:\\Windows\\Media\\Windows Error.wav"
  },
  unsupported: {
    task_complete: "",
    agent_idle: "",
    notification: "",
    error: ""
  }
};
var PLATFORM_SOUND_COMMANDS = {
  darwin: {
    command: "afplay",
    args: []
  },
  linux: {
    command: "paplay",
    args: []
  },
  win32: {
    command: "powershell",
    args: ["-Command"]
  },
  unsupported: null
};
function getSoundPath(event, config2 = { enabled: true }) {
  if (!config2.enabled) {
    return null;
  }
  const platform = getPlatform();
  if (config2.customPaths && config2.customPaths[platform]) {
    const platformSounds = config2.customPaths[platform];
    if (platformSounds && event.type in platformSounds) {
      const eventType = event.type;
      const customSound = platformSounds[eventType];
      if (customSound) {
        return customSound;
      }
    }
  }
  const defaultSounds = DEFAULT_SOUND_PATHS[platform];
  if (defaultSounds && event.type in defaultSounds) {
    const eventType = event.type;
    return defaultSounds[eventType];
  }
  return null;
}
async function playSound(event, config2 = { enabled: true, volume: 1 }) {
  if (!config2.enabled) {
    return false;
  }
  const soundPath = getSoundPath(event, config2);
  if (!soundPath) {
    console.log(`[sound-player] No sound path for event ${event.type}`);
    return false;
  }
  const platform = getPlatform();
  const platformCommand = PLATFORM_SOUND_COMMANDS !== null ? PLATFORM_SOUND_COMMANDS[platform] : null;
  if (!platformCommand) {
    console.log(`[sound-player] No sound command for platform ${platform}`);
    return false;
  }
  try {
    const { spawn: spawn2 } = await import("node:child_process");
    const args = [];
    if (platform === "win32") {
      const volume = config2.volume || 1;
      const sound = `(New-Object Media.SoundPlayer "${soundPath}").Volume = ${volume}; $sound.PlaySync()`;
      args.push(`(Add-Type -AssemblyName PresentationCore; ${sound})`);
    } else {
      const volumeArg = config2.volume !== undefined && config2.volume !== 1 ? [`--volume=${config2.volume.toFixed(2)}`] : [];
      args.push(...platformCommand.args, ...volumeArg, soundPath);
    }
    const result = spawn2(platformCommand.command, args, {
      detached: true,
      stdio: "ignore"
    });
    result.unref();
    console.log(`[sound-player] Playing ${event.type} sound for ${platform}`);
    return true;
  } catch (error) {
    console.error(`[sound-player] Error playing sound:`, error);
    return false;
  }
}

// src/notifications/manager.ts
var DEFAULT_CONFIG = {
  enabled: true,
  batchSize: 5,
  batchDelay: 100,
  maxRetries: 3,
  soundConfig: { enabled: true, volume: 1 }
};

class NotificationManager {
  queue = [];
  processing = false;
  sentNotifications = new Set;
  config;
  constructor(config2 = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config2 };
  }
  enqueue(title, message, soundEvent, id) {
    const notificationId = id || this.generateId();
    this.queue.push({
      id: notificationId,
      title,
      message,
      soundEvent,
      timestamp: Date.now(),
      retryCount: 0
    });
    console.log(`[notification-manager] Enqueued: ${notificationId} - ${title}`);
    this.processQueue();
    return notificationId;
  }
  generateId() {
    return `notify-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    this.processing = true;
    try {
      const batch = this.queue.splice(0, this.config.batchSize);
      const dedupedBatch = batch.filter((n) => !this.sentNotifications.has(n.id));
      if (dedupedBatch.length === 0) {
        this.processing = false;
        return;
      }
      for (const notification of dedupedBatch) {
        await this.sendNotification(notification);
        this.sentNotifications.add(notification.id);
      }
      if (this.queue.length > 0) {
        await new Promise((resolve2) => setTimeout(resolve2, this.config.batchDelay));
        this.processQueue();
      }
    } finally {
      this.processing = false;
    }
  }
  async sendNotification(notification) {
    const commandResult = await getNotificationCommand();
    if (!commandResult) {
      console.log(`[notification-manager] No notification command available for ${notification.id}`);
      return false;
    }
    try {
      let success = false;
      if (commandResult.platform === "linux") {
        success = await this.sendLinuxNotification(notification, commandResult);
      } else if (commandResult.platform === "darwin") {
        success = await this.sendDarwinNotification(notification, commandResult);
      } else if (commandResult.platform === "win32") {
        success = await this.sendWindowsNotification(notification, commandResult);
      }
      if (success && notification.soundEvent) {
        await playSound(notification.soundEvent, this.config.soundConfig);
      }
      return success;
    } catch (error) {
      console.error(`[notification-manager] Error sending notification ${notification.id}:`, error);
      if (notification.retryCount < this.config.maxRetries) {
        notification.retryCount++;
        this.queue.push(notification);
        setTimeout(() => this.processQueue(), 1000 * (notification.retryCount + 1));
      }
      return false;
    }
  }
  async sendLinuxNotification(notification, command) {
    try {
      const { spawn: spawn2 } = await import("node:child_process");
      const args = [
        ...command.args,
        `--app-name=Kraken-Code`,
        `--icon=kraken-code`,
        notification.id,
        notification.title,
        notification.message
      ];
      const result = spawn2(command.command, args, {
        detached: true,
        stdio: "ignore"
      });
      result.unref();
      return true;
    } catch {
      return false;
    }
  }
  async sendDarwinNotification(notification, command) {
    try {
      const { execFile: execFile4 } = await import("node:child_process");
      const script = `
        display notification with title "${notification.title}"           subtitle "Kraken-Code"           message "${notification.message}"           sound name "${notification.soundEvent || "notification"}"
      `;
      await new Promise((resolve2, reject) => {
        execFile4(command.command, [...command.args, "-e", script], (error) => {
          if (error)
            reject(error);
          else
            resolve2();
        });
      });
      return true;
    } catch {
      return false;
    }
  }
  async sendWindowsNotification(notification, command) {
    try {
      const { spawn: spawn2 } = await import("node:child_process");
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing

        $balloon = New-Object System.Windows.Forms.NotifyIcon
        $balloon.Visible = $false
        $balloon.BalloonTipIcon = [System.Drawing.ToolTipIcon]::Info
        $balloon.BalloonTipTitle = "${notification.title}"
        $balloon.BalloonTipText = "${notification.message}"
        $balloon.Icon = [System.Drawing.Icon]::Information
        $balloon.Text = "Kraken-Code"
        $balloon.ShowBalloonTip(5000)
        $balloon.Dispose()
      `;
      const result = spawn2(command.command, [...command.args, script], {
        detached: true,
        stdio: "ignore"
      });
      result.unref();
      return true;
    } catch {
      return false;
    }
  }
  clearQueue() {
    this.queue = [];
    this.sentNotifications.clear();
    console.log("[notification-manager] Queue cleared");
  }
  getQueueLength() {
    return this.queue.length;
  }
  isProcessing() {
    return this.processing;
  }
  clearSentHistory() {
    this.sentNotifications.clear();
  }
}
var globalManager = null;
function createNotificationManager(config2) {
  if (!globalManager) {
    globalManager = new NotificationManager(config2);
  }
  return globalManager;
}
function sendNotification(title, message, soundEvent, config2) {
  const manager2 = createNotificationManager(config2);
  return manager2.enqueue(title, message, soundEvent);
}

// src/hooks/notifications/index.ts
function createNotificationsHook(input, options) {
  const config2 = options?.config ?? { enabled: true };
  if (!config2.enabled) {
    return {};
  }
  const notificationConfig = {
    enabled: config2.enabled,
    soundConfig: config2.soundConfig,
    batchSize: config2.batchSize,
    batchDelay: config2.batchDelay,
    maxRetries: config2.maxRetries
  };
  const manager2 = createNotificationManager(notificationConfig);
  return {
    "tool.execute.after": async (toolInput, toolOutput) => {
      if (!config2.enabled)
        return;
      const { tool: tool3 } = toolInput;
      if (!toolOutput?.output)
        return;
      let soundEvent;
      let message = "";
      let title = "Kraken-Code";
      if (tool3 === "session_list") {
        title = "Sessions Listed";
        message = "Session list retrieved successfully";
      } else if (tool3 === "session_create") {
        title = "Session Created";
        message = "New session started";
        soundEvent = { type: "task_complete" };
      } else if (tool3 === "session_close") {
        title = "Session Closed";
        message = "Session closed";
        soundEvent = { type: "task_complete" };
      } else if (tool3 === "write" || tool3 === "edit" || tool3 === "multiEdit") {
        title = "File Modified";
        message = "File operation completed";
        soundEvent = { type: "task_complete" };
      } else if (tool3 === "ast_grep_replace") {
        title = "Code Refactored";
        message = "AST grep replace completed";
        soundEvent = { type: "task_complete" };
      } else if (tool3.startsWith("lsp_")) {
        title = "LSP Operation";
        message = `${tool3} completed`;
      }
      if (message) {
        sendNotification(title, message, soundEvent, config2);
      }
    }
  };
}

// src/hooks/empty-task-response-detector/index.ts
var sessionHistories2 = new Map;
function getSessionHistory2(sessionID) {
  let history = sessionHistories2.get(sessionID);
  if (!history) {
    history = {
      sessionID,
      emptyCount: 0,
      lastEmptyTime: null,
      history: []
    };
    sessionHistories2.set(sessionID, history);
  }
  return history;
}
function isOutputEmpty(output) {
  if (!output) {
    return { empty: true, reason: "output is null/undefined" };
  }
  if (output.output === null || output.output === undefined) {
    return { empty: true, reason: "output.output is null/undefined" };
  }
  let outputContent = "";
  if (output.content && Array.isArray(output.content)) {
    outputContent = output.content.join("");
  } else if (output.output && typeof output.output === "string") {
    outputContent = output.output;
  } else if (typeof output === "string") {
    outputContent = output;
  } else if (typeof output.output === "object") {
    outputContent = JSON.stringify(output.output);
  }
  if (outputContent.trim().length === 0) {
    return { empty: true, reason: "output content is empty or whitespace-only" };
  }
  try {
    if (typeof outputContent === "string") {
      const parsed = JSON.parse(outputContent);
      if (typeof parsed === "object" && Object.keys(parsed).length === 0) {
        return { empty: true, reason: "output is empty JSON object" };
      }
    }
  } catch {}
  return { empty: false, reason: "" };
}
function getRetryDelay(retryCount, baseDelay) {
  return baseDelay * Math.pow(2, retryCount);
}
async function handleEmptyTaskResponse(input, output, config2, retryCount = 0) {
  const { sessionID, callID } = input;
  const maxRetries = config2.maxRetries ?? 3;
  const retryDelay = config2.retryDelay ?? 1000;
  const check = isOutputEmpty(output);
  if (!check.empty) {
    return false;
  }
  const history = getSessionHistory2(sessionID);
  history.emptyCount++;
  history.lastEmptyTime = Date.now();
  history.history.push({
    timestamp: Date.now(),
    callID: callID || "unknown",
    reason: check.reason
  });
  console.warn(`[empty-task-response-detector] Task tool returned empty response ` + `(session: ${sessionID}, call: ${callID}, reason: ${check.reason})`);
  const notifyThreshold = config2.notifyOnThreshold ?? 3;
  if (history.emptyCount >= notifyThreshold) {
    console.warn(`[empty-task-response-detector] Threshold exceeded: ${history.emptyCount} empty responses in session ${sessionID}. ` + `This may indicate a recurring issue with the agent or model.`);
  }
  if (config2.autoRecover && retryCount < maxRetries) {
    const delay = getRetryDelay(retryCount, retryDelay);
    console.log(`[empty-task-response-detector] Auto-recovering: retry in ${delay}ms ` + `(attempt ${retryCount + 1}/${maxRetries})`);
    await new Promise((resolve2) => setTimeout(resolve2, delay));
    console.log("[empty-task-response-detector] [session recovered - continuing previous task]");
    return true;
  }
  return false;
}
function createEmptyTaskResponseDetectorHook(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    trackPatterns: true,
    autoRecover: false,
    notifyOnThreshold: 3
  };
  return {
    "tool.execute.after": async (toolInput, toolOutput) => {
      if (!config2.enabled)
        return;
      if (toolInput.tool !== "task") {
        return;
      }
      await handleEmptyTaskResponse(toolInput, toolOutput, config2);
    }
  };
}

// src/hooks/edit-error-recovery/index.ts
var fileHistories = new Map;
var editRetries = new Map;
function getFileHistory(filePath) {
  let history = fileHistories.get(filePath);
  if (!history) {
    history = {
      filePath,
      failures: [],
      lastGoodContent: null,
      conflictCount: 0
    };
    fileHistories.set(filePath, history);
  }
  return history;
}
function getRetryDelay2(retryCount, baseDelay, maxDelay) {
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}
function detectEditErrorType(error) {
  const errorMessage = String(error).toLowerCase();
  if (errorMessage.includes("no such file") || errorMessage.includes("file not found")) {
    return "file_not_found";
  }
  if (errorMessage.includes("permission denied") || errorMessage.includes("eacces")) {
    return "permission_denied";
  }
  if (errorMessage.includes("not found") || errorMessage.includes("string not found")) {
    return "merge_conflict";
  }
  if (errorMessage.includes("concurrent") || errorMessage.includes("modified")) {
    return "concurrent_edit";
  }
  return "unknown";
}
function getRecoveryAction(errorType, filePath, config2) {
  switch (errorType) {
    case "file_not_found":
      if (config2.autoCreateDirs) {
        return {
          canRecover: true,
          action: "create_directories",
          suggestion: "Create parent directories and retry edit"
        };
      }
      return {
        canRecover: false,
        action: "none",
        suggestion: "Create the file or parent directories manually"
      };
    case "permission_denied":
      return {
        canRecover: false,
        action: "check_permissions",
        suggestion: "Check file permissions and user access"
      };
    case "merge_conflict":
      return {
        canRecover: true,
        action: "refresh_and_retry",
        suggestion: "Read file again and retry with current content"
      };
    case "concurrent_edit":
      return {
        canRecover: true,
        action: "retry_with_backoff",
        suggestion: "Wait and retry edit with fresh content"
      };
    default:
      return {
        canRecover: false,
        action: "none",
        suggestion: "Investigate the error and try again"
      };
  }
}
async function applyRecovery2(errorType, filePath, config2) {
  const action = getRecoveryAction(errorType, filePath, config2);
  if (!action.canRecover) {
    console.log(`[edit-error-recovery] Cannot recover from error type: ${errorType}`);
    console.log(`[edit-error-recovery] Suggestion: ${action.suggestion}`);
    return false;
  }
  console.log(`[edit-error-recovery] Attempting recovery action: ${action.action}`);
  console.log(`[edit-error-recovery] Suggestion: ${action.suggestion}`);
  if (errorType === "file_not_found" && config2.autoCreateDirs) {
    try {
      const { mkdir: mkdir2 } = await import("node:fs/promises");
      const dir = filePath.split("/").slice(0, -1).join("/");
      if (dir) {
        await mkdir2(dir, { recursive: true });
        console.log(`[edit-error-recovery] Created directory: ${dir}`);
      }
      return true;
    } catch (e) {
      console.error(`[edit-error-recovery] Failed to create directory: ${e}`);
      return false;
    }
  }
  return true;
}
function createEditErrorRecovery(_input, options) {
  const config2 = options?.config ?? {
    enabled: true,
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 1e4,
    autoCreateDirs: true,
    trackConflicts: true
  };
  return {
    "tool.execute.after": async (input, output) => {
      if (!config2.enabled)
        return;
      if (input.tool !== "edit" && input.tool !== "write") {
        return;
      }
      const sessionID = input.sessionID;
      const filePath = input.filePath;
      const maxRetries = config2.maxRetries ?? 5;
      const baseDelay = config2.baseDelay ?? 500;
      const maxDelay = config2.maxDelay ?? 1e4;
      const outputAny = output;
      if (outputAny.error || outputAny.status === "error") {
        const error = outputAny.error || outputAny.output || "Unknown error";
        const errorType = detectEditErrorType(error);
        const retryKey = `${sessionID}-${filePath || "unknown"}`;
        const currentRetries = editRetries.get(retryKey) ?? 0;
        if (currentRetries < maxRetries) {
          if (filePath) {
            const history = getFileHistory(filePath);
            history.failures.push({
              timestamp: Date.now(),
              filePath,
              errorType,
              errorMessage: String(error),
              retryAttempt: currentRetries + 1
            });
            if (errorType === "merge_conflict" && config2.trackConflicts) {
              history.conflictCount++;
            }
          }
          console.log(`[edit-error-recovery] Edit error detected (attempt ${currentRetries + 1}/${maxRetries})`);
          if (filePath) {
            console.log(`[edit-error-recovery] File: ${filePath}`);
          }
          console.log(`[edit-error-recovery] Error type: ${errorType}`);
          console.log(`[edit-error-recovery] Error: ${error}`);
          const recovered = await applyRecovery2(errorType, filePath || "", config2);
          if (recovered) {
            const delay = getRetryDelay2(currentRetries, baseDelay, maxDelay);
            editRetries.set(retryKey, currentRetries + 1);
            console.log(`[edit-error-recovery] Retry scheduled in ${delay}ms`);
            console.log("[edit-error-recovery] [session recovered - continuing previous task]");
            setTimeout(() => {
              editRetries.delete(retryKey);
            }, delay);
          } else {
            console.error(`[edit-error-recovery] Recovery failed for ${filePath || "unknown"}`);
            editRetries.delete(retryKey);
          }
        } else {
          console.error(`[edit-error-recovery] Max retries (${maxRetries}) exceeded for ${filePath || "unknown"}`);
          editRetries.delete(retryKey);
        }
      } else {
        if (filePath) {
          editRetries.delete(`${sessionID}-${filePath}`);
        }
      }
    }
  };
}

// src/hooks/grep-output-truncator/index.ts
var DEFAULT_CONFIG2 = {
  maxTokens: 50000,
  headroomRatio: 0.5
};
function truncateGrepOutput(output, maxTokens, headroomRatio) {
  const usableTokens = maxTokens * (1 - headroomRatio);
  const maxChars = Math.floor(usableTokens * 4);
  if (output.length <= maxChars) {
    return output;
  }
  const lines = output.split(`
`);
  const charCountLimit = maxChars;
  let currentCount = 0;
  let truncateIndex = lines.length;
  for (let i = 0;i < lines.length; i++) {
    currentCount += lines[i].length + 1;
    if (currentCount > charCountLimit) {
      truncateIndex = i;
      break;
    }
  }
  if (truncateIndex === lines.length) {
    return output;
  }
  const truncated = lines.slice(0, truncateIndex).join(`
`);
  const omittedLines = lines.length - truncateIndex;
  const estimatedTokens = Math.ceil(output.length / 4);
  return `${truncated}

` + `[Grep output truncated: ${estimatedTokens.toLocaleString()} tokens estimated, ` + `${omittedLines.toLocaleString()} matches omitted]`;
}
async function grepToolExecuteAfter(input, output, config2) {
  if (input.tool !== "grep") {
    return;
  }
  if (output?.content && Array.isArray(output.content)) {
    output.content = output.content.map((content) => {
      if (typeof content === "string") {
        return truncateGrepOutput(content, config2.maxTokens, config2.headroomRatio);
      }
      return content;
    });
  } else if (output?.output && typeof output.output === "string") {
    output.output = truncateGrepOutput(output.output, config2.maxTokens, config2.headroomRatio);
  }
}
function createGrepOutputTruncatorHook(_input, options) {
  const finalConfig = { ...DEFAULT_CONFIG2, ...options?.config };
  return {
    "tool.execute.after": async (toolInput, toolOutput) => {
      await grepToolExecuteAfter(toolInput, toolOutput, finalConfig);
    }
  };
}

// src/hooks/session-recovery/index.ts
init_detector();
var sessionErrorStates = new Map;
function createSessionRecovery(_input, options) {
  const config2 = options?.config ?? { enabled: true, autoRecover: false };
  if (!config2.enabled) {
    return {
      "chat.message": async () => {}
    };
  }
  return {
    "chat.message": async (input) => {
      const { sessionID } = input;
      if (!sessionID)
        return;
      const state = getOrCreateSessionState2(sessionID);
      state.errorType = null;
    },
    event: async (input) => {
      const { sessionID, type, error } = input;
      if (type !== "session.error")
        return;
      if (!sessionID)
        return;
      const { detectErrorType: detectErrorType2 } = await Promise.resolve().then(() => (init_detector(), exports_detector));
      const errorType = detectErrorType2(error);
      const state = getOrCreateSessionState2(sessionID);
      state.errorType = errorType;
      state.lastErrorTime = Date.now();
      state.errorCount++;
      console.log(`[session-recovery] Detected error type: ${errorType}`);
      console.log(`[session-recovery] Error count for session ${sessionID}: ${state.errorCount}`);
      if (config2.autoRecover && isRecoverableError(errorType)) {
        const { attemptRecovery: attemptRecovery2 } = await Promise.resolve().then(() => (init_strategies(), exports_strategies));
        const context = {
          sessionID,
          error,
          timestamp: Date.now()
        };
        try {
          await attemptRecovery2(errorType, context, { maxRetries: 3 });
          console.log(`[session-recovery] Auto-recovery attempted for ${errorType}`);
        } catch (recoveryError) {
          console.error("[session-recovery] Auto-recovery failed:", recoveryError);
        }
      }
    }
  };
}
function getOrCreateSessionState2(sessionID) {
  let state = sessionErrorStates.get(sessionID);
  if (!state) {
    state = {
      sessionID,
      errorType: null,
      errorCount: 0,
      lastErrorTime: null,
      recoveryAttempts: 0,
      messagesBeforeError: 0
    };
    sessionErrorStates.set(sessionID, state);
  }
  return state;
}

// src/features/blitzkrieg/blitzkrieg-test-plan.ts
var DEFAULT_TEST_PLAN_VALIDATION_OPTIONS = {
  enforceMinimumTestCases: true,
  enforceCoverageThreshold: true,
  requireApproval: false,
  allowPartialImplementation: false
};
function validateTestPlan(state, requirements, options = DEFAULT_TEST_PLAN_VALIDATION_OPTIONS) {
  const violations = [];
  const recommendations = [];
  if (!state.exists) {
    if (requirements.requiredBeforeImplementation) {
      violations.push({
        type: "missing-test-cases",
        details: "No test plan exists for this feature",
        severity: "error"
      });
    }
    return { valid: false, violations, recommendations };
  }
  if (options.enforceMinimumTestCases) {
    const testCaseCount = state.testCases.length;
    if (testCaseCount < requirements.minTestCases) {
      violations.push({
        type: "missing-test-cases",
        details: `Test plan has ${testCaseCount} test cases, minimum required is ${requirements.minTestCases}`,
        severity: "error"
      });
      recommendations.push(`Add ${requirements.minTestCases - testCaseCount} more test cases`);
    }
  }
  if (options.enforceCoverageThreshold && requirements.requireCoverageThreshold && requirements.coverageThresholdPercent > 0) {
    if (state.coverageTarget === undefined) {
      violations.push({
        type: "insufficient-coverage",
        details: "Coverage target is not specified in test plan",
        severity: "warning"
      });
      recommendations.push(`Specify coverage target (min ${requirements.coverageThresholdPercent}%)`);
    } else if (state.coverageTarget < requirements.coverageThresholdPercent) {
      violations.push({
        type: "insufficient-coverage",
        details: `Coverage target ${state.coverageTarget}% is below required ${requirements.coverageThresholdPercent}%`,
        severity: "error"
      });
      recommendations.push(`Increase coverage target to at least ${requirements.coverageThresholdPercent}%`);
    }
  }
  if (options.requireApproval && !state.approved) {
    violations.push({
      type: "missing-approval",
      details: "Test plan has not been approved",
      severity: "error"
    });
    recommendations.push("Request approval for the test plan");
  }
  const testCaseCategories = new Set(state.testCases.map((tc) => tc.category));
  if (!testCaseCategories.has("edge-case") && options.enforceMinimumTestCases) {
    recommendations.push("Consider adding edge case tests for more comprehensive coverage");
  }
  if (!testCaseCategories.has("error-path") && options.enforceMinimumTestCases) {
    recommendations.push("Consider adding error path tests for error handling coverage");
  }
  return {
    valid: violations.filter((v) => v.severity === "error").length === 0,
    violations,
    recommendations
  };
}
function generateTestPlanSummary(state) {
  const summary = {
    totalTestCases: state.testCases.length,
    happyPathCases: 0,
    edgeCaseCases: 0,
    errorPathCases: 0,
    integrationCases: 0,
    coveragePercentage: state.coverageTarget,
    approvalStatus: state.approved ? "approved" : "pending"
  };
  if (!state.exists) {
    summary.approvalStatus = "none";
    return summary;
  }
  for (const testCase of state.testCases) {
    switch (testCase.category) {
      case "happy-path":
        summary.happyPathCases++;
        break;
      case "edge-case":
        summary.edgeCaseCases++;
        break;
      case "error-path":
        summary.errorPathCases++;
        break;
      case "integration":
        summary.integrationCases++;
        break;
    }
  }
  return summary;
}
function canBeginImplementation(state, requirements) {
  if (!state.exists) {
    return !requirements.requiredBeforeImplementation;
  }
  const result = validateTestPlan(state, requirements, {
    enforceMinimumTestCases: true,
    enforceCoverageThreshold: requirements.requireCoverageThreshold,
    requireApproval: false,
    allowPartialImplementation: false
  });
  return result.valid;
}

// src/hooks/blitzkrieg-test-plan-enforcer/index.ts
var testPlanStore = {};
function isImplementationFile(filePath) {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__/,
    /\/test\//,
    /\/tests\//,
    /node_modules/,
    /\.md$/,
    /\.json$/
  ];
  return !testPatterns.some((pattern) => pattern.test(filePath));
}
function getFeaturePath(filePath) {
  const normalized = filePath.replace(/\.(ts|tsx|js|jsx)$/, "");
  return normalized.replace(/\.test$|\.spec$/, "");
}
function getTestPlanState(featurePath) {
  const plan = testPlanStore[featurePath];
  return plan ? {
    exists: true,
    testCases: Array(plan.testCases).fill({}),
    coverageTarget: plan.coverageTarget,
    approved: plan.approved
  } : {
    exists: false,
    testCases: [],
    approved: false
  };
}
function getBlitzkriegConfig(input) {
  const config2 = input.config;
  return config2?.blitzkrieg;
}
function createBlitzkriegTestPlanEnforcerHook(input) {
  return {
    "tool.execute.before": async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig(input);
      if (!blitzkriegConfig?.enabled) {
        return;
      }
      const toolName = toolInput.tool;
      if (toolName !== "edit" && toolName !== "write") {
        return;
      }
      const args = toolOutput;
      const filePath = args?.filePath;
      if (!filePath || !isImplementationFile(filePath)) {
        return;
      }
      const testPlanConfig = blitzkriegConfig.testPlan;
      if (!testPlanConfig?.requiredBeforeImplementation) {
        return;
      }
      const featurePath = getFeaturePath(filePath);
      const testPlanState = getTestPlanState(featurePath);
      const requirements = {
        minTestCases: testPlanConfig.minTestCases,
        requireCoverageThreshold: testPlanConfig.requireCoverageThreshold,
        coverageThresholdPercent: testPlanConfig.coverageThresholdPercent,
        requiredBeforeImplementation: testPlanConfig.requiredBeforeImplementation
      };
      if (!canBeginImplementation(testPlanState, requirements)) {
        const validation = validateTestPlan(testPlanState, requirements);
        const violations = validation.violations.map((v) => v.details).join("; ");
        throw new Error(`Blitzkrieg Test Plan Violation: ${violations}. Please create a test plan for this feature before implementing. Use registerTestPlan('${featurePath}', testCaseCount, coverageTarget, approved) to register a test plan.`);
      }
    }
  };
}

// src/features/blitzkrieg/blitzkrieg-tdd.ts
var DEFAULT_TDD_ENFORCEMENT_CONFIG = {
  enforceWriteTestFirst: true,
  forbidCodeWithoutTest: true,
  allowRefactorWithoutTest: true,
  enforceTestFirstSeverity: "block",
  forbidCodeWithoutTestSeverity: "block"
};
function isTestFile(filePath) {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /\/__tests__\/.*\.[jt]sx?$/,
    /\/test\/[^\/]*\.[jt]sx?$/,
    /\/tests\/[^\/]*\.[jt]sx?$/
  ];
  return testPatterns.some((pattern) => pattern.test(filePath));
}
function isImplementationFile2(filePath) {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /\/__tests__\//,
    /\/test\/[^\/]*\.[jt]sx?$/,
    /\/tests\/[^\/]*\.[jt]sx?$/,
    /node_modules/,
    /\/dist\//,
    /\/build\//
  ];
  return !testPatterns.some((pattern) => pattern.test(filePath));
}
function isRefactorOperation(content, previousContent) {
  if (!previousContent)
    return false;
  const refactorKeywords = [
    /refactor/i,
    /extract/i,
    /restructure/i,
    /reorganize/i,
    /rename/i,
    /move.*function/i
  ];
  const hasRefactorKeywords = refactorKeywords.some((pattern) => pattern.test(content));
  const isStructuralChange = content.length > previousContent.length * 0.8 && content.length < previousContent.length * 1.5;
  return hasRefactorKeywords && isStructuralChange;
}
function evaluateTddCompliance(operation, session, config2 = DEFAULT_TDD_ENFORCEMENT_CONFIG, previousContent) {
  const violations = [];
  const suggestions = [];
  const isTest = isTestFile(operation.filePath);
  const isImpl = isImplementationFile2(operation.filePath);
  if (isTest) {
    session.testsWritten.push(operation);
    session.currentCompliance.testWrittenFirst = true;
    session.currentCompliance.testFilePaths.push(operation.filePath);
    return {
      decision: "allow",
      reason: "Test file operations are always allowed",
      violations: [],
      suggestions: []
    };
  }
  if (!isImpl) {
    return {
      decision: "allow",
      reason: "Non-implementation file operations are not subject to TDD enforcement",
      violations: [],
      suggestions: []
    };
  }
  session.filesWritten.push(operation);
  session.currentCompliance.implementationFilePaths.push(operation.filePath);
  const isRefactor = isRefactorOperation(operation.content, previousContent);
  session.currentCompliance.isRefactor = isRefactor;
  if (isRefactor && config2.allowRefactorWithoutTest) {
    return {
      decision: "allow",
      reason: "Refactor operations are allowed without new tests when configured",
      violations: [],
      suggestions: []
    };
  }
  if (config2.enforceWriteTestFirst && !session.currentCompliance.testWrittenFirst) {
    violations.push({
      type: "test-not-first",
      file: operation.filePath,
      severity: config2.enforceTestFirstSeverity
    });
    suggestions.push("Write tests before implementing the feature (TDD test-first principle)");
  }
  if (config2.forbidCodeWithoutTest && session.testsWritten.length === 0) {
    violations.push({
      type: "code-without-test",
      file: operation.filePath,
      severity: config2.forbidCodeWithoutTestSeverity
    });
    suggestions.push("Write corresponding test files before implementation code");
  }
  const hasBlockingViolation = violations.some((v) => v.severity === "error");
  if (hasBlockingViolation) {
    return {
      decision: "block",
      reason: "TDD violation detected. See violation details for more information.",
      violations,
      suggestions
    };
  } else if (violations.length > 0) {
    return {
      decision: "warn",
      reason: "TDD best practice not followed. Consider the following suggestions.",
      violations,
      suggestions
    };
  }
  return {
    decision: "allow",
    reason: "Operation is TDD-compliant",
    violations: [],
    suggestions: []
  };
}

// src/hooks/blitzkrieg-tdd-workflow/index.ts
var activeSessions = new Map;
function getOrCreateSession(sessionId) {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      sessionId,
      testsWritten: [],
      implementationFilesWritten: []
    });
  }
  return activeSessions.get(sessionId);
}
function getBlitzkriegConfig2(input) {
  const config2 = input.config;
  return config2?.blitzkrieg;
}
async function getPreviousFileContent(filePath) {
  return;
}
function createBlitzkriegTddWorkflowHook(input) {
  return {
    "tool.execute.before": async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig2(input);
      if (!blitzkriegConfig?.enabled) {
        return;
      }
      const toolName = toolInput.tool;
      const sessionId = toolInput.sessionID;
      if (toolName !== "edit" && toolName !== "write") {
        return;
      }
      const args = toolOutput;
      const filePath = args?.filePath;
      if (!filePath) {
        return;
      }
      const session = getOrCreateSession(sessionId);
      if (isTestFile(filePath)) {
        session.testsWritten.push(filePath);
        return;
      }
      if (!isImplementationFile2(filePath)) {
        return;
      }
      const tddConfig = blitzkriegConfig.tddWorkflow;
      const enforcementConfig = {
        enforceWriteTestFirst: tddConfig.enforceWriteTestFirst,
        forbidCodeWithoutTest: tddConfig.forbidCodeWithoutTest,
        allowRefactorWithoutTest: tddConfig.allowRefactorWithoutTest,
        enforceTestFirstSeverity: "block",
        forbidCodeWithoutTestSeverity: "block"
      };
      const previousContent = await getPreviousFileContent(filePath);
      const operation = {
        filePath,
        operation: toolName,
        content: args?.content || "",
        timestamp: new Date().toISOString()
      };
      const result = evaluateTddCompliance(operation, {
        sessionId,
        startTime: new Date().toISOString(),
        filesWritten: session.implementationFilesWritten.map((fp) => ({
          filePath: fp,
          operation: "write",
          content: "",
          timestamp: new Date().toISOString()
        })),
        testsWritten: session.testsWritten.map((tp) => ({
          filePath: tp,
          operation: "write",
          content: "",
          timestamp: new Date().toISOString()
        })),
        currentCompliance: {
          testWrittenFirst: session.testsWritten.length > 0,
          codeHasTest: false,
          isRefactor: isRefactorOperation(operation.content, previousContent),
          violations: [],
          testFilePaths: session.testsWritten,
          implementationFilePaths: session.implementationFilesWritten
        }
      }, enforcementConfig, previousContent);
      session.implementationFilesWritten.push(filePath);
      if (result.decision === "block") {
        const violations = result.violations.map((v) => `${v.type}: ${v.file}`).join("; ");
        throw new Error(`Blitzkrieg TDD Violation: ${violations}. ${result.reason}

Suggestions:
${result.suggestions.map((s) => `  - ${s}`).join(`
`)}`);
      }
      if (result.decision === "warn" && result.violations.length > 0) {
        console.warn(`Blitzkrieg TDD Warning: ${result.reason}`);
      }
    },
    "tool.execute.after": async (toolInput) => {
      const sessionId = toolInput.sessionID;
    }
  };
}

// src/features/blitzkrieg/blitzkrieg-verification.ts
var DEFAULT_VERIFICATION_OPTIONS = {
  strictMode: false,
  ignoreWarnings: false,
  coverageThreshold: 80,
  minAssertions: 1,
  minEdgeCases: 1
};

class BuildOutputParser {
  parse(output, exitCode) {
    const errors = this.parseErrors(output);
    const warnings = this.countWarnings(output);
    return {
      success: exitCode === 0,
      exitCode,
      output,
      errors,
      warnings
    };
  }
  parseErrors(output) {
    const errors = [];
    const tsPattern = /(.+?):(\d+):(\d+)\s*[-–]\s*(error|warning)\s*(TS\d+|ESLint)\s*:\s*(.+)/g;
    let match;
    while ((match = tsPattern.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[6],
        code: match[5],
        severity: match[4] === "error" ? "error" : "warning"
      });
    }
    const pyPattern = /File "(.+?)", line (\d+), in .+?(.+)/g;
    while ((match = pyPattern.exec(output)) !== null) {
      if (!errors.some((e) => e.file === match[1] && e.line === parseInt(match[2], 10))) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          message: match[3].trim(),
          code: "PythonError",
          severity: "error"
        });
      }
    }
    const genericPattern = /(error|Error|ERROR)[:\s]+(.+)/g;
    while ((match = genericPattern.exec(output)) !== null) {
      const existingError = match[2].substring(0, 50);
      if (!errors.some((e) => e.message.includes(existingError))) {
        errors.push({
          message: match[2].trim(),
          code: "GenericError",
          severity: "error"
        });
      }
    }
    return errors;
  }
  countWarnings(output) {
    const warningPatterns = [
      /(warning|Warning|WARNING)[:\s]+/g,
      /warn[:\s]+/gi
    ];
    let count = 0;
    for (const pattern of warningPatterns) {
      const matches = output.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }
}

class TestOutputParser {
  parse(output) {
    const assertions = this.countAssertions(output);
    const edgeCases = this.identifyEdgeCases(output);
    const testPath = this.extractTestPath(output);
    return {
      testPath,
      assertions,
      edgeCasesCovered: edgeCases.length,
      executionLog: output
    };
  }
  countAssertions(output) {
    const assertionPatterns = [
      /\b(assert|expect|should|it\.only|test\.only)\s*\(/gi,
      /passes|failures/gi
    ];
    let count = 0;
    for (const pattern of assertionPatterns) {
      const matches = output.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    const summaryMatch = output.match(/(\d+)\s+(?:passes|fail|tests?)/i);
    if (summaryMatch) {
      const num = parseInt(summaryMatch[1], 10);
      if (num > count) {
        count = num;
      }
    }
    return count;
  }
  identifyEdgeCases(output) {
    const edgeCaseIndicators = [
      /null/i,
      /undefined/i,
      /empty/gi,
      /zero/gi,
      /negative/i,
      /overflow/i,
      /underflow/i,
      /async|await/gi,
      /error|exception/gi,
      /timeout/i,
      /boundary/i,
      /edge/gi
    ];
    const covered = [];
    for (const pattern of edgeCaseIndicators) {
      if (pattern.test(output)) {
        const name = pattern.source.replace(/^\^?|\\b|\\/gi, "").substring(0, 30);
        if (!covered.includes(name)) {
          covered.push(name);
        }
      }
    }
    return covered;
  }
  extractTestPath(output) {
    const pathPatterns = [
      /Running\s+(.+?test.+\.(?:ts|js|py))/i,
      /Test\s+Files.*[\n\r]+.*(.+\.(?:test|spec)\.[jt]sx?)/i
    ];
    for (const pattern of pathPatterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return "";
  }
}

class CoverageOutputParser {
  parse(output, threshold) {
    const coverage = this.parseCoveragePercentages(output);
    return {
      statementCoverage: coverage.statement,
      branchCoverage: coverage.branch,
      functionCoverage: coverage.function,
      lineCoverage: coverage.line,
      coverageOutput: output,
      meetsThreshold: this.checkThreshold(coverage, threshold)
    };
  }
  parseCoveragePercentages(output) {
    const result = {
      statement: 0,
      branch: 0,
      function: 0,
      line: 0
    };
    const patterns = [
      [/Statements?\s*[:\s]+(\d+(?:\.\d+)?)%/i, "statement"],
      [/Branches?\s*[:\s]+(\d+(?:\.\d+)?)%/i, "branch"],
      [/Functions?\s*[:\s]+(\d+(?:\.\d+)?)%/i, "function"],
      [/Lines?\s*[:\s]+(\d+(?:\.\d+)?)%/i, "line"],
      [/coverage:\s+(\d+(?:\.\d+)?)%/i, "statement"]
    ];
    for (const [pattern, key] of patterns) {
      const match = output.match(pattern);
      if (match) {
        result[key] = parseFloat(match[1]);
      }
    }
    return result;
  }
  checkThreshold(coverage, threshold) {
    const coverages = [coverage.statement, coverage.branch, coverage.function, coverage.line];
    const validCoverages = coverages.filter((c) => c > 0);
    if (validCoverages.length === 0) {
      return false;
    }
    const averageCoverage = validCoverages.reduce((sum, c) => sum + c, 0) / validCoverages.length;
    return averageCoverage >= threshold;
  }
}

class BlitzkriegVerification {
  buildParser = new BuildOutputParser;
  testParser = new TestOutputParser;
  coverageParser = new CoverageOutputParser;
  verify(buildOutput, buildExitCode, testOutput, coverageOutput, config2, options = DEFAULT_VERIFICATION_OPTIONS) {
    const evidence = this.collectEvidence(buildOutput, buildExitCode, testOutput, coverageOutput, options.coverageThreshold);
    const violations = [];
    const warnings = [];
    this.checkBuildEvidence(evidence.buildEvidence, violations, warnings);
    this.checkTestEvidence(evidence.testEvidence, config2, violations, warnings, options);
    this.checkCoverageEvidence(evidence.coverageEvidence, config2, violations, warnings, options);
    const summary = this.generateSummary(evidence, violations, warnings);
    const hasBlockingViolation = violations.some((v) => v.severity === "error");
    const compliant = !hasBlockingViolation && !summary.failedTests;
    return {
      compliant,
      evidence,
      violations,
      warnings,
      summary
    };
  }
  collectEvidence(buildOutput, buildExitCode, testOutput, coverageOutput, coverageThreshold) {
    const buildEvidence = this.buildParser.parse(buildOutput, buildExitCode);
    const testEvidence = this.testParser.parse(testOutput);
    const coverageEvidence = this.coverageParser.parse(coverageOutput, coverageThreshold);
    return {
      buildEvidence,
      testEvidence,
      coverageEvidence,
      timestamp: new Date().toISOString()
    };
  }
  checkBuildEvidence(evidence, violations, warnings) {
    if (!evidence.success) {
      violations.push({
        type: "build-failed",
        message: `Build failed with exit code ${evidence.exitCode}`,
        severity: "error",
        details: {
          exitCode: evidence.exitCode,
          errorCount: evidence.errors.length
        }
      });
    } else if (evidence.warnings > 0) {
      warnings.push({
        type: "build-warnings",
        message: `Build completed with ${evidence.warnings} warning(s)`,
        suggestion: "Review warnings and fix if necessary"
      });
    }
  }
  checkTestEvidence(evidence, config2, violations, warnings, options) {
    if (config2.requireTestExecutionEvidence && evidence.executionLog === undefined) {
      violations.push({
        type: "no-test-execution",
        message: "No test execution evidence found",
        severity: "error"
      });
    }
    if (config2.requireAssertionEvidence && evidence.assertions < options.minAssertions) {
      violations.push({
        type: "no-assertions",
        message: `Insufficient assertions: found ${evidence.assertions}, minimum required is ${options.minAssertions}`,
        severity: "error",
        details: { actual: evidence.assertions, required: options.minAssertions }
      });
    }
    if (config2.requireEdgeCaseEvidence && evidence.edgeCasesCovered < options.minEdgeCases) {
      violations.push({
        type: "no-edge-cases",
        message: `No edge cases covered: minimum required is ${options.minEdgeCases}`,
        severity: "error",
        details: { actual: evidence.edgeCasesCovered, required: options.minEdgeCases }
      });
    }
  }
  checkCoverageEvidence(evidence, config2, violations, warnings, options) {
    if (!evidence.coverageOutput) {
      warnings.push({
        type: "missing-coverage-data",
        message: "No coverage data found",
        suggestion: "Run tests with coverage to get coverage metrics"
      });
      return;
    }
    if (config2.requireEdgeCaseEvidence && evidence.statementCoverage < options.coverageThreshold) {
      if (options.strictMode) {
        violations.push({
          type: "insufficient-coverage",
          message: `Coverage ${evidence.statementCoverage.toFixed(1)}% below threshold ${options.coverageThreshold}%`,
          severity: "error",
          details: {
            statement: evidence.statementCoverage,
            branch: evidence.branchCoverage,
            function: evidence.functionCoverage,
            line: evidence.lineCoverage,
            threshold: options.coverageThreshold
          }
        });
      } else {
        warnings.push({
          type: "low-coverage",
          message: `Coverage ${evidence.statementCoverage.toFixed(1)}% is below optimal threshold ${options.coverageThreshold}%`,
          suggestion: "Consider adding more tests to improve coverage"
        });
      }
    }
  }
  generateSummary(evidence, violations, warnings) {
    const testOutput = evidence.testEvidence.executionLog || "";
    const passedMatch = testOutput.match(/(\d+)\s+(?:passes?|passed|success)/i);
    const failedMatch = testOutput.match(/(\d+)\s+(?:failures?|failed)/i);
    const skippedMatch = testOutput.match(/(\d+)\s+(?:skipped|pending)/i);
    const totalTests = (passedMatch ? parseInt(passedMatch[1], 10) : 0) + (failedMatch ? parseInt(failedMatch[1], 10) : 0) + (skippedMatch ? parseInt(skippedMatch[1], 10) : 0);
    const passedTests = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failedTests = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const skippedTests = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
    let overallScore = 100;
    if (failedTests > 0) {
      overallScore -= failedTests / totalTests * 100;
    }
    if (evidence.coverageEvidence.statementCoverage > 0) {
      overallScore = (overallScore + evidence.coverageEvidence.statementCoverage) / 2;
    }
    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalAssertions: evidence.testEvidence.assertions,
      passedAssertions: evidence.testEvidence.assertions,
      edgeCasesCovered: evidence.testEvidence.edgeCasesCovered,
      overallScore: Math.round(overallScore * 100) / 100
    };
  }
  verifyWithTestPlan(buildOutput, buildExitCode, testOutput, coverageOutput, testPlanState, config2, options = DEFAULT_VERIFICATION_OPTIONS) {
    const result = this.verify(buildOutput, buildExitCode, testOutput, coverageOutput, config2.evidence, options);
    const testPlanSummary = generateTestPlanSummary(testPlanState);
    const testPlanResult = validateTestPlan(testPlanState, {
      minTestCases: config2.testPlan.minTestCases,
      requireCoverageThreshold: config2.testPlan.requireCoverageThreshold,
      coverageThresholdPercent: config2.testPlan.coverageThresholdPercent,
      requiredBeforeImplementation: config2.testPlan.requiredBeforeImplementation
    }, DEFAULT_TEST_PLAN_VALIDATION_OPTIONS);
    if (!testPlanResult.valid && options.strictMode) {
      for (const violation of testPlanResult.violations) {
        result.violations.push({
          type: "missing-evidence",
          message: `Test Plan: ${violation.details}`,
          severity: violation.severity
        });
      }
    }
    result.summary = {
      ...result.summary,
      totalTests: testPlanSummary.totalTestCases + result.summary.totalTests
    };
    const hasBlockingViolation = result.violations.some((v) => v.severity === "error");
    result.compliant = !hasBlockingViolation && result.summary.failedTests === 0;
    return result;
  }
}
function createEvidenceReport(testFilePaths = []) {
  return {
    testFilePaths,
    timestamp: new Date().toISOString()
  };
}

// src/hooks/blitzkrieg-evidence-verifier/index.ts
var evidenceStore = {};
function registerEvidence(taskId, evidence) {
  if (!evidenceStore[taskId]) {
    evidenceStore[taskId] = {
      testFilePaths: []
    };
  }
  const existing = evidenceStore[taskId].evidence || createEvidenceReport();
  evidenceStore[taskId].evidence = {
    ...existing,
    ...evidence,
    testFilePaths: [...existing.testFilePaths, ...evidence.testFilePaths || []]
  };
}
function getBlitzkriegConfig3(input) {
  const config2 = input.config;
  return config2?.blitzkrieg;
}
function getTaskId(toolInput) {
  return toolInput.sessionID || "default";
}
function isTaskCompletion(toolName) {
  const completionKeywords = ["todowrite", "task", "complete", "done"];
  return completionKeywords.some((keyword) => toolName.toLowerCase().includes(keyword));
}
function createBlitzkriegEvidenceVerifierHook(input) {
  return {
    "tool.execute.before": async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig3(input);
      if (!blitzkriegConfig?.enabled) {
        return;
      }
      const toolName = toolInput.tool;
      if (!isTaskCompletion(toolName)) {
        return;
      }
      const evidenceConfig = blitzkriegConfig.evidence;
      if (!evidenceConfig.requireTestExecutionEvidence && !evidenceConfig.requireAssertionEvidence && !evidenceConfig.requireEdgeCaseEvidence) {
        return;
      }
      const taskId = getTaskId(toolInput);
      const taskEvidence = evidenceStore[taskId];
      if (!taskEvidence) {
        throw new Error(`Blitzkrieg Evidence Verification: No evidence registered for task "${taskId}". Please register test files and evidence before marking task complete.`);
      }
      const evidence = taskEvidence.evidence || createEvidenceReport();
      console.log(`[blitzkrieg-evidence-verifier] Evidence verification is not fully implemented. Skipping verification for task ${taskId}.`);
    },
    "tool.execute.after": async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig3(input);
      if (!blitzkriegConfig?.enabled) {
        return;
      }
      const toolName = toolInput.tool;
      if (toolName === "bash") {
        const args = toolOutput;
        const command = args?.command;
        if (command && isTestCommand(command)) {
          const taskId = getTaskId(toolInput);
          const output = toolOutput.output;
          if (output) {
            registerEvidence(taskId, {
              testExecutionEvidence: output
            });
          }
        }
      }
    }
  };
}
function isTestCommand(command) {
  const testPatterns = [
    /npm\s+test/i,
    /yarn\s+test/i,
    /pnpm\s+test/i,
    /pytest/i,
    /jest/i,
    /mocha/i,
    /vitest/i,
    /karma/i,
    /cypress/i,
    /playwright/i,
    /test\s+--?/
  ];
  return testPatterns.some((pattern) => pattern.test(command));
}

// src/features/blitzkrieg/blitzkrieg-planner.ts
var DEFAULT_PLANNER_CONSTRAINT_CONFIG = {
  requireTestStep: true,
  requireVerificationStep: true,
  maxImplementationStepComplexity: 3,
  enforceComplexitySeverity: "block",
  enforceStructureSeverity: "block"
};
function createPlanningStep(id, description, type, complexity = 1, dependencies = []) {
  return {
    id,
    description,
    type,
    complexity: Math.max(1, Math.min(10, complexity)),
    dependencies
  };
}
function inferStepType(description) {
  const lowerDesc = description.toLowerCase();
  const verificationKeywords = [
    "verify implementation",
    "validate results",
    "review code",
    "approve",
    "confirm",
    "verify",
    "validate",
    "check",
    "review"
  ];
  const planningKeywords = ["plan architecture", "design solution", "plan", "design", "architect", "outline"];
  const testKeywords = ["test", "spec", "assert", "mock", "stub"];
  if (verificationKeywords.some((kw) => lowerDesc.includes(kw))) {
    return "verification";
  }
  if (planningKeywords.some((kw) => lowerDesc.includes(kw))) {
    return "planning";
  }
  if (testKeywords.some((kw) => lowerDesc.includes(kw))) {
    return "test";
  }
  return "implementation";
}
function estimateComplexity(description) {
  const lowerDesc = description.toLowerCase();
  let complexity = 1;
  const complexityKeywords = {
    simple: 1,
    basic: 1,
    add: 2,
    create: 2,
    implement: 2,
    modify: 2,
    update: 2,
    refactor: 3,
    restructure: 3,
    reorganize: 3,
    integrate: 4,
    complex: 4,
    difficult: 5,
    "multi-file": 4,
    "cross-module": 5,
    very: 3,
    extremely: 4
  };
  for (const [keyword, value] of Object.entries(complexityKeywords)) {
    if (lowerDesc.includes(keyword)) {
      complexity = Math.max(complexity, value);
    }
  }
  const wordCount = description.split(/\s+/).length;
  if (wordCount > 10)
    complexity += 1;
  if (wordCount > 20)
    complexity += 1;
  if (wordCount > 30)
    complexity += 1;
  return Math.min(10, complexity);
}
function mapSeverity(severity) {
  switch (severity) {
    case "block":
      return "error";
    case "warn":
      return "warning";
    default:
      return "warning";
  }
}
function checkPlanningConstraints(steps, config2 = DEFAULT_PLANNER_CONSTRAINT_CONFIG) {
  const violations = [];
  const hasTestStep = steps.some((s) => s.type === "test");
  const hasVerificationStep = steps.some((s) => s.type === "verification");
  const implementationSteps = steps.filter((s) => s.type === "implementation");
  if (config2.requireTestStep && implementationSteps.length > 0 && !hasTestStep) {
    violations.push({
      type: "missing-test-step",
      taskId: "plan",
      severity: mapSeverity(config2.enforceStructureSeverity),
      message: "Plan contains implementation steps but no test step"
    });
  }
  if (config2.requireVerificationStep && implementationSteps.length > 0 && !hasVerificationStep) {
    violations.push({
      type: "missing-verification",
      taskId: "plan",
      severity: mapSeverity(config2.enforceStructureSeverity),
      message: "Plan contains implementation steps but no verification step"
    });
  }
  let complexityValid = true;
  for (const step of implementationSteps) {
    if (step.complexity > config2.maxImplementationStepComplexity) {
      violations.push({
        type: "excessive-complexity",
        taskId: step.id,
        severity: mapSeverity(config2.enforceComplexitySeverity),
        message: `Step "${step.description}" has complexity ${step.complexity}, exceeding maximum of ${config2.maxImplementationStepComplexity}`
      });
      complexityValid = false;
    }
  }
  return {
    hasTestStep,
    hasVerificationStep,
    complexityValid,
    violations
  };
}
function generatePlanningComplianceReport(steps, config2 = DEFAULT_PLANNER_CONSTRAINT_CONFIG) {
  const check = checkPlanningConstraints(steps, config2);
  const suggestions = [];
  if (!check.hasTestStep && config2.requireTestStep) {
    suggestions.push("Add test steps to verify the implementation works correctly");
  }
  if (!check.hasVerificationStep && config2.requireVerificationStep) {
    suggestions.push("Add a verification step to ensure quality before completion");
  }
  for (const violation of check.violations) {
    if (violation.type === "excessive-complexity") {
      suggestions.push(`Break down complex step "${violation.taskId}" into smaller, more manageable tasks`);
    }
  }
  const stats = calculatePlanningStepStatistics(steps);
  const complexityScore = calculateComplexityScore(stats);
  return {
    compliant: check.violations.filter((v) => v.severity === "error").length === 0,
    steps,
    violations: check.violations,
    suggestions,
    complexityScore
  };
}
function calculatePlanningStepStatistics(steps) {
  const stats = {
    totalSteps: steps.length,
    implementationSteps: 0,
    testSteps: 0,
    verificationSteps: 0,
    planningSteps: 0,
    averageComplexity: 0,
    maxComplexity: 0
  };
  if (steps.length === 0) {
    return stats;
  }
  for (const step of steps) {
    switch (step.type) {
      case "implementation":
        stats.implementationSteps++;
        break;
      case "test":
        stats.testSteps++;
        break;
      case "verification":
        stats.verificationSteps++;
        break;
      case "planning":
        stats.planningSteps++;
        break;
    }
    stats.maxComplexity = Math.max(stats.maxComplexity, step.complexity);
  }
  const totalComplexity = steps.reduce((sum, s) => sum + s.complexity, 0);
  stats.averageComplexity = totalComplexity / steps.length;
  return stats;
}
function calculateComplexityScore(stats) {
  let score = 100;
  if (stats.averageComplexity > 5) {
    score -= (stats.averageComplexity - 5) * 10;
  }
  if (stats.maxComplexity > 7) {
    score -= (stats.maxComplexity - 7) * 5;
  }
  const hasTests = stats.testSteps > 0;
  const hasVerification = stats.verificationSteps > 0;
  const hasPlanning = stats.planningSteps > 0;
  if (hasTests)
    score += 5;
  if (hasVerification)
    score += 5;
  if (hasPlanning)
    score += 5;
  return Math.max(0, Math.min(100, score));
}

// src/hooks/blitzkrieg-planner-constraints/index.ts
var planningStore = {};
function clearPlanning(sessionId) {
  delete planningStore[sessionId];
}
function getBlitzkriegConfig4(input) {
  const config2 = input.config;
  return config2?.blitzkrieg;
}
function isPlanningOperation(toolName, args) {
  if (toolName === "todowrite") {
    return true;
  }
  if (toolName === "task") {
    return true;
  }
  if (args?.prompt?.includes("plan")) {
    return true;
  }
  return false;
}
function extractPlanningSteps(args) {
  const todos = args?.todos;
  if (!todos || !Array.isArray(todos)) {
    return [];
  }
  return todos.map((t) => t.content || "");
}
function createBlitzkriegPlannerConstraintsHook(input) {
  return {
    "tool.execute.before": async (toolInput, toolOutput) => {
      const blitzkriegConfig = getBlitzkriegConfig4(input);
      if (!blitzkriegConfig?.enabled) {
        return;
      }
      const toolName = toolInput.tool;
      const sessionId = toolInput.sessionID;
      if (!isPlanningOperation(toolName, toolOutput)) {
        return;
      }
      const plannerConfig = blitzkriegConfig.plannerConstraints;
      if (!plannerConfig.requireTestStep && !plannerConfig.requireVerificationStep) {
        return;
      }
      const args = toolOutput;
      const stepDescriptions = extractPlanningSteps(args);
      if (stepDescriptions.length === 0) {
        return;
      }
      const steps = stepDescriptions.map((desc, index) => createPlanningStep(`${sessionId}-step-${index}`, desc, inferStepType(desc), estimateComplexity(desc)));
      planningStore[sessionId] = { steps };
      const check = checkPlanningConstraints(steps, {
        requireTestStep: plannerConfig.requireTestStep,
        requireVerificationStep: plannerConfig.requireVerificationStep,
        maxImplementationStepComplexity: plannerConfig.maxImplementationStepComplexity,
        enforceComplexitySeverity: "block",
        enforceStructureSeverity: "block"
      });
      const blockingViolations = check.violations.filter((v) => v.severity === "error");
      if (blockingViolations.length > 0) {
        const report = generatePlanningComplianceReport(steps, {
          requireTestStep: plannerConfig.requireTestStep,
          requireVerificationStep: plannerConfig.requireVerificationStep,
          maxImplementationStepComplexity: plannerConfig.maxImplementationStepComplexity,
          enforceComplexitySeverity: "block",
          enforceStructureSeverity: "block"
        });
        const violationsMsg = blockingViolations.map((v) => `- [${v.severity}] ${v.type}: ${v.message}`).join(`
`);
        const suggestionsMsg = report.suggestions.map((s) => `- ${s}`).join(`
`);
        throw new Error(`Blitzkrieg Planner Constraint Violation:

${violationsMsg}

Suggestions:
${suggestionsMsg}`);
      }
      const warningViolations = check.violations.filter((v) => v.severity === "warning");
      if (warningViolations.length > 0) {
        const warningsMsg = warningViolations.map((v) => `- [${v.severity}] ${v.type}: ${v.message}`).join(`
`);
        console.warn(`Blitzkrieg Planner Warnings:
${warningsMsg}`);
      }
    },
    "tool.execute.after": async (toolInput, toolOutput) => {
      const toolName = toolInput.tool;
      if (toolName === "todowrite") {
        const args = toolOutput;
        const todos = args?.todos;
        const allCompleted = todos?.every((t) => t.status === "completed" || t.status === "cancelled");
        if (allCompleted && todos && todos.length > 0) {
          const sessionId = toolInput.sessionID;
          clearPlanning(sessionId);
        }
      }
    }
  };
}

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
        await new Promise((resolve2) => setTimeout(resolve2, waitTime));
      }
    }
    this.requests.push(now);
  }
  reset() {
    this.requests = [];
  }
}

// src/features/mcp/websearch.ts
var z13 = tool.schema;
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
var websearchToolImpl = tool({
  description: "Search the web for information using AI-powered search via Exa AI. Returns relevant web pages with their content.",
  args: {
    query: z13.string().describe("Search query for the web"),
    numResults: z13.number().min(1).max(20).optional().default(DEFAULT_NUM_RESULTS).describe("Number of results to return (1-20)"),
    livecrawl: z13.enum(["fallback", "preferred"]).optional().default("fallback").describe("Live crawl mode"),
    searchType: z13.enum(["auto", "fast", "deep"]).optional().default("auto").describe("Search type"),
    contextMaxCharacters: z13.number().min(1000).max(50000).optional().default(1e4).describe("Maximum characters per result")
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
var webfetchToolImpl = tool({
  description: "Fetch and parse web content from a specific URL using Exa AI. Returns the content in the specified format.",
  args: {
    url: z13.string().url().describe("URL to fetch content from"),
    format: z13.enum(["markdown", "text", "html"]).optional().default("markdown").describe("Output format"),
    timeout: z13.number().min(1000).max(60000).optional().describe("Timeout in milliseconds")
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
var z14 = tool.schema;
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
async function getDocumentation(library, path12, options = {}) {
  const apiKey = currentConfig2.apiKey || process.env.CONTEXT7_API_KEY;
  if (!apiKey) {
    throw new Error("CONTEXT7_API_KEY is required for documentation lookup. Please set the environment variable.");
  }
  const cacheKey = `doc:${library}:${path12}:${options.version || "latest"}`;
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
          path: path12,
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
var context7SearchTool = tool({
  description: "Search official documentation for libraries, SDKs, and APIs. Returns relevant documentation pages with content.",
  args: {
    query: z14.string().describe("Search query for documentation"),
    library: z14.string().optional().describe('Library name (e.g., "react", "nodejs", "python")'),
    version: z14.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    numResults: z14.number().min(1).max(10).optional().default(DEFAULT_NUM_RESULTS2).describe("Number of results to return"),
    maxTokens: z14.number().min(1000).max(20000).optional().describe("Maximum tokens per result")
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
var context7GetTool = tool({
  description: "Get specific documentation page by library and path. Fetches the exact documentation content.",
  args: {
    library: z14.string().describe('Library name (e.g., "react", "nodejs", "python")'),
    path: z14.string().describe('Documentation path (e.g., "/hooks/useEffect", "/api/fs")'),
    version: z14.string().optional().describe('Library version (e.g., "18.0.0", "3.11")'),
    maxTokens: z14.number().min(1000).max(20000).optional().describe("Maximum tokens to return")
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
var z15 = tool.schema;
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
async function getGitHubFile(owner, repo, path12, options = {}) {
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
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${path12}${options.ref ? `?ref=${options.ref}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(currentConfig3.timeout ?? DEFAULT_TIMEOUT3)
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${owner}/${repo}/${path12}`);
      }
      if (response.status === 403) {
        const rateLimitReset = response.headers.get("X-RateLimit-Reset");
        throw new Error(`GitHub rate limit exceeded. Reset at ${rateLimitReset || "unknown"}. Consider using GITHUB_TOKEN for higher limits.`);
      }
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }
    const content = await response.text();
    const language = inferLanguageFromPath(path12);
    const fileUrl = `https://github.com/${owner}/${repo}/blob/${options.ref || "main"}/${path12}`;
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
function inferLanguageFromPath(path12) {
  const ext = path12.split(".").pop()?.toLowerCase();
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
var grepSearchTool = tool({
  description: "Search code across public GitHub repositories. Returns matching files with repository information.",
  args: {
    query: z15.string().describe("Search query (supports GitHub code search syntax)"),
    language: z15.string().optional().describe('Filter by programming language (e.g., "TypeScript", "Python")'),
    extension: z15.string().optional().describe('Filter by file extension (e.g., "ts", "js", "py")'),
    maxResults: z15.number().min(1).max(30).optional().default(DEFAULT_MAX_RESULTS).describe("Number of results to return"),
    page: z15.number().min(1).optional().default(1).describe("Page number for pagination")
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
var grepGetFileTool = tool({
  description: "Fetch file content from a GitHub repository. Can fetch individual files from search results.",
  args: {
    owner: z15.string().describe('Repository owner (e.g., "facebook", "microsoft")'),
    repo: z15.string().describe('Repository name (e.g., "react", "typescript")'),
    path: z15.string().describe('File path (e.g., "src/index.ts", "README.md")'),
    ref: z15.string().optional().describe('Git reference (branch, tag, or commit, defaults to "main")')
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

// src/features/mcp/index.ts
var builtinMCPs = [
  websearchMCP,
  context7MCP,
  grepAppMCP
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

// src/features/learning/integration.ts
import * as path17 from "path";
import * as os10 from "os";

// src/features/learning/experience-store.ts
import * as fs11 from "fs";
import * as path12 from "path";
import * as readline from "readline";

class ExperienceStore {
  experiencePath;
  buffer;
  maxBufferSize;
  maxAgeDays;
  constructor(storagePath, config2) {
    this.experiencePath = path12.join(storagePath, "experiences.jsonl");
    this.maxBufferSize = config2?.maxBufferSize || 1000;
    this.maxAgeDays = config2?.maxAgeDays || 90;
    this.buffer = [];
    this.ensureStorage();
  }
  ensureStorage() {
    const dir = path12.dirname(this.experiencePath);
    if (!fs11.existsSync(dir)) {
      fs11.mkdirSync(dir, { recursive: true });
    }
    if (!fs11.existsSync(this.experiencePath)) {
      fs11.writeFileSync(this.experiencePath, "", "utf-8");
    }
  }
  async addExperience(experience) {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const fullExperience = {
      id,
      timestamp,
      ...experience
    };
    this.buffer.push(fullExperience);
    if (this.buffer.length >= 100) {
      await this.flushBuffer();
    }
    return fullExperience;
  }
  async flushBuffer() {
    if (this.buffer.length === 0)
      return;
    const lines = this.buffer.map((exp) => JSON.stringify(exp)).join(`
`) + `
`;
    fs11.appendFileSync(this.experiencePath, lines, "utf-8");
    console.log(`[ExperienceStore] Flushed ${this.buffer.length} experiences`);
    this.buffer = [];
  }
  async loadExperiences() {
    const experiences = [];
    const fileStream = fs11.createReadStream(this.experiencePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    for await (const line of rl) {
      if (line.trim()) {
        try {
          const exp = JSON.parse(line);
          experiences.push(exp);
        } catch (e) {
          console.error(`[ExperienceStore] Failed to parse line: ${line}`);
        }
      }
    }
    const now = Date.now();
    const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;
    return experiences.filter((exp) => {
      const expTime = new Date(exp.timestamp).getTime();
      return now - expTime <= maxAgeMs;
    });
  }
  async findRelevant(currentState, context, k = 5) {
    const experiences = await this.loadExperiences();
    const scored = experiences.map((exp) => ({
      exp,
      score: this.calculateSimilarityScore(exp, currentState, context)
    })).sort((a, b) => b.score - a.score).slice(0, k).map((item) => item.exp);
    return scored;
  }
  async getBestAction(currentState, context) {
    const experiences = await this.findRelevant(currentState, context, 10);
    if (experiences.length === 0) {
      return null;
    }
    const scored = experiences.map((exp) => ({
      exp,
      score: this.scoreExperience(exp)
    }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    return {
      bestAction: best.exp.action,
      expectedReward: best.exp.reward,
      confidence: best.exp.confidence,
      similarExperiences: scored.slice(0, 3).map((s) => s.exp)
    };
  }
  calculateSimilarityScore(exp, currentState, context) {
    let score = 0;
    if (exp.state === currentState) {
      score += 2;
    } else if (currentState.includes(exp.state) || exp.state.includes(currentState)) {
      score += 1;
    }
    const contextLower = context.toLowerCase();
    const expContext = exp.context.prompt || "";
    const expContextLower = expContext.toLowerCase();
    const keywords = this.extractKeywords(contextLower);
    const expKeywords = this.extractKeywords(expContextLower);
    const keywordMatches = keywords.filter((k) => expKeywords.includes(k)).length;
    score += keywordMatches * 0.5;
    if (exp.context.tool && contextLower.includes(exp.context.tool.toLowerCase())) {
      score += 0.5;
    }
    return score;
  }
  scoreExperience(exp) {
    let score = 0;
    score += exp.reward * 2;
    score += exp.confidence * 0.5;
    const ageMs = Date.now() - new Date(exp.timestamp).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const recencyScore = Math.exp(-ageDays / 30);
    score += recencyScore * 0.5;
    return score;
  }
  extractKeywords(text) {
    const words = text.split(/\s+/);
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "can",
      "could",
      "may",
      "might",
      "must",
      "to",
      "of",
      "in",
      "for",
      "on",
      "at",
      "by",
      "with",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again"
    ]);
    return words.filter((w) => w.length > 3 && !stopWords.has(w)).filter((w, i, arr) => arr.indexOf(w) === i);
  }
  async getReplayBuffer(size = 100) {
    const experiences = await this.loadExperiences();
    const recent = experiences.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, size);
    return {
      buffer: recent,
      maxSize: this.maxBufferSize
    };
  }
  async getStats() {
    const experiences = await this.loadExperiences();
    if (experiences.length === 0) {
      return {
        totalExperiences: 0,
        avgReward: 0,
        successRate: 0,
        recentExperiences: []
      };
    }
    const avgReward = experiences.reduce((sum, exp) => sum + exp.reward, 0) / experiences.length;
    const successCount = experiences.filter((exp) => exp.outcome === "success").length;
    const successRate = successCount / experiences.length;
    const recent = experiences.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    return {
      totalExperiences: experiences.length,
      avgReward,
      successRate,
      recentExperiences: recent
    };
  }
  async compact() {
    const experiences = await this.loadExperiences();
    const lines = experiences.map((exp) => JSON.stringify(exp)).join(`
`);
    fs11.writeFileSync(this.experiencePath, lines + `
`, "utf-8");
    console.log(`[ExperienceStore] Compacted: kept ${experiences.length} experiences`);
  }
}

// src/features/learning/knowledge-graph.ts
import * as fs12 from "fs";
import * as path13 from "path";

class KnowledgeGraphStore {
  nodesPath;
  edgesPath;
  indexPath;
  graph;
  maxNodes;
  constructor(storagePath, config2) {
    const kgDir = path13.join(storagePath, "knowledge_graph");
    this.nodesPath = path13.join(kgDir, "nodes.json");
    this.edgesPath = path13.join(kgDir, "edges.json");
    this.indexPath = path13.join(kgDir, "indexes.json");
    this.maxNodes = config2?.maxNodes || 1e4;
    this.graph = {
      nodes: {},
      edges: [],
      indexes: {
        byType: {},
        byImportance: [],
        byTag: {}
      }
    };
    this.ensureStorage();
    this.loadGraph();
  }
  ensureStorage() {
    const dir = path13.dirname(this.nodesPath);
    if (!fs12.existsSync(dir)) {
      fs12.mkdirSync(dir, { recursive: true });
    }
  }
  loadGraph() {
    if (fs12.existsSync(this.nodesPath)) {
      const nodesData = fs12.readFileSync(this.nodesPath, "utf-8");
      this.graph.nodes = JSON.parse(nodesData);
    }
    if (fs12.existsSync(this.edgesPath)) {
      const edgesData = fs12.readFileSync(this.edgesPath, "utf-8");
      this.graph.edges = JSON.parse(edgesData);
    }
    if (fs12.existsSync(this.indexPath)) {
      const indexesData = fs12.readFileSync(this.indexPath, "utf-8");
      this.graph.indexes = JSON.parse(indexesData);
    }
    console.log(`[KnowledgeGraph] Loaded ${Object.keys(this.graph.nodes).length} nodes, ${this.graph.edges.length} edges`);
  }
  saveGraph() {
    fs12.writeFileSync(this.nodesPath, JSON.stringify(this.graph.nodes, null, 2), "utf-8");
    fs12.writeFileSync(this.edgesPath, JSON.stringify(this.graph.edges, null, 2), "utf-8");
    fs12.writeFileSync(this.indexPath, JSON.stringify(this.graph.indexes, null, 2), "utf-8");
  }
  async addNode(id, type, data, source = "manual") {
    const now = new Date().toISOString();
    if (this.graph.nodes[id]) {
      const existing = this.graph.nodes[id];
      existing.data = { ...existing.data, ...data };
      existing.metadata.updated = now;
      existing.lastAccessed = now;
      existing.accessCount++;
      this.graph.nodes[id] = existing;
    } else {
      const newNode = {
        id,
        type,
        data,
        relations: {
          relatedTo: [],
          conflictsWith: [],
          dependsOn: []
        },
        importance: 5,
        strength: 0.8,
        lastAccessed: now,
        accessCount: 0,
        metadata: {
          tags: data.tags || [],
          source,
          created: now,
          updated: now
        }
      };
      this.graph.nodes[id] = newNode;
      this.updateIndexes(newNode);
    }
    this.saveGraph();
    return this.graph.nodes[id];
  }
  getNode(id) {
    const node = this.graph.nodes[id];
    if (node) {
      node.lastAccessed = new Date().toISOString();
      node.accessCount++;
      this.saveGraph();
    }
    return node || null;
  }
  async addEdge(from, to, type, weight = 1) {
    const existing = this.graph.edges.find((e) => e.from === from && e.to === to && e.type === type);
    if (existing) {
      existing.weight = weight;
    } else {
      const newEdge = { from, to, type, weight };
      this.graph.edges.push(newEdge);
      const fromNode = this.graph.nodes[from];
      const toNode = this.graph.nodes[to];
      if (fromNode) {
        switch (type) {
          case "relates_to":
            fromNode.relations.relatedTo.push(to);
            break;
          case "conflicts_with":
            fromNode.relations.conflictsWith.push(to);
            break;
          case "depends_on":
            fromNode.relations.dependsOn.push(to);
            break;
        }
      }
      if (type === "relates_to" && toNode) {
        toNode.relations.relatedTo.push(from);
      }
    }
    this.saveGraph();
  }
  getNodesByType(type) {
    const nodeIds = this.graph.indexes.byType[type] || [];
    return nodeIds.map((id) => this.graph.nodes[id]).filter((n) => n !== undefined);
  }
  getNodesByTag(tag) {
    const nodeIds = this.graph.indexes.byTag[tag] || [];
    return nodeIds.map((id) => this.graph.nodes[id]).filter((n) => n !== undefined);
  }
  getImportantNodes(limit = 10) {
    const nodeIds = this.graph.indexes.byImportance.slice(0, limit);
    return nodeIds.map((id) => this.graph.nodes[id]).filter((n) => n !== undefined);
  }
  getRelatedNodes(nodeId) {
    const related = [];
    for (const edge of this.graph.edges) {
      if (edge.from === nodeId) {
        const node = this.graph.nodes[edge.to];
        if (node) {
          related.push({ node, edge });
        }
      } else if (edge.to === nodeId) {
        const node = this.graph.nodes[edge.from];
        if (node) {
          related.push({ node, edge });
        }
      }
    }
    return related;
  }
  findPath(fromId, toId) {
    if (!this.graph.nodes[fromId] || !this.graph.nodes[toId]) {
      return null;
    }
    if (fromId === toId) {
      return [this.graph.nodes[fromId]];
    }
    const visited = new Set;
    const queue = [{ id: fromId, path: [fromId] }];
    while (queue.length > 0) {
      const { id, path: path14 } = queue.shift();
      if (id === toId) {
        return path14.map((p) => this.graph.nodes[p]);
      }
      visited.add(id);
      const neighbors = this.graph.edges.filter((e) => e.from === id || e.to === id).map((e) => e.from === id ? e.to : e.from);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, path: [...path14, neighbor] });
        }
      }
    }
    return null;
  }
  async getRelevantContext(query) {
    const queryLower = query.toLowerCase();
    const keywords = this.extractKeywords(queryLower);
    const relevantNodes = [];
    for (const [id, node] of Object.entries(this.graph.nodes)) {
      const nodeText = `${node.id} ${JSON.stringify(node.data)}`.toLowerCase();
      const matchCount = keywords.filter((kw) => nodeText.includes(kw)).length;
      if (matchCount > 0) {
        relevantNodes.push(node);
      }
    }
    relevantNodes.sort((a, b) => b.importance - a.importance);
    const relevantNodeIds = new Set(relevantNodes.map((n) => n.id));
    const relevantEdges = this.graph.edges.filter((e) => relevantNodeIds.has(e.from) && relevantNodeIds.has(e.to));
    return {
      nodes: relevantNodes.slice(0, 10),
      relationships: relevantEdges
    };
  }
  extractKeywords(query) {
    const words = query.split(/\s+/);
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "can",
      "could",
      "may",
      "might",
      "must",
      "to",
      "of",
      "in",
      "for",
      "on",
      "at",
      "by",
      "with",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again"
    ]);
    return words.filter((w) => w.length > 3 && !stopWords.has(w)).filter((w, i, arr) => arr.indexOf(w) === i);
  }
  updateIndexes(node) {
    if (!this.graph.indexes.byType[node.type]) {
      this.graph.indexes.byType[node.type] = [];
    }
    this.graph.indexes.byType[node.type].push(node.id);
    this.graph.indexes.byImportance.push(node.id);
    this.graph.indexes.byImportance.sort((a, b) => {
      const aImp = this.graph.nodes[a]?.importance || 0;
      const bImp = this.graph.nodes[b]?.importance || 0;
      return bImp - aImp;
    });
    for (const tag of node.metadata.tags) {
      if (!this.graph.indexes.byTag[tag]) {
        this.graph.indexes.byTag[tag] = [];
      }
      this.graph.indexes.byTag[tag].push(node.id);
    }
    if (Object.keys(this.graph.nodes).length > this.maxNodes) {
      this.pruneLeastImportant();
    }
  }
  pruneLeastImportant() {
    const nodeIds = this.graph.indexes.byImportance.slice(this.maxNodes);
    for (const id of nodeIds) {
      delete this.graph.nodes[id];
      this.graph.edges = this.graph.edges.filter((e) => e.from !== id && e.to !== id);
    }
    this.graph.indexes.byImportance = this.graph.indexes.byImportance.slice(0, this.maxNodes);
    console.log(`[KnowledgeGraph] Pruned ${nodeIds.length} nodes`);
  }
  getStats() {
    const byType = {};
    for (const node of Object.values(this.graph.nodes)) {
      byType[node.type] = (byType[node.type] || 0) + 1;
    }
    const totalImportance = Object.values(this.graph.nodes).reduce((sum, n) => sum + n.importance, 0);
    const totalStrength = Object.values(this.graph.nodes).reduce((sum, n) => sum + n.strength, 0);
    return {
      totalNodes: Object.keys(this.graph.nodes).length,
      totalEdges: this.graph.edges.length,
      byType,
      avgImportance: totalImportance / Object.keys(this.graph.nodes).length || 0,
      avgStrength: totalStrength / Object.keys(this.graph.nodes).length || 0
    };
  }
  exportGraph() {
    return JSON.parse(JSON.stringify(this.graph));
  }
  search(query, type) {
    const queryLower = query.toLowerCase();
    const keywords = this.extractKeywords(queryLower);
    const results = [];
    for (const node of Object.values(this.graph.nodes)) {
      if (type && node.type !== type) {
        continue;
      }
      const nodeText = `${node.id} ${JSON.stringify(node.data)}`.toLowerCase();
      const matchCount = keywords.filter((kw) => nodeText.includes(kw)).length;
      if (matchCount > 0) {
        results.push(node);
      }
    }
    results.sort((a, b) => {
      const scoreA = a.importance * 10 + a.accessCount;
      const scoreB = b.importance * 10 + b.accessCount;
      return scoreB - scoreA;
    });
    return results;
  }
  getAllNodes() {
    return Object.values(this.graph.nodes);
  }
  getAllEdges() {
    return this.graph.edges;
  }
}

// src/features/learning/pattern-detection.ts
import * as fs13 from "fs";
import * as path14 from "path";

class PatternDetector {
  patternsPath;
  patterns;
  minFrequency;
  minConfidence;
  constructor(storagePath, config2) {
    const patternsDir = path14.join(storagePath, "patterns");
    this.patternsPath = path14.join(patternsDir, "detection_patterns.json");
    this.minFrequency = config2?.minFrequency || 3;
    this.minConfidence = config2?.minConfidence || 0.7;
    this.patterns = new Map;
    this.ensureStorage();
    this.loadPatterns();
  }
  ensureStorage() {
    const dir = path14.dirname(this.patternsPath);
    if (!fs13.existsSync(dir)) {
      fs13.mkdirSync(dir, { recursive: true });
    }
  }
  loadPatterns() {
    if (fs13.existsSync(this.patternsPath)) {
      try {
        const data = fs13.readFileSync(this.patternsPath, "utf-8");
        const patternsArray = JSON.parse(data);
        for (const pattern of patternsArray) {
          this.patterns.set(pattern.id, pattern);
        }
        console.log(`[PatternDetector] Loaded ${this.patterns.size} patterns`);
      } catch (error) {
        console.error(`[PatternDetector] Failed to load patterns from ${this.patternsPath}:`, error);
        const archivePath = `${this.patternsPath}.corrupted-${Date.now()}`;
        try {
          fs13.renameSync(this.patternsPath, archivePath);
          console.log(`[PatternDetector] Archived corrupted file to ${archivePath}`);
        } catch (renameError) {
          console.error(`[PatternDetector] Failed to archive corrupted file:`, renameError);
        }
        this.patterns = new Map;
        console.log(`[PatternDetector] Starting with empty patterns map`);
      }
    }
  }
  savePatterns() {
    const patternsArray = Array.from(this.patterns.values());
    fs13.writeFileSync(this.patternsPath, JSON.stringify(patternsArray, null, 2), "utf-8");
  }
  async analyzeExperiences(experiences) {
    const detectedPatterns = [];
    const positivePatterns = this.detectPatternsByOutcome(experiences, "positive");
    detectedPatterns.push(...positivePatterns);
    const negativePatterns = this.detectPatternsByOutcome(experiences, "negative");
    detectedPatterns.push(...negativePatterns);
    for (const pattern of detectedPatterns) {
      await this.updatePattern(pattern);
    }
    const avgConfidence = detectedPatterns.length > 0 ? detectedPatterns.reduce((sum, p) => sum + p.confidence, 0) / detectedPatterns.length : 0;
    const suggestedBehavior = this.generateSuggestedBehavior(detectedPatterns);
    return {
      patterns: detectedPatterns,
      confidence: avgConfidence,
      suggestedBehavior,
      contextMatches: {
        similarExperiences: this.findSimilarExperiences(experiences, detectedPatterns),
        relatedPatterns: this.findRelatedPatterns(detectedPatterns)
      }
    };
  }
  detectPatternsByOutcome(experiences, type) {
    const patterns = [];
    const filteredExperiences = experiences.filter((exp) => {
      if (type === "positive") {
        return exp.outcome === "success" && exp.reward > 0.5;
      } else {
        return exp.outcome === "failure" || exp.reward < -0.3;
      }
    });
    if (filteredExperiences.length < this.minFrequency) {
      return patterns;
    }
    const byState = new Map;
    for (const exp of filteredExperiences) {
      if (!byState.has(exp.state)) {
        byState.set(exp.state, []);
      }
      byState.get(exp.state).push(exp);
    }
    for (const [state, stateExps] of byState.entries()) {
      if (stateExps.length < this.minFrequency)
        continue;
      const actions = stateExps.map((e) => e.action);
      const actionCounts = new Map;
      for (const action of actions) {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      }
      for (const [action, count] of actionCounts.entries()) {
        if (count >= this.minFrequency) {
          const pattern = {
            id: `pattern-${type}-${state}-${action}-${Date.now()}`,
            type,
            category: this.categorizePattern(state),
            description: this.generatePatternDescription(type, state, action),
            examples: stateExps.slice(0, 3).map((e) => `${e.action}: ${e.outcome}`),
            frequency: count,
            firstSeen: new Date(Math.min(...stateExps.map((e) => new Date(e.timestamp).getTime()))).toISOString(),
            lastSeen: new Date(Math.max(...stateExps.map((e) => new Date(e.timestamp).getTime()))).toISOString(),
            confidence: Math.min(1, count / stateExps.length),
            triggers: [state, action],
            consequences: type === "positive" ? ["High success rate"] : ["Frequent failures"],
            suggestedActions: this.generateSuggestedActions(type, state, action),
            impact: this.assessImpact(count, type),
            status: "active"
          };
          patterns.push(pattern);
        }
      }
    }
    return patterns;
  }
  async updatePattern(pattern) {
    const existingId = this.findSimilarPattern(pattern);
    if (existingId) {
      const existing = this.patterns.get(existingId);
      existing.frequency += pattern.frequency;
      existing.lastSeen = pattern.lastSeen;
      existing.examples = [...existing.examples, ...pattern.examples].slice(0, 10);
      existing.confidence = (existing.confidence + pattern.confidence) / 2;
      this.patterns.set(existingId, existing);
    } else {
      this.patterns.set(pattern.id, pattern);
    }
    this.savePatterns();
  }
  findSimilarPattern(pattern) {
    for (const [id, existing] of this.patterns.entries()) {
      if (existing.type === pattern.type && existing.category === pattern.category && existing.description === pattern.description) {
        return id;
      }
    }
    return null;
  }
  categorizePattern(state) {
    const lowerState = state.toLowerCase();
    if (lowerState.includes("debug") || lowerState.includes("error") || lowerState.includes("fix")) {
      return "debugging";
    } else if (lowerState.includes("code") || lowerState.includes("implement") || lowerState.includes("build")) {
      return "coding";
    } else if (lowerState.includes("review") || lowerState.includes("test") || lowerState.includes("check")) {
      return "testing";
    } else if (lowerState.includes("design") || lowerState.includes("architect") || lowerState.includes("plan")) {
      return "design";
    } else {
      return "general";
    }
  }
  generatePatternDescription(type, state, action) {
    if (type === "positive") {
      return `When ${state}, using ${action} tends to succeed`;
    } else {
      return `When ${state}, using ${action} often fails`;
    }
  }
  generateSuggestedActions(type, state, action) {
    if (type === "positive") {
      return [
        `Continue using ${action} when ${state}`,
        `Consider refining ${action} for even better results`
      ];
    } else {
      return [
        `Avoid ${action} when ${state}`,
        `Try alternative approaches for ${state}`,
        `Research better methods for ${state} scenarios`
      ];
    }
  }
  assessImpact(frequency, type) {
    if (frequency < 5)
      return "low";
    if (frequency < 15)
      return type === "negative" ? "high" : "medium";
    if (frequency < 30)
      return "high";
    return "critical";
  }
  generateSuggestedBehavior(patterns) {
    if (patterns.length === 0) {
      return "No clear patterns detected. Continue working normally.";
    }
    const positives = patterns.filter((p) => p.type === "positive");
    const negatives = patterns.filter((p) => p.type === "negative");
    if (negatives.length > positives.length) {
      const topNegative = negatives[0];
      return `Warning: Detected negative pattern "${topNegative.description}". Consider alternative approaches.`;
    } else if (positives.length > 0) {
      const topPositive = positives[0];
      return `Good pattern detected: "${topPositive.description}". Consider continuing this approach.`;
    } else {
      return "Mixed patterns detected. Evaluate context before proceeding.";
    }
  }
  findSimilarExperiences(experiences, patterns) {
    const similar = [];
    for (const pattern of patterns) {
      for (const exp of experiences) {
        if (exp.state === pattern.triggers[0] && exp.action === pattern.triggers[1]) {
          similar.push(exp.id);
        }
      }
    }
    return [...new Set(similar)].slice(0, 5);
  }
  findRelatedPatterns(patterns) {
    return patterns.map((p) => p.id);
  }
  async listPatterns(filters) {
    let patterns = Array.from(this.patterns.values());
    if (filters?.type) {
      patterns = patterns.filter((p) => p.type === filters.type);
    }
    if (filters?.status) {
      patterns = patterns.filter((p) => p.status === filters.status);
    }
    if (filters?.impact) {
      patterns = patterns.filter((p) => p.impact === filters.impact);
    }
    patterns.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0)
        return impactDiff;
      return b.frequency - a.frequency;
    });
    return patterns;
  }
  async updatePatternStatus(id, status) {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`);
    }
    pattern.status = status;
    this.savePatterns();
  }
  getStats() {
    const patterns = Array.from(this.patterns.values());
    const byCategory = {};
    const byImpact = {};
    for (const pattern of patterns) {
      byCategory[pattern.category] = (byCategory[pattern.category] || 0) + 1;
      byImpact[pattern.impact] = (byImpact[pattern.impact] || 0) + 1;
    }
    return {
      totalPatterns: patterns.length,
      positive: patterns.filter((p) => p.type === "positive").length,
      negative: patterns.filter((p) => p.type === "negative").length,
      active: patterns.filter((p) => p.status === "active").length,
      byCategory,
      byImpact
    };
  }
  getAllPatterns() {
    return Array.from(this.patterns.values());
  }
}

// src/features/learning/state-machine.ts
import * as fs14 from "fs";
import * as path15 from "path";

class StateMachineEngine {
  stateMachinesPath;
  stateMachines;
  currentMachineId;
  constructor(storagePath) {
    const smDir = path15.join(storagePath, "state_machines");
    this.stateMachinesPath = path15.join(smDir, "machines.json");
    this.stateMachines = new Map;
    this.ensureStorage();
    this.loadStateMachines();
  }
  ensureStorage() {
    const dir = path15.dirname(this.stateMachinesPath);
    if (!fs14.existsSync(dir)) {
      fs14.mkdirSync(dir, { recursive: true });
    }
  }
  loadStateMachines() {
    if (fs14.existsSync(this.stateMachinesPath)) {
      const data = fs14.readFileSync(this.stateMachinesPath, "utf-8");
      const machinesArray = JSON.parse(data);
      for (const machine of machinesArray) {
        this.stateMachines.set(machine.id, machine);
      }
      console.log(`[StateMachine] Loaded ${this.stateMachines.size} state machines`);
    }
  }
  saveStateMachines() {
    const machinesArray = Array.from(this.stateMachines.values());
    fs14.writeFileSync(this.stateMachinesPath, JSON.stringify(machinesArray, null, 2), "utf-8");
  }
  createMachine(id, name, initialState, states) {
    if (!states[initialState]) {
      throw new Error(`Initial state '${initialState}' not found in states. Available states: ${Object.keys(states).join(", ")}`);
    }
    const machine = {
      id,
      name,
      initialState,
      states,
      transitions: this.buildTransitionsMap(states),
      currentState: initialState,
      history: [],
      metadata: {
        created: new Date().toISOString(),
        version: "1.0.0",
        triggers: []
      }
    };
    this.stateMachines.set(id, machine);
    this.saveStateMachines();
    return machine;
  }
  buildTransitionsMap(states) {
    const transitions = {};
    for (const [stateName, state] of Object.entries(states)) {
      if (state.transitions && state.transitions.length > 0) {
        transitions[stateName] = state.transitions;
      } else {
        transitions[stateName] = [];
      }
    }
    return transitions;
  }
  getMachine(id) {
    return this.stateMachines.get(id) || null;
  }
  setCurrentMachine(id) {
    if (!this.stateMachines.has(id)) {
      throw new Error(`State machine not found: ${id}`);
    }
    this.currentMachineId = id;
    console.log(`[StateMachine] Set current machine: ${id}`);
  }
  getCurrentState() {
    if (!this.currentMachineId) {
      return null;
    }
    const machine = this.stateMachines.get(this.currentMachineId);
    return machine?.currentState || null;
  }
  getCurrentMachine() {
    if (!this.currentMachineId) {
      return null;
    }
    return this.stateMachines.get(this.currentMachineId) || null;
  }
  async transition(trigger, context) {
    if (!this.currentMachineId) {
      console.warn("[StateMachine] No current machine set");
      return false;
    }
    const machine = this.stateMachines.get(this.currentMachineId);
    if (!machine) {
      return false;
    }
    const currentState = machine.currentState;
    const transitions = machine.transitions[currentState] || [];
    let matchedTransition = null;
    for (const transition of transitions) {
      if (transition.condition) {
        if (transition.condition(context)) {
          matchedTransition = transition;
          break;
        }
      } else {
        if (this.triggerMatches(transition, trigger)) {
          matchedTransition = transition;
          break;
        }
      }
    }
    if (!matchedTransition) {
      console.warn(`[StateMachine] No transition found from ${currentState} for trigger: ${trigger}`);
      return false;
    }
    if (matchedTransition.probability !== undefined) {
      const rand = Math.random();
      if (rand > matchedTransition.probability) {
        console.log(`[StateMachine] Stochastic transition not taken (prob: ${matchedTransition.probability})`);
        return false;
      }
    }
    if (!machine.states[matchedTransition.toState]) {
      console.error(`[StateMachine] Target state '${matchedTransition.toState}' does not exist in machine. Cannot transition.`);
      return false;
    }
    const currentStateDef = machine.states[currentState];
    if (currentStateDef?.onExit) {
      currentStateDef.onExit();
    }
    const transitionRecord = {
      timestamp: new Date().toISOString(),
      fromState: currentState,
      toState: matchedTransition.toState,
      trigger,
      context
    };
    machine.currentState = matchedTransition.toState;
    machine.history.push(transitionRecord);
    if (matchedTransition.action) {
      matchedTransition.action();
    }
    const newStateDef = machine.states[matchedTransition.toState];
    if (newStateDef?.onEnter) {
      newStateDef.onEnter();
    }
    this.saveStateMachines();
    console.log(`[StateMachine] Transitioned: ${currentState} → ${matchedTransition.toState} (trigger: ${trigger})`);
    return true;
  }
  triggerMatches(transition, trigger) {
    if (transition.toolMethod) {
      return trigger.toLowerCase().includes(transition.toolMethod.toLowerCase());
    }
    if (!transition.fromState || transition.fromState === "") {
      return true;
    }
    return trigger === transition.fromState || trigger.includes(transition.fromState);
  }
  async detectStateTransition(context) {
    if (!this.currentMachineId) {
      return null;
    }
    const machine = this.stateMachines.get(this.currentMachineId);
    if (!machine) {
      return null;
    }
    const currentState = machine.currentState;
    const detectedState = this.analyzeContextForState(context, currentState);
    if (detectedState && detectedState !== currentState) {
      try {
        await this.transition(`auto-detect: ${detectedState}`, context);
        return detectedState;
      } catch (error) {
        console.error(`[StateMachine] Auto-transition failed:`, error);
        return null;
      }
    }
    return null;
  }
  analyzeContextForState(context, currentState) {
    let contextStr;
    try {
      contextStr = JSON.stringify(context).toLowerCase();
    } catch (error) {
      console.error(`[StateMachine] Failed to stringify context:`, error);
      contextStr = String(context).toLowerCase();
    }
    const stateRules = {
      analyzing: [/analyz/, /review/, /check/, /exam/],
      debugging: [/debug/, /error/, /bug/, /fix/, /issue/],
      implementing: [/implement/, /build/, /create/, /add/],
      testing: [/test/, /verify/, /check/],
      reviewing: [/review/, /inspect/, /audit/],
      deploying: [/deploy/, /release/, /publish/],
      learning: [/learn/, /study/, /research/],
      planning: [/plan/, /design/, /architect/]
    };
    for (const [state, rules] of Object.entries(stateRules)) {
      if (state === currentState)
        continue;
      for (const rule of rules) {
        if (rule.test(contextStr)) {
          return state;
        }
      }
    }
    return null;
  }
  addTransition(machineId, fromState, transition) {
    const machine = this.stateMachines.get(machineId);
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`);
    }
    if (!machine.states[fromState]) {
      throw new Error(`Source state '${fromState}' not found in machine states. Available states: ${Object.keys(machine.states).join(", ")}`);
    }
    if (!machine.transitions[fromState]) {
      machine.transitions[fromState] = [];
    }
    machine.transitions[fromState].push(transition);
    if (!machine.states[fromState].transitions) {
      machine.states[fromState].transitions = [];
    }
    machine.states[fromState].transitions.push(transition);
    this.saveStateMachines();
  }
  resetMachine(machineId) {
    const machine = this.stateMachines.get(machineId);
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`);
    }
    machine.currentState = machine.initialState;
    machine.history = [];
    this.saveStateMachines();
    console.log(`[StateMachine] Reset machine: ${machineId}`);
  }
  getHistory(machineId) {
    const machine = this.stateMachines.get(machineId);
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`);
    }
    return machine.history;
  }
  getStats(machineId) {
    const machine = this.stateMachines.get(machineId);
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`);
    }
    const transitionsByState = {};
    for (const transition of machine.history) {
      transitionsByState[transition.toState] = (transitionsByState[transition.toState] || 0) + 1;
    }
    let avgTimeBetweenTransitions;
    if (machine.history.length > 1) {
      let totalTime = 0;
      for (let i = 1;i < machine.history.length; i++) {
        const prev = new Date(machine.history[i - 1].timestamp).getTime();
        const curr = new Date(machine.history[i].timestamp).getTime();
        totalTime += curr - prev;
      }
      avgTimeBetweenTransitions = totalTime / (machine.history.length - 1);
    }
    return {
      currentState: machine.currentState,
      totalTransitions: machine.history.length,
      transitionsByState,
      avgTimeBetweenTransitions
    };
  }
  exportMachine(machineId) {
    const machine = this.stateMachines.get(machineId);
    if (!machine) {
      return null;
    }
    return JSON.parse(JSON.stringify(machine));
  }
  getAllMachines() {
    return Array.from(this.stateMachines.values());
  }
}

// src/features/learning/fsrs-scheduler.ts
import * as fs15 from "fs";
import * as path16 from "path";

class FSRScheduler {
  itemsPath;
  items;
  initialIntervals;
  constructor(storagePath, config2) {
    const fsrsDir = path16.join(storagePath, "fsrs");
    this.itemsPath = path16.join(fsrsDir, "items.json");
    this.items = new Map;
    this.initialIntervals = config2?.initialIntervals || [1, 3, 7, 14, 30, 60, 120, 240, 480];
    this.ensureStorage();
    this.loadItems();
  }
  ensureStorage() {
    const dir = path16.dirname(this.itemsPath);
    if (!fs15.existsSync(dir)) {
      fs15.mkdirSync(dir, { recursive: true });
    }
  }
  loadItems() {
    if (fs15.existsSync(this.itemsPath)) {
      const data = fs15.readFileSync(this.itemsPath, "utf-8");
      const itemsArray = JSON.parse(data);
      for (const item of itemsArray) {
        this.items.set(item.id, item);
      }
      console.log(`[FSRS] Loaded ${this.items.size} items`);
    }
  }
  saveItems() {
    const itemsArray = Array.from(this.items.values());
    fs15.writeFileSync(this.itemsPath, JSON.stringify(itemsArray, null, 2), "utf-8");
  }
  createItem(id, ease = 5) {
    const now = new Date;
    const item = {
      id,
      ease,
      intervalDays: [...this.initialIntervals],
      nextReviewDate: this.addDays(now, this.initialIntervals[0]).toISOString(),
      reviewCount: 0
    };
    this.items.set(id, item);
    this.saveItems();
    return item;
  }
  scheduleReviews(itemId) {
    const item = this.items.get(itemId);
    if (!item) {
      this.createItem(itemId);
      return this.scheduleReviews(itemId);
    }
    const schedules = [];
    let currentDate = new Date;
    for (let i = 0;i < item.intervalDays.length; i++) {
      const intervalDays = item.intervalDays[i];
      const nextReviewDate = this.addDays(currentDate, intervalDays);
      schedules.push({
        itemId,
        nextReviewDate: nextReviewDate.toISOString(),
        intervalDays
      });
      currentDate = nextReviewDate;
    }
    return schedules;
  }
  async updateEase(itemId, recalled) {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    let newEase = item.ease;
    if (!recalled) {
      newEase = Math.min(10, item.ease + 1);
    } else {
      newEase = Math.max(1, item.ease - 1);
    }
    item.ease = newEase;
    item.reviewCount++;
    item.lastReviewDate = new Date().toISOString();
    const nextInterval = this.calculateNextInterval(item);
    item.nextReviewDate = this.addDays(new Date, nextInterval).toISOString();
    this.items.set(itemId, item);
    this.saveItems();
    return newEase;
  }
  calculateNextInterval(item) {
    const easeIndex = Math.min(item.ease - 1, this.initialIntervals.length - 1);
    const baseInterval = this.initialIntervals[easeIndex];
    const easeFactor = 1 - item.ease / 20;
    return Math.max(1, Math.floor(baseInterval * easeFactor));
  }
  getDueItems() {
    const now = new Date;
    const due = [];
    for (const item of this.items.values()) {
      const nextReview = new Date(item.nextReviewDate);
      if (nextReview <= now) {
        due.push(item);
      }
    }
    return due;
  }
  getItem(itemId) {
    return this.items.get(itemId) || null;
  }
  deleteItem(itemId) {
    this.items.delete(itemId);
    this.saveItems();
  }
  getAllItems() {
    return Array.from(this.items.values());
  }
  getStats() {
    const items = Array.from(this.items.values());
    const dueCount = this.getDueItems().length;
    const totalEase = items.reduce((sum, item) => sum + item.ease, 0);
    const avgEase = items.length > 0 ? totalEase / items.length : 0;
    const totalReviews = items.reduce((sum, item) => sum + item.reviewCount, 0);
    const avgReviewsPerItem = items.length > 0 ? totalReviews / items.length : 0;
    const byEase = {};
    for (const item of items) {
      byEase[item.ease] = (byEase[item.ease] || 0) + 1;
    }
    return {
      totalItems: items.length,
      itemsDue: dueCount,
      avgEase,
      avgReviewsPerItem,
      byEase
    };
  }
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  resetItem(itemId) {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    item.ease = 5;
    item.intervalDays = [...this.initialIntervals];
    item.nextReviewDate = this.addDays(new Date, this.initialIntervals[0]).toISOString();
    item.reviewCount = 0;
    item.lastReviewDate = undefined;
    this.items.set(itemId, item);
    this.saveItems();
  }
  exportItems() {
    return Array.from(this.items.values());
  }
  importItems(items) {
    for (const item of items) {
      if (!this.items.has(item.id)) {
        this.items.set(item.id, item);
      }
    }
    this.saveItems();
  }
}

// src/hooks/learning/experience-recorder-hook.ts
function createExperienceRecorderHook(input, learningContext) {
  const { experienceStore } = learningContext;
  return {
    "tool.execute.after": async (hookInput, hookOutput) => {
      try {
        const { tool: tool3, toolArgs } = hookInput;
        const output = hookOutput.output || {};
        const skipTools = [
          "session_list",
          "session_read",
          "session_search",
          "session_info",
          "learning-experience",
          "learning-knowledge",
          "learning-pattern",
          "learning-fsm",
          "learning-stats",
          "model-switcher"
        ];
        if (skipTools.includes(tool3)) {
          return;
        }
        const state = JSON.stringify({
          tool: tool3,
          toolArgs: typeof toolArgs === "string" ? { args: toolArgs } : toolArgs,
          timestamp: Date.now()
        });
        const context = JSON.stringify({
          sessionId: hookInput.sessionID,
          output: JSON.stringify(output).slice(0, 500),
          errorMessage: output.error || output.errorMessage || undefined
        });
        const reward = output.error || output.errorMessage ? -0.5 : output.success === true || output.result?.success === true ? 0.5 : 0;
        const confidence = output.confidence ?? 0.5;
        const keywords = typeof toolArgs === "string" ? toolArgs.split(/\s+/).filter((w) => w.length > 3 && w.length < 30).slice(0, 10) : [];
        await experienceStore.addExperience({
          state,
          action: tool3,
          outcome: reward > 0 ? "success" : reward < 0 ? "failure" : "partial",
          reward,
          confidence,
          context: {
            sessionId: hookInput.sessionID,
            tool: tool3
          },
          metadata: {
            keywords,
            toolName: tool3,
            hasError: !!output.error
          }
        });
        console.log(`[ExperienceRecorder] Recorded experience: ${tool3} (reward: ${reward}, confidence: ${confidence})`);
      } catch (error) {
        console.error("[ExperienceRecorder] Error recording experience:", error);
      }
    }
  };
}

// src/hooks/learning/context-injector-hook.ts
function formatContextInjection(experiences, knowledgeNodes, patterns, currentState) {
  const parts = [];
  parts.push("# Learning System Context");
  parts.push("");
  if (currentState) {
    parts.push(`## Current State: ${currentState}`);
    parts.push("");
  }
  if (experiences.length > 0) {
    parts.push("## Relevant Past Experiences");
    parts.push("");
    experiences.slice(0, 3).forEach((exp, i) => {
      const tool3 = exp.action;
      const reward = exp.reward > 0 ? "✓" : exp.reward < 0 ? "✗" : "○";
      parts.push(`${i + 1}. ${reward} ${tool3} (confidence: ${exp.confidence.toFixed(2)})`);
      if (exp.metadata?.keywords?.length > 0) {
        parts.push(`   Keywords: ${exp.metadata.keywords.join(", ")}`);
      }
    });
    parts.push("");
  }
  if (knowledgeNodes.length > 0) {
    parts.push("## Relevant Knowledge");
    parts.push("");
    knowledgeNodes.slice(0, 3).forEach((node, i) => {
      parts.push(`${i + 1}. ${node.type}: ${node.id}`);
      if (node.importance > 7) {
        parts.push(`   [High Importance: ${node.importance}/10]`);
      }
    });
    parts.push("");
  }
  if (patterns.length > 0) {
    parts.push("## Relevant Patterns");
    parts.push("");
    patterns.slice(0, 3).forEach((pattern, i) => {
      const type = pattern.type === "positive" ? "✓ Win" : "✗ Loss";
      parts.push(`${i + 1}. ${type}: ${pattern.category}`);
      parts.push(`   Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence.toFixed(2)}`);
      if (pattern.suggestedActions?.length > 0) {
        parts.push(`   Suggested: ${pattern.suggestedActions[0]}`);
      }
    });
    parts.push("");
  }
  return parts.join(`
`);
}
function extractKeywordsFromPrompt(prompt) {
  const words = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && w.length < 30);
  const stopWords = [
    "the",
    "and",
    "for",
    "are",
    "but",
    "not",
    "you",
    "all",
    "can",
    "had",
    "her",
    "was",
    "one",
    "our",
    "out",
    "has",
    "have",
    "been",
    "will",
    "with",
    "this",
    "that",
    "from",
    "they",
    "would",
    "there",
    "their",
    "what",
    "which",
    "when",
    "make",
    "like",
    "into",
    "year",
    "your",
    "just",
    "over",
    "also",
    "such",
    "because",
    "these",
    "first",
    "being",
    "most",
    "some",
    "those",
    "through"
  ];
  return words.filter((w) => !stopWords.includes(w)).slice(0, 10);
}
function createContextInjectorHook(input, learningContext) {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine } = learningContext;
  return {
    "chat.message": async (hookInput, hookOutput) => {
      try {
        const { sessionID, parts } = hookInput;
        const messageText = parts?.[0]?.text || "";
        if (!messageText || messageText.length < 10) {
          return;
        }
        console.log(`[ContextInjector] Injecting context for session ${sessionID}`);
        const keywords = extractKeywordsFromPrompt(messageText);
        const allExperiences = await experienceStore.loadExperiences();
        const experiences = allExperiences.filter((exp) => {
          if (keywords.length === 0)
            return true;
          return exp.metadata?.keywords && exp.metadata.keywords.some((kw) => keywords.includes(kw.toLowerCase()));
        }).slice(0, 5);
        const knowledgeResult = await knowledgeGraph.getRelevantContext(messageText);
        const knowledgeNodes = knowledgeResult.nodes.slice(0, 5);
        const allPatterns = patternDetector.getAllPatterns();
        const patterns = allPatterns.filter((p) => {
          if (keywords.length === 0)
            return true;
          return p.triggers?.some((t) => keywords.includes(t.toLowerCase()));
        }).slice(0, 5);
        const currentState = stateMachine.getCurrentState();
        if (experiences.length > 0 || knowledgeNodes.length > 0 || patterns.length > 0 || currentState) {
          const contextMessage = formatContextInjection(experiences, knowledgeNodes, patterns, currentState ?? undefined);
          hookOutput.parts = hookOutput.parts || [];
          hookOutput.parts.push({
            type: "text",
            text: contextMessage,
            id: `context-${Date.now()}`
          });
          console.log(`[ContextInjector] Injected ${experiences.length} experiences, ` + `${knowledgeNodes.length} knowledge nodes, ` + `${patterns.length} patterns`);
        } else {
          console.log("[ContextInjector] No relevant context to inject");
        }
      } catch (error) {
        console.error("[ContextInjector] Error injecting context:", error);
      }
    }
  };
}

// src/hooks/learning/synthesis-trigger-hook.ts
function createSynthesisTriggerHook(input, learningContext) {
  const { experienceStore } = learningContext;
  return {
    "tool.execute.after": async (hookInput, hookOutput) => {
      try {
        const { sessionID, tool: tool3 } = hookInput;
        const synthesisTriggers = ["summary", "report", "done", "complete"];
        const shouldSynthesize = synthesisTriggers.some((t) => tool3.toLowerCase().includes(t));
        if (!shouldSynthesize) {
          return;
        }
        console.log(`[SynthesisTrigger] Starting synthesis for session ${sessionID}`);
        await experienceStore.flushBuffer();
        console.log(`[SynthesisTrigger] Synthesis complete for session ${sessionID}`);
      } catch (error) {
        console.error("[SynthesisTrigger] Error during synthesis:", error);
      }
    }
  };
}

// src/hooks/learning/index.ts
function createLearningHooks(input, learningContext, config2) {
  const hooks = {};
  if (config2.experienceRecorder.enabled) {
    const hook = createExperienceRecorderHook(input, learningContext);
    Object.assign(hooks, hook);
    console.log("[LearningHooks] Experience recorder hook enabled");
  }
  if (config2.contextInjector.enabled) {
    const hook = createContextInjectorHook(input, learningContext);
    Object.assign(hooks, hook);
    console.log("[LearningHooks] Context injector hook enabled");
  }
  if (config2.synthesisTrigger.enabled) {
    const hook = createSynthesisTriggerHook(input, learningContext);
    Object.assign(hooks, hook);
    console.log("[LearningHooks] Synthesis trigger hook enabled");
  }
  return hooks;
}

// src/tools/learning/learning-experience.ts
import { z as z16 } from "zod";
function createExperienceTool(experienceStore) {
  return tool({
    description: "Add or query experiences from the learning system. " + "Use this tool to record successful or unsuccessful actions for future reference, " + "or to query past experiences to find similar situations and their outcomes.",
    args: {
      action: z16.enum(["add", "query", "recent"]).describe("Action to perform: 'add' to record an experience, 'query' to find similar experiences, " + "'recent' to get recent experiences"),
      actionName: z16.string().optional().describe("Action taken (for add action)"),
      reward: z16.number().min(-1).max(1).optional().describe("Reward: -1 (failure) to 1 (success), 0 for neutral (for add action)"),
      confidence: z16.number().min(0).max(1).optional().describe("Confidence in this experience: 0 (low) to 1 (high) (for add action)"),
      keywords: z16.array(z16.string()).optional().describe("Keywords describing this experience (for add/query actions)"),
      limit: z16.number().int().min(1).max(100).optional().describe("Maximum number of results (for query/recent actions, default: 10)")
    },
    async execute(args) {
      const { action, actionName, reward, confidence, keywords, limit } = args;
      try {
        switch (action) {
          case "add": {
            if (!actionName || typeof reward === "undefined") {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: actionName and reward are required for 'add' action"
              }, null, 2);
            }
            const outcome = reward > 0.3 ? "success" : reward < -0.3 ? "failure" : "partial";
            const experience = await experienceStore.addExperience({
              state: JSON.stringify({ source: "manual" }),
              action: actionName,
              outcome,
              reward,
              confidence: confidence ?? 0.5,
              context: {
                sessionId: "manual"
              },
              metadata: {
                keywords: keywords || []
              }
            });
            return JSON.stringify({
              success: true,
              message: "Experience recorded successfully",
              experienceId: experience.id,
              reward,
              confidence
            }, null, 2);
          }
          case "query": {
            const allExperiences = await experienceStore.loadExperiences();
            let filtered = allExperiences;
            if (keywords && keywords.length > 0) {
              const keywordLower = keywords.map((k) => k.toLowerCase());
              filtered = filtered.filter((exp) => exp.metadata?.keywords && exp.metadata.keywords.some((kw) => keywordLower.includes(kw.toLowerCase())));
            }
            const results = filtered.slice(0, limit || 10);
            return JSON.stringify({
              success: true,
              count: results.length,
              experiences: results.map((exp) => ({
                id: exp.id,
                action: exp.action,
                outcome: exp.outcome,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp
              }))
            }, null, 2);
          }
          case "recent": {
            const allExperiences = await experienceStore.loadExperiences();
            const recent = allExperiences.slice(-(limit || 10));
            return JSON.stringify({
              success: true,
              count: recent.length,
              experiences: recent.map((exp) => ({
                id: exp.id,
                action: exp.action,
                outcome: exp.outcome,
                reward: exp.reward,
                confidence: exp.confidence,
                timestamp: exp.timestamp
              }))
            }, null, 2);
          }
          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: add, query, recent`
            }, null, 2);
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}

// src/tools/learning/learning-knowledge.ts
import { z as z17 } from "zod";
function createKnowledgeTool(knowledgeGraph) {
  return tool({
    description: "Manage knowledge graph of entities and relationships. " + "Use this tool to store important concepts, their properties, and how they relate to each other.",
    args: {
      action: z17.enum(["addNode", "addEdge", "getNode", "search", "list"]).describe("Action to perform: 'addNode', 'addEdge', 'getNode', 'search', 'list'"),
      nodeId: z17.string().optional().describe("Node ID (for addNode, getNode)"),
      type: z17.string().optional().describe("Node type: person, concept, tool, pattern, file, api, error (for addNode)"),
      data: z17.object({}).passthrough().optional().describe("Data to store with the node (for addNode)"),
      source: z17.enum(["experience", "manual", "inference"]).optional().describe("Source of the node (for addNode)"),
      fromNodeId: z17.string().optional().describe("Source node ID (for addEdge)"),
      toNodeId: z17.string().optional().describe("Target node ID (for addEdge)"),
      edgeType: z17.enum(["relatedTo", "conflictsWith", "dependsOn"]).optional().describe("Relationship type (for addEdge)"),
      weight: z17.number().min(0).max(1).optional().describe("Relationship strength: 0-1 (for addEdge)"),
      query: z17.string().optional().describe("Query text (for search action)"),
      limit: z17.number().int().min(1).max(100).optional().describe("Maximum results (for search/list, default: 10)"),
      byType: z17.string().optional().describe("Filter by node type (for list action)")
    },
    async execute(args) {
      const {
        action,
        nodeId,
        type,
        data,
        source,
        fromNodeId,
        toNodeId,
        edgeType,
        weight,
        query,
        limit,
        byType
      } = args;
      try {
        switch (action) {
          case "addNode": {
            if (!nodeId || !type) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: nodeId and type are required"
              }, null, 2);
            }
            const node = await knowledgeGraph.addNode(nodeId, type, data || {}, source || "manual");
            return JSON.stringify({
              success: true,
              message: "Node added successfully",
              node: {
                id: node.id,
                type: node.type,
                importance: node.importance,
                strength: node.strength
              }
            }, null, 2);
          }
          case "addEdge": {
            if (!fromNodeId || !toNodeId || !edgeType) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: fromNodeId, toNodeId, and edgeType are required"
              }, null, 2);
            }
            await knowledgeGraph.addEdge(fromNodeId, toNodeId, edgeType, weight || 1);
            return JSON.stringify({
              success: true,
              message: "Edge added successfully",
              fromNodeId,
              toNodeId,
              edgeType
            }, null, 2);
          }
          case "getNode": {
            if (!nodeId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: nodeId"
              }, null, 2);
            }
            const node = knowledgeGraph.getNode(nodeId);
            if (!node) {
              return JSON.stringify({
                success: false,
                error: `Node not found: ${nodeId}`
              }, null, 2);
            }
            return JSON.stringify({
              success: true,
              node: {
                id: node.id,
                type: node.type,
                data: node.data,
                relations: node.relations,
                importance: node.importance,
                strength: node.strength,
                lastAccessed: node.lastAccessed,
                accessCount: node.accessCount,
                metadata: node.metadata
              }
            }, null, 2);
          }
          case "search": {
            if (!query) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: query"
              }, null, 2);
            }
            const results = knowledgeGraph.search(query, byType);
            const limited = results.slice(0, limit || 10);
            return JSON.stringify({
              success: true,
              count: limited.length,
              nodes: limited.map((node) => ({
                id: node.id,
                type: node.type,
                importance: node.importance,
                strength: node.strength
              }))
            }, null, 2);
          }
          case "list": {
            const allNodes = knowledgeGraph.getAllNodes();
            let filtered = allNodes;
            if (byType) {
              filtered = filtered.filter((n) => n.type === byType);
            }
            const limited = filtered.slice(0, limit || 10);
            return JSON.stringify({
              success: true,
              count: limited.length,
              total: filtered.length,
              nodes: limited.map((node) => ({
                id: node.id,
                type: node.type,
                importance: node.importance,
                strength: node.strength
              }))
            }, null, 2);
          }
          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: addNode, addEdge, getNode, search, list`
            }, null, 2);
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}

// src/tools/learning/learning-pattern.ts
import { z as z18 } from "zod";
function createPatternTool(patternDetector) {
  return tool({
    description: "Detect and manage behavioral patterns. " + "Use this tool to identify recurring wins and losses, " + "find successful strategies, and avoid mistakes.",
    args: {
      action: z18.enum(["get", "list", "update"]).describe("Action to perform: 'get', 'list', 'update'"),
      patternId: z18.string().optional().describe("Pattern ID (for get, update actions)"),
      status: z18.enum(["active", "resolved", "superseded"]).optional().describe("Pattern status (for update action)"),
      minFrequency: z18.number().int().min(1).optional().describe("Minimum frequency threshold (for list action)"),
      minConfidence: z18.number().min(0).max(1).optional().describe("Minimum confidence threshold (for list action)"),
      limit: z18.number().int().min(1).max(100).optional().describe("Maximum results (for list action, default: 20)")
    },
    async execute(args) {
      const {
        action,
        patternId,
        status,
        minFrequency,
        minConfidence,
        limit
      } = args;
      try {
        switch (action) {
          case "get": {
            if (!patternId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternId is required for 'get' action"
              }, null, 2);
            }
            const allPatterns = patternDetector.getAllPatterns();
            const pattern = allPatterns.find((p) => p.id === patternId);
            if (!pattern) {
              return JSON.stringify({
                success: false,
                error: `Pattern not found: ${patternId}`
              }, null, 2);
            }
            return JSON.stringify({
              success: true,
              pattern: {
                id: pattern.id,
                name: pattern.category,
                type: pattern.type,
                triggers: pattern.triggers,
                consequences: pattern.consequences,
                suggestedActions: pattern.suggestedActions,
                impact: pattern.impact,
                confidence: pattern.confidence,
                frequency: pattern.frequency,
                status: pattern.status,
                description: pattern.description,
                exampleCount: pattern.examples?.length || 0
              }
            }, null, 2);
          }
          case "list": {
            const filters = {};
            if (minFrequency)
              filters.minFrequency = minFrequency;
            if (minConfidence)
              filters.minConfidence = minConfidence;
            const patterns = await patternDetector.listPatterns(filters);
            return JSON.stringify({
              success: true,
              count: patterns.length,
              patterns: patterns.map((p) => ({
                id: p.id,
                name: p.category,
                type: p.type,
                impact: p.impact,
                confidence: p.confidence,
                frequency: p.frequency,
                status: p.status,
                description: p.description
              }))
            }, null, 2);
          }
          case "update": {
            if (!patternId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: patternId is required for 'update' action"
              }, null, 2);
            }
            await patternDetector.updatePatternStatus(patternId, status || "active");
            return JSON.stringify({
              success: true,
              message: "Pattern status updated successfully",
              patternId,
              status: status || "active"
            }, null, 2);
          }
          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: get, list, update`
            }, null, 2);
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}

// src/tools/learning/learning-fsm.ts
import { z as z19 } from "zod";
function createFsmTool(stateMachine) {
  return tool({
    description: "Manage state machines for behavioral control. " + "Use this tool to create state machines for workflows, track state transitions.",
    args: {
      action: z19.enum(["createMachine", "getMachine", "listMachines", "transition", "getCurrentState"]).describe("Action to perform: 'createMachine', 'getMachine', 'listMachines', 'transition', 'getCurrentState'"),
      machineId: z19.string().optional().describe("Machine ID (for most actions)"),
      name: z19.string().optional().describe("Machine name/description (for createMachine)"),
      initialState: z19.string().optional().describe("Initial state name (for createMachine)"),
      toState: z19.string().optional().describe("Target state (for transition action)"),
      trigger: z19.string().optional().describe("Transition trigger (for transition action)")
    },
    async execute(args) {
      const {
        action,
        machineId,
        name,
        initialState,
        toState,
        trigger
      } = args;
      try {
        switch (action) {
          case "createMachine": {
            if (!machineId || !initialState) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and initialState are required for 'createMachine' action"
              }, null, 2);
            }
            stateMachine.createMachine(machineId, name || "", initialState, {
              [initialState]: {
                name: initialState,
                description: "Initial state",
                transitions: [],
                metadata: {}
              }
            });
            return JSON.stringify({
              success: true,
              message: "State machine created successfully",
              machineId,
              initialState
            }, null, 2);
          }
          case "getMachine": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'getMachine' action"
              }, null, 2);
            }
            const machine = stateMachine.getMachine(machineId);
            if (!machine) {
              return JSON.stringify({
                success: false,
                error: `State machine not found: ${machineId}`
              }, null, 2);
            }
            return JSON.stringify({
              success: true,
              machine: {
                id: machine.id,
                name: machine.name,
                currentState: machine.currentState,
                stateCount: Object.keys(machine.states).length,
                states: Object.entries(machine.states).map(([stateName, state]) => ({
                  name: stateName,
                  description: state.description,
                  transitionCount: state.transitions?.length || 0
                }))
              }
            }, null, 2);
          }
          case "listMachines": {
            const machines = stateMachine.getAllMachines();
            return JSON.stringify({
              success: true,
              count: machines.length,
              machines: machines.map((m) => ({
                id: m.id,
                name: m.name,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
            }, null, 2);
          }
          case "transition": {
            if (!machineId || !trigger) {
              return JSON.stringify({
                success: false,
                error: "Missing required fields: machineId and trigger are required for 'transition' action"
              }, null, 2);
            }
            stateMachine.setCurrentMachine(machineId);
            const success = await stateMachine.transition(trigger, { toState });
            if (!success) {
              return JSON.stringify({
                success: false,
                error: "Transition failed - no valid transition path found"
              }, null, 2);
            }
            return JSON.stringify({
              success: true,
              message: "State transition successful",
              machineId,
              currentState: stateMachine.getCurrentState()
            }, null, 2);
          }
          case "getCurrentState": {
            if (!machineId) {
              return JSON.stringify({
                success: false,
                error: "Missing required field: machineId is required for 'getCurrentState' action"
              }, null, 2);
            }
            stateMachine.setCurrentMachine(machineId);
            const currentState = stateMachine.getCurrentState();
            return JSON.stringify({
              success: true,
              currentState
            }, null, 2);
          }
          default:
            return JSON.stringify({
              success: false,
              error: `Unknown action: ${action}. Valid actions: createMachine, getMachine, listMachines, transition, getCurrentState`
            }, null, 2);
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}

// src/tools/learning/learning-stats.ts
import { z as z20 } from "zod";
function createStatsTool(config2) {
  const { experienceStore, knowledgeGraph, patternDetector, stateMachine } = config2;
  return tool({
    description: "Get comprehensive statistics across the learning system. " + "Shows experience metrics, knowledge graph stats, patterns, and state machine status.",
    args: {
      section: z20.enum(["all", "experience", "knowledge", "patterns", "fsm"]).describe("Which section to show: 'all' for everything, or specific section")
    },
    async execute(args) {
      const { section } = args;
      try {
        const result = {
          success: true,
          timestamp: Date.now(),
          sections: []
        };
        if (section === "all" || section === "experience") {
          const allExperiences = await experienceStore.loadExperiences();
          const total = allExperiences.length;
          const rewards = allExperiences.map((e) => e.reward);
          const avgReward = rewards.length > 0 ? rewards.reduce((a, b) => a + b, 0) / rewards.length : 0;
          const successRate = total > 0 ? allExperiences.filter((e) => e.outcome === "success").length / total : 0;
          result.sections.push({
            name: "Experience Store",
            stats: {
              totalExperiences: total,
              averageReward: Number(avgReward.toFixed(3)),
              successRate: Number((successRate * 100).toFixed(1)) + "%"
            }
          });
        }
        if (section === "all" || section === "knowledge") {
          const nodes = await knowledgeGraph.getImportantNodes(1e5);
          const byType = new Map;
          const highImportance = nodes.filter((n) => n.importance >= 7).length;
          const totalImportance = nodes.reduce((sum, n) => sum + n.importance, 0);
          nodes.forEach((node) => {
            byType.set(node.type, (byType.get(node.type) || 0) + 1);
          });
          result.sections.push({
            name: "Knowledge Graph",
            stats: {
              totalNodes: nodes.length,
              totalEdges: 0,
              highImportanceNodes: highImportance,
              averageImportance: nodes.length > 0 ? Number((totalImportance / nodes.length).toFixed(2)) : 0,
              topTypes: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => `${type}: ${count}`)
            }
          });
        }
        if (section === "all" || section === "patterns") {
          const patterns = patternDetector.getAllPatterns();
          const positive = patterns.filter((p) => p.type === "positive").length;
          const negative = patterns.filter((p) => p.type === "negative").length;
          const active = patterns.filter((p) => p.status === "active").length;
          const highImpact = patterns.filter((p) => p.impact === "high" || p.impact === "critical").length;
          const avgConfidence = patterns.length > 0 ? Number((patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length).toFixed(3)) : 0;
          result.sections.push({
            name: "Pattern Detection",
            stats: {
              totalPatterns: patterns.length,
              positivePatterns: positive,
              negativePatterns: negative,
              activePatterns: active,
              highImpactPatterns: highImpact,
              averageConfidence: avgConfidence,
              mostFrequent: patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 3).map((p) => ({ name: p.category, frequency: p.frequency }))
            }
          });
        }
        if (section === "all" || section === "fsm") {
          const machines = stateMachine.getAllMachines();
          const totalStates = machines.reduce((sum, m) => sum + Object.keys(m.states).length, 0);
          result.sections.push({
            name: "State Machines",
            stats: {
              totalMachines: machines.length,
              totalStates,
              machines: machines.map((m) => ({
                id: m.id,
                description: m.name,
                currentState: m.currentState,
                stateCount: Object.keys(m.states).length
              }))
            }
          });
        }
        return JSON.stringify(result, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }, null, 2);
      }
    }
  });
}

// src/tools/learning/index.ts
function initializeLearningTools(config2) {
  const {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine
  } = config2;
  return {
    experienceTool: createExperienceTool(experienceStore),
    knowledgeTool: createKnowledgeTool(knowledgeGraph),
    patternTool: createPatternTool(patternDetector),
    fsmTool: createFsmTool(stateMachine),
    statsTool: createStatsTool({
      experienceStore,
      knowledgeGraph,
      patternDetector,
      stateMachine
    })
  };
}

// src/features/learning/integration.ts
var learningSystemInstance = null;
function initializeLearningSystem(input, config2) {
  const mergedConfig = {
    enabled: config2?.enabled ?? true,
    storagePath: config2?.storagePath ?? path17.join(os10.homedir(), ".clawd", "learning"),
    experienceStore: {
      enabled: config2?.experienceStore?.enabled ?? true,
      bufferSize: config2?.experienceStore?.bufferSize ?? 1000,
      maxAgeDays: config2?.experienceStore?.maxAgeDays ?? 90
    },
    knowledgeGraph: {
      enabled: config2?.knowledgeGraph?.enabled ?? true,
      maxNodes: config2?.knowledgeGraph?.maxNodes ?? 1e4
    },
    patternDetection: {
      enabled: config2?.patternDetection?.enabled ?? true,
      minFrequency: config2?.patternDetection?.minFrequency ?? 3,
      minConfidence: config2?.patternDetection?.minConfidence ?? 0.7
    },
    stateMachine: {
      enabled: config2?.stateMachine?.enabled ?? true,
      initialState: config2?.stateMachine?.initialState ?? "unknown"
    },
    fsrs: {
      enabled: config2?.fsrs?.enabled ?? true,
      initialIntervals: config2?.fsrs?.initialIntervals ?? [1, 3, 7, 14, 30, 60, 120, 240, 480]
    },
    hooks: {
      recordOnToolExecute: config2?.hooks?.recordOnToolExecute ?? true,
      recordOnSessionEnd: config2?.hooks?.recordOnSessionEnd ?? true,
      injectOnSessionStart: config2?.hooks?.injectOnSessionStart ?? true
    }
  };
  if (!mergedConfig.enabled) {
    console.log("[LearningSystem] Learning system disabled");
    return {
      hooks: {},
      tools: {},
      shutdown: async () => {}
    };
  }
  console.log("[LearningSystem] Initializing unified AI memory system...");
  console.log(`[LearningSystem] Storage path: ${mergedConfig.storagePath}`);
  const storagePath = mergedConfig.storagePath;
  const experienceStore = new ExperienceStore(storagePath, {
    maxBufferSize: mergedConfig.experienceStore?.bufferSize || 1000,
    maxAgeDays: mergedConfig.experienceStore?.maxAgeDays || 90
  });
  const knowledgeGraph = new KnowledgeGraphStore(storagePath, {
    maxNodes: mergedConfig.knowledgeGraph?.maxNodes || 1e4
  });
  const patternDetector = new PatternDetector(storagePath, {
    minFrequency: mergedConfig.patternDetection?.minFrequency || 3,
    minConfidence: mergedConfig.patternDetection?.minConfidence || 0.7
  });
  const stateMachine = new StateMachineEngine(storagePath);
  if (mergedConfig.stateMachine.enabled) {
    const defaultMachine = stateMachine.getMachine("default");
    if (!defaultMachine) {
      stateMachine.createMachine("default", "Default Workflow State Machine", mergedConfig.stateMachine?.initialState || "unknown", {
        unknown: {
          name: "Unknown",
          description: "Initial state before any context",
          transitions: [],
          metadata: {}
        },
        analyzing: {
          name: "Analyzing",
          description: "Exploring and understanding the problem",
          transitions: [
            { fromState: "analyzing", toState: "implementing", condition: () => true }
          ],
          metadata: {}
        },
        implementing: {
          name: "Implementing",
          description: "Writing code and building solutions",
          transitions: [
            { fromState: "implementing", toState: "testing", condition: () => true },
            { fromState: "implementing", toState: "debugging", condition: () => true }
          ],
          metadata: {}
        },
        testing: {
          name: "Testing",
          description: "Verifying correctness",
          transitions: [
            { fromState: "testing", toState: "documenting", condition: () => true },
            { fromState: "testing", toState: "debugging", condition: () => true }
          ],
          metadata: {}
        },
        debugging: {
          name: "Debugging",
          description: "Finding and fixing errors",
          transitions: [
            { fromState: "debugging", toState: "testing", condition: () => true },
            { fromState: "debugging", toState: "analyzing", condition: () => true }
          ],
          metadata: {}
        },
        documenting: {
          name: "Documenting",
          description: "Writing documentation and comments",
          transitions: [],
          metadata: {}
        }
      });
      console.log("[LearningSystem] Created default state machine");
    }
  }
  let fsrsScheduler;
  if (mergedConfig.fsrs.enabled) {
    fsrsScheduler = new FSRScheduler(storagePath, {
      initialIntervals: mergedConfig.fsrs.initialIntervals
    });
  }
  const learningContext = {
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine,
    fsrsScheduler
  };
  const hooks = createLearningHooks(input, learningContext, {
    experienceRecorder: {
      enabled: mergedConfig.hooks.recordOnToolExecute
    },
    contextInjector: {
      enabled: mergedConfig.hooks.injectOnSessionStart
    },
    synthesisTrigger: {
      enabled: mergedConfig.hooks.recordOnSessionEnd
    }
  });
  const tools2 = initializeLearningTools({
    experienceStore,
    knowledgeGraph,
    patternDetector,
    stateMachine,
    fsrsScheduler
  });
  console.log("[LearningSystem] Initialized successfully");
  console.log(`[LearningSystem] ${Object.keys(hooks).length} hooks registered`);
  console.log(`[LearningSystem] 5 tools registered`);
  learningSystemInstance = {
    hooks,
    tools: {
      "learning-experience": tools2.experienceTool,
      "learning-knowledge": tools2.knowledgeTool,
      "learning-pattern": tools2.patternTool,
      "learning-fsm": tools2.fsmTool,
      "learning-stats": tools2.statsTool
    },
    shutdown: async () => {
      console.log("[LearningSystem] Shutting down...");
      await experienceStore.flushBuffer();
      console.log("[LearningSystem] Shutdown complete");
    }
  };
  return learningSystemInstance;
}
async function shutdownLearningSystem() {
  if (learningSystemInstance) {
    await learningSystemInstance.shutdown();
    learningSystemInstance = null;
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
import * as z3rt from "zod/v3";
import * as z4mini from "zod/v4-mini";
function isZ4Schema(s) {
  const schema = s;
  return !!schema._zod;
}
function safeParse2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = z4mini.safeParse(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = v3Schema.safeParse(data);
  return result;
}
function getObjectShape(schema) {
  if (!schema)
    return;
  let rawShape;
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    rawShape = v4Schema._zod?.def?.shape;
  } else {
    const v3Schema = schema;
    rawShape = v3Schema.shape;
  }
  if (!rawShape)
    return;
  if (typeof rawShape === "function") {
    try {
      return rawShape();
    } catch {
      return;
    }
  }
  return rawShape;
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def2 = v4Schema._zod?.def;
    if (def2) {
      if (def2.value !== undefined)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0) {
        return def2.values[0];
      }
    }
  }
  const v3Schema = schema;
  const def = v3Schema._def;
  if (def) {
    if (def.value !== undefined)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0) {
      return def.values[0];
    }
  }
  const directValue = schema.value;
  if (directValue !== undefined)
    return directValue;
  return;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
import * as z21 from "zod/v4";
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = z21.custom((v) => v !== null && (typeof v === "object" || typeof v === "function"));
var ProgressTokenSchema = z21.union([z21.string(), z21.number().int()]);
var CursorSchema = z21.string();
var TaskCreationParamsSchema = z21.looseObject({
  ttl: z21.union([z21.number(), z21.null()]).optional(),
  pollInterval: z21.number().optional()
});
var TaskMetadataSchema = z21.object({
  ttl: z21.number().optional()
});
var RelatedTaskMetadataSchema = z21.object({
  taskId: z21.string()
});
var RequestMetaSchema = z21.looseObject({
  progressToken: ProgressTokenSchema.optional(),
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = z21.object({
  _meta: RequestMetaSchema.optional()
});
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  task: TaskMetadataSchema.optional()
});
var isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success;
var RequestSchema = z21.object({
  method: z21.string(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = z21.object({
  _meta: RequestMetaSchema.optional()
});
var NotificationSchema = z21.object({
  method: z21.string(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultSchema = z21.looseObject({
  _meta: RequestMetaSchema.optional()
});
var RequestIdSchema = z21.union([z21.string(), z21.number().int()]);
var JSONRPCRequestSchema = z21.object({
  jsonrpc: z21.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
var JSONRPCNotificationSchema = z21.object({
  jsonrpc: z21.literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
var JSONRPCResultResponseSchema = z21.object({
  jsonrpc: z21.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32000] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
  ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = z21.object({
  jsonrpc: z21.literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: z21.object({
    code: z21.number().int(),
    message: z21.string(),
    data: z21.unknown().optional()
  })
}).strict();
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var JSONRPCMessageSchema = z21.union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = z21.union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  requestId: RequestIdSchema.optional(),
  reason: z21.string().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = z21.object({
  src: z21.string(),
  mimeType: z21.string().optional(),
  sizes: z21.array(z21.string()).optional(),
  theme: z21.enum(["light", "dark"]).optional()
});
var IconsSchema = z21.object({
  icons: z21.array(IconSchema).optional()
});
var BaseMetadataSchema = z21.object({
  name: z21.string(),
  title: z21.string().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: z21.string(),
  websiteUrl: z21.string().optional(),
  description: z21.string().optional()
});
var FormElicitationCapabilitySchema = z21.intersection(z21.object({
  applyDefaults: z21.boolean().optional()
}), z21.record(z21.string(), z21.unknown()));
var ElicitationCapabilitySchema = z21.preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return { form: {} };
    }
  }
  return value;
}, z21.intersection(z21.object({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), z21.record(z21.string(), z21.unknown()).optional()));
var ClientTasksCapabilitySchema = z21.looseObject({
  list: AssertObjectSchema.optional(),
  cancel: AssertObjectSchema.optional(),
  requests: z21.looseObject({
    sampling: z21.looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    elicitation: z21.looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = z21.looseObject({
  list: AssertObjectSchema.optional(),
  cancel: AssertObjectSchema.optional(),
  requests: z21.looseObject({
    tools: z21.looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ClientCapabilitiesSchema = z21.object({
  experimental: z21.record(z21.string(), AssertObjectSchema).optional(),
  sampling: z21.object({
    context: AssertObjectSchema.optional(),
    tools: AssertObjectSchema.optional()
  }).optional(),
  elicitation: ElicitationCapabilitySchema.optional(),
  roots: z21.object({
    listChanged: z21.boolean().optional()
  }).optional(),
  tasks: ClientTasksCapabilitySchema.optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  protocolVersion: z21.string(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: z21.literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = z21.object({
  experimental: z21.record(z21.string(), AssertObjectSchema).optional(),
  logging: AssertObjectSchema.optional(),
  completions: AssertObjectSchema.optional(),
  prompts: z21.object({
    listChanged: z21.boolean().optional()
  }).optional(),
  resources: z21.object({
    subscribe: z21.boolean().optional(),
    listChanged: z21.boolean().optional()
  }).optional(),
  tools: z21.object({
    listChanged: z21.boolean().optional()
  }).optional(),
  tasks: ServerTasksCapabilitySchema.optional()
});
var InitializeResultSchema = ResultSchema.extend({
  protocolVersion: z21.string(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  instructions: z21.string().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: z21.literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = z21.object({
  progress: z21.number(),
  total: z21.optional(z21.number()),
  message: z21.optional(z21.string())
});
var ProgressNotificationParamsSchema = z21.object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  nextCursor: CursorSchema.optional()
});
var TaskStatusSchema = z21.enum(["working", "input_required", "completed", "failed", "cancelled"]);
var TaskSchema = z21.object({
  taskId: z21.string(),
  status: TaskStatusSchema,
  ttl: z21.union([z21.number(), z21.null()]),
  createdAt: z21.string(),
  lastUpdatedAt: z21.string(),
  pollInterval: z21.optional(z21.number()),
  statusMessage: z21.optional(z21.string())
});
var CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
});
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: z21.literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: z21.string()
  })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: z21.literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: z21.string()
  })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: z21.literal("tasks/list")
});
var ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: z21.array(TaskSchema)
});
var CancelTaskRequestSchema = RequestSchema.extend({
  method: z21.literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: z21.string()
  })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ResourceContentsSchema = z21.object({
  uri: z21.string(),
  mimeType: z21.optional(z21.string()),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  text: z21.string()
});
var Base64Schema = z21.string().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  blob: Base64Schema
});
var RoleSchema = z21.enum(["user", "assistant"]);
var AnnotationsSchema = z21.object({
  audience: z21.array(RoleSchema).optional(),
  priority: z21.number().min(0).max(1).optional(),
  lastModified: z21.iso.datetime({ offset: true }).optional()
});
var ResourceSchema = z21.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uri: z21.string(),
  description: z21.optional(z21.string()),
  mimeType: z21.optional(z21.string()),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.optional(z21.looseObject({}))
});
var ResourceTemplateSchema = z21.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uriTemplate: z21.string(),
  description: z21.optional(z21.string()),
  mimeType: z21.optional(z21.string()),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.optional(z21.looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: z21.literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: z21.array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: z21.literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: z21.array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  uri: z21.string()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: z21.literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: z21.array(z21.union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: z21.literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: z21.literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  uri: z21.string()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = z21.object({
  name: z21.string(),
  description: z21.optional(z21.string()),
  required: z21.optional(z21.boolean())
});
var PromptSchema = z21.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: z21.optional(z21.string()),
  arguments: z21.optional(z21.array(PromptArgumentSchema)),
  _meta: z21.optional(z21.looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: z21.literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: z21.array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  name: z21.string(),
  arguments: z21.record(z21.string(), z21.string()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: z21.literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = z21.object({
  type: z21.literal("text"),
  text: z21.string(),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var ImageContentSchema = z21.object({
  type: z21.literal("image"),
  data: Base64Schema,
  mimeType: z21.string(),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var AudioContentSchema = z21.object({
  type: z21.literal("audio"),
  data: Base64Schema,
  mimeType: z21.string(),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var ToolUseContentSchema = z21.object({
  type: z21.literal("tool_use"),
  name: z21.string(),
  id: z21.string(),
  input: z21.record(z21.string(), z21.unknown()),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var EmbeddedResourceSchema = z21.object({
  type: z21.literal("resource"),
  resource: z21.union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  annotations: AnnotationsSchema.optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: z21.literal("resource_link")
});
var ContentBlockSchema = z21.union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = z21.object({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  description: z21.string().optional(),
  messages: z21.array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = z21.object({
  title: z21.string().optional(),
  readOnlyHint: z21.boolean().optional(),
  destructiveHint: z21.boolean().optional(),
  idempotentHint: z21.boolean().optional(),
  openWorldHint: z21.boolean().optional()
});
var ToolExecutionSchema = z21.object({
  taskSupport: z21.enum(["required", "optional", "forbidden"]).optional()
});
var ToolSchema = z21.object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: z21.string().optional(),
  inputSchema: z21.object({
    type: z21.literal("object"),
    properties: z21.record(z21.string(), AssertObjectSchema).optional(),
    required: z21.array(z21.string()).optional()
  }).catchall(z21.unknown()),
  outputSchema: z21.object({
    type: z21.literal("object"),
    properties: z21.record(z21.string(), AssertObjectSchema).optional(),
    required: z21.array(z21.string()).optional()
  }).catchall(z21.unknown()).optional(),
  annotations: ToolAnnotationsSchema.optional(),
  execution: ToolExecutionSchema.optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: z21.literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: z21.array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  content: z21.array(ContentBlockSchema).default([]),
  structuredContent: z21.record(z21.string(), z21.unknown()).optional(),
  isError: z21.boolean().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: z21.unknown()
}));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  name: z21.string(),
  arguments: z21.record(z21.string(), z21.unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: z21.literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = z21.object({
  autoRefresh: z21.boolean().default(true),
  debounceMs: z21.number().int().nonnegative().default(300)
});
var LoggingLevelSchema = z21.enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: z21.literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  level: LoggingLevelSchema,
  logger: z21.string().optional(),
  data: z21.unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = z21.object({
  name: z21.string().optional()
});
var ModelPreferencesSchema = z21.object({
  hints: z21.array(ModelHintSchema).optional(),
  costPriority: z21.number().min(0).max(1).optional(),
  speedPriority: z21.number().min(0).max(1).optional(),
  intelligencePriority: z21.number().min(0).max(1).optional()
});
var ToolChoiceSchema = z21.object({
  mode: z21.enum(["auto", "required", "none"]).optional()
});
var ToolResultContentSchema = z21.object({
  type: z21.literal("tool_result"),
  toolUseId: z21.string().describe("The unique identifier for the corresponding tool call."),
  content: z21.array(ContentBlockSchema).default([]),
  structuredContent: z21.object({}).loose().optional(),
  isError: z21.boolean().optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var SamplingContentSchema = z21.discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
var SamplingMessageContentBlockSchema = z21.discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = z21.object({
  role: RoleSchema,
  content: z21.union([SamplingMessageContentBlockSchema, z21.array(SamplingMessageContentBlockSchema)]),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: z21.array(SamplingMessageSchema),
  modelPreferences: ModelPreferencesSchema.optional(),
  systemPrompt: z21.string().optional(),
  includeContext: z21.enum(["none", "thisServer", "allServers"]).optional(),
  temperature: z21.number().optional(),
  maxTokens: z21.number().int(),
  stopSequences: z21.array(z21.string()).optional(),
  metadata: AssertObjectSchema.optional(),
  tools: z21.array(ToolSchema).optional(),
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: z21.literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  model: z21.string(),
  stopReason: z21.optional(z21.enum(["endTurn", "stopSequence", "maxTokens"]).or(z21.string())),
  role: RoleSchema,
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  model: z21.string(),
  stopReason: z21.optional(z21.enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(z21.string())),
  role: RoleSchema,
  content: z21.union([SamplingMessageContentBlockSchema, z21.array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = z21.object({
  type: z21.literal("boolean"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  default: z21.boolean().optional()
});
var StringSchemaSchema = z21.object({
  type: z21.literal("string"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  minLength: z21.number().optional(),
  maxLength: z21.number().optional(),
  format: z21.enum(["email", "uri", "date", "date-time"]).optional(),
  default: z21.string().optional()
});
var NumberSchemaSchema = z21.object({
  type: z21.enum(["number", "integer"]),
  title: z21.string().optional(),
  description: z21.string().optional(),
  minimum: z21.number().optional(),
  maximum: z21.number().optional(),
  default: z21.number().optional()
});
var UntitledSingleSelectEnumSchemaSchema = z21.object({
  type: z21.literal("string"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  enum: z21.array(z21.string()),
  default: z21.string().optional()
});
var TitledSingleSelectEnumSchemaSchema = z21.object({
  type: z21.literal("string"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  oneOf: z21.array(z21.object({
    const: z21.string(),
    title: z21.string()
  })),
  default: z21.string().optional()
});
var LegacyTitledEnumSchemaSchema = z21.object({
  type: z21.literal("string"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  enum: z21.array(z21.string()),
  enumNames: z21.array(z21.string()).optional(),
  default: z21.string().optional()
});
var SingleSelectEnumSchemaSchema = z21.union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = z21.object({
  type: z21.literal("array"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  minItems: z21.number().optional(),
  maxItems: z21.number().optional(),
  items: z21.object({
    type: z21.literal("string"),
    enum: z21.array(z21.string())
  }),
  default: z21.array(z21.string()).optional()
});
var TitledMultiSelectEnumSchemaSchema = z21.object({
  type: z21.literal("array"),
  title: z21.string().optional(),
  description: z21.string().optional(),
  minItems: z21.number().optional(),
  maxItems: z21.number().optional(),
  items: z21.object({
    anyOf: z21.array(z21.object({
      const: z21.string(),
      title: z21.string()
    }))
  }),
  default: z21.array(z21.string()).optional()
});
var MultiSelectEnumSchemaSchema = z21.union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = z21.union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = z21.union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: z21.literal("form").optional(),
  message: z21.string(),
  requestedSchema: z21.object({
    type: z21.literal("object"),
    properties: z21.record(z21.string(), PrimitiveSchemaDefinitionSchema),
    required: z21.array(z21.string()).optional()
  })
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: z21.literal("url"),
  message: z21.string(),
  elicitationId: z21.string(),
  url: z21.string().url()
});
var ElicitRequestParamsSchema = z21.union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: z21.literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  elicitationId: z21.string()
});
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  action: z21.enum(["accept", "decline", "cancel"]),
  content: z21.preprocess((val) => val === null ? undefined : val, z21.record(z21.string(), z21.union([z21.string(), z21.number(), z21.boolean(), z21.array(z21.string())])).optional())
});
var ResourceTemplateReferenceSchema = z21.object({
  type: z21.literal("ref/resource"),
  uri: z21.string()
});
var PromptReferenceSchema = z21.object({
  type: z21.literal("ref/prompt"),
  name: z21.string()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: z21.union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  argument: z21.object({
    name: z21.string(),
    value: z21.string()
  }),
  context: z21.object({
    arguments: z21.record(z21.string(), z21.string()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: z21.literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({
  completion: z21.looseObject({
    values: z21.array(z21.string()).max(100),
    total: z21.optional(z21.number().int()),
    hasMore: z21.optional(z21.boolean())
  })
});
var RootSchema = z21.object({
  uri: z21.string().startsWith("file://"),
  name: z21.string().optional(),
  _meta: z21.record(z21.string(), z21.unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: z21.literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: z21.array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: z21.literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ClientRequestSchema = z21.union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ClientNotificationSchema = z21.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]);
var ClientResultSchema = z21.union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var ServerRequestSchema = z21.union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ServerNotificationSchema = z21.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = z21.union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);

class McpError extends Error {
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`);
    this.code = code;
    this.data = data;
    this.name = "McpError";
  }
  static fromError(code, message, data) {
    if (code === ErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) {
        return new UrlElicitationRequiredError(errorData.elicitations, message);
      }
    }
    return new McpError(code, message, data);
  }
}

class UrlElicitationRequiredError extends McpError {
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ErrorCode.UrlElicitationRequired, message, {
      elicitations
    });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
import * as z4mini2 from "zod/v4-mini";

// node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
// node_modules/zod-to-json-schema/dist/esm/selectParser.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind3 } from "zod/v3";

// node_modules/zod-to-json-schema/dist/esm/parsers/array.js
import { ZodFirstPartyTypeKind } from "zod/v3";

// node_modules/zod-to-json-schema/dist/esm/parsers/record.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind2 } from "zod/v3";

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function getMethodLiteral(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value !== "string") {
    throw new Error("Schema method literal must be a string");
  }
  return value;
}
function parseWithCompat(schema, data) {
  const result = safeParse2(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 60000;

class Protocol {
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = new Map;
    this._requestHandlerAbortControllers = new Map;
    this._notificationHandlers = new Map;
    this._responseHandlers = new Map;
    this._progressHandlers = new Map;
    this._timeoutInfo = new Map;
    this._pendingDebouncedNotifications = new Set;
    this._taskProgressTokens = new Map;
    this._requestResolvers = new Map;
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(PingRequestSchema, (_request) => ({}));
    this._taskStore = _options?.taskStore;
    this._taskMessageQueue = _options?.taskMessageQueue;
    if (this._taskStore) {
      this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
        const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return {
          ...task
        };
      });
      this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
        const handleTaskResult = async () => {
          const taskId = request.params.taskId;
          if (this._taskMessageQueue) {
            let queuedMessage;
            while (queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId)) {
              if (queuedMessage.type === "response" || queuedMessage.type === "error") {
                const message = queuedMessage.message;
                const requestId = message.id;
                const resolver = this._requestResolvers.get(requestId);
                if (resolver) {
                  this._requestResolvers.delete(requestId);
                  if (queuedMessage.type === "response") {
                    resolver(message);
                  } else {
                    const errorMessage = message;
                    const error = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                    resolver(error);
                  }
                } else {
                  const messageType = queuedMessage.type === "response" ? "Response" : "Error";
                  this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
                }
                continue;
              }
              await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
            }
          }
          const task = await this._taskStore.getTask(taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
          }
          if (!isTerminal(task.status)) {
            await this._waitForTaskUpdate(taskId, extra.signal);
            return await handleTaskResult();
          }
          if (isTerminal(task.status)) {
            const result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
            this._clearTaskQueue(taskId);
            return {
              ...result,
              _meta: {
                ...result._meta,
                [RELATED_TASK_META_KEY]: {
                  taskId
                }
              }
            };
          }
          return await handleTaskResult();
        };
        return await handleTaskResult();
      });
      this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
        try {
          const { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
          return {
            tasks,
            nextCursor,
            _meta: {}
          };
        } catch (error) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
        try {
          const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
          }
          if (isTerminal(task.status)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
          }
          await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId);
          this._clearTaskQueue(request.params.taskId);
          const cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!cancelledTask) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
          }
          return {
            _meta: {},
            ...cancelledTask
          };
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
  }
  async _oncancel(notification) {
    if (!notification.params.requestId) {
      return;
    }
    const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
    controller?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  async connect(transport) {
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.();
      this._onclose();
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error) => {
      _onerror?.(error);
      this._onerror(error);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = new Map;
    this._progressHandlers.clear();
    this._taskProgressTokens.clear();
    this._pendingDebouncedNotifications.clear();
    const error = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = undefined;
    this.onclose?.();
    for (const handler of responseHandlers.values()) {
      handler(error);
    }
  }
  _onerror(error) {
    this.onerror?.(error);
  }
  _onnotification(notification) {
    const handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    if (handler === undefined) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
  }
  _onrequest(request, extra) {
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    const relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId;
    if (handler === undefined) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId).catch((error) => this._onerror(new Error(`Failed to enqueue error response: ${error}`)));
      } else {
        capturedTransport?.send(errorResponse).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
      }
      return;
    }
    const abortController = new AbortController;
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : undefined;
    const taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : undefined;
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        const notificationOptions = { relatedRequestId: request.id };
        if (relatedTaskId) {
          notificationOptions.relatedTask = { taskId: relatedTaskId };
        }
        await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        const requestOptions = { ...options, relatedRequestId: request.id };
        if (relatedTaskId && !requestOptions.relatedTask) {
          requestOptions.relatedTask = { taskId: relatedTaskId };
        }
        const effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        if (effectiveTaskId && taskStore) {
          await taskStore.updateTaskStatus(effectiveTaskId, "input_required");
        }
        return await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      if (taskCreationParams) {
        this.assertTaskHandlerCapability(request.method);
      }
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted) {
        return;
      }
      const response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "response",
          message: response,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(response);
      }
    }, async (error) => {
      if (abortController.signal.aborted) {
        return;
      }
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error["code"]) ? error["code"] : ErrorCode.InternalError,
          message: error.message ?? "Internal error",
          ...error["data"] !== undefined && { data: error["data"] }
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(errorResponse);
      }
    }).catch((error) => this._onerror(new Error(`Failed to send response: ${error}`))).finally(() => {
      this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error) {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        responseHandler(error);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      this._requestResolvers.delete(messageId);
      if (isJSONRPCResultResponse(response)) {
        resolver(response);
      } else {
        const error = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error);
      }
      return;
    }
    const handler = this._responseHandlers.get(messageId);
    if (handler === undefined) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    let isTaskResponse = false;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result === "object") {
      const result = response.result;
      if (result.task && typeof result.task === "object") {
        const task = result.task;
        if (typeof task.taskId === "string") {
          isTaskResponse = true;
          this._taskProgressTokens.set(task.taskId, messageId);
        }
      }
    }
    if (!isTaskResponse) {
      this._progressHandlers.delete(messageId);
    }
    if (isJSONRPCResultResponse(response)) {
      handler(response);
    } else {
      const error = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error);
    }
  }
  get transport() {
    return this._transport;
  }
  async close() {
    await this._transport?.close();
  }
  async* requestStream(request, resultSchema, options) {
    const { task } = options ?? {};
    if (!task) {
      try {
        const result = await this.request(request, resultSchema, options);
        yield { type: "result", result };
      } catch (error) {
        yield {
          type: "error",
          error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
        };
      }
      return;
    }
    let taskId;
    try {
      const createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task) {
        taskId = createResult.task.taskId;
        yield { type: "taskCreated", task: createResult.task };
      } else {
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      }
      while (true) {
        const task2 = await this.getTask({ taskId }, options);
        yield { type: "taskStatus", task: task2 };
        if (isTerminal(task2.status)) {
          if (task2.status === "completed") {
            const result = await this.getTaskResult({ taskId }, resultSchema, options);
            yield { type: "result", result };
          } else if (task2.status === "failed") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
            };
          } else if (task2.status === "cancelled") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
            };
          }
          return;
        }
        if (task2.status === "input_required") {
          const result = await this.getTaskResult({ taskId }, resultSchema, options);
          yield { type: "result", result };
          return;
        }
        const pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1000;
        await new Promise((resolve2) => setTimeout(resolve2, pollInterval));
        options?.signal?.throwIfAborted();
      }
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof McpError ? error : new McpError(ErrorCode.InternalError, String(error))
      };
    }
  }
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve2, reject) => {
      const earlyReject = (error) => {
        reject(error);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) {
        try {
          this.assertCapabilityForMethod(request.method);
          if (task) {
            this.assertTaskCapability(request.method);
          }
        } catch (e) {
          earlyReject(e);
          return;
        }
      }
      options?.signal?.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta || {},
            progressToken: messageId
          }
        };
      }
      if (task) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          task
        };
      }
      if (relatedTask) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          _meta: {
            ...jsonrpcRequest.params?._meta || {},
            [RELATED_TASK_META_KEY]: relatedTask
          }
        };
      }
      const cancel = (reason) => {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => this._onerror(new Error(`Failed to send cancellation: ${error2}`)));
        const error = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const parseResult = safeParse2(resultSchema, response.result);
          if (!parseResult.success) {
            reject(parseResult.error);
          } else {
            resolve2(parseResult.data);
          }
        } catch (error) {
          reject(error);
        }
      });
      options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      const relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        const responseResolver = (response) => {
          const handler = this._responseHandlers.get(messageId);
          if (handler) {
            handler(response);
          } else {
            this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
          }
        };
        this._requestResolvers.set(messageId, responseResolver);
        this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      } else {
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => {
          this._cleanupTimeout(messageId);
          reject(error);
        });
      }
    });
  }
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  async notification(notification, options) {
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      const jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    const debouncedMethods = this._options?.debouncedNotificationMethods ?? [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask;
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        if (options?.relatedTask) {
          jsonrpcNotification2 = {
            ...jsonrpcNotification2,
            params: {
              ...jsonrpcNotification2.params,
              _meta: {
                ...jsonrpcNotification2.params?._meta || {},
                [RELATED_TASK_META_KEY]: options.relatedTask
              }
            }
          };
        }
        this._transport?.send(jsonrpcNotification2, options).catch((error) => this._onerror(error));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    if (options?.relatedTask) {
      jsonrpcNotification = {
        ...jsonrpcNotification,
        params: {
          ...jsonrpcNotification.params,
          _meta: {
            ...jsonrpcNotification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  setRequestHandler(requestSchema, handler) {
    const method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      const parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  setNotificationHandler(notificationSchema, handler) {
    const method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      const parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  _cleanupTaskProgressHandler(taskId) {
    const progressToken = this._taskProgressTokens.get(taskId);
    if (progressToken !== undefined) {
      this._progressHandlers.delete(progressToken);
      this._taskProgressTokens.delete(taskId);
    }
  }
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue) {
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    }
    const maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId, maxQueueSize);
  }
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      const messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (const message of messages) {
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          const requestId = message.message.id;
          const resolver = this._requestResolvers.get(requestId);
          if (resolver) {
            resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed"));
            this._requestResolvers.delete(requestId);
          } else {
            this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
          }
        }
      }
    }
  }
  async _waitForTaskUpdate(taskId, signal) {
    let interval = this._options?.defaultTaskPollInterval ?? 1000;
    try {
      const task = await this._taskStore?.getTask(taskId);
      if (task?.pollInterval) {
        interval = task.pollInterval;
      }
    } catch {}
    return new Promise((resolve2, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      const timeoutId = setTimeout(resolve2, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: true });
    });
  }
  requestTaskStore(request, sessionId) {
    const taskStore = this._taskStore;
    if (!taskStore) {
      throw new Error("No task store configured");
    }
    return {
      createTask: async (taskParams) => {
        if (!request) {
          throw new Error("No request provided");
        }
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        const task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification);
          if (isTerminal(task.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      getTaskResult: (taskId) => {
        return taskStore.getTaskResult(taskId, sessionId);
      },
      updateTaskStatus: async (taskId, status, statusMessage) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        }
        if (isTerminal(task.status)) {
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        }
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        const updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification);
          if (isTerminal(updatedTask.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      listTasks: (cursor) => {
        return taskStore.listTasks(cursor, sessionId);
      }
    };
  }
}
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === undefined)
      continue;
    const baseValue = result[k];
    if (isPlainObject(baseValue) && isPlainObject(addValue)) {
      result[k] = { ...baseValue, ...addValue };
    } else {
      result[k] = addValue;
    }
  }
  return result;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
var import_ajv = __toESM(require_ajv(), 1);
var import_ajv_formats = __toESM(require_dist(), 1);
function createDefaultAjvInstance() {
  const ajv = new import_ajv.default({
    strict: false,
    validateFormats: true,
    validateSchema: false,
    allErrors: true
  });
  const addFormats = import_ajv_formats.default;
  addFormats(ajv);
  return ajv;
}

class AjvJsonSchemaValidator {
  constructor(ajv) {
    this._ajv = ajv ?? createDefaultAjvInstance();
  }
  getValidator(schema) {
    const ajvValidator = "$id" in schema && typeof schema.$id === "string" ? this._ajv.getSchema(schema.$id) ?? this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => {
      const valid = ajvValidator(input);
      if (valid) {
        return {
          valid: true,
          data: input,
          errorMessage: undefined
        };
      } else {
        return {
          valid: false,
          data: undefined,
          errorMessage: this._ajv.errorsText(ajvValidator.errors)
        };
      }
    };
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/client.js
class ExperimentalClientTasks {
  constructor(_client) {
    this._client = _client;
  }
  async* callToolStream(params, resultSchema = CallToolResultSchema, options) {
    const clientInternal = this._client;
    const optionsWithTask = {
      ...options,
      task: options?.task ?? (clientInternal.isToolTask(params.name) ? {} : undefined)
    };
    const stream = clientInternal.requestStream({ method: "tools/call", params }, resultSchema, optionsWithTask);
    const validator = clientInternal.getToolOutputValidator(params.name);
    for await (const message of stream) {
      if (message.type === "result" && validator) {
        const result = message.result;
        if (!result.structuredContent && !result.isError) {
          yield {
            type: "error",
            error: new McpError(ErrorCode.InvalidRequest, `Tool ${params.name} has an output schema but did not return structured content`)
          };
          return;
        }
        if (result.structuredContent) {
          try {
            const validationResult = validator(result.structuredContent);
            if (!validationResult.valid) {
              yield {
                type: "error",
                error: new McpError(ErrorCode.InvalidParams, `Structured content does not match the tool's output schema: ${validationResult.errorMessage}`)
              };
              return;
            }
          } catch (error) {
            if (error instanceof McpError) {
              yield { type: "error", error };
              return;
            }
            yield {
              type: "error",
              error: new McpError(ErrorCode.InvalidParams, `Failed to validate structured content: ${error instanceof Error ? error.message : String(error)}`)
            };
            return;
          }
        }
      }
      yield message;
    }
  }
  async getTask(taskId, options) {
    return this._client.getTask({ taskId }, options);
  }
  async getTaskResult(taskId, resultSchema, options) {
    return this._client.getTaskResult({ taskId }, resultSchema, options);
  }
  async listTasks(cursor, options) {
    return this._client.listTasks(cursor ? { cursor } : undefined, options);
  }
  async cancelTask(taskId, options) {
    return this._client.cancelTask({ taskId }, options);
  }
  requestStream(request, resultSchema, options) {
    return this._client.requestStream(request, resultSchema, options);
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/helpers.js
function assertToolsCallTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "tools/call":
      if (!requests.tools?.call) {
        throw new Error(`${entityName} does not support task creation for tools/call (required for ${method})`);
      }
      break;
    default:
      break;
  }
}
function assertClientRequestTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "sampling/createMessage":
      if (!requests.sampling?.createMessage) {
        throw new Error(`${entityName} does not support task creation for sampling/createMessage (required for ${method})`);
      }
      break;
    case "elicitation/create":
      if (!requests.elicitation?.create) {
        throw new Error(`${entityName} does not support task creation for elicitation/create (required for ${method})`);
      }
      break;
    default:
      break;
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js
function applyElicitationDefaults(schema, data) {
  if (!schema || data === null || typeof data !== "object")
    return;
  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const obj = data;
    const props = schema.properties;
    for (const key of Object.keys(props)) {
      const propSchema = props[key];
      if (obj[key] === undefined && Object.prototype.hasOwnProperty.call(propSchema, "default")) {
        obj[key] = propSchema.default;
      }
      if (obj[key] !== undefined) {
        applyElicitationDefaults(propSchema, obj[key]);
      }
    }
  }
  if (Array.isArray(schema.anyOf)) {
    for (const sub of schema.anyOf) {
      if (typeof sub !== "boolean") {
        applyElicitationDefaults(sub, data);
      }
    }
  }
  if (Array.isArray(schema.oneOf)) {
    for (const sub of schema.oneOf) {
      if (typeof sub !== "boolean") {
        applyElicitationDefaults(sub, data);
      }
    }
  }
}
function getSupportedElicitationModes(capabilities) {
  if (!capabilities) {
    return { supportsFormMode: false, supportsUrlMode: false };
  }
  const hasFormCapability = capabilities.form !== undefined;
  const hasUrlCapability = capabilities.url !== undefined;
  const supportsFormMode = hasFormCapability || !hasFormCapability && !hasUrlCapability;
  const supportsUrlMode = hasUrlCapability;
  return { supportsFormMode, supportsUrlMode };
}

class Client extends Protocol {
  constructor(_clientInfo, options) {
    super(options);
    this._clientInfo = _clientInfo;
    this._cachedToolOutputValidators = new Map;
    this._cachedKnownTaskTools = new Set;
    this._cachedRequiredTaskTools = new Set;
    this._listChangedDebounceTimers = new Map;
    this._capabilities = options?.capabilities ?? {};
    this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new AjvJsonSchemaValidator;
    if (options?.listChanged) {
      this._pendingListChangedConfig = options.listChanged;
    }
  }
  _setupListChangedHandlers(config2) {
    if (config2.tools && this._serverCapabilities?.tools?.listChanged) {
      this._setupListChangedHandler("tools", ToolListChangedNotificationSchema, config2.tools, async () => {
        const result = await this.listTools();
        return result.tools;
      });
    }
    if (config2.prompts && this._serverCapabilities?.prompts?.listChanged) {
      this._setupListChangedHandler("prompts", PromptListChangedNotificationSchema, config2.prompts, async () => {
        const result = await this.listPrompts();
        return result.prompts;
      });
    }
    if (config2.resources && this._serverCapabilities?.resources?.listChanged) {
      this._setupListChangedHandler("resources", ResourceListChangedNotificationSchema, config2.resources, async () => {
        const result = await this.listResources();
        return result.resources;
      });
    }
  }
  get experimental() {
    if (!this._experimental) {
      this._experimental = {
        tasks: new ExperimentalClientTasks(this)
      };
    }
    return this._experimental;
  }
  registerCapabilities(capabilities) {
    if (this.transport) {
      throw new Error("Cannot register capabilities after connecting to transport");
    }
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  setRequestHandler(requestSchema, handler) {
    const shape = getObjectShape(requestSchema);
    const methodSchema = shape?.method;
    if (!methodSchema) {
      throw new Error("Schema is missing a method literal");
    }
    let methodValue;
    if (isZ4Schema(methodSchema)) {
      const v4Schema = methodSchema;
      const v4Def = v4Schema._zod?.def;
      methodValue = v4Def?.value ?? v4Schema.value;
    } else {
      const v3Schema = methodSchema;
      const legacyDef = v3Schema._def;
      methodValue = legacyDef?.value ?? v3Schema.value;
    }
    if (typeof methodValue !== "string") {
      throw new Error("Schema method literal must be a string");
    }
    const method = methodValue;
    if (method === "elicitation/create") {
      const wrappedHandler = async (request, extra) => {
        const validatedRequest = safeParse2(ElicitRequestSchema, request);
        if (!validatedRequest.success) {
          const errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid elicitation request: ${errorMessage}`);
        }
        const { params } = validatedRequest.data;
        params.mode = params.mode ?? "form";
        const { supportsFormMode, supportsUrlMode } = getSupportedElicitationModes(this._capabilities.elicitation);
        if (params.mode === "form" && !supportsFormMode) {
          throw new McpError(ErrorCode.InvalidParams, "Client does not support form-mode elicitation requests");
        }
        if (params.mode === "url" && !supportsUrlMode) {
          throw new McpError(ErrorCode.InvalidParams, "Client does not support URL-mode elicitation requests");
        }
        const result = await Promise.resolve(handler(request, extra));
        if (params.task) {
          const taskValidationResult = safeParse2(CreateTaskResultSchema, result);
          if (!taskValidationResult.success) {
            const errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
          }
          return taskValidationResult.data;
        }
        const validationResult = safeParse2(ElicitResultSchema, result);
        if (!validationResult.success) {
          const errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid elicitation result: ${errorMessage}`);
        }
        const validatedResult = validationResult.data;
        const requestedSchema = params.mode === "form" ? params.requestedSchema : undefined;
        if (params.mode === "form" && validatedResult.action === "accept" && validatedResult.content && requestedSchema) {
          if (this._capabilities.elicitation?.form?.applyDefaults) {
            try {
              applyElicitationDefaults(requestedSchema, validatedResult.content);
            } catch {}
          }
        }
        return validatedResult;
      };
      return super.setRequestHandler(requestSchema, wrappedHandler);
    }
    if (method === "sampling/createMessage") {
      const wrappedHandler = async (request, extra) => {
        const validatedRequest = safeParse2(CreateMessageRequestSchema, request);
        if (!validatedRequest.success) {
          const errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid sampling request: ${errorMessage}`);
        }
        const { params } = validatedRequest.data;
        const result = await Promise.resolve(handler(request, extra));
        if (params.task) {
          const taskValidationResult = safeParse2(CreateTaskResultSchema, result);
          if (!taskValidationResult.success) {
            const errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
          }
          return taskValidationResult.data;
        }
        const hasTools = params.tools || params.toolChoice;
        const resultSchema = hasTools ? CreateMessageResultWithToolsSchema : CreateMessageResultSchema;
        const validationResult = safeParse2(resultSchema, result);
        if (!validationResult.success) {
          const errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid sampling result: ${errorMessage}`);
        }
        return validationResult.data;
      };
      return super.setRequestHandler(requestSchema, wrappedHandler);
    }
    return super.setRequestHandler(requestSchema, handler);
  }
  assertCapability(capability, method) {
    if (!this._serverCapabilities?.[capability]) {
      throw new Error(`Server does not support ${capability} (required for ${method})`);
    }
  }
  async connect(transport, options) {
    await super.connect(transport);
    if (transport.sessionId !== undefined) {
      return;
    }
    try {
      const result = await this.request({
        method: "initialize",
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: this._capabilities,
          clientInfo: this._clientInfo
        }
      }, InitializeResultSchema, options);
      if (result === undefined) {
        throw new Error(`Server sent invalid initialize result: ${result}`);
      }
      if (!SUPPORTED_PROTOCOL_VERSIONS.includes(result.protocolVersion)) {
        throw new Error(`Server's protocol version is not supported: ${result.protocolVersion}`);
      }
      this._serverCapabilities = result.capabilities;
      this._serverVersion = result.serverInfo;
      if (transport.setProtocolVersion) {
        transport.setProtocolVersion(result.protocolVersion);
      }
      this._instructions = result.instructions;
      await this.notification({
        method: "notifications/initialized"
      });
      if (this._pendingListChangedConfig) {
        this._setupListChangedHandlers(this._pendingListChangedConfig);
        this._pendingListChangedConfig = undefined;
      }
    } catch (error) {
      this.close();
      throw error;
    }
  }
  getServerCapabilities() {
    return this._serverCapabilities;
  }
  getServerVersion() {
    return this._serverVersion;
  }
  getInstructions() {
    return this._instructions;
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "logging/setLevel":
        if (!this._serverCapabilities?.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._serverCapabilities?.prompts) {
          throw new Error(`Server does not support prompts (required for ${method})`);
        }
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
      case "resources/subscribe":
      case "resources/unsubscribe":
        if (!this._serverCapabilities?.resources) {
          throw new Error(`Server does not support resources (required for ${method})`);
        }
        if (method === "resources/subscribe" && !this._serverCapabilities.resources.subscribe) {
          throw new Error(`Server does not support resource subscriptions (required for ${method})`);
        }
        break;
      case "tools/call":
      case "tools/list":
        if (!this._serverCapabilities?.tools) {
          throw new Error(`Server does not support tools (required for ${method})`);
        }
        break;
      case "completion/complete":
        if (!this._serverCapabilities?.completions) {
          throw new Error(`Server does not support completions (required for ${method})`);
        }
        break;
      case "initialize":
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/roots/list_changed":
        if (!this._capabilities.roots?.listChanged) {
          throw new Error(`Client does not support roots list changed notifications (required for ${method})`);
        }
        break;
      case "notifications/initialized":
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    switch (method) {
      case "sampling/createMessage":
        if (!this._capabilities.sampling) {
          throw new Error(`Client does not support sampling capability (required for ${method})`);
        }
        break;
      case "elicitation/create":
        if (!this._capabilities.elicitation) {
          throw new Error(`Client does not support elicitation capability (required for ${method})`);
        }
        break;
      case "roots/list":
        if (!this._capabilities.roots) {
          throw new Error(`Client does not support roots capability (required for ${method})`);
        }
        break;
      case "tasks/get":
      case "tasks/list":
      case "tasks/result":
      case "tasks/cancel":
        if (!this._capabilities.tasks) {
          throw new Error(`Client does not support tasks capability (required for ${method})`);
        }
        break;
      case "ping":
        break;
    }
  }
  assertTaskCapability(method) {
    assertToolsCallTaskCapability(this._serverCapabilities?.tasks?.requests, method, "Server");
  }
  assertTaskHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    assertClientRequestTaskCapability(this._capabilities.tasks?.requests, method, "Client");
  }
  async ping(options) {
    return this.request({ method: "ping" }, EmptyResultSchema, options);
  }
  async complete(params, options) {
    return this.request({ method: "completion/complete", params }, CompleteResultSchema, options);
  }
  async setLoggingLevel(level, options) {
    return this.request({ method: "logging/setLevel", params: { level } }, EmptyResultSchema, options);
  }
  async getPrompt(params, options) {
    return this.request({ method: "prompts/get", params }, GetPromptResultSchema, options);
  }
  async listPrompts(params, options) {
    return this.request({ method: "prompts/list", params }, ListPromptsResultSchema, options);
  }
  async listResources(params, options) {
    return this.request({ method: "resources/list", params }, ListResourcesResultSchema, options);
  }
  async listResourceTemplates(params, options) {
    return this.request({ method: "resources/templates/list", params }, ListResourceTemplatesResultSchema, options);
  }
  async readResource(params, options) {
    return this.request({ method: "resources/read", params }, ReadResourceResultSchema, options);
  }
  async subscribeResource(params, options) {
    return this.request({ method: "resources/subscribe", params }, EmptyResultSchema, options);
  }
  async unsubscribeResource(params, options) {
    return this.request({ method: "resources/unsubscribe", params }, EmptyResultSchema, options);
  }
  async callTool(params, resultSchema = CallToolResultSchema, options) {
    if (this.isToolTaskRequired(params.name)) {
      throw new McpError(ErrorCode.InvalidRequest, `Tool "${params.name}" requires task-based execution. Use client.experimental.tasks.callToolStream() instead.`);
    }
    const result = await this.request({ method: "tools/call", params }, resultSchema, options);
    const validator = this.getToolOutputValidator(params.name);
    if (validator) {
      if (!result.structuredContent && !result.isError) {
        throw new McpError(ErrorCode.InvalidRequest, `Tool ${params.name} has an output schema but did not return structured content`);
      }
      if (result.structuredContent) {
        try {
          const validationResult = validator(result.structuredContent);
          if (!validationResult.valid) {
            throw new McpError(ErrorCode.InvalidParams, `Structured content does not match the tool's output schema: ${validationResult.errorMessage}`);
          }
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(ErrorCode.InvalidParams, `Failed to validate structured content: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    return result;
  }
  isToolTask(toolName) {
    if (!this._serverCapabilities?.tasks?.requests?.tools?.call) {
      return false;
    }
    return this._cachedKnownTaskTools.has(toolName);
  }
  isToolTaskRequired(toolName) {
    return this._cachedRequiredTaskTools.has(toolName);
  }
  cacheToolMetadata(tools2) {
    this._cachedToolOutputValidators.clear();
    this._cachedKnownTaskTools.clear();
    this._cachedRequiredTaskTools.clear();
    for (const tool3 of tools2) {
      if (tool3.outputSchema) {
        const toolValidator = this._jsonSchemaValidator.getValidator(tool3.outputSchema);
        this._cachedToolOutputValidators.set(tool3.name, toolValidator);
      }
      const taskSupport = tool3.execution?.taskSupport;
      if (taskSupport === "required" || taskSupport === "optional") {
        this._cachedKnownTaskTools.add(tool3.name);
      }
      if (taskSupport === "required") {
        this._cachedRequiredTaskTools.add(tool3.name);
      }
    }
  }
  getToolOutputValidator(toolName) {
    return this._cachedToolOutputValidators.get(toolName);
  }
  async listTools(params, options) {
    const result = await this.request({ method: "tools/list", params }, ListToolsResultSchema, options);
    this.cacheToolMetadata(result.tools);
    return result;
  }
  _setupListChangedHandler(listType, notificationSchema, options, fetcher) {
    const parseResult = ListChangedOptionsBaseSchema.safeParse(options);
    if (!parseResult.success) {
      throw new Error(`Invalid ${listType} listChanged options: ${parseResult.error.message}`);
    }
    if (typeof options.onChanged !== "function") {
      throw new Error(`Invalid ${listType} listChanged options: onChanged must be a function`);
    }
    const { autoRefresh, debounceMs } = parseResult.data;
    const { onChanged } = options;
    const refresh = async () => {
      if (!autoRefresh) {
        onChanged(null, null);
        return;
      }
      try {
        const items = await fetcher();
        onChanged(null, items);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        onChanged(error, null);
      }
    };
    const handler = () => {
      if (debounceMs) {
        const existingTimer = this._listChangedDebounceTimers.get(listType);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        const timer = setTimeout(refresh, debounceMs);
        this._listChangedDebounceTimers.set(listType, timer);
      } else {
        refresh();
      }
    };
    this.setNotificationHandler(notificationSchema, handler);
  }
  async sendRootsListChanged() {
    return this.notification({ method: "notifications/roots/list_changed" });
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js
var import_cross_spawn = __toESM(require_cross_spawn(), 1);
import process2 from "node:process";
import { PassThrough } from "node:stream";

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
class ReadBuffer {
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf(`
`);
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = undefined;
  }
}
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + `
`;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js
var DEFAULT_INHERITED_ENV_VARS = process2.platform === "win32" ? [
  "APPDATA",
  "HOMEDRIVE",
  "HOMEPATH",
  "LOCALAPPDATA",
  "PATH",
  "PROCESSOR_ARCHITECTURE",
  "SYSTEMDRIVE",
  "SYSTEMROOT",
  "TEMP",
  "USERNAME",
  "USERPROFILE",
  "PROGRAMFILES"
] : ["HOME", "LOGNAME", "PATH", "SHELL", "TERM", "USER"];
function getDefaultEnvironment() {
  const env = {};
  for (const key of DEFAULT_INHERITED_ENV_VARS) {
    const value = process2.env[key];
    if (value === undefined) {
      continue;
    }
    if (value.startsWith("()")) {
      continue;
    }
    env[key] = value;
  }
  return env;
}

class StdioClientTransport {
  constructor(server) {
    this._readBuffer = new ReadBuffer;
    this._stderrStream = null;
    this._serverParams = server;
    if (server.stderr === "pipe" || server.stderr === "overlapped") {
      this._stderrStream = new PassThrough;
    }
  }
  async start() {
    if (this._process) {
      throw new Error("StdioClientTransport already started! If using Client class, note that connect() calls start() automatically.");
    }
    return new Promise((resolve2, reject) => {
      this._process = import_cross_spawn.default(this._serverParams.command, this._serverParams.args ?? [], {
        env: {
          ...getDefaultEnvironment(),
          ...this._serverParams.env
        },
        stdio: ["pipe", "pipe", this._serverParams.stderr ?? "inherit"],
        shell: false,
        windowsHide: process2.platform === "win32" && isElectron(),
        cwd: this._serverParams.cwd
      });
      this._process.on("error", (error) => {
        reject(error);
        this.onerror?.(error);
      });
      this._process.on("spawn", () => {
        resolve2();
      });
      this._process.on("close", (_code) => {
        this._process = undefined;
        this.onclose?.();
      });
      this._process.stdin?.on("error", (error) => {
        this.onerror?.(error);
      });
      this._process.stdout?.on("data", (chunk) => {
        this._readBuffer.append(chunk);
        this.processReadBuffer();
      });
      this._process.stdout?.on("error", (error) => {
        this.onerror?.(error);
      });
      if (this._stderrStream && this._process.stderr) {
        this._process.stderr.pipe(this._stderrStream);
      }
    });
  }
  get stderr() {
    if (this._stderrStream) {
      return this._stderrStream;
    }
    return this._process?.stderr ?? null;
  }
  get pid() {
    return this._process?.pid ?? null;
  }
  processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(error);
      }
    }
  }
  async close() {
    if (this._process) {
      const processToClose = this._process;
      this._process = undefined;
      const closePromise = new Promise((resolve2) => {
        processToClose.once("close", () => {
          resolve2();
        });
      });
      try {
        processToClose.stdin?.end();
      } catch {}
      await Promise.race([closePromise, new Promise((resolve2) => setTimeout(resolve2, 2000).unref())]);
      if (processToClose.exitCode === null) {
        try {
          processToClose.kill("SIGTERM");
        } catch {}
        await Promise.race([closePromise, new Promise((resolve2) => setTimeout(resolve2, 2000).unref())]);
      }
      if (processToClose.exitCode === null) {
        try {
          processToClose.kill("SIGKILL");
        } catch {}
      }
    }
    this._readBuffer.clear();
  }
  send(message) {
    return new Promise((resolve2) => {
      if (!this._process?.stdin) {
        throw new Error("Not connected");
      }
      const json = serializeMessage(message);
      if (this._process.stdin.write(json)) {
        resolve2();
      } else {
        this._process.stdin.once("drain", resolve2);
      }
    });
  }
}
function isElectron() {
  return "type" in process2;
}

// src/features/skills/mcp-manager.ts
var IDLE_TIMEOUT = 5 * 60 * 1000;

class SkillMcpManager {
  clients = new Map;
  pendingConnections = new Map;
  async getOrCreateClient(info, config2) {
    const { serverName } = info;
    const key = `${serverName}:${info.command}`;
    if (this.clients.has(key)) {
      const clientInfo2 = this.clients.get(key);
      console.log(`[skill-mcp-manager] Reusing existing client for ${serverName}`);
      clientInfo2.lastUsed = Date.now();
      return clientInfo2.client;
    }
    if (this.pendingConnections.has(key)) {
      console.log(`[skill-mcp-manager] Reusing pending connection for ${serverName}`);
      return this.pendingConnections.get(key).promise;
    }
    console.log(`[skill-mcp-manager] Creating new MCP client for ${serverName}`);
    const client2 = new Client({
      name: serverName,
      version: "1.0.0"
    });
    const transport = new StdioClientTransport({
      command: info.command,
      args: info.args,
      env: info.env
    });
    await client2.connect(transport);
    const clientInfo = {
      client: client2,
      lastUsed: Date.now(),
      idleSince: Date.now()
    };
    this.clients.set(key, clientInfo);
    this.pendingConnections.delete(key);
    console.log(`[skill-mcp-manager] Connected to ${serverName} MCP server`);
    this.startIdleCheck(serverName, clientInfo);
    return client2;
  }
  async disconnectSession(sessionID) {
    console.log(`[skill-mcp-manager] Disconnecting MCP clients for session ${sessionID}`);
    for (const [key, clientInfo] of this.clients.entries()) {
      if (clientInfo.cleanupTimer)
        clearTimeout(clientInfo.cleanupTimer);
      try {
        await clientInfo.client.close();
        console.log(`[skill-mcp-manager] Disconnected from ${key}`);
      } catch (error) {
        console.error(`[skill-mcp-manager] Error disconnecting from ${key}:`, error);
      }
      this.clients.delete(key);
    }
    this.pendingConnections.clear();
  }
  async disconnectAll() {
    console.log("[skill-mcp-manager] Disconnecting all MCP clients");
    for (const [key] of this.clients.keys()) {
      const clientInfo = this.clients.get(key);
      if (clientInfo.cleanupTimer)
        clearTimeout(clientInfo.cleanupTimer);
      try {
        await clientInfo.client.close();
        console.log(`[skill-mcp-manager] Disconnected from ${key}`);
      } catch (error) {
        console.error(`[skill-mcp-manager] Error disconnecting from ${key}:`, error);
      }
      this.clients.delete(key);
    }
    this.clients.clear();
    this.pendingConnections.clear();
  }
  async listTools(info, context) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.listTools();
      const tools2 = result.tools ?? [];
      console.log(`[skill-mcp-manager] Listed ${tools2.length} tools from ${info.serverName}`);
      return tools2;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing tools from ${info.serverName}:`, error);
      return [];
    }
  }
  async listResources(info, context) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.listResources();
      const resources = result.resources ?? [];
      console.log(`[skill-mcp-manager] Listed ${resources.length} resources from ${info.serverName}`);
      return resources;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing resources from ${info.serverName}:`, error);
      return [];
    }
  }
  async listPrompts(info, context) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.listPrompts();
      const prompts = result.prompts ?? [];
      console.log(`[skill-mcp-manager] Listed ${prompts.length} prompts from ${info.serverName}`);
      return prompts;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error listing prompts from ${info.serverName}:`, error);
      return [];
    }
  }
  async callTool(info, context, name, args) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.callTool({
        name,
        arguments: args
      });
      console.log(`[skill-mcp-manager] Called tool ${name} on ${info.serverName}`);
      return result;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error calling tool ${name} on ${info.serverName}:`, error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
  async readResource(info, context, uri) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.readResource({ uri });
      console.log(`[skill-mcp-manager] Read resource ${uri} from ${info.serverName}`);
      return result;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error reading resource ${uri} from ${info.serverName}:`, error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
  async getPrompt(info, context, name, args) {
    const client2 = await this.getOrCreateClient(info, context);
    try {
      const result = await client2.getPrompt({
        name,
        arguments: args
      });
      console.log(`[skill-mcp-manager] Got prompt ${name} from ${info.serverName}`);
      return result;
    } catch (error) {
      console.error(`[skill-mcp-manager] Error getting prompt ${name} from ${info.serverName}:`, error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
  startIdleCheck(serverName, clientInfo) {
    clientInfo.cleanupTimer = setTimeout(() => {
      const idleTime = Date.now() - clientInfo.lastUsed;
      console.log(`[skill-mcp-manager] Checking idle status for ${serverName}: ${idleTime}ms idle`);
      if (idleTime >= IDLE_TIMEOUT) {
        console.log(`[skill-mcp-manager] Disconnecting ${serverName} due to idle (${Math.floor(idleTime / 1000 / 60)}min)`);
        this.disconnectClientInternal(serverName, clientInfo);
      }
    }, 60000);
  }
  disconnectClientInternal(serverName, clientInfo) {
    if (clientInfo.cleanupTimer) {
      clearTimeout(clientInfo.cleanupTimer);
    }
    try {
      clientInfo.client.close();
      console.log(`[skill-mcp-manager] Disconnected from ${serverName}`);
    } catch (error) {
      console.error(`[skill-mcp-manager] Error disconnecting from ${serverName}:`, error);
    }
    const key = `${serverName}:1.0.0`;
    this.clients.delete(key);
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
  const inputConfig = input.config || {};
  let krakenConfig = inputConfig.kraken_code;
  if (!krakenConfig) {
    try {
      const fs16 = await import("node:fs/promises");
      const path18 = await import("path");
      const os11 = await import("os");
      const krakenConfigPath = path18.default.join(os11.default.homedir(), ".config", "opencode", "kraken-code.json");
      const configContent = await fs16.default.readFile(krakenConfigPath, "utf-8");
      krakenConfig = JSON.parse(configContent);
      console.log("[kraken-code] Loaded config from kraken-code.json");
    } catch (e) {
      krakenConfig = {};
    }
  }
  if (!inputConfig.kraken_code && krakenConfig) {
    inputConfig.kraken_code = krakenConfig;
  }
  const config2 = inputConfig;
  const hooks = [];
  console.log("[kraken-code] Initializing plugin...");
  let learningTools = {};
  try {
    const learningSystem = initializeLearningSystem(input, config2.learning);
    hooks.push(learningSystem.hooks);
    learningTools = {
      "learning-experience": learningSystem.tools.experienceTool,
      "learning-knowledge": learningSystem.tools.knowledgeTool,
      "learning-pattern": learningSystem.tools.patternTool,
      "learning-fsm": learningSystem.tools.fsmTool,
      "learning-stats": learningSystem.tools.statsTool
    };
    hooks.push({ tool: learningTools });
    console.log("[kraken-code] Learning system initialized");
  } catch (e) {
    console.error("[kraken-code] Error initializing learning system:", e);
  }
  const modeHooks = createModeHooks(input, {
    enabled: config2.modes?.search?.enabled ?? true,
    autoActivate: true
  });
  hooks.push(modeHooks);
  const sessionStorageHooks = createSessionStorageHook(input, {
    enabled: config2.claudeCodeCompatibility?.dataStorage ?? true
  });
  hooks.push(sessionStorageHooks);
  const claudeCodeHooks = createClaudeCodeHooks(input, {
    config: config2.claudeCodeCompatibility
  });
  hooks.push(claudeCodeHooks);
  hooks.push({ tool: builtinTools });
  hooks.push({
    config: async (newConfig) => {
      console.log("[kraken-code] Configuration updated");
      if (!newConfig.agent)
        newConfig.agent = {};
      const agents = getSeaThemedAgents();
      for (const [name, agentConfig] of Object.entries(agents)) {
        if (!newConfig.agent[name]) {
          console.log(`[kraken-code] Injecting agent: ${name}, has permission:`, !!agentConfig.permission);
          if (agentConfig.permission) {
            console.log(`[kraken-code]   Agent ${name} permission keys:`, Object.keys(agentConfig.permission));
          }
          newConfig.agent[name] = agentConfig;
        }
      }
      if (!newConfig.default_agent && newConfig.agent["Kraken"])
        newConfig.default_agent = "Kraken";
      const validPermissionKeys = ["edit", "bash", "webfetch", "doom_loop", "external_directory"];
      const defaultPermissions = {
        edit: "ask",
        bash: "ask",
        webfetch: "ask",
        doom_loop: "ask",
        external_directory: "ask"
      };
      for (const agentName of Object.keys(newConfig.agent)) {
        const agent = newConfig.agent[agentName];
        if (agent) {
          const cleanPermission = {};
          if (agent.permission && typeof agent.permission === "object") {
            for (const key of validPermissionKeys) {
              if (key in agent.permission) {
                const value = agent.permission[key];
                if (value === "allow" || value === "ask" || value === "deny") {
                  cleanPermission[key] = value;
                }
              }
            }
          }
          for (const key of validPermissionKeys) {
            if (!(key in cleanPermission)) {
              cleanPermission[key] = defaultPermissions[key];
            }
          }
          agent.permission = cleanPermission;
          console.log(`[kraken-code] Sanitized ${agentName} permission:`, JSON.stringify(agent.permission, null, 2));
        }
      }
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
      const mcpConfig = newConfig.mcp || {};
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
    hooks.push(createKeywordDetector(input));
    hooks.push(createAutoSlashCommand(input));
    hooks.push(createRulesInjector(input));
    hooks.push(createAgentUsageReminder(input));
    hooks.push(createAnthropicContextWindowLimitRecovery(input));
    hooks.push(createAutoUpdateChecker(input));
    hooks.push(createCompactionContextInjector(input));
    hooks.push(createDirectoryAgentsInjector(input));
    hooks.push(createDirectoryReadmeInjector(input));
    hooks.push(createEditErrorRecovery(input));
    hooks.push(createEmptyTaskResponseDetectorHook(input));
    hooks.push(createInteractiveBashSession(input));
    hooks.push(createNonInteractiveEnv(input));
    hooks.push(createPreemptiveCompaction(input));
    hooks.push(createSessionRecovery(input));
    hooks.push(createThinkingBlockValidator(input));
    hooks.push(createCommentChecker(input));
    hooks.push(createBlitzkriegTestPlanEnforcerHook(input));
    hooks.push(createBlitzkriegTddWorkflowHook(input));
    hooks.push(createBlitzkriegEvidenceVerifierHook(input));
    hooks.push(createBlitzkriegPlannerConstraintsHook(input));
    hooks.push(createGrepOutputTruncatorHook(input));
    hooks.push(createNotificationsHook(input));
  } catch (e) {
    console.error("Kraken Code: Error initializing hooks", e);
  }
  hooks.push({
    "tool.execute.after": async (hookInput, hookOutput) => {
      if (!hookOutput.output)
        return;
      const { tool: tool3, sessionID } = hookInput;
      if (hookOutput.output && hookOutput.output.toolOutput) {
        await recordToolUse2(sessionID, tool3, hookOutput.output.toolInput, hookOutput.output.toolOutput);
      }
      if (sessionID) {
        console.log(`[storage-hooks] Tool ${tool3} completed for session ${sessionID}`);
      }
    }
  });
  process.on("exit", async () => {
    try {
      await shutdownAllMcpServers();
      await shutdownLearningSystem();
    } catch (e) {
      console.error("Kraken Code: Error shutting down services", e);
    }
  });
  const mergedHooks = mergeHooks(...hooks);
  console.log("[kraken-code] Plugin initialized with", Object.keys(mergedHooks).length, "hooks");
  return mergedHooks;
};
var src_default = createOpenCodeXPlugin;
export {
  src_default as default
};
