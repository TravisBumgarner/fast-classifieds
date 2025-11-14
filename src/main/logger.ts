import * as Sentry from '@sentry/electron/main'

const isProd = process.defaultApp === false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logFn(...args: any[]) {
  if (isProd) {
    Sentry.captureMessage(args.map(String).join(' '))
  } else {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logErrorFn(err: any, ...rest: any[]) {
  if (isProd) {
    Sentry.captureException(err)
  } else {
    // eslint-disable-next-line no-console
    console.error(err, ...rest)
  }
}

const log = Object.assign(logFn, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...args: any[]) => logFn(...args),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => {
    const [err, ...rest] = args
    logErrorFn(err, ...rest)
  },
})

export default log
