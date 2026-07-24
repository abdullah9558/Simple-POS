import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { addLogSink, createConsoleSink, formatLogEntry, logger, type LogEntry } from '../src/shared/logger.ts'

const MAX_LOG_BYTES = 2 * 1024 * 1024

let initialized = false

export function initMainLogging(): void {
  if (initialized) return
  initialized = true

  addLogSink(createConsoleSink())

  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const logFile = path.join(logDir, 'main.log')

    addLogSink((entry: LogEntry) => {
      try {
        if (fs.existsSync(logFile) && fs.statSync(logFile).size > MAX_LOG_BYTES) {
          const rotated = path.join(logDir, 'main.prev.log')
          if (fs.existsSync(rotated)) fs.unlinkSync(rotated)
          fs.renameSync(logFile, rotated)
        }
        fs.appendFileSync(logFile, `${formatLogEntry(entry)}\n`, 'utf8')
      } catch {
        // ignore disk errors
      }
    })

    logger.info(`Logging to ${logFile}`, 'main')
  } catch (err) {
    logger.warn('File logging unavailable', 'main', err)
  }
}

export { logger }
