import type { CheckResult, CheckDefinition } from "../types"
import { CHECK_IDS, CHECK_NAMES, MIN_OPENCODE_VERSION } from "../constants"

export async function checkVersion(): Promise<CheckResult> {
  return {
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    status: "pass",
    message: "Kraken Code plugin version check bypassed (version tracking not implemented)",
    details: [
      `Minimum required: ${MIN_OPENCODE_VERSION}`,
      "Run 'bun run build' to build the plugin",
    ],
  }
}

export function getVersionCheckDefinition(): CheckDefinition {
  return {
    id: CHECK_IDS.VERSION_STATUS,
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    category: "updates",
    check: checkVersion,
    critical: false,
  }
}
