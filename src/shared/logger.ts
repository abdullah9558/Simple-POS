type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(level: LogLevel): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const min = env?.POS_LOG_LEVEL as LogLevel | undefined
  const threshold = min && LEVEL_ORDER[min] !== undefined ? LEVEL_ORDER[min] : LEVEL_ORDER.info
  return LEVEL_ORDER[level] >= threshold
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? `[${entry.context}] ` : ''
  const data = entry.data !== undefined ? ` ${safeSerialize(entry.data)}` : ''
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${ctx}${entry.message}${data}`
}

function safeSerialize(data: unknown): string {
  try {
    if (data instanceof Error) {
      return JSON.stringify({ name: data.name, message: data.message, stack: data.stack })
    }
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

export type LogSink = (entry: LogEntry) => void

let sinks: LogSink[] = []

export function addLogSink(sink: LogSink): void {
  sinks.push(sink)
}

export function clearLogSinks(): void {
  sinks = []
}

function emit(level: LogLevel, message: string, context?: string, data?: unknown): void {
  if (!shouldLog(level)) return
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }
  for (const sink of sinks) {
    try {
      sink(entry)
    } catch {
      // never throw from logging
    }
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: unknown) => emit('debug', message, context, data),
  info: (message: string, context?: string, data?: unknown) => emit('info', message, context, data),
  warn: (message: string, context?: string, data?: unknown) => emit('warn', message, context, data),
  error: (message: string, context?: string, data?: unknown) => emit('error', message, context, data),
  child: (context: string) => ({
    debug: (message: string, data?: unknown) => emit('debug', message, context, data),
    info: (message: string, data?: unknown) => emit('info', message, context, data),
    warn: (message: string, data?: unknown) => emit('warn', message, context, data),
    error: (message: string, data?: unknown) => emit('error', message, context, data),
  }),
}

/** Console sink for development / Electron main. */
export function createConsoleSink(): LogSink {
  return (entry) => {
    const line = formatEntry(entry)
    if (entry.level === 'error') console.error(line)
    else if (entry.level === 'warn') console.warn(line)
    else console.log(line)
  }
}

export function formatLogEntry(entry: LogEntry): string {
  return formatEntry(entry)
}
