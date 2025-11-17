import * as Sentry from '@sentry/electron/main'

const isProd = process.defaultApp === false

function logFn(...args: unknown[]) {
  if (isProd) {
    Sentry.captureMessage(args.map(String).join(' '))
  } else {
    console.log(...args)
  }
}

function logErrorFn(err: unknown, ...rest: unknown[]) {
  if (isProd) {
    Sentry.captureException(err)
  } else {
    console.error(err, ...rest)
  }
}

const log = Object.assign(logFn, {
  info: (...args: unknown[]) => logFn(...args),
  error: (...args: unknown[]) => {
    const [err, ...rest] = args
    logErrorFn(err, ...rest)
  },
})

export default log
