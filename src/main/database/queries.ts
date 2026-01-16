import { and, count, desc, eq, inArray } from 'drizzle-orm'
import type OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import {
  AI_RECOMMENDATION_STATUS,
  type JobPostingDTO,
  type JobPostingDuplicateStatus,
  type NewHashDTO,
  type NewJobPostingDTO,
  type NewPromptDTO,
  type NewScrapeRunDTO,
  type NewScrapeTaskDTO,
  type NewSiteDTO,
  type ScrapeRunStatus,
  type UpdateSiteDTO,
} from '../../shared/types'
import { db } from './client'
import { apiUsage, hashes, jobPostings, prompts, scrapeRuns, scrapeTasks, sites } from './schema'

async function insertApiUsage({
  response,
  userSelectedModel,
  prompt,
  siteContent,
  siteUrl,
  siteTitle,
}: {
  response: OpenAI.Responses.Response
  userSelectedModel: string
  prompt: string
  siteContent: string
  siteUrl: string
  siteTitle: string
}) {
  return db
    .insert(apiUsage)
    .values({
      id: uuidv4(),
      responseId: response.id,
      actualModel: response.model,
      userSelectedModel: userSelectedModel,
      createdAt: new Date(),
      status: response.status,
      siteTitle: siteTitle,
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

async function hashExists({
  siteId,
  siteContentHash,
  promptHash,
  jobToJSONPromptHash,
}: {
  siteId: string
  siteContentHash: string
  promptHash: string
  jobToJSONPromptHash: string
}): Promise<boolean> {
  const result = await db
    .select()
    .from(hashes)
    .where(
      and(
        eq(hashes.jobToJSONPromptHash, jobToJSONPromptHash),
        eq(hashes.siteContentHash, siteContentHash),
        eq(hashes.promptHash, promptHash),
        eq(hashes.siteId, siteId),
      ),
    )
    .limit(1)
  return result.length > 0
}

async function insertHash(data: NewHashDTO) {
  return db
    .insert(hashes)
    .values({ ...data, id: uuidv4() })
    .returning()
}

async function insertScrapeRun(data: NewScrapeRunDTO) {
  return db
    .insert(scrapeRuns)
    .values({ ...data, id: uuidv4() })
    .returning()
}

async function insertScrapeTask(data: NewScrapeTaskDTO) {
  return db
    .insert(scrapeTasks)
    .values({ ...data, id: uuidv4() })
    .returning()
}

async function updateJobPosting(id: string, data: Partial<NewJobPostingDTO>) {
  return db
    .update(jobPostings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobPostings.id, id))
    .returning()
}

async function insertJobPostings(data: NewJobPostingDTO[]) {
  if (data.length === 0) return []
  const dataWithIds = data.map((item) => ({ ...item, id: uuidv4() }))
  return db.insert(jobPostings).values(dataWithIds).returning()
}

async function getSites({ siteIds }: { siteIds?: string[] }) {
  return db
    .select()
    .from(sites)
    .where(siteIds ? inArray(sites.id, siteIds) : undefined)
}

async function getAllSitesWithJobCounts() {
  const allSites = await db.select().from(sites)

  const sitesWithCounts = await Promise.all(
    allSites.map(async (site) => {
      const jobs = await db.select().from(jobPostings).where(eq(jobPostings.siteId, site.id))
      const prompt = await db.select().from(prompts).where(eq(prompts.id, site.promptId)).limit(1)
      return {
        ...site,
        totalJobs: jobs.length,
        promptTitle: prompt[0]?.title || 'Unknown Prompt',
      }
    }),
  )

  return sitesWithCounts
}

async function getSiteById(id: string) {
  const result = await db.select().from(sites).where(eq(sites.id, id)).limit(1)
  return result[0] || null
}

async function insertSite(data: NewSiteDTO) {
  return db
    .insert(sites)
    .values({ ...data, id: uuidv4() })
    .returning()
}

async function updateSite(id: string, data: Partial<UpdateSiteDTO>) {
  return db
    .update(sites)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .returning()
}

async function deleteSite(id: string) {
  return db.delete(sites).where(eq(sites.id, id)).returning()
}

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

async function getPromptById(id: string) {
  const result = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1)
  return result[0] || null
}

async function insertPrompt(data: NewPromptDTO) {
  return db
    .insert(prompts)
    .values({ ...data, id: uuidv4() })
    .returning()
}

async function updatePrompt(id: string, data: Partial<NewPromptDTO>) {
  return db
    .update(prompts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prompts.id, id))
    .returning()
}

