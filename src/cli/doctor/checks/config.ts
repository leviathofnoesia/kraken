import { existsSync, readFileSync } from 'node:fs'
import * as jsoncParser from 'jsonc-parser'
import path from 'node:path'
import os from 'node:os'
import type { CheckResult, CheckDefinition } from '../types'
import { CHECK_IDS, CHECK_NAMES } from '../constants'

function getOpenCodeConfigPaths() {
  const crossPlatformDir = path.join(os.homedir(), '.config', 'opencode')
  return {
    configJson: path.join(crossPlatformDir, 'opencode.json'),
    configJsonc: path.join(crossPlatformDir, 'opencode.jsonc'),
  }
}

function parseJsonc<T = unknown>(content: string): T {
  const errors: jsoncParser.ParseError[] = []
  const result = jsoncParser.parse(content, errors, { allowTrailingComma: true })
  if (errors.length > 0) {
    throw new Error(`JSONC parse error: ${errors[0].error}`)
  }
  return result as T
}

export async function checkConfigValidity(): Promise<CheckResult> {
  const paths = getOpenCodeConfigPaths()
  const configPath = paths.configJsonc || paths.configJson

  if (!existsSync(configPath)) {
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: 'fail',
      message: 'OpenCode config file not found',
      details: [`Expected: ${configPath}`],
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    parseJsonc(content)
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: 'pass',
      message: 'Config file is valid JSONC',
      details: [`Config: ${configPath}`],
    }
  } catch (error) {
    return {
      name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
      status: 'fail',
      message: `Config parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: [`Config: ${configPath}`],
    }
  }
}

export function getConfigCheckDefinition(): CheckDefinition {
  return {
    id: CHECK_IDS.CONFIG_VALIDATION,
    name: CHECK_NAMES[CHECK_IDS.CONFIG_VALIDATION],
    category: 'configuration',
    check: checkConfigValidity,
    critical: false,
  }
}
