/**
 * Signal: editFileCount
 * Counts distinct files edited in recent messages.
 * Normalized against a ceiling of 8 files.
 */

import type { SignalContext, SignalValue } from '../types'

const CEILING = 8

export function extractEditFileCount(ctx: SignalContext): SignalValue {
  const uniqueFiles = new Set(ctx.recentEdits.map((e) => e.filePath))
  const raw = uniqueFiles.size
  const value = Math.min(raw / CEILING, 1.0)

  return {
    name: 'editFileCount',
    value,
    confidence: raw > 0 ? 0.9 : 0.3,
  }
}
