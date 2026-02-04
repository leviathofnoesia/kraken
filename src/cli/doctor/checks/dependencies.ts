import type { CheckResult, CheckDefinition, DependencyInfo } from "../types"
import { CHECK_IDS, CHECK_NAMES } from "../constants"

function getLocatorCommand(): string[] {
  return process.platform === "win32" ? ["where"] : ["which"]
}

async function checkBinaryExists(binary: string): Promise<{ exists: boolean; path: string | null }> {
  try {
    const proc = Bun.spawn([...getLocatorCommand(), binary], { stdout: "pipe", stderr: "pipe" })
    const output = await new Response(proc.stdout).text()
    await proc.exited
    if (proc.exitCode === 0) {
      const path = output.trim().split("\n")[0]?.trim() ?? null
      return { exists: true, path }
    }
  } catch {
    // intentionally empty - binary not found
  }
  return { exists: false, path: null }
}

async function getBinaryVersion(binary: string): Promise<string | null> {
  try {
    const proc = Bun.spawn([binary, "--version"], { stdout: "pipe", stderr: "pipe" })
    const output = await new Response(proc.stdout).text()
    const errorOutput = await new Response(proc.stderr).text()
    await proc.exited
    if (proc.exitCode === 0) {
      const rawOutput = output.trim() || errorOutput.trim()
      return rawOutput.split("\n")[0]
    }
  } catch {
    // intentionally empty - version unavailable
  }
  return null
}

export async function checkAstGrepCli(): Promise<DependencyInfo> {
  const binaryCheck = await checkBinaryExists("sg")
  const altBinaryCheck = !binaryCheck.exists ? await checkBinaryExists("ast-grep") : null

  const binary = binaryCheck.exists ? binaryCheck : altBinaryCheck
  if (!binary || !binary.exists) {
    return {
      name: "AST-Grep CLI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Install: npm install -g @ast-grep/cli",
    }
  }

  const version = await getBinaryVersion(binary.path!)

  return {
    name: "AST-Grep CLI",
    required: false,
    installed: true,
    version,
    path: binary.path,
  }
}

export function checkAstGrepNapi(): DependencyInfo {
  try {
    require.resolve("@ast-grep/napi")
    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: true,
      version: null,
      path: null,
    }
  } catch {
    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Will use CLI fallback if available",
    }
  }
}

export async function checkPython3(): Promise<DependencyInfo> {
  const binaryCheck = await checkBinaryExists("python3")
  const fallbackCheck = !binaryCheck.exists ? await checkBinaryExists("python") : null

  const pythonBinary = binaryCheck.exists ? binaryCheck : fallbackCheck

  if (!pythonBinary || !pythonBinary.exists) {
    return {
      name: "Python 3",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint:
        process.platform === "win32"
          ? "Install: https://www.python.org/downloads/windows/"
          : "Install: https://www.python.org/downloads/",
    }
  }

  const version = await getBinaryVersion(pythonBinary.path!)
  const majorMatch = version?.match(/(?:python\s*)?(\d+)(?:\.\d+)?/i)
  const majorVersion = majorMatch ? Number(majorMatch[1]) : null

  if (majorVersion !== 3) {
    return {
      name: "Python 3",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint:
        process.platform === "win32"
          ? "Install: https://www.python.org/downloads/windows/"
          : "Install: https://www.python.org/downloads/",
    }
  }

  return {
    name: "Python 3",
    required: false,
    installed: true,
    version,
    path: pythonBinary.path,
  }
}

export async function checkRipgrep(): Promise<DependencyInfo> {
  const binaryCheck = await checkBinaryExists("rg")

  if (!binaryCheck.exists) {
    return {
      name: "ripgrep (rg)",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint:
        "Install: apt install ripgrep or brew install ripgrep" +
        (process.platform === "win32"
          ? " or choco install ripgrep or winget install BurntSushi.ripgrep.MSVC"
          : ""),
    }
  }

  const version = await getBinaryVersion(binaryCheck.path!)

  return {
    name: "ripgrep (rg)",
    required: false,
    installed: true,
    version,
    path: binaryCheck.path,
  }
}

// Comment checker is now a built-in hook, no external dependency needed

function dependencyToCheckResult(dep: DependencyInfo, checkName: string): CheckResult {
  if (dep.installed) {
    return {
      name: checkName,
      status: "pass",
      message: dep.version ?? "installed",
      details: dep.path ? [`Path: ${dep.path}`] : undefined,
    }
  }

  return {
    name: checkName,
    status: "warn",
    message: "Not installed (optional)",
    details: dep.installHint ? [dep.installHint] : undefined,
  }
}

export async function checkDependencyAstGrepCli(): Promise<CheckResult> {
  const info = await checkAstGrepCli()
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_CLI])
}

export async function checkDependencyAstGrepNapi(): Promise<CheckResult> {
  const info = checkAstGrepNapi()
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_NAPI])
}

export async function checkDependencyPython3(): Promise<CheckResult> {
  const info = await checkPython3()
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_PYTHON])
}

export async function checkDependencyRipgrep(): Promise<CheckResult> {
  const info = await checkRipgrep()
  return dependencyToCheckResult(info, CHECK_NAMES[CHECK_IDS.DEP_RIPGREP])
}

export async function checkDependencyCommentChecker(): Promise<CheckResult> {
  return {
    name: "Comment Checker",
    status: "pass",
    message: "Built-in hook, always available",
    details: ["Comment checking is handled by hooks/comment-checker"],
  }
}

export function getDependencyCheckDefinitions(): CheckDefinition[] {
  return [
    {
      id: CHECK_IDS.DEP_AST_GREP_CLI,
      name: CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_CLI],
      category: "dependencies",
      check: checkDependencyAstGrepCli,
      critical: false,
    },
    {
      id: CHECK_IDS.DEP_AST_GREP_NAPI,
      name: CHECK_NAMES[CHECK_IDS.DEP_AST_GREP_NAPI],
      category: "dependencies",
      check: checkDependencyAstGrepNapi,
      critical: false,
    },
    {
      id: CHECK_IDS.DEP_PYTHON,
      name: CHECK_NAMES[CHECK_IDS.DEP_PYTHON],
      category: "dependencies",
      check: checkDependencyPython3,
      critical: false,
    },
    {
      id: CHECK_IDS.DEP_RIPGREP,
      name: CHECK_NAMES[CHECK_IDS.DEP_RIPGREP],
      category: "dependencies",
      check: checkDependencyRipgrep,
      critical: false,
    },
    {
      id: CHECK_IDS.DEP_COMMENT_CHECKER,
      name: CHECK_NAMES[CHECK_IDS.DEP_COMMENT_CHECKER],
      category: "dependencies",
      check: checkDependencyCommentChecker,
      critical: false,
    },
  ]
}
