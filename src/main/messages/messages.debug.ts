import { SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT } from '../../shared/consts'
import { errorCodeToMessage } from '../../shared/errors'
import { CHANNEL } from '../../shared/messages.types'
import queries from '../database/queries'
import { buildNewJobPostingDTO } from '../jobFinder/buildNewJobPostingDTO'
import { processText } from '../jobFinder/processText'
import { scrape } from '../jobFinder/scrape'
import logger from '../logger'
import { getStore } from '../store'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL.DEBUG.SCRAPE, async (_event, params) => {
  try {
    const result = await scrape({
      siteUrl: params.url,
      selector: params.selector,
    })
    if (result.ok) {
      return {
        success: true as const,
        scrapedContent: result.scrapedContent,
      }
    } else {
      return {
        success: false as const,
        error: errorCodeToMessage({ error: result.errorCode, type: 'INTERNAL' }),
      }
    }
  } catch (error) {
    logger.error('Error in debug scrape:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.DEBUG.AI, async (_event, params) => {
  try {
    logger.info('Debug AI params:', params)
    const storeData = getStore()
    const result = await processText({
      apiKey: storeData.openaiApiKey,
      model: storeData.openaiModel,
      prompt: params.prompt,
      scrapedContent: params.scrapedContent,
      siteUrl: params.siteUrl,
      siteId: params.siteId,
      scrapeRunId: 'debug-run',
      jobToJSONPrompt: SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT,
    })
    logger.info('Debug AI result:', result.aiJobs)

    const existingDuplicationDetectionIds = new Set(
      (await queries.getJobPostings({})).map((j) => j.duplicationDetectionId),
    )

    const jobs = result.aiJobs.map((job) =>
      buildNewJobPostingDTO({
        ...job,
        siteId: params.siteId,
        scrapeRunId: 'debug-run',
        siteUrl: params.siteUrl,
        existingDuplicationDetectionIds,
      }),
    )

    return {
      success: true as const,
      jobs,
      rawResponse: result.rawResponse,
    }
  } catch (error) {
    logger.error('Error in debug process text:', error)

    return {
      success: false as const,
      error: errorCodeToMessage({ error, type: 'OPEN_AI' }),
    }
  }
})
