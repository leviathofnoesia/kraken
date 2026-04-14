import { spawn, ChildProcess } from "node:child_process"
import type {
  ResolvedServer,
  Diagnostic,
  HoverResult,
  DocumentSymbol,
  SymbolInfo,
  Location,
  LocationLink,
  PrepareRenameResult,
  PrepareRenameDefaultBehavior,
  Range,
  WorkspaceEdit,
  CodeAction,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
} from "./types"

export class LSPClient {
  private root: string
  private server: ResolvedServer
  private proc: ChildProcess | null = null
  private buffer = ""
  private pending = new Map<number | string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  private requestIdCounter = 0
  private openedFiles = new Map<string, number>()
  private stderrBuffer = ""
  private processExited = false
  private diagnosticsStore = new Map<string, Diagnostic[]>()

  constructor(root: string, server: ResolvedServer) {
    this.root = root
    this.server = server
  }

  async start(): Promise<void> {
    if (this.proc) return

    const [command, ...args] = this.server.command
    const env = { ...process.env, ...this.server.env }

    this.proc = spawn(command, args, {
      cwd: this.root,
      env: env as NodeJS.ProcessEnv,
      stdio: ["pipe", "pipe", "pipe"],
    })

    this.proc.on("error", (err) => {
      this.processExited = true
      this.rejectAllPending(new Error(`LSP process error: ${err.message}`))
    })

    this.proc.on("exit", (code, signal) => {
      this.processExited = true
      this.rejectAllPending(new Error(`LSP process exited with code ${code} and signal ${signal}`))
    })

    this.proc.stdout?.on("data", (data) => {
      this.buffer += data.toString()
      this.processBuffer()
    })

    this.proc.stderr?.on("data", (data) => {
      this.stderrBuffer += data.toString()
      if (this.stderrBuffer.length > 10000) {
        this.stderrBuffer = this.stderrBuffer.slice(-5000)
      }
    })
  }

  private rejectAllPending(error: Error): void {
    for (const [id, { reject }] of this.pending) {
      reject(error)
    }
    this.pending.clear()
  }

  private processBuffer(): void {
    const separator = "\r\n\r\n"
    while (true) {
      const sepIndex = this.buffer.indexOf(separator)
      if (sepIndex === -1) break

      const headerSection = this.buffer.slice(0, sepIndex)
      this.buffer = this.buffer.slice(sepIndex + separator.length)

      const contentLengthMatch = headerSection.match(/Content-Length:\s*(\d+)/i)
      if (!contentLengthMatch) continue

      const contentLength = Number.parseInt(contentLengthMatch[1], 10)
      if (this.buffer.length < contentLength) continue

      const content = this.buffer.slice(0, contentLength)
      this.buffer = this.buffer.slice(contentLength)

      try {
        const message = JSON.parse(content)
        this.handleMessage(message)
      } catch (e) {
        console.error("Failed to parse LSP message:", e)
      }
    }
  }

  private handleMessage(message: JSONRPCResponse | JSONRPCNotification): void {
    if ("id" in message && message.id !== null) {
      const pending = this.pending.get(message.id)
      if (pending) {
        this.pending.delete(message.id)
        if ("error" in message) {
          pending.reject(new Error(message.error?.message || "LSP error"))
        } else {
          pending.resolve(message.result)
        }
      }
    } else if ("method" in message) {
      if (message.method === "textDocument/publishDiagnostics") {
        const params = message.params as { uri: string; diagnostics: Diagnostic[] }
        this.diagnosticsStore.set(params.uri, params.diagnostics)
      }
    }
  }

  private send(request: JSONRPCRequest): Promise<unknown> {
    if (!this.proc || this.processExited) {
      return Promise.reject(new Error("LSP process not running"))
    }

    const id = ++this.requestIdCounter
    const message = { ...request, id }
    const content = JSON.stringify(message)

    const header = `Content-Length: ${content.length}\r\n\r\n`
    const fullMessage = header + content

    this.proc.stdin?.write(fullMessage)

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
  }

