#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import * as jsoncParser from 'jsonc-parser'
import path from 'node:path'
import os from 'node:os'
import color from 'picocolors'
import { PACKAGE_NAME } from './doctor/constants'

export interface UninstallResult {
  success: boolean
  message: string
  configPath?: string
  krakenConfigRemoved?: boolean
}

function getOpenCodeConfigPaths(): { configJson: string; configJsonc: string } {
  const crossPlatformDir = path.join(os.homedir(), '.config', 'opencode')
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

function removePluginFromConfig(content: string, format: 'json' | 'jsonc'): string {
  const errors: jsoncParser.ParseError[] = []
  const root = jsoncParser.parse(content, errors, { allowTrailingComma: true })

  if (errors.length > 0) {
    throw new Error(`Failed to parse config: ${errors[0].error}`)
  }

  const plugins: string[] = Array.isArray(root.plugin) ? [...root.plugin] : []

  // Remove kraken-code plugin (and any kraken-code@* variants)
  const filteredPlugins = plugins.filter(
    (p) => p !== PACKAGE_NAME && !p.startsWith(`${PACKAGE_NAME}@`),
  )

  if (root.plugin === undefined) {
    return content
  }

  const editOptions: jsoncParser.ModificationOptions = {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
      insertFinalNewline: true,
    },
  }

  const edits = jsoncParser.modify(content, ['plugin'], filteredPlugins, editOptions)
  return jsoncParser.applyEdits(content, edits)
}

export async function runUninstall(options: {
  config?: boolean
  verbose?: boolean
}): Promise<UninstallResult> {
  console.log(color.cyan('🗑️  Uninstalling Kraken Code plugin...'))

  const configInfo = detectConfigPath()

  if (!configInfo) {
    return {
      success: false,
      message: 'OpenCode config not found',
    }
  }

  let content: string
  let format: 'json' | 'jsonc'

  try {
    content = readFileSync(configInfo.path, 'utf-8')
    format = configInfo.format
  } catch (error) {
    return {
      success: false,
      message: `Failed to read config: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  // Check if kraken-code plugin is registered
  const errors: jsoncParser.ParseError[] = []
  const root = jsoncParser.parse(content, errors, { allowTrailingComma: true })

  if (errors.length > 0) {
    return {
      success: false,
      message: `Failed to parse config: ${errors[0].error}`,
    }
  }

  const plugins: string[] = Array.isArray(root.plugin) ? [...root.plugin] : []
  const isRegistered = plugins.some((p) => p === PACKAGE_NAME || p.startsWith(`${PACKAGE_NAME}@`))

  if (!isRegistered) {
    if (options.verbose) {
      console.log(color.dim(`  Plugin "${PACKAGE_NAME}" not found in config`))
    }
    return {
      success: true,
      message: `Plugin "${PACKAGE_NAME}" not registered`,
      configPath: configInfo.path,
    }
  }

  // Remove plugin from config
  try {
    const updatedContent = removePluginFromConfig(content, format)
    writeFileSync(configInfo.path, updatedContent, 'utf-8')
    console.log(color.green(`\n✓ Removed "${PACKAGE_NAME}" from OpenCode plugin list`))
  } catch (error) {
    return {
      success: false,
      message: `Failed to update config: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  let krakenConfigRemoved = false

  // Optionally remove kraken-code config file if --config flag is provided
  if (options.config !== false) {
    const krakenConfigPath = path.join(os.homedir(), '.config', 'opencode', 'kraken-code.json')

    if (existsSync(krakenConfigPath)) {
      try {
        unlinkSync(krakenConfigPath)
        krakenConfigRemoved = true
        console.log(color.green(`✓ Removed Kraken Code config at ${krakenConfigPath}`))
      } catch (error) {
        console.log(
          color.yellow(
            `  Warning: Failed to remove ${krakenConfigPath}: ${error instanceof Error ? error.message : String(error)}`,
          ),
        )
      }
    } else {
      if (options.verbose) {
        console.log(color.dim(`  Kraken Code config not found at ${krakenConfigPath}`))
      }
    }
  }

  // Remove skill templates if they exist
  if (options.config !== false) {
    const skillDir = path.join(os.homedir(), '.config', 'opencode', 'skill')

    if (existsSync(skillDir)) {
      try {
        const { readdir, unlink, rmdir } = await import('node:fs/promises')
        const skillCategories = ['kraken-code']

        for (const category of skillCategories) {
          const categoryPath = path.join(skillDir, category)
          if (existsSync(categoryPath)) {
            const categoryFiles = await readdir(categoryPath)

            for (const skillFile of categoryFiles) {
              const filePath = path.join(categoryPath, skillFile)
              await unlink(filePath)
            }

            // Remove empty directories
            const remainingFiles = await readdir(categoryPath)
            if (remainingFiles.length === 0) {
              await rmdir(categoryPath)
            }

            if (options.verbose) {
              console.log(color.dim(`  Removed skill templates from ${categoryPath}`))
            }
          }
        }
      } catch (error) {
        console.log(
          color.yellow(
            `  Warning: Failed to remove skill templates: ${error instanceof Error ? error.message : String(error)}`,
          ),
        )
      }
    }
  }

  console.log(color.green('\n🎉 Kraken Code plugin uninstalled successfully!'))
  console.log(
    color.dim(
      '\nNote: OpenCode may still be running. If so, restart it to complete uninstallation.',
    ),
  )

  return {
    success: true,
    message: 'Kraken Code plugin uninstalled',
    configPath: configInfo.path,
    krakenConfigRemoved,
  }
}

if (import.meta.main) {
  const options = {
    config: process.argv.includes('--config') ? true : undefined,
    verbose: process.argv.includes('-v') || process.argv.includes('--verbose') ? true : undefined,
  }
  runUninstall(options)
}
