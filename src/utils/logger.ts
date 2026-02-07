/**
 * Enhanced Logger with TUI Output Gating
 *
 * Prevents hook output from showing through OpenCode TUI while
 * preserving critical error reporting capabilities.
 *
 * USAGE GUIDE:
 * 1. Import: import { createLogger } from '../../utils/logger'
 * 2. Create instance: const logger = createLogger('hook-name')
 * 3. Debug info: logger.debug('message')  // GATED - only when DEBUG=1
 * 4. Warnings: logger.warn('message')      // GATED - only when DEBUG=1
 * 5. Errors: logger.error('message')     // NEVER GATED - always visible
 *
 * DEBUG ENVIRONMENT:
 *   Set DEBUG=1 or ANTIGRAVITY_DEBUG=1 or KRAKEN_LOG=1
 *   This enables logger.debug/warn/info for development
 *
 * TUI LEAKAGE PREVENTION:
 *   All console.log/warn/info statements in hooks are gated by SHOULD_LOG
 *   console.error is NEVER gated for critical errors
 *   This prevents output from appearing in OpenCode TUI
 */

/**
 * Enable all output (for debugging/testing)
 * Set to true when:
 * - ANTIGRAVITY_DEBUG=1 (kraken-code specific debug)
 * - DEBUG=1 (general debug)
 * - KRAKEN_LOG=1 (kraken-code logging)
 */
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
    this.isDebug = SHOULD_LOG
  }

  private format(level: LogLevel, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${this.module}] [${level}] ${args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
      .join(' ')}`
  }

  /**
   * Debug output - ALWAYS gated
   * Only shows when SHOULD_LOG=true (development/testing)
   */
  debug(...args: any[]): void {
    if (this.isDebug) {
      console.log(this.format(LogLevel.DEBUG, ...args))
    }
  }

  /**
   * Info output - GATED in production
   * Shows when SHOULD_LOG=true, but operational messages should be suppressed in normal use
   */
  info(...args: any[]): void {
    if (this.isDebug) {
      console.log(this.format(LogLevel.INFO, ...args))
    }
  }

  /**
   * Warning output - GATED unless critical
   * Shows when SHOULD_LOG=true, but warnings are suppressed in normal use
   */
  warn(...args: any[]): void {
    if (this.isDebug) {
      console.warn(this.format(LogLevel.WARN, ...args))
    }
  }

  /**
   * Error output - NEVER gated
   * Critical errors MUST always be visible, even in production
   * This prevents silent failures and ensures users see real errors
   */
  error(...args: any[]): void {
    console.error(this.format(LogLevel.ERROR, ...args))
  }

  /**
   * Critical error - NEVER gated, always visible
   * For emergency conditions that require immediate user attention
   * Example: Memory exhaustion, session crash, critical security issues
   */
  critical(...args: any[]): void {
    console.error(this.format(LogLevel.ERROR, ...args))
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module)
}

/**
 * Helper to check if logging is enabled
 * Use this to conditionally execute expensive logging operations
 */
export function isLoggingEnabled(): boolean {
  return SHOULD_LOG
}
