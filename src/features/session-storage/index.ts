import { ensureDirectories } from "../../storage"

export interface SessionStorageOptions {
  autoInitialize?: boolean
}

export function createSessionStorage(options: SessionStorageOptions = {}) {
  if (options.autoInitialize !== false) {
    ensureDirectories()
  }

  return {
    initialize: () => ensureDirectories(),
  }
}
