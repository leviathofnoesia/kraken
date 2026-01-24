import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { withLspClient, formatHoverResult, formatLocation, formatSymbolKind } from "./utils"

export const lsp_hover = tool({
  description:
    "Get hover information (type, documentation) for a symbol at a position in a file. " +
    "Use this to get information about variables, functions, classes, etc.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    line: z.number().describe("0-indexed line number"),
    character: z.number().describe("0-indexed character position"),
  },
  async execute({ path, line, character }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.hover(path, line, character)
      })

      return JSON.stringify({
        success: true,
        hover: formatHoverResult(result as any),
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_goto_definition = tool({
  description:
    "Jump to the definition of a symbol at the given position. " +
    "Returns the location where the symbol is defined.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    line: z.number().describe("0-indexed line number"),
    character: z.number().describe("0-indexed character position"),
  },
  async execute({ path, line, character }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.definition(path, line, character)
      })

      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No definition found",
        })
      }

      const locations = Array.isArray(result) ? result : [result]
      const formatted = locations.map(formatLocation)

      return JSON.stringify({
        success: true,
        locations: formatted,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_find_references = tool({
  description:
    "Find all references to a symbol in the workspace. " +
    "Returns a list of locations where the symbol is used.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    line: z.number().describe("0-indexed line number"),
    character: z.number().describe("0-indexed character position"),
    includeDeclaration: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include the declaration location in results"),
  },
  async execute({ path, line, character, includeDeclaration }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.references(path, line, character, includeDeclaration)
      })

      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No references found",
        })
      }

      const locations = Array.isArray(result) ? result : [result]
      const formatted = locations.map(formatLocation)

      return JSON.stringify({
        success: true,
        count: formatted.length,
        references: formatted,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_document_symbols = tool({
  description:
    "Get all symbols (classes, functions, variables) in a document. " +
    "Returns a hierarchical tree of symbols with their locations.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
  },
  async execute({ path }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.documentSymbols(path)
      })

      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No symbols found",
        })
      }

      const symbols = Array.isArray(result) ? result : [result]

      const formatSymbol = (sym: any, indent = 0): any => {
        return {
          kind: formatSymbolKind(sym.kind),
          name: sym.name,
          detail: sym.detail || undefined,
          range: sym.range,
          children: sym.children?.map((c: any) => formatSymbol(c, indent + 1)),
        }
      }

      return JSON.stringify({
        success: true,
        symbols: symbols.map((s: any) => formatSymbol(s)),
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_workspace_symbols = tool({
  description:
    "Search for symbols across the entire workspace. " +
    "Use this to find classes, functions, etc. without knowing their location.",
  args: {
    query: z.string().describe("Search query (e.g., 'MyClass', 'createUser')"),
  },
  async execute({ query }) {
    try {
      const result = await withLspClient(process.cwd(), async (client) => {
        return await client.workspaceSymbols(query)
      })

      if (!result) {
        return JSON.stringify({
          success: true,
          message: "No symbols found",
        })
      }

      const symbols = Array.isArray(result) ? result : [result]

      const formatted = symbols.map((s: any) => ({
        kind: formatSymbolKind(s.kind),
        name: s.name,
        containerName: s.containerName || undefined,
        location: formatLocation(s.location),
      }))

      return JSON.stringify({
        success: true,
        count: formatted.length,
        symbols: formatted,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_diagnostics = tool({
  description:
    "Get diagnostics (errors, warnings, hints) for a file. " +
    "Returns all issues reported by the language server.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    severity: z
      .enum(["error", "warning", "information", "hint", "all"])
      .optional()
      .default("all")
      .describe("Filter by severity level"),
  },
  async execute({ path, severity }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.diagnostics(path)
      })

      const { filterDiagnosticsBySeverity } = await import("./utils")

      let items = result.items || []
      if (severity !== "all") {
        items = filterDiagnosticsBySeverity(
          items,
          severity as "error" | "warning" | "information" | "hint"
        )
      }

      const formatted = items.map((diag: any) => ({
        severity: diag.severity,
        message: diag.message,
        range: diag.range,
        source: diag.source,
        code: diag.code,
      }))

      return JSON.stringify({
        success: true,
        count: formatted.length,
        diagnostics: formatted,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_prepare_rename = tool({
  description:
    "Prepare a rename operation at a position. " +
    "Returns the range that would be renamed, if valid.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    line: z.number().describe("0-indexed line number"),
    character: z.number().describe("0-indexed character position"),
  },
  async execute({ path, line, character }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.prepareRename(path, line, character)
      })

      if (!result) {
        return JSON.stringify({
          success: true,
          message: "Cannot rename at this position",
        })
      }

      return JSON.stringify({
        success: true,
        result: result,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_rename = tool({
  description:
    "Rename a symbol at a position. " +
    "Performs a workspace-wide rename of the symbol to the new name.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    line: z.number().describe("0-indexed line number"),
    character: z.number().describe("0-indexed character position"),
    newName: z.string().describe("New name for the symbol"),
  },
  async execute({ path, line, character, newName }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.rename(path, line, character, newName)
      })

      const { formatWorkspaceEdit, applyWorkspaceEdit, formatApplyResult } = await import("./utils")
      const editResult = await applyWorkspaceEdit(result as any)
      const formatted = formatWorkspaceEdit(result as any)

      return JSON.stringify({
        success: true,
        workspaceEdit: formatted,
        applyResult: formatApplyResult(editResult),
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_code_actions = tool({
  description:
    "Get available code actions (refactors, quick fixes) for a range. " +
    "Returns a list of actions that can be applied to fix issues or refactor code.",
  args: {
    path: z.string().describe("Absolute path to the source file"),
    startLine: z.number().describe("0-indexed start line"),
    startChar: z.number().describe("0-indexed start character"),
    endLine: z.number().describe("0-indexed end line"),
    endChar: z.number().describe("0-indexed end character"),
    only: z
      .array(z.string())
      .optional()
      .describe("Filter by action kind (e.g., 'quickfix', 'refactor')"),
  },
  async execute({ path, startLine, startChar, endLine, endChar, only }) {
    try {
      const result = await withLspClient(path, async (client) => {
        return await client.codeAction(path, startLine, startChar, endLine, endChar, only)
      })

      const { formatCodeActions } = await import("./utils")

      return JSON.stringify({
        success: true,
        count: result?.length || 0,
        actions: result || [],
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_code_action_resolve = tool({
  description: "Resolve a code action to get its full details (including edits).",
  args: {
    action: z.any().describe("Code action object from lsp_code_actions"),
  },
  async execute({ action }) {
    try {
      const { formatWorkspaceEdit, applyWorkspaceEdit, formatApplyResult } = await import("./utils")

      const result = await withLspClient(process.cwd(), async (client) => {
        return await client.codeActionResolve(action)
      })

      if (result.edit) {
        const editResult = await applyWorkspaceEdit(result.edit)
        return JSON.stringify({
          success: true,
          action: result,
          workspaceEdit: formatWorkspaceEdit(result.edit),
          applyResult: formatApplyResult(editResult),
        })
      }

      return JSON.stringify({
        success: true,
        action: result,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})

export const lsp_servers = tool({
  description:
    "List available LSP servers and their installation status. " +
    "Shows which servers are configured and installed for different file types.",
  args: {
    extension: z
      .string()
      .optional()
      .describe("Filter by file extension (e.g., 'ts', 'py', 'js')"),
  },
  async execute({ extension }) {
    try {
      const { BUILTIN_SERVERS, findServerForExtension } = await import("./config")

      if (extension) {
        const result = await findServerForExtension(extension)
        return JSON.stringify({
          success: true,
          extension,
          lookup: result,
        })
      }

      const servers = BUILTIN_SERVERS.map((s) => ({
        id: s.id,
        extensions: s.extensions,
        disabled: s.disabled || false,
      }))

      return JSON.stringify({
        success: true,
        servers,
        count: servers.length,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})
