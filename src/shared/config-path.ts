import * as path from 'path'
import * as os from 'os'

export interface OpenCodeConfigDirOptions {
  binary?: string
}

export function getOpenCodeConfigDir(options: OpenCodeConfigDirOptions = {}): string {
  const configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
  return path.join(configDir, options.binary || 'opencode')
}

export function getDataDir(): string {
  return path.join(os.homedir(), '.local', 'share')
}
