import type { BrowserWindow } from 'electron'
import { CHANNEL_FROM_MAIN } from '../../shared/types/messages.fromMain'
import queries from '../database/queries'
import log from '../logger'
import { typedIpcMain } from '../messages/ipcMain'
import store from '../store'
import processSite from './processSite'

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
      typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, {
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
          typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, {
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
                typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, {
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
        typedIpcMain.send(CHANNEL_FROM_MAIN.SCRAPE.COMPLETE, {
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

export function getActiveRun() {
  for (const [scrapeRunId, progress] of activeRuns.entries()) {
    if (progress.status === 'pending' || progress.status === 'in_progress') {
      return { hasActive: true as const, scrapeRunId, progress }
    }
  }
  return { hasActive: false as const }
}
