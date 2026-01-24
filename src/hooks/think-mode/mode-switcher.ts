import type { ModeConfig, ModeActivation } from "./modes"
import { getModeConfig } from "./modes"

export interface ModeSwitcherOptions {
  enabled?: boolean
  onModeActivate?: (activation: ModeActivation) => void
  onModeDeactivate?: (mode: string) => void
}

interface ActiveMode {
  name: string
  activatedAt: number
  config: ModeConfig
}

const activeModes: Map<string, ActiveMode> = new Map()

export function activateMode(
  sessionID: string,
  modeName: string,
  options?: ModeSwitcherOptions
): boolean {
  const config = getModeConfig(modeName)
  if (!config || !config.enabled) {
    console.log(`[mode-switcher] Mode "${modeName}" not found or disabled`)
    return false
  }

  const activeMode: ActiveMode = {
    name: modeName,
    activatedAt: Date.now(),
    config,
  }

  activeModes.set(sessionID, activeMode)
  console.log(`[mode-switcher] Activated mode "${modeName}" for session ${sessionID}`)

  if (options?.onModeActivate) {
    options.onModeActivate({
      mode: modeName,
      keyword: "",
    })
  }

  return true
}

export function deactivateMode(sessionID: string): void {
  const activeMode = activeModes.get(sessionID)
  if (activeMode) {
    console.log(`[mode-switcher] Deactivated mode "${activeMode.name}" for session ${sessionID}`)
    activeModes.delete(sessionID)

    // Callback for mode deactivation (optional)
  }
}

export function getActiveMode(sessionID: string): ActiveMode | undefined {
  return activeModes.get(sessionID)
}

export function isModeActive(sessionID: string, modeName: string): boolean {
  const activeMode = activeModes.get(sessionID)
  return activeMode?.name === modeName
}

export function clearAllModes(): void {
  activeModes.clear()
}

export function getActiveModeCount(): number {
  return activeModes.size
}
