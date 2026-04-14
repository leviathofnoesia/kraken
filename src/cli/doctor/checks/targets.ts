import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getHomeDir } from '../../../shared/home-dir'
import { verifyTargetAdapter } from '../../../universal/adapters'
import type { CheckDefinition, CheckResult } from '../types'
import { CHECK_IDS, CHECK_NAMES } from '../constants'

type Target = 'codex' | 'claude' | 'cline' | 'cursor' | 'vscode' | 'ci'

function getTargetConfigPath(target: Target): string {
  return join(getHomeDir(), '.config', 'kraken', 'targets', `${target}.json`)
}

export async function checkUniversalBootstrap(target: Target): Promise<CheckResult> {
  const targetPath = getTargetConfigPath(target)
  if (!existsSync(targetPath)) {
    return {
      name: CHECK_NAMES[CHECK_IDS.UNIVERSAL_BOOTSTRAP],
      status: 'fail',
      message: `Target bootstrap missing for ${target}`,
      details: [`Run: kraken-code init --target ${target}`],
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.UNIVERSAL_BOOTSTRAP],
    status: 'pass',
    message: `Bootstrap present for ${target}`,
    details: [targetPath],
  }
}

export async function checkBridgeExecutable(): Promise<CheckResult> {
  const candidatePaths = process.env.PATH?.split(':') || []
  const found = candidatePaths.some((dir) => existsSync(join(dir, 'kraken-code')))

  if (!found) {
    return {
      name: CHECK_NAMES[CHECK_IDS.BRIDGE_BINARY],
      status: 'warn',
      message: 'kraken-code not found on PATH',
      details: ['Ensure kraken-code is installed globally or add it to PATH'],
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.BRIDGE_BINARY],
    status: 'pass',
    message: 'kraken-code found on PATH',
  }
}

export async function checkHostAdapterRegistration(target: Target): Promise<CheckResult> {
  const verification = verifyTargetAdapter(target)
  if (verification.ok) {
    return {
      name: CHECK_NAMES[CHECK_IDS.HOST_ADAPTER],
      status: 'pass',
      message: `${target} adapter configured`,
      details: [verification.path],
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.HOST_ADAPTER],
    status: 'fail',
    message: `${target} adapter not configured`,
    details: [verification.path, `Run: kraken-code init --target ${target}`],
  }
}

export function getTargetCheckDefinitions(target?: string): CheckDefinition[] {
  if (!target || target === 'opencode') {
    return []
  }

  const typedTarget = target as Target
  const checks: CheckDefinition[] = [
    {
      id: CHECK_IDS.UNIVERSAL_BOOTSTRAP,
      name: CHECK_NAMES[CHECK_IDS.UNIVERSAL_BOOTSTRAP],
      category: 'installation',
      check: () => checkUniversalBootstrap(typedTarget),
      critical: true,
    },
    {
      id: CHECK_IDS.BRIDGE_BINARY,
      name: CHECK_NAMES[CHECK_IDS.BRIDGE_BINARY],
      category: 'dependencies',
      check: checkBridgeExecutable,
      critical: false,
    },
  ]

  checks.push({
    id: CHECK_IDS.HOST_ADAPTER,
    name: CHECK_NAMES[CHECK_IDS.HOST_ADAPTER],
    category: 'configuration',
    check: () => checkHostAdapterRegistration(typedTarget),
    critical: true,
  })

  return checks
}
