import { and, desc, eq } from 'drizzle-orm'
import type OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import type {
  NewHashDTO,
  NewJobPostingDTO,
  NewPromptDTO,
  NewScrapeRunDTO,
  NewScrapeTaskDTO,
  NewSiteDTO,
  Status,
  UpdateSiteDTO,
} from '../../shared/types'
import { db } from './client'
import { apiUsage, hashes, jobPostings, prompts, scrapeRuns, scrapeTasks, sites } from './schema'

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
      id: uuidv4(),
      responseId: response.id,
      model: response.model,
      createdAt: new Date(),
      status: response.status,

      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,

      cachedTokens: response.usage?.input_tokens_details.cached_tokens || 0,
      reasoningTokens: response.usage?.output_tokens_details.reasoning_tokens || 0,

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
  const result = await db.select().from(hashes).where(eq(hashes.hash, hash)).limit(1)
  return result.length > 0
}

/**
 * Insert a new hash into the database
 */
async function insertHash(data: NewHashDTO) {
  return db
    .insert(hashes)
    .values({ ...data, id: uuidv4() })
    .returning()
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
    await db.insert(hashes).values({ id: uuidv4(), hash, siteUrl }).returning()
    return {
      exists: false,
    }
  }
}

/**
 * Insert a scrape run
 */
async function insertScrapeRun(data: NewScrapeRunDTO) {
  return db
    .insert(scrapeRuns)
    .values({ ...data, id: uuidv4() })
    .returning()
}

/**
 * Insert a scrape task
 */
async function insertScrapeTask(data: NewScrapeTaskDTO) {
  return db
    .insert(scrapeTasks)
    .values({ ...data, id: uuidv4() })
    .returning()
}

/**
 * Insert a job posting
 */
async function insertJobPosting(data: NewJobPostingDTO) {
  return db
    .insert(jobPostings)
    .values({ ...data, id: uuidv4() })
    .returning()
}

/**
 * Insert multiple job postings
 */
async function insertJobPostings(data: NewJobPostingDTO[]) {
  if (data.length === 0) return []
  const dataWithIds = data.map((item) => ({ ...item, id: uuidv4() }))
  return db.insert(jobPostings).values(dataWithIds).returning()
}

/**
 * Get all sites
 */
async function getAllSites() {
  return db.select().from(sites)
}

/**
 * Get all sites with job counts
 */
async function getAllSitesWithJobCounts() {
  const allSites = await db.select().from(sites)

  const sitesWithCounts = await Promise.all(
    allSites.map(async (site) => {
      const jobs = await db.select().from(jobPostings).where(eq(jobPostings.siteId, site.id))

      return {
        ...site,
        totalJobs: jobs.length,
      }
    }),
  )

  return sitesWithCounts
}

/**
 * Get a site by ID
 */
async function getSiteById(id: string) {
  const result = await db.select().from(sites).where(eq(sites.id, id)).limit(1)
  return result[0] || null
}

/**
 * Insert a new site
 */
async function insertSite(data: NewSiteDTO) {
  return db
    .insert(sites)
    .values({ ...data, id: uuidv4() })
    .returning()
}

/**
 * Update a site
 */
async function updateSite(id: string, data: Partial<UpdateSiteDTO>) {
  return db
    .update(sites)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .returning()
}

/**
 * Delete a site
 */
async function deleteSite(id: string) {
  return db.delete(sites).where(eq(sites.id, id)).returning()
}

/**
 * Get all prompts
 */
async function getAllPrompts() {
  return db.select().from(prompts)
}

async function getAllHashes() {
  return db.select().from(hashes)
}

async function getAllApiUsage() {
  return db.select().from(apiUsage)
}

async function getAllScrapeTasks() {
  return db.select().from(scrapeTasks)
}

/**
 * Get a prompt by ID
 */
async function getPromptById(id: string) {
  const result = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1)
  return result[0] || null
}

/**
 * Insert a new prompt
 */
async function insertPrompt(data: NewPromptDTO) {
  return db
    .insert(prompts)
    .values({ ...data, id: uuidv4() })
    .returning()
}

/**
 * Update a prompt
 */
async function updatePrompt(id: string, data: Partial<NewPromptDTO>) {
  return db
    .update(prompts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prompts.id, id))
    .returning()
}

/**
 * Delete a prompt
 */
async function deletePrompt(id: string) {
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
async function getScrapeTasksByRunId(scrapeRunId: string) {
  return db
    .select()
    .from(scrapeTasks)
    .where(eq(scrapeTasks.scrapeRunId, scrapeRunId))
    .orderBy(desc(scrapeTasks.createdAt))
}

/**
 * Get failed scrape tasks for a specific run
 */
async function getFailedTasksByRunId(scrapeRunId: string) {
  return db
    .select()
    .from(scrapeTasks)
    .where(and(eq(scrapeTasks.scrapeRunId, scrapeRunId), eq(scrapeTasks.status, 'error')))
    .orderBy(desc(scrapeTasks.createdAt))
}

/**
 * Update scrape run completion status
 */
async function updateScrapeRun(
  id: string,
  data: {
    successfulSites?: number
    failedSites?: number
    completedAt?: Date
    status?: Status
  },
) {
  return db.update(scrapeRuns).set(data).where(eq(scrapeRuns.id, id)).returning()
}

/**
 * Get all job postings (ordered by most recent first)
 */
async function getAllJobPostings() {
  return db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt))
}

/**
 * Get job postings for a specific site (ordered by most recent first)
 */
async function getJobPostingsBySiteId(siteId: string) {
  return db.select().from(jobPostings).where(eq(jobPostings.siteId, siteId)).orderBy(desc(jobPostings.createdAt))
}

/**
 * Update job posting status
 */
async function updateJobPostingStatus(
  id: string,
  status: 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer',
) {
  return db.update(jobPostings).set({ status, updatedAt: new Date() }).where(eq(jobPostings.id, id)).returning()
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
  getAllSitesWithJobCounts,
  getSiteById,
  getAllApiUsage,
  getAllHashes,
  getAllScrapeTasks,
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
  getJobPostingsBySiteId,
  updateJobPostingStatus,
  nukeDatabase,
}
