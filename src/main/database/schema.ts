import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import {
  AI_RECOMMENDATION_STATUS,
  type AIRecommendationStatus,
  JOB_POSTING_DUPLICATE_STATUS,
  JOB_POSTING_STATUS,
  type JobPostingDuplicateStatus,
  type JobPostingStatus,
  PROMPT_STATUS,
  type PromptStatus,
  SCRAPE_RUN_STATUS,
  type ScrapeRunStatus,
  SITE_STATUS,
  type SiteStatus,
} from '../../shared/types'

export const apiUsage = sqliteTable('api_usage', {
  id: text('id').primaryKey(),
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

export const hashes = sqliteTable('hashes', {
  id: text('id').primaryKey(),
  siteContentHash: text('site_content_hash').notNull(),
  promptHash: text('prompt_hash').notNull(),
  jobToJSONPromptHash: text('job_to_json_prompt_hash').notNull(),
  siteId: text('site_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const scrapeRuns = sqliteTable('scrape_runs', {
  id: text('id').primaryKey(),
  status: text('status', {
    enum: Object.values(SCRAPE_RUN_STATUS) as [ScrapeRunStatus, ...ScrapeRunStatus[]],
  }).notNull(),
  totalSites: integer('total_sites').notNull().default(0),
  successfulSites: integer('successful_sites').notNull().default(0),
  failedSites: integer('failed_sites').notNull().default(0),
  comments: text('comments'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export const scrapeTasks = sqliteTable('scrape_tasks', {
  id: text('id').primaryKey(),
  scrapeRunId: text('scrape_run_id').notNull(),
  siteId: text('site_id').notNull(),
  siteUrl: text('site_url').notNull(),
  status: text('status', {
    enum: Object.values(SCRAPE_RUN_STATUS) as [ScrapeRunStatus, ...ScrapeRunStatus[]],
  }).notNull(),
  newPostingsFound: integer('new_postings_found').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export const jobPostings = sqliteTable('job_postings', {
  aiRecommendationStatus: text('ai_recommendation_status', {
    enum: Object.values(AI_RECOMMENDATION_STATUS) as [AIRecommendationStatus, ...AIRecommendationStatus[]],
  }).notNull(),
  duplicationDetectionId: text('duplication_detection_id').notNull(), // See duplicateDetection.ts for more details.
  duplicateStatus: text('duplicate_status', {
    enum: Object.values(JOB_POSTING_DUPLICATE_STATUS) as [JobPostingDuplicateStatus, ...JobPostingDuplicateStatus[]],
  }).notNull(),
  id: text('id').primaryKey(),
  scrapeRunId: text('scrape_run_id').notNull(),
  title: text('title').notNull(),
  siteUrl: text('site_url').notNull(),
  jobUrl: text('job_url').notNull(),
  siteId: text('site_id').notNull(),
  recommendationExplanation: text('recommendation_explanation').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  status: text('status', {
    enum: Object.values(JOB_POSTING_STATUS) as [JobPostingStatus, ...JobPostingStatus[]],
  })
    .notNull()
    .default(JOB_POSTING_STATUS.NEW),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
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

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status', {
    enum: Object.values(PROMPT_STATUS) as [PromptStatus, ...PromptStatus[]],
  })
    .notNull()
    .default(PROMPT_STATUS.ACTIVE),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
