import { describe, expect, test } from 'bun:test'
import { spawn } from 'node:child_process'
import type { UniversalTarget } from '../universal/targets'

interface JsonRpcResponse {
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

function findToolCallResponse(responses: JsonRpcResponse[]): JsonRpcResponse | undefined {
  return responses.find((response) => String(response.id) === '2')
}

async function runBridgeExchange(
  target: UniversalTarget,
  mode: 'standard' | 'strict',
): Promise<JsonRpcResponse[]> {
  return new Promise((resolve, reject) => {
    const initialize = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
    const callTool =
      '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"ast_grep_replace","arguments":{"pattern":"x","replacement":"y","language":"typescript"}}}'
    const command = `printf '%s\\n' '${initialize}' '${callTool}' | bun run src/cli/index.ts bridge start --protocol mcp --target ${target} --mode ${mode}`
    const child = spawn('bash', ['-lc', command], { stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`bridge exited with code ${code}: ${stderr}`))
        return
      }
      const combinedOutput = `${stdout}\n${stderr}`
      const responses: JsonRpcResponse[] = combinedOutput
        .split('\n')
        .map((line) => line.trim())
        .map((line) => {
          const start = line.indexOf('{')
          return start >= 0 ? line.slice(start) : ''
        })
        .filter((line) => line.startsWith('{'))
        .flatMap((line) => {
          try {
            return [JSON.parse(line) as JsonRpcResponse]
          } catch {
            return []
          }
        })
      resolve(responses)
    })

  })
}

describe('bridge e2e policy', () => {
  test(
    'strict blocks edit tools and standard does not block for all targets',
    async () => {
    const targets: UniversalTarget[] = ['opencode', 'codex', 'claude', 'cline', 'cursor', 'vscode', 'ci']

    for (const target of targets) {
      const strictResponses = await runBridgeExchange(target, 'strict')
      const strictCall = findToolCallResponse(strictResponses)
      expect(strictCall?.error?.code).toBe(-32001)

      const standardResponses = await runBridgeExchange(target, 'standard')
      const standardCall = findToolCallResponse(standardResponses)
      expect(standardCall?.error?.code).not.toBe(-32001)
    }
    },
    20_000,
  )
})
