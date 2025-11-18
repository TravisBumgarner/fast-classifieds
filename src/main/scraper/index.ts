import type { BrowserWindow } from 'electron'
import { errorCodeToMessage } from '../../shared/errors'
import queries from '../database/queries'
import log from '../logger'
import store from '../store'
import { hashContent } from '../utilities'
import { processText } from './ai'
import { scrape } from './scrape'

// Store active scrape runs in memory
const activeRuns = new Map<
  string,
  {
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    totalSites: number
    completedSites: number
    sites: Array<{
      siteId: string
      siteTitle: string
      siteUrl: string
      status: 'pending' | 'scraping' | 'processing' | 'complete' | 'error'
      newJobsFound?: number
      errorMessage?: string
    }>
  }
>()

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

    const { scrapedContent, hash: siteContentHash } = await scrape({ siteUrl, selector })
    log.info(`Scraped content for: ${siteUrl}, siteContentHash: ${siteContentHash}`)

    const promptHash = hashContent(prompt)

    const jobToJSONPrompt = store.get('openAiSiteHTMLToJSONJobsPrompt')
    const jobToJSONPromptHash = hashContent(jobToJSONPrompt)

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

    const { jobs, rawResponse } = await processText({
      prompt,
      scrapedContent,
      siteUrl,
      apiKey,
      model,
      jobToJSONPrompt,
      siteId,
      scrapeRunId,
    })

    await queries.insertApiUsage({
      response: rawResponse,
      prompt,
      siteContent: JSON.stringify(scrapedContent),
      siteUrl,
    })

    // Insert job postings
    const jobPostings = jobs.map((job) => ({
      ...job,
      siteId,
    }))

    if (jobPostings.length > 0) {
      await queries.insertJobPostings(jobPostings)
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
    const errorMessage = errorCodeToMessage(error)
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

export async function startScraping(mainWindow: BrowserWindow | null) {
  try {
    const model = store.get('openaiModel')
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
    const allSites = await queries.getAllSites()
    const activeSites = allSites.filter((s) => s.status === 'active')

    if (activeSites.length === 0) {
      return { success: false as const, error: 'No active sites to scrape' }
    }

    // Create scrape run
    const [scrapeRun] = await queries.insertScrapeRun({
      status: 'new_data',
      totalSites: activeSites.length,
      successfulSites: 0,
      failedSites: 0,
    })

    const scrapeRunId = scrapeRun.id

    // Initialize progress tracking
    const progress = {
      status: 'in_progress' as const,
      totalSites: activeSites.length,
      completedSites: 0,
      sites: activeSites.map((site) => ({
        siteId: site.id,
        siteTitle: site.siteTitle,
        siteUrl: site.siteUrl,
        status: 'pending' as const,
      })),
    }

    activeRuns.set(scrapeRunId, progress)

    // Send initial progress to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      log.info('[Scraper] Sending initial progress for runId:', scrapeRunId)
      mainWindow.webContents.send('scraper:progress', {
        scrapeRunId,
        progress,
      })
    }

    // Process sites asynchronously (don't await)
    const processSitesAsync = async () => {
      let totalNewJobs = 0
      let successfulSites = 0
      let failedSites = 0

      for (let i = 0; i < activeSites.length; i++) {
        const site = activeSites[i]
        const prompt = await queries.getPromptById(site.promptId)

        // Update progress
        const currentProgress = activeRuns.get(scrapeRunId)
        if (currentProgress) {
          currentProgress.sites[i].status = 'scraping'
          activeRuns.set(scrapeRunId, currentProgress)
        }

        // Send progress update to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          log.info('[Scraper] Sending progress update for site', i, 'runId:', scrapeRunId)
          mainWindow.webContents.send('scraper:progress', {
            scrapeRunId,
            progress: activeRuns.get(scrapeRunId),
          })
        }

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
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('scraper:progress', {
                  scrapeRunId,
                  progress: currentProgress,
                })
              }
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

        if (result.status === 'complete') {
          successfulSites++
          totalNewJobs += result.newJobsFound || 0
        } else if (result.status === 'error') {
          failedSites++
        }

        // Send final progress update for this site
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scraper:progress', {
            scrapeRunId,
            progress: activeRuns.get(scrapeRunId),
          })
        }
      }

      // Mark run as completed
      const finalProgress = activeRuns.get(scrapeRunId)
      if (finalProgress) {
        finalProgress.status = 'completed'
        activeRuns.set(scrapeRunId, finalProgress)
      }

      // Update database with completion status
      await queries.updateScrapeRun(scrapeRunId, {
        successfulSites,
        failedSites,
        completedAt: new Date(),
        status: failedSites > 0 ? 'error' : 'new_data',
      })

      // Send completion event
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scraper:complete', {
          scrapeRunId,
          totalNewJobs,
          successfulSites,
          failedSites,
        })
      }
    }

    // Start processing sites without blocking
    processSitesAsync()

    return { success: true as const, scrapeRunId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('Failed to start scraping:', errorMessage)
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

export async function retryFailedScrapes(mainWindow: BrowserWindow | null, originalRunId: string) {
  try {
    const apiKey = store.get('openaiApiKey')
    const model = store.get('openaiModel')
    const delay = store.get('scrapeDelay')

    if (!apiKey) {
      return {
        success: false as const,
        error: 'OpenAI API key not configured. Please set it in Settings.',
      }
    }

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

    // Get failed tasks from the original run
    const failedTasks = await queries.getFailedTasksByRunId(originalRunId)

    if (failedTasks.length === 0) {
      return { success: false as const, error: 'No failed sites to retry' }
    }

    // Get site details for failed tasks
    const siteIds = failedTasks.map((t) => t.siteId)
    const allSites = await queries.getAllSites()
    const sitesToRetry = allSites.filter((s) => siteIds.includes(s.id))

    // Create a new scrape run for retries
    const [scrapeRun] = await queries.insertScrapeRun({
      status: 'new_data',
      totalSites: sitesToRetry.length,
      successfulSites: 0,
      failedSites: 0,
      comments: `Retry of run #${originalRunId}`,
    })

    const scrapeRunId = scrapeRun.id

    // Initialize progress tracking
    const progress = {
      status: 'in_progress' as const,
      totalSites: sitesToRetry.length,
      completedSites: 0,
      sites: sitesToRetry.map((site) => ({
        siteId: site.id,
        siteTitle: site.siteTitle,
        siteUrl: site.siteUrl,
        status: 'pending' as const,
      })),
    }

    activeRuns.set(scrapeRunId, progress)

    // Send initial progress to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      log.info('[Scraper] Sending initial progress for retry runId:', scrapeRunId)
      mainWindow.webContents.send('scraper:progress', {
        scrapeRunId,
        progress,
      })
    }

    // Process sites asynchronously (same logic as startScraping)
    const processSitesAsync = async () => {
      let totalNewJobs = 0
      let successfulSites = 0
      let failedSites = 0

      for (let i = 0; i < sitesToRetry.length; i++) {
        const site = sitesToRetry[i]
        const prompt = await queries.getPromptById(site.promptId)

        // Update progress
        const currentProgress = activeRuns.get(scrapeRunId)
        if (currentProgress) {
          currentProgress.sites[i].status = 'scraping'
          activeRuns.set(scrapeRunId, currentProgress)

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('scraper:progress', {
              scrapeRunId,
              progress: currentProgress,
            })
          }
        }

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
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('scraper:progress', {
                  scrapeRunId,
                  progress: currentProgress,
                })
              }
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

        if (result.status === 'complete') {
          successfulSites++
          totalNewJobs += result.newJobsFound || 0
        } else if (result.status === 'error') {
          failedSites++
        }

        // Send final progress update for this site
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scraper:progress', {
            scrapeRunId,
            progress: activeRuns.get(scrapeRunId),
          })
        }
      }

      // Mark run as completed
      const finalProgress = activeRuns.get(scrapeRunId)
      if (finalProgress) {
        finalProgress.status = 'completed'
        activeRuns.set(scrapeRunId, finalProgress)
      }

      // Update database with completion status
      await queries.updateScrapeRun(scrapeRunId, {
        successfulSites,
        failedSites,
        completedAt: new Date(),
        status: failedSites > 0 ? 'error' : 'new_data',
      })

      // Send completion event
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scraper:complete', {
          scrapeRunId,
          totalNewJobs,
          successfulSites,
          failedSites,
        })
      }
    }

    // Start processing sites without blocking
    processSitesAsync()

    return { success: true as const, scrapeRunId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('Failed to retry scraping:', errorMessage)
    return { success: false as const, error: errorMessage }
  }
}
