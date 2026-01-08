// rendererLogger.ts

import * as Sentry from '@sentry/electron/renderer'
import log from 'electron-log/renderer'

const isBundled = import.meta.env.PROD

function toMessage(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return a.stack || a.message
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a)
        } catch {
          return String(a)
        }
      }
      return String(a)
    })
    .join(' ')
}

// function sendToSentry(level: 'info' | 'warning' | 'error', args: unknown[]) {
//   if (!isBundled) return

//   if (level === 'error' && args[0] instanceof Error) {
//     Sentry.captureException(args[0] as Error)

//     if (args.length > 1) {
//       Sentry.captureMessage(toMessage(args.slice(1)), 'info')
//     }
//     return
//   }

//   Sentry.captureMessage(toMessage(args), level)
// }

function write(level: 'info' | 'warn' | 'error', args: unknown[]) {
  // Always log inside renderer via electron-log
  switch (level) {
    case 'info':
      log.info('[renderer]', ...args)
      break
    case 'warn':
      log.warn('[renderer]', ...args)
      break
    case 'error':
      log.error('[renderer]', ...args)
      break
  }

  // Always console-log when NOT bundled (dev)
  if (!isBundled) {
    // biome-ignore lint/suspicious/noConsole: it's fine.
    const fn = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log
    fn(...args)
  }

  // // Send to Sentry only in production
  // if (isBundled) {
  //   const sentryLevel = level === 'warn' ? 'warning' : level
  //   sendToSentry(sentryLevel as 'info' | 'warning' | 'error', args)
  // }
}

const logger = {
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
}

export default logger
