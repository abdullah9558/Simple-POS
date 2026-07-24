import { addLogSink, createConsoleSink, logger } from '../shared/logger'

let installed = false

export function initRendererLogging(): void {
  if (installed) return
  installed = true

  addLogSink(createConsoleSink())

  window.addEventListener('error', (event) => {
    logger.error(event.message || 'Unhandled window error', 'renderer', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logger.error(
      reason instanceof Error ? reason.message : 'Unhandled promise rejection',
      'renderer',
      reason,
    )
  })
}

export { logger }
