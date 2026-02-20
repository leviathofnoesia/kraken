#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import * as jsoncParser from 'jsonc-parser'
import path from 'node:path'
import color from 'picocolors'
import { PACKAGE_NAME } from './doctor/constants'
import { runInit } from './init'
import { getHomeDir } from '../shared/home-dir'
import { isUniversalTarget, type UniversalTarget } from '../universal/targets'

type InstallTarget = UniversalTarget

export interface InstallResult {
  success: boolean
  message: string
  configPath?: string
}

function getOpenCodeConfigPaths(): { configJson: string; configJsonc: string } {
  const crossPlatformDir = path.join(getHomeDir(), '.config', 'opencode')
  return {
    configJson: path.join(crossPlatformDir, 'opencode.json'),
    configJsonc: path.join(crossPlatformDir, 'opencode.jsonc'),
  }
}

function detectConfigPath(): { path: string; format: 'json' | 'jsonc' } | null {
  const paths = getOpenCodeConfigPaths()

  if (existsSync(paths.configJsonc)) {
    return { path: paths.configJsonc, format: 'jsonc' }
  }
  if (existsSync(paths.configJson)) {
    return { path: paths.configJson, format: 'json' }
  }
  return null
}

export function registerPluginInConfig(content: string, format: 'json' | 'jsonc'): string {
  const errors: jsoncParser.ParseError[] = []
  const root = jsoncParser.parse(content, errors, { allowTrailingComma: true })

  if (errors.length > 0) {
    throw new Error(`Failed to parse config: ${errors[0].error}`)
  }

  const plugins: string[] = Array.isArray(root.plugin) ? [...root.plugin] : []

  const isRegistered = plugins.some((p) => p === PACKAGE_NAME || p.startsWith(`${PACKAGE_NAME}@`))
  if (isRegistered) {
    return content
  }

  plugins.push(PACKAGE_NAME)

  const editOptions: jsoncParser.ModificationOptions = {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
      insertFinalNewline: true,
    },
  }

  if (root.plugin === undefined) {
    let insertPos = 0
    const openBrace = content.indexOf('{')
    if (openBrace !== -1) {
      insertPos = openBrace + 1
    }

    const indent = format === 'jsonc' ? '  ' : '  '
    const newline = content.includes('\n') ? '\n' : ''
    const pluginText = `${newline}${indent}"plugin": ${JSON.stringify(plugins)},`

    return content.slice(0, insertPos) + pluginText + content.slice(insertPos)
  }

  const edits = jsoncParser.modify(content, ['plugin'], plugins, editOptions)
  return jsoncParser.applyEdits(content, edits)
}

function createDefaultConfig(): string {
  return `{
  "plugin": [
    "${PACKAGE_NAME}"
  ]
}
`
}

export async function install(target: InstallTarget = 'opencode'): Promise<InstallResult> {
  if (target !== 'opencode') {
    await runInit({ target, minimal: true })
    return {
      success: true,
      message: `Kraken bootstrap generated for ${target}`,
    }
  }

  const paths = getOpenCodeConfigPaths()
  const configInfo = detectConfigPath()

  let content: string
  let format: 'json' | 'jsonc'

  if (configInfo) {
    try {
      content = readFileSync(configInfo.path, 'utf-8')
      format = configInfo.format
    } catch (error) {
      return {
        success: false,
        message: `Failed to read config: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  } else {
    const dir = path.dirname(paths.configJson)
    if (!existsSync(dir)) {
      try {
        const { mkdirSync } = await import('node:fs')
        mkdirSync(dir, { recursive: true })
      } catch (error) {
        return {
          success: false,
          message: `Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    }

    content = createDefaultConfig()
    format = 'json'
  }

  try {
    const updatedContent = registerPluginInConfig(content, format)
    writeFileSync(configInfo?.path ?? paths.configJson, updatedContent, 'utf-8')

    const finalConfigPath = configInfo?.path ?? paths.configJson

    if (updatedContent === content) {
      return {
        success: true,
        message: `Plugin "${PACKAGE_NAME}" is already registered`,
        configPath: finalConfigPath,
      }
    }

    return {
      success: true,
      message: `Plugin "${PACKAGE_NAME}" registered successfully`,
      configPath: finalConfigPath,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to register plugin: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function printResult(result: InstallResult): void {
  if (result.success) {
    console.log(color.green(`\n${String.fromCodePoint(0x2713)} ${result.message}`))
    if (result.configPath) {
      console.log(color.dim(`  Config: ${result.configPath}`))
    }
  } else {
    console.log(color.red(`\n${String.fromCodePoint(0x2717)} ${result.message}`))
  }
}

export async function runInstall(options?: { target?: InstallTarget }): Promise<void> {
  const rawTarget = options?.target ?? 'opencode'
  if (!isUniversalTarget(rawTarget)) {
    printResult({
      success: false,
      message: `Unsupported target: ${rawTarget}`,
    })
    process.exit(1)
  }

  const result = await install(rawTarget)
  printResult(result)
  process.exit(result.success ? 0 : 1)
}

if (import.meta.main) {
  runInstall()
}
