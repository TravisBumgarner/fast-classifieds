export default {
  schema: './src/main/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data.sqlite',
  },
} as const
