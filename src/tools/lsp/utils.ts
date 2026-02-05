import { LSPClient } from './client'
import type {
  HoverResult,
  DocumentSymbol,
  SymbolInfo,
  Location,
  LocationLink,
  Diagnostic,
  PrepareRenameResult,
  PrepareRenameDefaultBehavior,
  Range,
  WorkspaceEdit,
  TextEdit,
  CodeAction,
  Command,
  ServerLookupResult,
} from './types'
import { findServerForExtension } from './config'
import { getClient } from './manager'

export function findWorkspaceRoot(filePath: string): string {
  const parts = filePath.split('/')
  for (let i = parts.length; i > 0; i--) {
    const path = parts.slice(0, i).join('/')
    const markers = [
      'package.json',
      'tsconfig.json',
      'pyproject.toml',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'build.gradle',
    ]
    for (const marker of markers) {
      try {
        const file = Bun.file(`${path}/${marker}`)
        if (file.size > 0) {
          return path
        }
      } catch {}
    }
  }
  return '/'
}

export function uriToPath(uri: string): string {
  return uri.replace(/^file:\/\//, '').replace(/%3A/g, ':')
}

export function formatServerLookupError(
  result: Exclude<ServerLookupResult, { status: 'found' }>,
): string {
  if (result.status === 'not_configured') {
    return `No LSP server configured for extension: ${result.extension}`
  } else {
    return `LSP server not installed: ${result.server.id}\nInstall: ${result.installHint}`
  }
}

export async function withLspClient<T>(
  filePath: string,
  fn: (client: LSPClient) => Promise<T>,
): Promise<T> {
  const root = findWorkspaceRoot(filePath)
  const ext = filePath.split('.').pop() ?? ''

  const lookup = await findServerForExtension(ext)

  if (lookup.status !== 'found') {
    throw new Error(formatServerLookupError(lookup))
  }

  const client = await getClient(root, lookup.server)

  return fn(client)
}

export function formatHoverResult(result: unknown): string {
  if (!result) return 'No hover information available'

  const hoverResult = result as { kind?: string; contents?: any }

  if (!hoverResult.contents) return 'No hover information available'

  if (typeof hoverResult.contents === 'string') {
    return hoverResult.contents
  }

  if (Array.isArray(hoverResult.contents)) {
    return hoverResult.contents
      .map((item) => {
        if (typeof item === 'string') return item
        return item.value
      })
      .join('\n\n')
  }

  return hoverResult.contents.value
}

export function formatLocation(loc: Location | LocationLink): string {
  if ('targetUri' in loc) {
    const uri = uriToPath(loc.targetUri)
    const { line, character } = loc.targetRange.start
    return `${uri}:${line + 1}:${character + 1}`
  } else {
    const uri = uriToPath(loc.uri)
    const { line, character } = loc.range.start
    return `${uri}:${line + 1}:${character + 1}`
  }
}

export function formatSymbolKind(kind: number): string {
  const kinds: Record<number, string> = {
    1: 'File',
    2: 'Module',
    3: 'Namespace',
    4: 'Package',
    5: 'Class',
    6: 'Method',
    7: 'Property',
    8: 'Field',
    9: 'Constructor',
    10: 'Enum',
    11: 'Interface',
    12: 'Function',
    13: 'Variable',
    14: 'Constant',
    15: 'String',
    16: 'Number',
    17: 'Boolean',
    18: 'Array',
    19: 'Object',
    20: 'Key',
    21: 'Null',
    22: 'EnumMember',
    23: 'Struct',
    24: 'Event',
    25: 'Operator',
    26: 'TypeParameter',
  }
  return kinds[kind] ?? `Unknown(${kind})`
}

export function formatSeverity(severity: number | undefined): string {
  switch (severity) {
    case 1:
      return 'Error'
    case 2:
      return 'Warning'
    case 3:
      return 'Information'
    case 4:
      return 'Hint'
    default:
      return 'Unknown'
  }
}

export function formatDocumentSymbol(symbol: DocumentSymbol, indent = 0): string {
  const prefix = '  '.repeat(indent)
  const kind = formatSymbolKind(symbol.kind)
  const lines = [`${prefix}${kind}: ${symbol.name}`]

  if (symbol.children) {
    for (const child of symbol.children) {
      lines.push(formatDocumentSymbol(child, indent + 1))
    }
  }

  return lines.join('\n')
}

export function formatSymbolInfo(symbol: SymbolInfo): string {
  const kind = formatSymbolKind(symbol.kind)
  const location = formatLocation(symbol.location)
  const container = symbol.containerName ? ` (${symbol.containerName})` : ''
  return `${kind}: ${symbol.name}${container}\n  at ${location}`
}

export function formatDiagnostic(diag: Diagnostic): string {
  const severity = formatSeverity(diag.severity)
  const { line, character } = diag.range.start
  const location = `line ${line + 1}, character ${character + 1}`
  const source = diag.source ? `[${diag.source}] ` : ''
  const code = diag.code ? ` ${diag.code}` : ''
  return `${severity} at ${location}: ${source}${diag.message}${code}`
}

export function filterDiagnosticsBySeverity(
  diagnostics: Diagnostic[],
  severityFilter?: 'error' | 'warning' | 'information' | 'hint' | 'all',
): Diagnostic[] {
  if (!severityFilter || severityFilter === 'all') return diagnostics

  const severityMap: Record<string, number> = {
    error: 1,
    warning: 2,
    information: 3,
    hint: 4,
  }

  const targetSeverity = severityMap[severityFilter]
  return diagnostics.filter((d) => d.severity === targetSeverity)
}

export function formatPrepareRenameResult(
  result: PrepareRenameResult | PrepareRenameDefaultBehavior | Range | null,
): string {
  if (!result) return 'Cannot rename at this location'

  if ('defaultBehavior' in result) {
    return 'Rename available (default behavior)'
  }

  const range = 'range' in result ? result.range : result
  const placeholder = 'placeholder' in result ? result.placeholder : 'symbol'

  const { line, character } = range.start
  return `Rename: ${placeholder} at line ${line + 1}, character ${character + 1}`
}

export function formatTextEdit(edit: TextEdit): string {
  const { line, character } = edit.range.start
  return `Line ${line + 1}, character ${character + 1}: "${edit.newText}"`
}

export function formatWorkspaceEdit(edit: WorkspaceEdit | null): string {
  if (!edit) return 'No workspace edit'

  const parts: string[] = []

  if (edit.changes) {
    for (const [uri, textEdits] of Object.entries(edit.changes)) {
      parts.push(`${uriToPath(uri)}: ${textEdits.length} change(s)`)
      for (const te of textEdits) {
        parts.push(`  ${formatTextEdit(te)}`)
      }
    }
  }

  if (edit.documentChanges) {
    for (const change of edit.documentChanges) {
      if ('kind' in change) {
        if (change.kind === 'rename') {
          parts.push(`rename: ${uriToPath(change.oldUri)} -> ${uriToPath(change.newUri)}`)
        } else {
          const uri = change.kind === 'create' ? change.uri : change.uri
          parts.push(`${change.kind}: ${uriToPath(uri)}`)
        }
      } else {
        parts.push(`${uriToPath(change.textDocument.uri)}: ${change.edits.length} edit(s)`)
      }
    }
  }

  return parts.join('\n') || 'Empty workspace edit'
}

export function formatCodeAction(action: CodeAction): string {
  const parts: string[] = [action.title]

  if (action.kind) parts.push(`[${action.kind}]`)
  if (action.isPreferred) parts.push('(preferred)')
  if (action.disabled) parts.push(`(disabled: ${action.disabled.reason})`)

  return parts.join(' ')
}

export function formatCodeActions(actions: (CodeAction | Command)[] | null): string {
  if (!actions || actions.length === 0) return 'No code actions available'

  return actions
    .map((a, i) => {
      if ('kind' in a || 'diagnostics' in a) {
        return `${i + 1}. ${formatCodeAction(a)}`
      }
      return `${i + 1}. ${a.title} (command: ${a.command})`
    })
    .join('\n')
}

export interface ApplyResult {
  success: boolean
  filesModified: string[]
  totalEdits: number
  errors: string[]
}

export async function applyWorkspaceEdit(edit: WorkspaceEdit | null): Promise<ApplyResult> {
  if (!edit) {
    return {
      success: true,
      filesModified: [],
      totalEdits: 0,
      errors: [],
    }
  }

  const result: ApplyResult = {
    success: true,
    filesModified: [],
    totalEdits: 0,
    errors: [],
  }

  if (edit.changes) {
    for (const [uri, textEdits] of Object.entries(edit.changes)) {
      try {
        const path = uriToPath(uri)
        const content = await Bun.file(path).text()
        const lines = content.split('\n')

        for (const te of textEdits) {
          const { line } = te.range.start
          if (lines[line] !== undefined) {
            lines[line] = te.newText
            result.totalEdits++
          }
        }

        Bun.write(path, lines.join('\n'))
        result.filesModified.push(path)
      } catch (error) {
        result.errors.push(`Failed to apply edit to ${uri}: ${error}`)
        result.success = false
      }
    }
  }

  return result
}

export function formatApplyResult(result: ApplyResult): string {
  if (result.success) {
    return `Successfully applied ${result.totalEdits} edit(s) to ${result.filesModified.length} file(s)`
  } else {
    return `Partial success: ${result.totalEdits} edit(s) applied to ${result.filesModified.length} file(s)\nErrors:\n${result.errors.join('\n')}`
  }
}
