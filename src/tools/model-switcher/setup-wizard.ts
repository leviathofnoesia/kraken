import { select, confirm, isCancel } from '@clack/prompts'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { generateOptimalPresets, type ProviderSubscription } from './catalog'
import { saveAgentConfig, savePresets, saveSetupComplete } from './config-manager'

export async function runSetupWizard(worktree: string): Promise<boolean> {
  console.log(`
  🌊 Kraken Code Model Switcher Setup
  
  Let's configure your agent models based on your available subscriptions.
  This will create optimal presets for your setup.
  `)

  const subscriptions = await selectProviderSubscriptions()

  console.log(
    `\n  Configuring for: ${subscriptions.map((s) => s.provider.toUpperCase()).join(', ')}\n`,
  )

  const presets = generateOptimalPresets(subscriptions)

  await saveAgentConfig(worktree, presets.balanced)
  await savePresets(worktree, presets)
  await saveSetupComplete(worktree, subscriptions)

  console.log(`\n  ✅ Setup Complete!\n`)
  console.log(`  Your agents are configured with the 'balanced' preset.`)
  console.log(`  Available presets: performance, quality, balanced, economy\n`)
  console.log(`  Use /models to customize your configuration.\n`)

  return true
}

async function selectProviderSubscriptions(): Promise<ProviderSubscription[]> {
  const subscriptions: ProviderSubscription[] = []

  const hasAnthropic = await confirm({
    message: 'Do you have Anthropic Claude access?',
  })

  if (!isCancel(hasAnthropic) && hasAnthropic) {
    const tier = await select({
      message: 'Anthropic subscription tier',
      options: [
        { value: 'free', label: 'Free (Claude Haiku)' },
        { value: 'pro', label: 'Claude Pro' },
        { value: 'max20', label: 'Max20' },
      ],
    })

    if (!isCancel(tier)) {
      subscriptions.push({ provider: 'anthropic', tier: tier as ProviderSubscription['tier'] })
    }
  }

  const hasOpenAI = await confirm({
    message: 'Do you have OpenAI ChatGPT access?',
  })

  if (!isCancel(hasOpenAI) && hasOpenAI) {
    const tier = await select({
      message: 'OpenAI subscription tier',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'plus', label: 'Plus' },
        { value: 'team', label: 'Team/Enterprise' },
      ],
    })

    if (!isCancel(tier)) {
      subscriptions.push({ provider: 'openai', tier: tier as ProviderSubscription['tier'] })
    }
  }

  const hasGoogle = await confirm({
    message: 'Do you have Google Antigravity access?',
  })

  if (!isCancel(hasGoogle) && hasGoogle) {
    const tier = await select({
      message: 'Google subscription tier',
      options: [
        { value: 'free', label: 'Free tier' },
        { value: 'paid', label: 'Paid (Antigravity)' },
      ],
    })

    if (!isCancel(tier)) {
      subscriptions.push({ provider: 'google', tier: tier as ProviderSubscription['tier'] })
    }
  }

  if (subscriptions.length === 0) {
    console.log('  ⚠️  No subscriptions selected. Using free models.\n')
    subscriptions.push({ provider: 'anthropic', tier: 'free' })
  }

  return subscriptions
}

export async function checkSetupNeeded(worktree: string): Promise<boolean> {
  const configPath = join(worktree, '.opencode', 'config.json')
  const content = await readFile(configPath, 'utf-8')
  const config = JSON.parse(content)
  return !config.modelSwitcher?.setupComplete
}
