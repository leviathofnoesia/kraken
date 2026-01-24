
export type CommandHandler = (...args: any[]) => Promise<any>

export interface Command {
  id: string
  description: string
  handler: CommandHandler
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map()

  registerCommand(id: string, description: string, handler: CommandHandler) {
    this.commands.set(id, { id, description, handler })
  }

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    const command = this.commands.get(id)
    if (!command) {
      throw new Error(`Command not found: ${id}`)
    }
    return command.handler(...args)
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values())
  }
}

export const commandRegistry = new CommandRegistry()
