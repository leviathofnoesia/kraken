import type { CheckResult, CheckDefinition } from '../types'
import { CHECK_IDS, CHECK_NAMES, MIN_OPENCODE_VERSION, PACKAGE_NAME } from '../constants'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

async function getInstalledVersion(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('npm', ['list', PACKAGE_NAME, '--json', '--depth=0'], {
      timeout: 10000,
    })
    const data = JSON.parse(stdout)
    const version = data?.dependencies?.[PACKAGE_NAME]?.version
    return version ?? null
  } catch {
    return null
  }
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('npm', ['view', PACKAGE_NAME, 'version'], {
      timeout: 15000,
    })
    return stdout.trim() || null
  } catch {
    return null
  }
}

export async function checkVersion(): Promise<CheckResult> {
  const [installed, latest] = await Promise.all([getInstalledVersion(), getLatestVersion()])

  if (!installed && !latest) {
    return {
      name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
      status: 'warn',
      message: 'Could not determine plugin version (npm unavailable or package not published)',
      details: [`Minimum required: ${MIN_OPENCODE_VERSION}`],
    }
  }

  if (!installed) {
    return {
      name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
      status: 'warn',
      message: 'Plugin not found in npm list — may be linked locally',
      details: [
        `Available on npm: ${latest ?? 'unknown'}`,
        `Minimum required: ${MIN_OPENCODE_VERSION}`,
      ],
    }
  }

  const details = [`Installed: v${installed}`, `Minimum required: ${MIN_OPENCODE_VERSION}`]

  if (latest && latest !== installed) {
    details.push(`Latest available: v${latest}`)
    return {
      name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
      status: 'warn',
      message: `Plugin v${installed} installed (v${latest} available)`,
      details,
    }
  }

  return {
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    status: 'pass',
    message: `Plugin v${installed} is up to date`,
    details,
  }
}

export function getVersionCheckDefinition(): CheckDefinition {
  return {
    id: CHECK_IDS.VERSION_STATUS,
    name: CHECK_NAMES[CHECK_IDS.VERSION_STATUS],
    category: 'updates',
    check: checkVersion,
    critical: false,
  }
}
