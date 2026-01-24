import { fileURLToPath } from "node:url"

export function uriToPath(uri: string): string {
  return fileURLToPath(uri)
}

export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths)
}

export function joinPath(...paths: string[]): string {
  return path.join(...paths)
}

export function dirnamePath(filePath: string): string {
  return path.dirname(filePath)
}

export function basenamePath(filePath: string): string {
  return path.basename(filePath)
}

export function extnamePath(filePath: string): string {
  return path.extname(filePath)
}

import * as path from "path"
