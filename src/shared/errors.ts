export const OPEN_AI_ERRORS = {
  invalid_api_key: 'Invalid Open AI key',
}

export const INTERNAL_ERRORS = {
  NO_URL: 'No URL provided',
  NO_SELECTOR: 'No selector provided',
  BROWSER_LAUNCH_FAIL: 'Failed to launch browser',
  NAVIGATION_FAIL: 'Failed to navigate to the URL',
  SELECTOR_NOT_FOUND: 'Selector not found on the page',
}

export const ERRORS = { ...OPEN_AI_ERRORS, ...INTERNAL_ERRORS }

type OpenAI = {
  error: unknown
  type: 'OPEN_AI'
}

type InternalApp = {
  error: string
  type: 'INTERNAL'
}

export const errorCodeToMessage = (error: OpenAI | InternalApp): string => {
  // This function is a mess. Good enough for now though.
  let errorMessage = 'Unknown Error'

  if (error.type === 'OPEN_AI') {
    const errorCode = (error.error as { code: string }).code || 'unknown_error'
    if (ERRORS[errorCode as keyof typeof ERRORS]) {
      errorMessage = OPEN_AI_ERRORS[errorCode as keyof typeof OPEN_AI_ERRORS]
    } else {
      console.log('Unmapped error code:', errorCode)
    }
  }

  if (error.type === 'INTERNAL') {
    errorMessage = INTERNAL_ERRORS[error.error as keyof typeof INTERNAL_ERRORS]
  }

  return errorMessage
}