async function deletePrompt(id: string) {
  return db.delete(prompts).where(eq(prompts.id, id)).returning()
}

async function getAllScrapeRuns() {
  return db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.createdAt))
}

async function getScrapeTasksByRunId(scrapeRunId: string) {
  return db
    .select({
      id: scrapeTasks.id,
      scrapeRunId: scrapeTasks.scrapeRunId,
      siteId: scrapeTasks.siteId,
      siteUrl: scrapeTasks.siteUrl,
      result: scrapeTasks.result,
      newPostingsFound: scrapeTasks.newPostingsFound,
      errorMessage: scrapeTasks.errorMessage,
      createdAt: scrapeTasks.createdAt,
      updatedAt: scrapeTasks.updatedAt,
      completedAt: scrapeTasks.completedAt,
      siteTitle: sites.siteTitle,
    })
    .from(scrapeTasks)
    .leftJoin(sites, eq(scrapeTasks.siteId, sites.id))
    .where(eq(scrapeTasks.scrapeRunId, scrapeRunId))
    .orderBy(desc(scrapeTasks.createdAt))
}

async function updateScrapeRun(
  id: string,
  data: {
    successfulSites?: number
    failedSites?: number
    completedAt?: Date
    status?: ScrapeRunStatus
  },
) {
  return db.update(scrapeRuns).set(data).where(eq(scrapeRuns.id, id)).returning()
}

async function getJobPostings({
  siteId,
  duplicateStatusArray,
}: {
  siteId?: string
  duplicateStatusArray?: JobPostingDuplicateStatus[]
}): Promise<JobPostingDTO[]> {
  const rows = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      siteUrl: jobPostings.siteUrl,
      siteId: jobPostings.siteId,
      description: jobPostings.description,
      recommendationExplanation: jobPostings.recommendationExplanation,
      location: jobPostings.location,
      status: jobPostings.status,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      scrapeRunId: jobPostings.scrapeRunId,
      siteTitle: sites.siteTitle,
      aiRecommendationStatus: jobPostings.aiRecommendationStatus,
      jobUrl: jobPostings.jobUrl,
      duplicateStatus: jobPostings.duplicateStatus,
      datePosted: jobPostings.datePosted,
    })
    .from(jobPostings)
    .leftJoin(sites, eq(jobPostings.siteId, sites.id))
    .where(
      and(
        siteId ? eq(jobPostings.siteId, siteId) : undefined,
        duplicateStatusArray ? inArray(jobPostings.duplicateStatus, duplicateStatusArray) : undefined,
      ),
    )
    .orderBy(desc(jobPostings.createdAt))

  return rows.map((r) => ({
    ...r,
    siteTitle: r.siteTitle ?? 'Unknown',
  }))
}

async function jobPostingsSuspectedDuplicatesCount() {
  return db
    .select({ count: count() })
    .from(jobPostings)
    .where(eq(jobPostings.duplicateStatus, 'suspected_duplicate'))
    .all()
}

async function skipNotRecommendedPostings() {
  return db
    .update(jobPostings)
    .set({ status: 'skipped', updatedAt: new Date() })
    .where(eq(jobPostings.aiRecommendationStatus, AI_RECOMMENDATION_STATUS.NOT_RECOMMENDED))
    .returning()
}

