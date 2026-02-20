#!/usr/bin/env bun
import color from 'picocolors'
import { startMcpBridge } from '../bridge/mcp-server'
import { isUniversalTarget, type UniversalMode, type UniversalTarget } from '../universal/targets'

export interface BridgeStartOptions {
  protocol?: 'mcp'
  target?: UniversalTarget
  mode?: UniversalMode
}

export async function runBridgeStart(options: BridgeStartOptions = {}): Promise<void> {
  const protocol = options.protocol ?? 'mcp'
  const target = options.target ?? 'opencode'
  const mode = options.mode ?? 'standard'

  if (protocol !== 'mcp') {
    console.error(color.red(`Unsupported protocol: ${protocol}`))
    process.exit(1)
  }

  if (!isUniversalTarget(target)) {
    console.error(color.red(`Unsupported target: ${target}`))
    process.exit(1)
  }

  if (process.stderr.writable) {
    process.stderr.write(`[kraken-bridge] Starting MCP bridge on stdio (target=${target}, mode=${mode})\n`)
  }

  await startMcpBridge({ target, mode })
}
