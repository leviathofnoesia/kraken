#!/usr/bin/env bun
import { readFileSync, existsSync } from 'node:fs'
import * as path from 'path'
import color from 'picocolors'
import { getHomeDir } from '../shared/home-dir'
import { verifyTargetAdapter } from '../universal/adapters'
import { isUniversalTarget, type UniversalTarget } from '../universal/targets'

export async function runStatus(options?: { target?: UniversalTarget }) {
  const target = options?.target ?? 'opencode'
  if (!isUniversalTarget(target)) {
    console.log(color.red(`✗ Unsupported target: ${target}`))
    return
  }

  if (target !== 'opencode') {
    runUniversalStatus(target)
    return
  }

  console.log(color.cyan('🐙 Kraken Code Status\n'))

  const home = getHomeDir()
  const opencodeConfigPath = path.join(home, '.config', 'opencode', 'opencode.json')
  const krakenConfigPath = path.join(home, '.config', 'opencode', 'kraken-code.json')

  // Check OpenCode config for plugin registration
  if (!existsSync(opencodeConfigPath)) {
    console.log(color.red('✗ OpenCode configuration not found'))
    console.log(color.dim('  Run: kraken-code init'))
    return
  }

  const opencodeConfig = JSON.parse(readFileSync(opencodeConfigPath, 'utf-8'))
  const isPluginRegistered = opencodeConfig.plugin?.includes('kraken-code') || false

  // Plugin Status
  console.log(color.bold('Plugin:'))
  if (isPluginRegistered) {
    console.log(color.green('  ✓ Registered: kraken-code'))
  } else {
    console.log(color.red('  ✗ Not registered'))
    console.log(color.dim('  Run: kraken-code init'))
  }

  // Check kraken-code config
  if (!existsSync(krakenConfigPath)) {
    console.log(color.yellow('\n⚠ Kraken Code configuration not found'))
    console.log(color.dim('  Run: kraken-code init'))
    return
  }

  const config = JSON.parse(readFileSync(krakenConfigPath, 'utf-8'))

  // Plugin Status
  console.log(color.bold('Plugin:'))
  console.log(color.green('  ✓ Registered: kraken-code'))

  // Default Agent
  if (config.default_agent) {
    console.log(color.bold('\nDefault Agent:'))
    console.log(`  ${config.default_agent}`)
  }

  // Agents Status
  if (config.agents) {
    const enabledAgents = Object.entries(config.agents)
      .filter(([_, agent]: [string, any]) => !agent.disable)
      .map(([name]) => name)
    if (enabledAgents.length > 0) {
      console.log(color.bold('\nEnabled Agents:'))
      console.log(`  ${enabledAgents.join(', ')}`)
    }
  }

  // Blitzkrieg Status
  if (config.blitzkrieg) {
    const status = config.blitzkrieg.enabled ? color.green('✓ Enabled') : color.red('✗ Disabled')
    console.log(color.bold('\nBlitzkrieg Mode:'))
    console.log(`  Status: ${status}`)
    console.log(color.dim("  Activate with: 'blitz' or 'blz'"))
  }

  // Learning Status
  const learningConfig = config.learning || config.memory
  if (learningConfig) {
    const status = learningConfig.enabled ? color.green('✓ Enabled') : color.red('✗ Disabled')
    console.log(color.bold('\nLearning:'))
    console.log(`  Status: ${status}`)
    console.log(`  Storage: ${learningConfig.storagePath || '~/.kraken/learning'}`)
  }

  // Modes Status
  if (config.modes) {
    const modeNames: string[] = []
    for (const [modeName, modeConfig] of Object.entries(config.modes)) {
      if (typeof modeConfig === 'object' && modeConfig && (modeConfig as any).enabled) {
        modeNames.push(modeName)
      }
    }
    if (modeNames.length > 0) {
      console.log(color.bold('\nActive Modes:'))
      console.log(`  ${modeNames.join(', ')}`)
    }
  }
}

function runUniversalStatus(target: Exclude<UniversalTarget, 'opencode'>) {
  console.log(color.cyan(`🐙 Kraken Universal Status (${target})\n`))

  const home = getHomeDir()
  const krakenConfigPath = path.join(home, '.config', 'kraken', 'kraken.json')
  const targetConfigPath = path.join(home, '.config', 'kraken', 'targets', `${target}.json`)

  console.log(color.bold('Bootstrap:'))
  if (existsSync(krakenConfigPath)) {
    console.log(color.green(`  ✓ Shared config: ${krakenConfigPath}`))
  } else {
    console.log(color.red(`  ✗ Missing shared config: ${krakenConfigPath}`))
  }

  if (existsSync(targetConfigPath)) {
    console.log(color.green(`  ✓ Target config: ${targetConfigPath}`))
  } else {
    console.log(color.red(`  ✗ Missing target config: ${targetConfigPath}`))
  }

  const adapter = verifyTargetAdapter(target)
  if (adapter.ok) {
    console.log(color.green(`\n✓ Host adapter configured: ${adapter.path}`))
  } else {
    console.log(color.red(`\n✗ Host adapter missing: ${adapter.path}`))
    console.log(color.dim(`  ${adapter.message}`))
    console.log(color.dim(`  Run: kraken-code init --target ${target}`))
  }
}
