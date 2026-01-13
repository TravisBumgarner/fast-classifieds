// import * as Sentry from '@sentry/electron/main'
import electronLog from 'electron-log/main'

// const isProd = !process.defaultApp
electronLog.initialize()

// function toMessage(args: unknown[]): string {
//   return args
//     .map((a) => {
//       if (a instanceof Error) return a.stack || a.message
//       if (typeof a === 'object' && a !== null) {
//         try {
//           return JSON.stringify(a)
//         } catch {
//           return String(a)
//         }
//       }
//       return String(a)
//     })
//     .join(' ')
// }

// function sendToSentry(level: 'info' | 'warning' | 'error', args: unknown[]) {
//   if (!isProd) return
//   if (level === 'error' && args[0] instanceof Error) {
//     Sentry.captureException(args[0] as Error)
//     if (args.length > 1) {
//       Sentry.captureMessage(toMessage(args.slice(1)), 'info')
//     }
//   } else {
//     Sentry.captureMessage(toMessage(args), level)
//   }
// }

function write(level: 'info' | 'warn' | 'error', args: unknown[]) {
  switch (level) {
    case 'info':
      electronLog.info('[main]', ...args)
      break
    case 'warn':
      electronLog.warn('[main]', ...args)
      break
    case 'error':
      electronLog.error('[main]', ...args)
      break
  }

  const consoleFn = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log
  consoleFn(...args)
  // if (!isProd) {
  // } else {
  //   const sentryLevel = level === 'warn' ? 'warning' : level
  //   //     sendToSentry(sentryLevel as 'info' | 'warning' | 'error', args)
  //   consoleFn(...args)
  // }
}

const logger = {
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
}

export default logger
