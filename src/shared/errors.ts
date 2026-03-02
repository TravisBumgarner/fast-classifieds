export const ANTHROPIC_ERRORS: Record<string, string> = {
  authentication_error: 'Invalid Anthropic API key',
  invalid_api_key: 'Invalid Anthropic API key',
}

export const INTERNAL_ERRORS = {
  NO_URL: 'No URL provided',
  NO_SELECTOR: 'No selector provided',
  BROWSER_LAUNCH_FAIL: 'Failed to launch browser',
  NAVIGATION_FAIL: 'Failed to navigate to the URL',
  SELECTOR_NOT_FOUND: 'Selector not found on the page',
}

export const ERRORS = { ...ANTHROPIC_ERRORS, ...INTERNAL_ERRORS }

type Anthropic = {
  error: unknown
  type: 'ANTHROPIC'
}

type InternalApp = {
  error: string
  type: 'INTERNAL'
}

export const errorCodeToMessage = (error: Anthropic | InternalApp): string => {
  let errorMessage = 'Unknown Error'

  if (error.type === 'ANTHROPIC') {
    const err = error.error as {
      code?: string
      type?: string
      message?: string
      status?: number
      error?: { type?: string; message?: string; error?: { type?: string; message?: string } }
    }

    // Try mapped error codes first (e.g. authentication_error)
    const errorCode = err.error?.error?.type || err.error?.type || err.code || err.type
    if (errorCode && ANTHROPIC_ERRORS[errorCode]) {
      errorMessage = ANTHROPIC_ERRORS[errorCode]
    }
    // SDK BadRequestError / APIError .message (e.g. "400 ...")
    else if (err.error?.error?.message) {
      errorMessage = err.error.error.message
    } else if (err.error?.message) {
      errorMessage = err.error.message
    } else if (err.message) {
      errorMessage = err.message
    }
  }

  if (error.type === 'INTERNAL') {
    errorMessage = INTERNAL_ERRORS[error.error as keyof typeof INTERNAL_ERRORS]
  }

  return errorMessage
}
