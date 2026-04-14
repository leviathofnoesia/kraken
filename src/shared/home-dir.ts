import { mkdirSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

function canWrite(dir: string): boolean {
  const probeDir = join(dir, '.kraken-write-probe')
  try {
    mkdirSync(probeDir, { recursive: true })
    rmSync(probeDir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

export function getHomeDir(): string {
  const preferred = process.env.HOME || homedir()
  if (canWrite(preferred)) {
    return preferred
  }

  const fallback = join(tmpdir(), 'kraken-home')
  mkdirSync(fallback, { recursive: true })
  return fallback
}