async function getSuspectedDuplicatesWithOriginals(): Promise<
  Array<{ unique: JobPostingDTO; suspectedDuplicate: JobPostingDTO }>
> {
  // Get all job postings that have a suspectedDuplicateOfJobPostingId
  const suspectedDuplicates = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      siteUrl: jobPostings.siteUrl,
      jobUrl: jobPostings.jobUrl,
      siteId: jobPostings.siteId,
      description: jobPostings.description,
      recommendationExplanation: jobPostings.recommendationExplanation,
      location: jobPostings.location,
      status: jobPostings.status,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      scrapeRunId: jobPostings.scrapeRunId,
      aiRecommendationStatus: jobPostings.aiRecommendationStatus,
      duplicateStatus: jobPostings.duplicateStatus,
      datePosted: jobPostings.datePosted,
      suspectedDuplicateOfJobPostingId: jobPostings.suspectedDuplicateOfJobPostingId,
      siteTitle: sites.siteTitle,
    })
    .from(jobPostings)
    .leftJoin(sites, eq(jobPostings.siteId, sites.id))
    .where(eq(jobPostings.duplicateStatus, 'suspected_duplicate'))

  // Get the original job postings
  const originalIds = suspectedDuplicates
    .map((d) => d.suspectedDuplicateOfJobPostingId)
    .filter((id) => id !== null) as string[]

  if (originalIds.length === 0) {
    return []
  }

  console.log('originalIds', originalIds)

  const originalJobPostings = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      siteUrl: jobPostings.siteUrl,
      jobUrl: jobPostings.jobUrl,
      siteId: jobPostings.siteId,
      description: jobPostings.description,
      recommendationExplanation: jobPostings.recommendationExplanation,
      location: jobPostings.location,
      status: jobPostings.status,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      scrapeRunId: jobPostings.scrapeRunId,
      aiRecommendationStatus: jobPostings.aiRecommendationStatus,
      duplicateStatus: jobPostings.duplicateStatus,
      datePosted: jobPostings.datePosted,
      siteTitle: sites.siteTitle,
    })
    .from(jobPostings)
    .leftJoin(sites, eq(jobPostings.siteId, sites.id))
    .where(inArray(jobPostings.id, originalIds))

  console.log('originalJobPostings', originalJobPostings)

  // Create a map for quick lookup
  const originalJobPostingsMap = new Map(
    originalJobPostings.map((job) => [
      job.id,
      {
        ...job,
        siteTitle: job.siteTitle ?? 'Unknown',
      } as JobPostingDTO,
    ]),
  )

  // Match suspected duplicates with their originals
  const result: Array<{ unique: JobPostingDTO; suspectedDuplicate: JobPostingDTO }> = []

  for (const suspectedDuplicate of suspectedDuplicates) {
    if (suspectedDuplicate.suspectedDuplicateOfJobPostingId) {
      const unique = originalJobPostingsMap.get(suspectedDuplicate.suspectedDuplicateOfJobPostingId)
      if (unique) {
        result.push({
          unique,
          suspectedDuplicate: {
            ...suspectedDuplicate,
            siteTitle: suspectedDuplicate.siteTitle ?? 'Unknown',
          } as JobPostingDTO,
        })
      }
    }
  }
  console.log('returning dups', result)
  return result
}

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
  insertScrapeRun,
  insertScrapeTask,
  updateScrapeRun,
  insertJobPostings,
  updateJobPosting,
  getSites,
  getAllSitesWithJobCounts,
  getSiteById,
  getAllApiUsage,
  getAllHashes,
  getAllScrapeTasks,
  insertSite,
  updateSite,
  deleteSite,
  jobPostingsSuspectedDuplicatesCount,
  getAllPrompts,
  getPromptById,
  insertPrompt,
  updatePrompt,
  deletePrompt,
  getAllScrapeRuns,
  getScrapeTasksByRunId,
  getJobPostings,
  getSuspectedDuplicatesWithOriginals,
  nukeDatabase,
  skipNotRecommendedPostings,
}
