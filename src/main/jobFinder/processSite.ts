import { SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT } from '../../shared/consts'
import { errorCodeToMessage } from '../../shared/errors'
import {
  JOB_POSTING_DUPLICATE_STATUS,
  SCRAPER_TASK_RESULT,
  SCRAPER_TASK_STATUS,
  type ScraperTaskProgress,
} from '../../shared/types'
import queries from '../database/queries'
import log from '../logger'
import { hashContent } from '../utilities'
import { buildNewJobPostingDTO } from './buildNewJobPostingDTO'
import { checkDuplicate, generateDuplicateHashMapBySite } from './duplicateDetection'
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
  onProgress?: (status: ScraperTaskProgress) => void
}) {
  try {
    log.info(`Processing: ${siteUrl}`)
    onProgress?.(SCRAPER_TASK_STATUS.SCRAPING)

    const response = await scrape({ siteUrl, selector })

    if (!response.ok) {
      return {
        status: SCRAPER_TASK_STATUS.ERROR,
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
        result: SCRAPER_TASK_RESULT.HASH_EXISTS,
        newPostingsFound: 0,
        completedAt: new Date(),
      })
      return { newJobsFound: 0, status: SCRAPER_TASK_STATUS.COMPLETE }
    }

    log.info(`New data found for: ${siteUrl}`)
    onProgress?.(SCRAPER_TASK_STATUS.PROCESSING)

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
    log.info(aiJobs)

    const duplicateHashMapBySite = await generateDuplicateHashMapBySite()
    console.log('duplicateHashMapBySite', duplicateHashMapBySite)

    const jobs = aiJobs
      .map((job) => {
        const duplicateCheck = checkDuplicate(
          {
            title: job.title,
            jobUrl: job.jobUrl,
            siteUrl,
            datePosted: job.datePosted ? new Date(job.datePosted) : null,
          },
          duplicateHashMapBySite,
        )

        console.log('duplicateCheck', duplicateCheck, job.title)

        return buildNewJobPostingDTO({
          ...job,
          siteId,
          scrapeRunId,
          siteUrl,
          duplicateStatus: duplicateCheck.duplicateStatus,
          suspectedDuplicateOfJobPostingId: duplicateCheck.jobPostingId,
        })
      })
      .filter(({ duplicateStatus }) => duplicateStatus !== JOB_POSTING_DUPLICATE_STATUS.CONFIRMED_DUPLICATE)

    await queries.insertApiUsage({
      response: rawResponse,
      userSelectedModel: model,
      prompt,
      siteContent: JSON.stringify(scrapedContent),
      siteUrl,
      siteTitle: siteUrl,
    })

    if (jobs.length > 0) {
      await queries.insertJobPostings(jobs)
    }

    await queries.insertScrapeTask({
      scrapeRunId,
      siteId,
      siteUrl,
      result: SCRAPER_TASK_RESULT.NEW_DATA,
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

    return { newJobsFound: jobs.length, status: SCRAPER_TASK_STATUS.COMPLETE }
  } catch (error) {
    const errorMessage = errorCodeToMessage({ error, type: 'OPEN_AI' })
    log.error(`✗ Error processing ${siteUrl}:`, error)

    await queries.insertScrapeTask({
      scrapeRunId,
      siteId,
      siteUrl,
      result: SCRAPER_TASK_RESULT.ERROR,
      newPostingsFound: 0,
      errorMessage,
      completedAt: new Date(),
    })

    return { status: SCRAPER_TASK_STATUS.ERROR, errorMessage }
  }
}

export default processSite
