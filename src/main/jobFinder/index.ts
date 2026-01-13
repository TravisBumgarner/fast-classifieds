import {
  SCRAPER_RUN_STATUS,
  SCRAPER_TASK_STATUS,
  type ScraperRunStatus,
  type ScraperTaskProgress,
} from '../../shared/types'
import { CHANNEL_FROM_MAIN } from '../../shared/types/messages.fromMain'
import queries from '../database/queries'
import { typedIpcMain } from '../messages/ipcMain'
import store from '../store'
import processSite from './processSite'

// Store active scrape runs in memory
const activeRuns = new Map<
  string,
  {
    status: ScraperRunStatus
    totalSites: number
    completedSites: number
    sites: Array<{
      siteId: string
      siteTitle: string
      siteUrl: string
      status: ScraperTaskProgress
      newJobsFound?: number
      errorMessage?: string
    }>
  }
>()

export async function startScraping(siteIds: string[]) {
  try {
    const selectedModel = store.get('selectedModel')
    const model = selectedModel.model
    const delay = store.get('scrapeDelay')
    const apiKey = store.get('openaiApiKey')

    if (!model) {
      return {
        success: false as const,
        error: 'OpenAI model not configured. Please set it in Settings.',
      }
    }

    if (!delay) {
      return {
        success: false as const,
        error: 'Scrape delay not configured. Please set it in Settings.',
      }
    }

    if (!apiKey) {
      return {
        success: false as const,
        error: 'OpenAI API key not configured. Please set it in Settings.',
      }
    }

    // Get all active sites
    const sites = await queries.getSites({ siteIds })

    if (sites.length === 0) {
      return { success: false as const, error: 'No sites to scrape' }
    }

    // Create scrape run
    const [scrapeRun] = await queries.insertScrapeRun({
      status: SCRAPER_RUN_STATUS.PENDING,
      totalSites: sites.length,
      successfulSites: 0,
      failedSites: 0,
    })

    const scrapeRunId = scrapeRun.id

    // Initialize progress tracking
    const progress = {
      status: SCRAPER_RUN_STATUS.IN_PROGRESS,
      totalSites: sites.length,
      completedSites: 0,
      sites: sites.map((site) => ({
        siteId: site.id,
        siteTitle: site.siteTitle,
        siteUrl: site.siteUrl,
        status: SCRAPER_RUN_STATUS.PENDING,
      })),
    }

    activeRuns.set(scrapeRunId, progress)

    typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, undefined)

    const processSitesAsync = async () => {
      let totalNewJobs = 0
      let successfulSites = 0
      let failedSites = 0

      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]

        try {
          const prompt = await queries.getPromptById(site.promptId)

          // Update progress
          const currentProgress = activeRuns.get(scrapeRunId)
          if (currentProgress) {
            currentProgress.sites[i].status = SCRAPER_TASK_STATUS.SCRAPING
            activeRuns.set(scrapeRunId, currentProgress)
          }

          // Send progress update to renderer
          typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, undefined)

          const result = await processSite({
            siteId: site.id,
            siteUrl: site.siteUrl,
            prompt: prompt.content,
            selector: site.selector,
            scrapeRunId,
            apiKey,
            model,
            delay,
            onProgress: (status) => {
              const currentProgress = activeRuns.get(scrapeRunId)
              if (currentProgress) {
                currentProgress.sites[i].status = status
                activeRuns.set(scrapeRunId, currentProgress)
                typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, undefined)
              }
            },
          })

          // Update progress with results
          const updatedProgress = activeRuns.get(scrapeRunId)
          if (updatedProgress) {
            updatedProgress.sites[i].status = result.status
            updatedProgress.sites[i].newJobsFound = result.newJobsFound
            updatedProgress.sites[i].errorMessage = result.errorMessage
            updatedProgress.completedSites++
            activeRuns.set(scrapeRunId, updatedProgress)
          }

          if (result.status === SCRAPER_TASK_STATUS.COMPLETE) {
            successfulSites++
            totalNewJobs += result.newJobsFound || 0
          } else if (result.status === SCRAPER_TASK_STATUS.ERROR) {
            failedSites++
          }

          typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, undefined)
        } catch (siteError) {
          failedSites++

          // Update progress even on error
          const errorProgress = activeRuns.get(scrapeRunId)
          if (errorProgress) {
            errorProgress.sites[i].status = SCRAPER_TASK_STATUS.ERROR
            errorProgress.sites[i].errorMessage = siteError instanceof Error ? siteError.message : String(siteError)
            errorProgress.completedSites++
            activeRuns.set(scrapeRunId, errorProgress)
          }
        }
      }

      // Mark run as completed
      const finalProgress = activeRuns.get(scrapeRunId)
      if (finalProgress) {
        finalProgress.status = SCRAPER_RUN_STATUS.COMPLETED
        activeRuns.set(scrapeRunId, finalProgress)
      }

      // Update database with completion status
      const finalStatus = failedSites > 0 ? SCRAPER_RUN_STATUS.FAILED : SCRAPER_RUN_STATUS.COMPLETED

      await queries.updateScrapeRun(scrapeRunId, {
        successfulSites,
        failedSites,
        completedAt: new Date(),
        status: finalStatus,
      })

      // Send completion event
      typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.COMPLETE, {
        scrapeRunId,
        totalNewJobs,
        successfulSites,
        failedSites,
      })
    }

    // Start processing sites without blocking
    processSitesAsync()

    return { success: true as const, scrapeRunId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false as const, error: errorMessage }
  }
}

export function getProgress(scrapeRunId: string) {
  const progress = activeRuns.get(scrapeRunId)
  if (!progress) {
    return { success: false as const, error: 'Scrape run not found' }
  }
  return { success: true as const, progress }
}

export function getActiveRun() {
  for (const [scrapeRunId, progress] of activeRuns.entries()) {
    if (progress.status === SCRAPER_RUN_STATUS.PENDING || progress.status === SCRAPER_RUN_STATUS.IN_PROGRESS) {
      return { hasActive: true as const, scrapeRunId, progress }
    }
  }
  return { hasActive: false as const }
}
