import type { LoadedCommand, CommandScope, CommandLoaderOptions } from './types'
import { loadCommandsFromDir, getDefaultCommandPaths } from './discovery'
import { createLogger } from '../../utils/logger'

const SCOPE_PRIORITY: CommandScope[] = [
  'builtin',
  'user',
  'opencode',
  'opencode-project',
  'project',
  'skill',
]
const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === '1' ||
  process.env.DEBUG === '1' ||
  process.env.KRAKEN_LOG === '1'
const logger = createLogger('command-loader')

export class CommandLoader {
  private commands: Map<string, LoadedCommand> = new Map()
  private options: CommandLoaderOptions

  constructor(options: CommandLoaderOptions = {}) {
    this.options = options
  }

  async loadAll(): Promise<Map<string, LoadedCommand>> {
    const paths = getDefaultCommandPaths()

    const loaders: Promise<LoadedCommand[]>[] = []

    if (!this.isScopeDisabled('user')) {
      const userDir = this.options.userCommandsDir || paths.user
      loaders.push(loadCommandsFromDir(userDir, 'user'))
    }

    if (!this.isScopeDisabled('project')) {
      const projectDir = this.options.projectCommandsDir || paths.project
      loaders.push(loadCommandsFromDir(projectDir, 'project'))
    }

    if (!this.isScopeDisabled('opencode')) {
      const opencodeGlobalDir = this.options.opencodeGlobalCommandsDir || paths.opencodeGlobal
      loaders.push(loadCommandsFromDir(opencodeGlobalDir, 'opencode'))
    }

    if (!this.isScopeDisabled('opencode-project')) {
      const opencodeProjectDir = this.options.opencodeProjectCommandsDir || paths.opencodeProject
      loaders.push(loadCommandsFromDir(opencodeProjectDir, 'opencode-project'))
    }

    const allCommands = await Promise.all(loaders)
    const flattened = allCommands.flat()

    for (const command of flattened) {
      this.registerCommand(command)
    }

    if (SHOULD_LOG) {
      logger.debug(`Loaded ${this.commands.size} commands from ${allCommands.length} sources`)
    }

    return this.commands
  }

  registerCommand(command: LoadedCommand): void {
    const existing = this.commands.get(command.name)

    if (existing) {
      const currentPriority = SCOPE_PRIORITY.indexOf(command.scope)
      const existingPriority = SCOPE_PRIORITY.indexOf(existing.scope)

      if (currentPriority > existingPriority) {
        this.commands.set(command.name, command)
        if (SHOULD_LOG) {
          logger.debug(`Overriding ${command.name} from ${existing.scope} with ${command.scope}`)
        }
      }
    } else {
      this.commands.set(command.name, command)
    }
  }

  getCommand(name: string): LoadedCommand | undefined {
    return this.commands.get(name)
  }

  listCommands(): LoadedCommand[] {
    return Array.from(this.commands.values())
  }

  clear(): void {
    this.commands.clear()
  }

  private isScopeDisabled(scope: CommandScope): boolean {
    return this.options.disabledScopes?.includes(scope) || false
  }
}

let globalLoader: CommandLoader | null = null

export async function getGlobalLoader(): Promise<CommandLoader> {
  if (!globalLoader) {
    globalLoader = new CommandLoader()
    await globalLoader.loadAll()
  }
  return globalLoader
}

export function resetGlobalLoader(): void {
  globalLoader = null
}
