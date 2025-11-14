import * as Sentry from '@sentry/electron/renderer'

const isBundled = import.meta.env.PROD

// eslint-disable-next-line no-console
console.log('is bundled:', isBundled)

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...args: any[]) => {
    if (isBundled) {
      Sentry.captureMessage(args.map(String).join(' '))
    } else {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (err: any, ...extra: any[]) => {
    if (isBundled) {
      if (err instanceof Error) Sentry.captureException(err)
      else Sentry.captureMessage(String(err))
    } else {
      // eslint-disable-next-line no-console
      console.error(err, ...extra)
    }
  },
}

export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
