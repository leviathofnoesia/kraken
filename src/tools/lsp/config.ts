import type { LSPServerConfig, ResolvedServer, ServerLookupResult } from "./types"
import { existsSync } from "node:fs"

export const BUILTIN_SERVERS: LSPServerConfig[] = [
  {
    id: "typescript-language-server",
    command: ["typescript-language-server", "--stdio"],
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  {
    id: "pyright",
    command: ["pyright-langserver", "--stdio"],
    extensions: [".py"],
  },
  {
    id: "rust-analyzer",
    command: ["rust-analyzer"],
    extensions: [".rs"],
  },
  {
    id: "gopls",
    command: ["gopls", "serve"],
    extensions: [".go"],
  },
  {
    id: "jdtls",
    command: ["jdtls"],
    extensions: [".java"],
  },
  {
    id: "clangd",
    command: ["clangd"],
    extensions: [".c", ".cpp", ".h", ".hpp"],
  },
  {
    id: "omnisharp",
    command: ["OmniSharp", "-lsp"],
    extensions: [".cs"],
  },
  {
    id: "intelephense",
    command: ["intelephense", "--stdio"],
    extensions: [".php"],
  },
  {
    id: "ruby-lsp",
    command: ["ruby-lsp"],
    extensions: [".rb"],
  },
  {
    id: "dart-analysis-server",
    command: ["dart", "analysis-server", "--lsp"],
    extensions: [".dart"],
  },
  {
    id: "lua-language-server",
    command: ["lua-language-server"],
    extensions: [".lua"],
  },
  {
    id: "kotlin-language-server",
    command: ["kotlin-language-server"],
    extensions: [".kt", ".kts"],
  },
  {
    id: "svelte-language-server",
    command: ["svelteserver", "--stdio"],
    extensions: [".svelte"],
  },
  {
    id: "vue-language-server",
    command: ["vue-language-server", "--stdio"],
    extensions: [".vue"],
  },
  {
    id: "elixir-ls",
    command: ["elixir-ls"],
    extensions: [".ex", ".exs"],
  },
  {
    id: "terraform-ls",
    command: ["terraform-ls", "serve"],
    extensions: [".tf", ".tfvars"],
  },
]

export function getLanguageId(ext: string): string {
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

export async function findServerForExtension(ext: string): Promise<ServerLookupResult> {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`

  const server = BUILTIN_SERVERS.find((s) => !s.disabled && s.extensions.includes(normalizedExt))

  if (!server) {
    return {
      status: "not_configured",
      extension: normalizedExt,
      availableServers: [],
    }
  }

  if (!(await isServerInstalled(server.command))) {
    return {
      status: "not_installed",
      server: {
        id: server.id,
        command: server.command,
        extensions: server.extensions,
      },
      installHint: getInstallHint(server.id),
    }
  }

  return {
    status: "found",
    server: {
      id: server.id,
      command: server.command,
      extensions: server.extensions,
      priority: BUILTIN_SERVERS.indexOf(server),
      env: server.env,
      initialization: server.initialization,
    },
  }
}

async function isServerInstalled(command: string[]): Promise<boolean> {
  const [cmd] = command
  if (!cmd) return false

  try {
    const result = Bun.spawn(["which", cmd], { stdout: "pipe" })
    const output = await new Response(result.stdout).text()
    return output.trim().length > 0
  } catch {
    return false
  }
}

export function getInstallHint(serverId: string): string {
  const hints: Record<string, string> = {
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
    "terraform-ls": "Install from https://github.com/hashicorp/terraform-ls",
  }

  return hints[serverId] ?? `Install ${serverId}`
}
