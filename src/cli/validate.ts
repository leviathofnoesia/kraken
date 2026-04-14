#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import color from 'picocolors'
import { createBridgeTools, handleMcpRequest } from '../bridge/mcp-server'
import { getTargetAdapterPath } from '../universal/adapters'
import { isUniversalTarget, type UniversalTarget } from '../universal/targets'

type NonOpenCodeTarget = Exclude<UniversalTarget, 'opencode'>

export interface ValidateOptions {
  target?: UniversalTarget
  json?: boolean
}

export interface ValidateResult {
  success: boolean
  target: UniversalTarget
  checks: Array<{ name: string; ok: boolean; message: string }>
}

function validateAdapterSchema(target: NonOpenCodeTarget): { ok: boolean; message: string } {
  const adapterPath = getTargetAdapterPath(target)
  if (!existsSync(adapterPath)) {
    return {
      ok: false,
      message: `Adapter config missing: ${adapterPath}`,
    }
  }

  const parsed = JSON.parse(readFileSync(adapterPath, 'utf-8')) as Record<string, any>
  if (target === 'ci') {
    const ok = parsed.transport === 'stdio' && parsed.server?.command === 'kraken-code'
    return {
      ok,
      message: ok
        ? `CI manifest valid (${adapterPath})`
        : `Invalid CI manifest schema (${adapterPath})`,
    }
  }

  const mcpServers = (parsed.mcpServers as Record<string, any>) || {}
  const dotted = (parsed['mcp.servers'] as Record<string, any>) || {}
  const server = mcpServers.kraken || dotted.kraken
  const ok = server?.command === 'kraken-code'
  return {
    ok,
    message: ok ? `Adapter schema valid (${adapterPath})` : `Adapter schema invalid (${adapterPath})`,
  }
}

async function validateBridgeLaunchability(target: UniversalTarget): Promise<{ ok: boolean; message: string }> {
  const tools = createBridgeTools()

  const init = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' }, tools, {
    target,
    mode: 'standard',
  })
  if (!init?.result) {
    return {
      ok: false,
      message: 'Bridge initialize failed',
    }
  }

  const strictCall = await handleMcpRequest(
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'ast_grep_replace',
        arguments: { pattern: 'x', replacement: 'y', language: 'typescript' },
      },
    },
    tools,
    { target, mode: 'strict' },
  )

  const ok = strictCall?.error?.code === -32001
  return {
    ok,
    message: ok
      ? 'Bridge policy check passed (strict mode blocks edit tools)'
      : 'Bridge policy check failed (strict mode did not block edit tool)',
  }
}

export async function runValidate(options: ValidateOptions = {}): Promise<ValidateResult> {
  const target = options.target ?? 'opencode'
  if (!isUniversalTarget(target)) {
    return {
      success: false,
      target: 'opencode',
      checks: [{ name: 'target', ok: false, message: `Unsupported target: ${target}` }],
    }
  }

  const checks: ValidateResult['checks'] = []

  if (target !== 'opencode') {
    const adapterCheck = validateAdapterSchema(target)
    checks.push({ name: 'adapter-schema', ok: adapterCheck.ok, message: adapterCheck.message })
  } else {
    checks.push({
      name: 'adapter-schema',
      ok: true,
      message: 'Adapter schema check skipped for opencode target',
    })
  }

  const bridgeCheck = await validateBridgeLaunchability(target)
  checks.push({ name: 'bridge-launchability', ok: bridgeCheck.ok, message: bridgeCheck.message })

  return {
    success: checks.every((check) => check.ok),
    target,
    checks,
  }
}

export async function runValidateCommand(options: ValidateOptions = {}): Promise<void> {
  const result = await runValidate(options)
  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.success ? 0 : 1)
  }

  console.log(color.cyan(`\nKraken Validate (${result.target})`))
  for (const check of result.checks) {
    const symbol = check.ok ? color.green('✓') : color.red('✗')
    console.log(`${symbol} ${check.name}: ${check.message}`)
  }
  process.exit(result.success ? 0 : 1)
}

if (import.meta.main) {
  runValidateCommand()
}
