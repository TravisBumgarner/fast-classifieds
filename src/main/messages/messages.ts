import { BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { CHANNEL } from '../../shared/messages.types'
import queries from '../database/queries'
import * as scraper from '../scraper'
import { scrape } from '../scraper/scrape'
import { typedIpcMain } from './index'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow) {
  mainWindow = window
}

typedIpcMain.handle(CHANNEL.APP.GET_BACKUP_DIRECTORY, async () => {
  return {
    type: 'get_backup_directory',
    backupDirectory: path.resolve(process.cwd(), 'db_backups'),
  }
})

typedIpcMain.handle(CHANNEL.APP.EXPORT_ALL_DATA, async () => {
  // try {
  //   // TODO: Implement export functionality
  //   return {
  //     type: 'export_all_data',
  //     success: true,
  //     data: {
  //       sites: [],
  //     },
  //   }
  // } catch (error) {
  //   return {
  //     type: 'export_all_data',
  //     success: false,
  //     error: error instanceof Error ? error.message : 'Unknown error',
  //   }
  // }
})

typedIpcMain.handle(CHANNEL.APP.RESTORE_ALL_DATA, async () => {
  try {
    // TODO: Implement restore functionality
    return {
      type: 'restore_all_data',
      success: true,
    }
  } catch (error) {
    return {
      type: 'restore_all_data',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.APP.NUKE_DATABASE, async () => {
  try {
    await queries.nukeDatabase()
    return {
      type: 'nuke_database',
      success: true,
    }
  } catch (error) {
    return {
      type: 'nuke_database',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// Site management handlers
typedIpcMain.handle(CHANNEL.SITES.GET_ALL, async () => {
  try {
    const sites = await queries.getAllSites()
    return {
      type: 'get_all_sites',
      sites,
    }
  } catch (error) {
    console.error('Error getting sites:', error)
    return {
      type: 'get_all_sites',
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL.SITES.GET_ALL_WITH_JOB_COUNTS, async () => {
  try {
    const sites = await queries.getAllSitesWithJobCounts()
    return {
      type: 'get_all_sites_with_job_counts',
      sites,
    }
  } catch (error) {
    console.error('Error getting sites with job counts:', error)
    return {
      type: 'get_all_sites_with_job_counts',
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL.SITES.GET_BY_ID, async (_event, params) => {
  try {
    const site = await queries.getSiteById(params.id)
    return {
      type: 'get_site_by_id',
      site,
    }
  } catch (error) {
    console.error('Error getting site:', error)
    return {
      type: 'get_site_by_id',
      site: null,
    }
  }
})

typedIpcMain.handle(CHANNEL.SITES.CREATE, async (_event, params) => {
  try {
    const result = await queries.insertSite(params)
    return {
      type: 'create_site',
      success: true,
      id: result[0]?.id,
    }
  } catch (error) {
    console.error('Error creating site:', error)
    return {
      type: 'create_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SITES.UPDATE, async (_event, params) => {
  try {
    const { id, ...updateData } = params
    await queries.updateSite(id, updateData)
    return {
      type: 'update_site',
      success: true,
    }
  } catch (error) {
    console.error('Error updating site:', error)
    return {
      type: 'update_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SITES.DELETE, async (_event, params) => {
  try {
    await queries.deleteSite(params.id)
    return {
      type: 'delete_site',
      success: true,
    }
  } catch (error) {
    console.error('Error deleting site:', error)
    return {
      type: 'delete_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// Prompt management handlers
typedIpcMain.handle(CHANNEL.PROMPTS.GET_ALL, async () => {
  try {
    const prompts = await queries.getAllPrompts()
    return {
      type: 'get_all_prompts',
      prompts,
    }
  } catch (error) {
    console.error('Error getting prompts:', error)
    return {
      type: 'get_all_prompts',
      prompts: [],
    }
  }
})

typedIpcMain.handle(CHANNEL.PROMPTS.GET_BY_ID, async (_event, params) => {
  try {
    const prompt = await queries.getPromptById(params.id)
    return {
      type: 'get_prompt_by_id',
      prompt,
    }
  } catch (error) {
    console.error('Error getting prompt:', error)
    return {
      type: 'get_prompt_by_id',
      prompt: null,
    }
  }
})

typedIpcMain.handle(CHANNEL.PROMPTS.CREATE, async (_event, params) => {
  try {
    const result = await queries.insertPrompt(params)
    return {
      type: 'create_prompt',
      success: true,
      id: result[0]?.id,
    }
  } catch (error) {
    console.error('Error creating prompt:', error)
    return {
      type: 'create_prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.PROMPTS.UPDATE, async (_event, params) => {
  try {
    const { id, ...updateData } = params
    await queries.updatePrompt(id, updateData)
    return {
      type: 'update_prompt',
      success: true,
    }
  } catch (error) {
    console.error('Error updating prompt:', error)
    return {
      type: 'update_prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.PROMPTS.DELETE, async (_event, params) => {
  try {
    await queries.deletePrompt(params.id)
    return {
      type: 'delete_prompt',
      success: true,
    }
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return {
      type: 'delete_prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SCRAPER.START, async (_event, params) => {
  try {
    const result = await scraper.startScraping(
      mainWindow,
      params.apiKey,
      params.model,
      params.delay,
    )
    return {
      type: 'start_scraping',
      ...result,
    }
  } catch (error) {
    console.error('Error starting scraper:', error)
    return {
      type: 'start_scraping',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SCRAPER.RETRY, async (_event, params) => {
  try {
    const result = await scraper.retryFailedScrapes(
      mainWindow,
      params.scrapeRunId,
      params.apiKey,
      params.model,
      params.delay,
    )
    return {
      type: 'retry_scraping',
      ...result,
    }
  } catch (error) {
    console.error('Error retrying scraper:', error)
    return {
      type: 'retry_scraping',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SCRAPER.GET_PROGRESS, async (_event, params) => {
  try {
    const result = scraper.getProgress(params.scrapeRunId)
    return {
      type: 'get_scrape_progress',
      ...result,
    }
  } catch (error) {
    console.error('Error getting scrape progress:', error)
    return {
      type: 'get_scrape_progress',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL.SCRAPER.DEBUG_SCRAPE, async (_event, params) => {
  try {
    const result = await scrape({
      siteUrl: params.url,
      selector: params.selector,
      delay: params.delay,
    })

    return {
      success: true,
      html: result.siteContent,
    }
  } catch (error) {
    console.error('Error in debug scrape:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// Scrape run history handlers
typedIpcMain.handle(CHANNEL.SCRAPE_RUNS.GET_ALL, async () => {
  try {
    const runs = await queries.getAllScrapeRuns()
    return {
      type: 'get_all_scrape_runs',
      runs,
    }
  } catch (error) {
    console.error('Error getting scrape runs:', error)
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
    console.error('Error getting scrape tasks:', error)
    return {
      type: 'get_scrape_tasks',
      tasks: [],
    }
  }
})

// Job postings handlers
typedIpcMain.handle(CHANNEL.JOB_POSTINGS.GET_ALL, async () => {
  try {
    const postings = await queries.getAllJobPostings()
    return {
      type: 'get_all_job_postings',
      postings,
    }
  } catch (error) {
    console.error('Error getting job postings:', error)
    return {
      type: 'get_all_job_postings',
      postings: [],
    }
  }
})

typedIpcMain.handle(
  CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID,
  async (_event, params) => {
    try {
      const postings = await queries.getJobPostingsBySiteId(params.siteId)
      return {
        type: 'get_job_postings_by_site_id',
        postings,
      }
    } catch (error) {
      console.error('Error getting job postings by site:', error)
      return {
        type: 'get_job_postings_by_site_id',
        postings: [],
      }
    }
  },
)

typedIpcMain.handle(
  CHANNEL.JOB_POSTINGS.UPDATE_STATUS,
  async (_event, params) => {
    try {
      await queries.updateJobPostingStatus(params.id, params.status)
      return {
        type: 'update_job_posting_status',
        success: true,
      }
    } catch (error) {
      console.error('Error updating job posting status:', error)
      return {
        type: 'update_job_posting_status',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
)

// Shell handlers
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  try {
    // Validate URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error('Invalid URL provided to openExternal:', url)
      return
    }

    // Ensure URL has a protocol
    let validUrl = url.trim()
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl
    }

    await shell.openExternal(validUrl)
  } catch (error) {
    console.error('Error opening external URL:', error)
  }
})
