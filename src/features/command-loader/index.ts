export * from "./types"
export * from "./discovery"
export * from "./loader"
export * from "./processor"

import { CommandLoader } from "./loader"

let loader: CommandLoader | null = null

export async function initializeCommandLoader() {
  if (!loader) {
    loader = new CommandLoader()
    await loader.loadAll()
  }
  return loader
}

export async function getCommands() {
  const commandLoader = await initializeCommandLoader()
  return commandLoader.listCommands()
}

export function getCommandLoader(): CommandLoader | null {
  return loader
}

export function resetCommandLoader() {
  loader = null
}
