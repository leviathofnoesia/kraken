import type { LoadedCommand, CommandDefinition, CommandTemplateContext } from './types'

export function processCommandTemplate(
  command: LoadedCommand,
  context: CommandTemplateContext = {},
): string {
  const { definition } = command
  let template = definition.template

  template = `<command-instruction>\n${template}\n</command-instruction>`

  if (context.arguments !== undefined) {
    template = template.replace(/\$ARGUMENTS/g, context.arguments)
  }

  for (const [key, value] of Object.entries(context)) {
    if (key === 'arguments') continue

    const placeholder = `\$\{${key}\}`
    template = template.replace(new RegExp(placeholder, 'g'), String(value))
  }

  return template
}

export function wrapCommandForExecution(
  command: LoadedCommand,
  userRequest: string,
  context: CommandTemplateContext = {},
): {
  instruction: string
  agent?: string
  model?: string
  subtask?: boolean
} {
  const { definition } = command

  context.arguments = userRequest

  const instruction = processCommandTemplate(command, context)

  return {
    instruction,
    agent: definition.agent,
    model: definition.model,
    subtask: definition.subtask,
  }
}

export function getArgumentPlaceholder(command: LoadedCommand): string {
  if (command.definition.argumentHint) {
    return command.definition.argumentHint
  }
  return '[arguments]'
}

export function formatCommandHelp(command: LoadedCommand): string {
  const { definition } = command
  const parts: string[] = []

  parts.push(`/${command.name}`)
  if (definition.description) {
    parts.push(`- ${definition.description}`)
  }
  if (definition.agent) {
    parts.push(`(agent: ${definition.agent})`)
  }
  if (definition.model) {
    parts.push(`(model: ${definition.model})`)
  }

  return parts.join(' ')
}

export function parseUserRequest(userInput: string, commandPrefix: string): string | null {
  const trimmedInput = userInput.trim()

  if (!trimmedInput.startsWith(`/${commandPrefix}`)) {
    return null
  }

  const afterPrefix = trimmedInput.slice(commandPrefix.length + 1)
  return afterPrefix.trim()
}

export function detectCommandInInput(
  userInput: string,
  availableCommands: LoadedCommand[],
): LoadedCommand | null {
  const trimmedInput = userInput.trim()

  for (const command of availableCommands) {
    const prefix = `/${command.name}`

    if (trimmedInput.startsWith(prefix)) {
      const afterPrefix = trimmedInput.slice(prefix.length)

      if (afterPrefix === '' || afterPrefix.startsWith(' ')) {
        return command
      }
    }
  }

  return null
}