  private async request<T>(method: string, params?: unknown): Promise<T> {
    const result = await this.send({
      jsonrpc: "2.0",
      id: this.requestIdCounter + 1,
      method,
      params,
    })
    return result as T
  }

  private async notify(method: string, params?: unknown): Promise<void> {
    if (!this.proc || this.processExited) {
      throw new Error("LSP process not running")
    }

    const message: JSONRPCNotification = {
      jsonrpc: "2.0",
      method,
      params,
    }

    const content = JSON.stringify(message)
    const header = `Content-Length: ${content.length}\r\n\r\n`
    const fullMessage = header + content

    this.proc.stdin?.write(fullMessage)
  }

  async initialize(): Promise<void> {
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
          rename: { dynamicRegistration: true },
        },
      },
      initializationOptions: this.server.initialization,
    }

    await this.request("initialize", initializeParams)
    await this.notify("initialized", {})
  }

  async openFile(filePath: string): Promise<void> {
    const uri = `file://${filePath}`
    let version = this.openedFiles.get(uri) ?? 0
    version++

    const { promises: fs } = await import("node:fs")
    const content = await fs.readFile(filePath, "utf-8")

    const ext = filePath.split(".").pop() ?? ""
    const languageId = this.getLanguageId(ext)

    await this.notify("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId,
        version,
        text: content,
      },
    })

    this.openedFiles.set(uri, version)
  }

  async hover(filePath: string, line: number, character: number): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/hover", {
      textDocument: { uri },
      position: { line, character },
    })
  }

  async definition(filePath: string, line: number, character: number): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/definition", {
      textDocument: { uri },
      position: { line, character },
    })
  }

  async references(filePath: string, line: number, character: number, includeDeclaration = true): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/references", {
      textDocument: { uri },
      position: { line, character },
      context: { includeDeclaration },
    })
  }

  async documentSymbols(filePath: string): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/documentSymbol", {
      textDocument: { uri },
    })
  }

  async workspaceSymbols(query: string): Promise<unknown> {
    return await this.request("workspace/symbol", { query })
  }

  async diagnostics(filePath: string): Promise<{ items: Diagnostic[] }> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)
    return { items: this.diagnosticsStore.get(uri) ?? [] }
  }

  async prepareRename(filePath: string, line: number, character: number): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/prepareRename", {
      textDocument: { uri },
      position: { line, character },
    })
  }

  async rename(filePath: string, line: number, character: number, newName: string): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    return await this.request("textDocument/rename", {
      textDocument: { uri },
      position: { line, character },
      newName,
    })
  }

  async codeAction(
    filePath: string,
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number,
    only?: string[]
  ): Promise<unknown> {
    const uri = `file://${filePath}`
    await this.ensureFileOpen(filePath)

    const diagnostics = this.diagnosticsStore.get(uri) ?? []

    return await this.request("textDocument/codeAction", {
      textDocument: { uri },
      range: {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
      },
      context: { diagnostics, only },
    })
  }

  async codeActionResolve(codeAction: unknown): Promise<unknown> {
    return await this.request("codeAction/resolve", codeAction)
  }

  isAlive(): boolean {
    return this.proc !== null && !this.processExited
  }

  async stop(): Promise<void> {
    this.processExited = true
    this.rejectAllPending(new Error("Client stopped"))

    if (this.proc) {
      try {
        await this.notify("shutdown")
        await this.notify("exit")
      } catch {
      }

      this.proc.kill()
      this.proc = null
    }

    this.openedFiles.clear()
    this.diagnosticsStore.clear()
  }

  private async ensureFileOpen(filePath: string): Promise<void> {
    const uri = `file://${filePath}`
    if (!this.openedFiles.has(uri)) {
      await this.openFile(filePath)
    }
  }

  private getLanguageId(ext: string): string {
    const map: Record<string, string> = {
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
      xml: "xml",
    }
    return map[ext.toLowerCase()] ?? ext
  }
}
