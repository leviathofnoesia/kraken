import path from "node:path"
import os from "node:os"

export function getDataDir(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(xdgConfig, "kraken-code")
}
