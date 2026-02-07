export const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === '1' ||
  process.env.DEBUG === '1' ||
  process.env.KRAKEN_LOG === '1'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private isDebug: boolean

  constructor(private module: string) {
    this.isDebug = process.env.ANTIGRAVITY_DEBUG === '1' || process.env.DEBUG === '1'
  }

  private format(level: LogLevel, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${this.module}] [${level}] ${args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
      .join(' ')}`
  }

  debug(...args: any[]): void {
    if (this.isDebug) {
      console.log(this.format(LogLevel.DEBUG, ...args))
    }
  }

  info(...args: any[]): void {
    console.log(this.format(LogLevel.INFO, ...args))
  }

  warn(...args: any[]): void {
    console.warn(this.format(LogLevel.WARN, ...args))
  }

  error(...args: any[]): void {
    console.error(this.format(LogLevel.ERROR, ...args))
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module)
}
