import { CHANNEL } from '../../shared/messages.types'
import queries from '../database/queries'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL.SCRAPE_RUNS.GET_ALL, async () => {
  try {
    const runs = await queries.getAllScrapeRuns()
    return {
      type: 'get_all_scrape_runs',
      runs,
    }
  } catch (error) {
    logger.error('Error getting scrape runs:', error)
    return {
      type: 'get_all_scrape_runs',
      runs: [],
    }
  }
})

typedIpcMain.handle(CHANNEL.SCRAPE_RUNS.GET_TASKS, async (_event, params) => {
  try {
    const tasks = await queries.getScrapeTasksByRunId(params.scrapeRunId)
    return {
      type: 'get_scrape_tasks',
      tasks,
    }
  } catch (error) {
    logger.error('Error getting scrape tasks:', error)
    return {
      type: 'get_scrape_tasks',
      tasks: [],
    }
  }
})
