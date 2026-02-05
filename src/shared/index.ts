import * as jsoncParser from 'jsonc-parser'
import path from 'node:path'
import os from 'node:os'

export function parseJsonc<T = unknown>(content: string): T {
  const errors: jsoncParser.ParseError[] = []
  const result = jsoncParser.parse(content, errors, { allowTrailingComma: true })
  if (errors.length > 0) {
    throw new Error(`JSONC parse error: ${errors[0].error}`)
  }
  return result as T
}

export interface OpenCodeConfigPaths {
  configJson: string
  configJsonc: string
}

export function getOpenCodeConfigPaths(_options: {
  binary: string
  version: string | null
}): OpenCodeConfigPaths {
  const crossPlatformDir = path.join(os.homedir(), '.config', 'opencode')
  const configJson = path.join(crossPlatformDir, 'opencode.json')
  const configJsonc = path.join(crossPlatformDir, 'opencode.jsonc')

  return {
    configJson,
    configJsonc,
  }
}
