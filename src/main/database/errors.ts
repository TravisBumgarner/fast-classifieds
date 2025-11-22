export function humanizeDbError(e: unknown, context: string): string {
  const err = e as unknown as { code: string | undefined }

  const code = err?.code as string | undefined

  switch (code) {
    case 'SQLITE_CONSTRAINT_UNIQUE':
      return `Duplicate ${context} for a unique field.`

    case 'SQLITE_CONSTRAINT_PRIMARYKEY':
      return `Duplicate ${context} for a primary key.`

    case 'SQLITE_CONSTRAINT_NOTNULL':
      return 'A required field is missing.'

    case 'SQLITE_CONSTRAINT_FOREIGNKEY':
      return `Invalid reference to related data for ${context}.`

    default:
      return 'Database error.'
  }
}
