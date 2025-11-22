import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import * as scraper from '../jobFinder'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.SCRAPER.START, async (_event, params) => {
  try {
    const result = await scraper.startScraping(params.siteIds)
    return {
      type: 'start_scraping',
      ...result,
    }
  } catch (error) {
    logger.error('Error starting scraper:', error)
    return {
      type: 'start_scraping',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SCRAPER.GET_PROGRESS, async (_event, params) => {
  try {
    const result = scraper.getProgress(params.scrapeRunId)
    return {
      type: 'get_scrape_progress',
      ...result,
    }
  } catch (error) {
    logger.error('Error getting scrape progress:', error)
    return {
      type: 'get_scrape_progress',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SCRAPER.GET_ACTIVE_RUN, async () => {
  try {
    const result = scraper.getActiveRun()
    return result
  } catch (error) {
    logger.error('Error getting active scrape run:', error)
    return { hasActive: false as const }
  }
})
