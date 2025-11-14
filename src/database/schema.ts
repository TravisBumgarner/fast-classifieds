import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { Status, STATUS } from '../shared/types'

export const apiUsage = sqliteTable('api_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  responseId: text('response_id'),
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  status: text('status'),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cachedTokens: integer('cached_tokens'),
  reasoningTokens: integer('reasoning_tokens'),
  prompt: text('prompt'),
  siteContent: text('site_content'),
  siteUrl: text('site_url'),

  outputText: text('output_text'),
  temperature: integer('temperature'),
  servicetier: text('service_tier'),
  reasoningEffort: text('reasoning_effort'),
})

export type ApiUsage = typeof apiUsage.$inferSelect
export type NewApiUsage = typeof apiUsage.$inferInsert

export const hashes = sqliteTable('hashes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hash: text('hash').notNull().unique(),
  siteUrl: text('site_url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Hash = typeof hashes.$inferSelect
export type NewHash = typeof hashes.$inferInsert

// Scrape runs - each run scans all active sites
export const scrapeRuns = sqliteTable('scrape_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status', {
    enum: Object.values(STATUS) as [Status, ...Status[]],
  }).notNull(),
  totalSites: integer('total_sites').notNull().default(0),
  successfulSites: integer('successful_sites').notNull().default(0),
  failedSites: integer('failed_sites').notNull().default(0),
  comments: text('comments'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export type ScrapeRun = typeof scrapeRuns.$inferSelect
export type NewScrapeRun = typeof scrapeRuns.$inferInsert

// Scrape tasks - individual site scans within a run
export const scrapeTasks = sqliteTable('scrape_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scrapeRunId: integer('scrape_run_id').notNull(),
  siteId: integer('site_id').notNull(),
  siteUrl: text('site_url').notNull(),
  status: text('status', {
    enum: Object.values(STATUS) as [Status, ...Status[]],
  }).notNull(),
  newPostingsFound: integer('new_postings_found').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export type ScrapeTask = typeof scrapeTasks.$inferSelect
export type NewScrapeTask = typeof scrapeTasks.$inferInsert

export const POSTING_STATUS = {
  NEW: 'new',
  APPLIED: 'applied',
  SKIPPED: 'skipped',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  OFFER: 'offer',
} as const

export type PostingStatus = (typeof POSTING_STATUS)[keyof typeof POSTING_STATUS]

// Job postings - individual job listings found
export const jobPostings = sqliteTable('job_postings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  siteUrl: text('site_url').notNull(),
  siteId: integer('site_id'),
  explanation: text('explanation'),
  status: text('status', {
    enum: Object.values(POSTING_STATUS) as [PostingStatus, ...PostingStatus[]],
  })
    .notNull()
    .default(POSTING_STATUS.NEW),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type JobPosting = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert

export const SITE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export type SiteStatus = (typeof SITE_STATUS)[keyof typeof SITE_STATUS]

export const sites = sqliteTable('sites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteTitle: text('site_title').notNull(),
  siteUrl: text('site_url').notNull().unique(),
  promptId: text('prompt_id').notNull(),
  selector: text('selector').notNull(),
  status: text('status', {
    enum: Object.values(SITE_STATUS) as [SiteStatus, ...SiteStatus[]],
  })
    .notNull()
    .default(SITE_STATUS.ACTIVE),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert

export const prompts = sqliteTable('prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Prompt = typeof prompts.$inferSelect
export type NewPrompt = typeof prompts.$inferInsert
