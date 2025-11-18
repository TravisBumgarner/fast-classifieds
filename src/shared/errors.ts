export const OPEN_AI_ERRORS = {
  invalid_api_key: 'Invalid Open AI key',
}

export const ERRORS = { ...OPEN_AI_ERRORS }

export const errorCodeToMessage = (error: unknown): string => {
  const errorCode = (error as { code: string }).code || 'unknown_error'
  let errorMessage = 'Unknown Error'

  if (ERRORS[errorCode as keyof typeof ERRORS]) {
    errorMessage = ERRORS[errorCode as keyof typeof ERRORS]
  }
  return errorMessage
}
