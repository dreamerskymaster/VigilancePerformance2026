/**
 * Logging utility for the vigilance study.
 * Provides consistent, formatted logging with timestamps.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('Task', 'Trial completed', { trialNumber: 1 })
 *   logger.error('API', 'Submit failed', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: unknown
}

/**
 * Format log entry for console output.
 */
const formatLog = (entry: LogEntry): string => {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`
  return `${prefix} ${entry.message}`
}

/**
 * Get current timestamp in ISO format.
 */
const getTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Logger instance with methods for each log level.
 */
export const logger = {
  debug: (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = { timestamp: getTimestamp(), level: 'debug', context, message, data }
      console.debug(formatLog(entry), data || '')
    }
  },
  
  info: (context: string, message: string, data?: unknown) => {
    const entry: LogEntry = { timestamp: getTimestamp(), level: 'info', context, message, data }
    console.info(formatLog(entry), data || '')
  },
  
  warn: (context: string, message: string, data?: unknown) => {
    const entry: LogEntry = { timestamp: getTimestamp(), level: 'warn', context, message, data }
    console.warn(formatLog(entry), data || '')
  },
  
  error: (context: string, message: string, data?: unknown) => {
    const entry: LogEntry = { timestamp: getTimestamp(), level: 'error', context, message, data }
    console.error(formatLog(entry), data || '')
  },
}

export default logger
