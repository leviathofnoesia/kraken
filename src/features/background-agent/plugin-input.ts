import type { PluginInput } from '@opencode-ai/plugin'

let input: PluginInput | null = null

export function setPluginInput(pluginInput: PluginInput): void {
  input = pluginInput
}

export function getPluginInput(): PluginInput | null {
  return input
}
