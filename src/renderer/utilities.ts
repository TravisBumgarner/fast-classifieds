import log from 'electron-log/renderer'

export const logMessage = (message: string) => {
  if (import.meta.env.VITE_API_URL) {
    console.log(message)
  } else {
    log.info(message)
  }
}

export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
