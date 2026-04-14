import type {
  AgentExecutionContext,
  AgentExecutionResult,
  PipelineMiddleware,
  DelegationClient,
  PipelineOptions,
} from './types'
import type { AgentName } from '../index'
import { getBus } from '../bus'
import { formatErrorResponse } from './output-formatters'
import { createLogger } from '../../utils/logger'

const logger = createLogger('agent-pipeline')

export class AgentPipeline {
  private middleware: PipelineMiddleware[] = []

  use(middleware: PipelineMiddleware): this {
    this.middleware.push(middleware)
    return this
  }

  getMiddleware(): PipelineMiddleware[] {
    return [...this.middleware]
  }

  async execute(
    agent: AgentName,
    task: string,
    client: DelegationClient,
    options: PipelineOptions = {},
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const depth = options.delegationDepth ?? 0

    let ctx: AgentExecutionContext = {
      agent,
      task,
      context: options.context,
      sessionID: undefined,
      parentSessionID: options.parentSessionID,
      delegationDepth: depth,
      enrichedPrompt: options.context ? `${task}\n\nAdditional context: ${options.context}` : task,
      metadata: { ...options.metadata },
      startTime,
    }

    getBus().publish('pipeline:start', { agent, task, depth }, 'pipeline')

    for (const mw of this.middleware) {
      if (mw.before) {
        try {
          ctx = await mw.before(ctx)
        } catch (err) {
          logger.error(`Middleware "${mw.name}" before-hook failed:`, err)
        }
      }
    }

    let result = await this.delegateToAgent(ctx, client)

    for (let i = this.middleware.length - 1; i >= 0; i--) {
      const mw = this.middleware[i]
      if (mw.after) {
        try {
          result = await mw.after(ctx, result)
        } catch (err) {
          logger.error(`Middleware "${mw.name}" after-hook failed:`, err)
        }
      }
    }

    getBus().publish(
      'pipeline:complete',
      {
        agent: result.agent,
        success: result.success,
        duration: result.duration,
      },
      'pipeline',
    )

    if (options.parentSessionID && result.output) {
      getBus().setState(
        options.parentSessionID,
        `last_${agent.toLowerCase()}_result`,
        { output: result.output, success: result.success, duration: result.duration },
        'pipeline',
      )
    }

    return result
  }

  private async delegateToAgent(
    ctx: AgentExecutionContext,
    client: DelegationClient,
  ): Promise<AgentExecutionResult> {
    try {
      const sessionResult = await client.session.create({
        body: {
          title: `${ctx.task.slice(0, 60)} (@${ctx.agent} subagent)`,
          parentID: ctx.parentSessionID,
        },
      } as any)

      const sessionData = sessionResult as any
      const sessionID = sessionData?.data?.id ?? sessionData?.id

      if (!sessionID) {
        return formatErrorResponse(ctx.agent, 'Failed to create child session', ctx)
      }

      ctx.sessionID = sessionID

      getBus().publish('session:created', { agent: ctx.agent, sessionID }, 'pipeline')

      await client.session.prompt({
        path: { id: sessionID },
        body: {
          parts: [{ type: 'text', text: ctx.enrichedPrompt }],
          agent: ctx.agent,
        },
      } as any)

      const messagesResult = await client.session.messages({
        path: { id: sessionID },
      } as any)

      const messages = (messagesResult as any)?.data ?? messagesResult
      const assistantMessages = Array.isArray(messages)
        ? messages.filter((m: any) => m.role === 'assistant')
        : []

      const lastAssistant = assistantMessages[assistantMessages.length - 1]
      const textParts =
        lastAssistant?.parts
          ?.filter((p: any) => p.type === 'text')
          ?.map((p: any) => p.text)
          ?.join('\n') ?? ''

      return {
        success: true,
        output: textParts || `Agent ${ctx.agent} completed the task. Session: ${sessionID}`,
        sessionID,
        agent: ctx.agent,
        duration: Date.now() - ctx.startTime,
        metadata: ctx.metadata,
      }
    } catch (error) {
      return formatErrorResponse(
        ctx.agent,
        error instanceof Error ? error.message : 'Unknown error during agent delegation',
        ctx,
      )
    }
  }
}

let defaultPipeline: AgentPipeline | null = null

export function getDefaultPipeline(): AgentPipeline {
  if (!defaultPipeline) {
    defaultPipeline = new AgentPipeline()
  }
  return defaultPipeline
}

export function resetDefaultPipeline(): void {
  defaultPipeline = null
}
