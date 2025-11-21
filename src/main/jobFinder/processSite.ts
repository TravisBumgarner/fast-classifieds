import { SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT } from '../../shared/consts'
import { errorCodeToMessage } from '../../shared/errors'
import queries from '../database/queries'
import log from '../logger'
import { hashContent } from '../utilities'
import { buildNewJobPostingDTO } from './buildNewJobPostingDTO'
import { processText } from './processText'
import { scrape } from './scrape'

async function processSite({
  siteId,
  siteUrl,
  prompt,
  selector,
  scrapeRunId,
  apiKey,
  model,
  onProgress,
}: {
  siteId: string
  siteUrl: string
  prompt: string
  selector: string
  scrapeRunId: string
  apiKey: string
  model: string
  delay?: number
  onProgress?: (status: 'scraping' | 'processing' | 'complete' | 'error') => void
}) {
  try {
    log.info(`Processing: ${siteUrl}`)
    onProgress?.('scraping')

    const response = await scrape({ siteUrl, selector })

    if (!response.ok) {
      return {
        status: 'error' as const,
        errorMessage: errorCodeToMessage({ error: response.errorCode, type: 'INTERNAL' }),
      }
    }

    const { scrapedContent, hash: siteContentHash } = response

    log.info(`Scraped content for: ${siteUrl}, siteContentHash: ${siteContentHash}`)

    const promptHash = hashContent(prompt)

    const jobToJSONPromptHash = hashContent(SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT)

    const exists = await queries.hashExists({ siteContentHash, siteId, promptHash, jobToJSONPromptHash })
    log.info(`Hash exists: ${exists}`)

    if (exists) {
      log.info(`Hash exists for: ${siteUrl}`)
      await queries.insertScrapeTask({
        scrapeRunId,
        siteId,
        siteUrl,
        status: 'hash_exists',
        newPostingsFound: 0,
        completedAt: new Date(),
      })
      return { newJobsFound: 0, status: 'complete' as const }
    }

    log.info(`New data found for: ${siteUrl}`)
    onProgress?.('processing')

    const { aiJobs, rawResponse } = await processText({
      prompt,
      scrapedContent,
      siteUrl,
      apiKey,
      model,
      jobToJSONPrompt: SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT,
      siteId,
      scrapeRunId,
    })

    const existingDuplicationDetectionIds = new Set(
      (await queries.getJobPostings({})).map((j) => j.duplicationDetectionId),
    )

    const jobs = aiJobs.map((job) =>
      buildNewJobPostingDTO({
        ...job,
        siteId,
        scrapeRunId,
        siteUrl,
        existingDuplicationDetectionIds,
      }),
    )

    await queries.insertApiUsage({
      response: rawResponse,
      prompt,
      siteContent: JSON.stringify(scrapedContent),
      siteUrl,
    })

    if (jobs.length > 0) {
      await queries.insertJobPostings(jobs)
    }

    await queries.insertScrapeTask({
      scrapeRunId,
      siteId,
      siteUrl,
      status: 'new_data',
      newPostingsFound: jobs.length,
      completedAt: new Date(),
    })

    // Only store the hash once AI has done its thing.
    // If something errors, we want to be able to retry.
    queries.insertHash({
      siteContentHash,
      promptHash,
      siteId,
      jobToJSONPromptHash,
    })

    return { newJobsFound: jobs.length, status: 'complete' as const }
  } catch (error) {
    const errorMessage = errorCodeToMessage({ error, type: 'OPEN_AI' })
    log.error(`✗ Error processing ${siteUrl}:`, error)

    await queries.insertScrapeTask({
      scrapeRunId,
      siteId,
      siteUrl,
      status: 'error',
      newPostingsFound: 0,
      errorMessage,
      completedAt: new Date(),
    })

    return { status: 'error' as const, errorMessage }
  }
}

export default processSite
