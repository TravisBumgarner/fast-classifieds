import { and, desc, eq } from 'drizzle-orm'
import OpenAI from 'openai'
import type { Status } from '../../shared/types'
import { db } from './client'
import {
  apiUsage,
  hashes,
  jobPostings,
  prompts,
  scrapeRuns,
  scrapeTasks,
  sites,
  type NewHash,
  type NewJobPosting,
  type NewPrompt,
  type NewScrapeRun,
  type NewScrapeTask,
  type NewSite,
} from './schema'

async function insertApiUsage({
  response,
  prompt,
  siteContent,
  siteUrl,
}: {
  response: OpenAI.Responses.Response
  prompt: string
  siteContent: string
  siteUrl: string
}) {
  return db
    .insert(apiUsage)
    .values({
      responseId: response.id,
      model: response.model,
      createdAt: new Date(),
      status: response.status,

      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,

      cachedTokens: response.usage?.input_tokens_details.cached_tokens || 0,
      reasoningTokens:
        response.usage?.output_tokens_details.reasoning_tokens || 0,

      prompt,
      siteContent,
      siteUrl,
      outputText: response.output_text,
    })
    .returning()
}

/**
 * Check if a hash exists in the database
 */
async function hashExists(hash: string): Promise<boolean> {
  const result = await db
    .select()
    .from(hashes)
    .where(eq(hashes.hash, hash))
    .limit(1)
  return result.length > 0
}

/**
 * Insert a new hash into the database
 */
async function insertHash(data: NewHash) {
  return db.insert(hashes).values(data).returning()
}

/**
 * Insert hash if it doesn't exist, or return existing record
 */
async function insertHashIfNotExists({
  hash,
  siteUrl,
}: {
  hash: string
  siteUrl: string
}): Promise<{ exists: boolean }> {
  const exists = await hashExists(hash)
  if (exists) {
    await db.select().from(hashes).where(eq(hashes.hash, hash)).limit(1)
    return {
      exists: true,
    }
  } else {
    await db.insert(hashes).values({ hash, siteUrl }).returning()
    return {
      exists: false,
    }
  }
}

/**
 * Insert a scrape run
 */
async function insertScrapeRun(data: NewScrapeRun) {
  return db.insert(scrapeRuns).values(data).returning()
}

/**
 * Insert a scrape task
 */
async function insertScrapeTask(data: NewScrapeTask) {
  return db.insert(scrapeTasks).values(data).returning()
}

/**
 * Insert a job posting
 */
async function insertJobPosting(data: NewJobPosting) {
  return db.insert(jobPostings).values(data).returning()
}

/**
 * Insert multiple job postings
 */
async function insertJobPostings(data: NewJobPosting[]) {
  if (data.length === 0) return []
  return db.insert(jobPostings).values(data).returning()
}

/**
 * Get all sites
 */
async function getAllSites() {
  return db.select().from(sites)
}

/**
 * Get a site by ID
 */
async function getSiteById(id: number) {
  const result = await db.select().from(sites).where(eq(sites.id, id)).limit(1)
  return result[0] || null
}

/**
 * Insert a new site
 */
async function insertSite(data: NewSite) {
  return db.insert(sites).values(data).returning()
}

/**
 * Update a site
 */
async function updateSite(id: number, data: Partial<NewSite>) {
  return db
    .update(sites)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .returning()
}

/**
 * Delete a site
 */
async function deleteSite(id: number) {
  return db.delete(sites).where(eq(sites.id, id)).returning()
}

/**
 * Get all prompts
 */
async function getAllPrompts() {
  return db.select().from(prompts)
}

/**
 * Get a prompt by ID
 */
async function getPromptById(id: number) {
  const result = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, id))
    .limit(1)
  return result[0] || null
}

/**
 * Insert a new prompt
 */
async function insertPrompt(data: NewPrompt) {
  return db.insert(prompts).values(data).returning()
}

/**
 * Update a prompt
 */
async function updatePrompt(id: number, data: Partial<NewPrompt>) {
  return db
    .update(prompts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prompts.id, id))
    .returning()
}

/**
 * Delete a prompt
 */
async function deletePrompt(id: number) {
  return db.delete(prompts).where(eq(prompts.id, id)).returning()
}

/**
 * Get all scrape runs (ordered by most recent first)
 */
async function getAllScrapeRuns() {
  return db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.createdAt))
}

/**
 * Get scrape tasks for a specific run
 */
async function getScrapeTasksByRunId(scrapeRunId: number) {
  return db
    .select()
    .from(scrapeTasks)
    .where(eq(scrapeTasks.scrapeRunId, scrapeRunId))
    .orderBy(desc(scrapeTasks.createdAt))
}

/**
 * Get failed scrape tasks for a specific run
 */
async function getFailedTasksByRunId(scrapeRunId: number) {
  return db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.scrapeRunId, scrapeRunId),
        eq(scrapeTasks.status, 'error'),
      ),
    )
    .orderBy(desc(scrapeTasks.createdAt))
}

/**
 * Update scrape run completion status
 */
async function updateScrapeRun(
  id: number,
  data: {
    successfulSites?: number
    failedSites?: number
    completedAt?: Date
    status?: Status
  },
) {
  return db
    .update(scrapeRuns)
    .set(data)
    .where(eq(scrapeRuns.id, id))
    .returning()
}

/**
 * Get all job postings (ordered by most recent first)
 */
async function getAllJobPostings() {
  return db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt))
}

/**
 * Update job posting status
 */
async function updateJobPostingStatus(
  id: number,
  status: 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer',
) {
  return db
    .update(jobPostings)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobPostings.id, id))
    .returning()
}

/**
 * Nuke database - delete all data from all tables
 */
async function nukeDatabase() {
  // Delete in order to respect any dependencies
  await db.delete(scrapeTasks)
  await db.delete(scrapeRuns)
  await db.delete(jobPostings)
  await db.delete(hashes)
  await db.delete(apiUsage)
  await db.delete(sites)
  await db.delete(prompts)
}

export default {
  insertApiUsage,
  hashExists,
  insertHash,
  insertHashIfNotExists,
  insertScrapeRun,
  insertScrapeTask,
  updateScrapeRun,
  insertJobPosting,
  insertJobPostings,
  getAllSites,
  getSiteById,
  insertSite,
  updateSite,
  deleteSite,
  getAllPrompts,
  getPromptById,
  insertPrompt,
  updatePrompt,
  deletePrompt,
  getAllScrapeRuns,
  getScrapeTasksByRunId,
  getFailedTasksByRunId,
  getAllJobPostings,
  updateJobPostingStatus,
  nukeDatabase,
}
