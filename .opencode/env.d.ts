/// <reference types="bun" />

declare module 'bun' {
  interface SpawnOptions {
    cwd?: string
    env?: Record<string, string | undefined>
    stdout?: 'pipe' | 'inherit' | 'ignore'
    stderr?: 'pipe' | 'inherit' | 'ignore'
    stdin?: 'pipe' | 'inherit' | 'ignore'
  }

  function spawn(command: string | URL, options?: SpawnOptions): ChildProcess
  function spawn(command: string[], options?: SpawnOptions): ChildProcess

  interface ChildProcess {
    readonly pid: number
    readonly exited: boolean
    readonly exitCode: number | null
    readonly signalCode: number | null
    stdout: ReadableStream<Uint8Array> | null
    stderr: ReadableStream<Uint8Array> | null
    stdin: WritableStream<Uint8Array> | null

    kill(signal?: string | number): boolean
    terminate(): boolean

    // Bun-specific
    readonly isHypothetical: boolean
  }
}

declare module 'node:process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        [key: string]: string | undefined
      }
    }
  }
}
