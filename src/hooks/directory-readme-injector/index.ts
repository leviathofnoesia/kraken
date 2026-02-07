import type { Hooks } from '@opencode-ai/plugin'
import type { PluginInput } from '@opencode-ai/plugin'
import { readFileSync, existsSync } from 'node:fs'
import { SHOULD_LOG } from '../../utils/logger'

export interface DirectoryReadmeInjectorConfig {
  enabled?: boolean
}

export function createDirectoryReadmeInjector(
  _input: PluginInput,
  options?: { config?: DirectoryReadmeInjectorConfig },
): Hooks {
  const config = options?.config ?? { enabled: true }

  return {
    'chat.message': async (input, output) => {
      if (!config.enabled) return
      const readmePaths = ['README.md', 'readme.md', 'Readme.md']
      for (const readme of readmePaths) {
        if (existsSync(readme)) {
          try {
            const content = readFileSync(readme, 'utf-8')
            if (SHOULD_LOG) {
              console.log('[directory-readme-injector] Found README, injecting context')
            }

            // Inject README content into the output
            if (output.parts && Array.isArray(output.parts)) {
              const textPartIndex = output.parts.findIndex((p: any) => p.type === 'text')
              if (textPartIndex >= 0) {
                const textPart = output.parts[textPartIndex] as any
                const readmeContext = `\n\n---\n**Project README:**\n${content}\n---\n\n`
                output.parts[textPartIndex] = {
                  ...textPart,
                  text: `${textPart.text || ''}${readmeContext}`,
                }
              }
            }
          } catch {
            if (SHOULD_LOG) {
              console.log('[directory-readme-injector] Could not read README')
            }
          }
          break
        }
      }
    },
  }
}
