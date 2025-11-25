import path from 'node:path'
import { app } from 'electron'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import { db } from '../database/client'
import queries from '../database/queries'
import { apiUsage, hashes, jobPostings, prompts, scrapeRuns, scrapeTasks, sites } from '../database/schema'
import store from '../store'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.APP.GET_BACKUP_DIRECTORY, async () => {
  const backupDirectory = path.join(app.getPath('userData'), 'db_backups')
  return {
    type: 'get_backup_directory',
    backupDirectory,
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.APP.EXPORT_ALL_DATA, async () => {
  const sites = await queries.getSites({})
  const prompts = await queries.getAllPrompts()
  const jobPostings = await queries.getJobPostings({})
  const scrapeRuns = await queries.getAllScrapeRuns()
  const hashes = await queries.getAllHashes()
  const apiUsage = await queries.getAllApiUsage()
  const scrapeTasks = await queries.getAllScrapeTasks()

  try {
    return {
      type: 'export_all_data',
      success: true,
      data: {
        sites,
        prompts,
        jobPostings,
        scrapeRuns,
        hashes,
        apiUsage,
        scrapeTasks,
      },
    }
  } catch (error) {
    return {
      type: 'export_all_data',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.APP.RESTORE_ALL_DATA, async (_event, params) => {
  try {
    await db.delete(sites).run()
    await db.delete(prompts).run()
    await db.delete(jobPostings).run()
    await db.delete(scrapeRuns).run()
    await db.delete(hashes).run()
    await db.delete(apiUsage).run()
    await db.delete(scrapeTasks).run()

    const {
      sites: storeSites,
      prompts: storePrompts,
      jobPostings: storeJobPostings,
      scrapeRuns: storeScrapeRuns,
      hashes: storeHashes,
      apiUsage: storeApiUsage,
      scrapeTasks: storeScrapeTasks,
    } = await params.data

    if (storeSites.length) await db.insert(sites).values(storeSites).run()
    if (storePrompts.length) await db.insert(prompts).values(storePrompts).run()
    if (storeJobPostings.length) await db.insert(jobPostings).values(storeJobPostings).run()
    if (storeScrapeRuns.length) await db.insert(scrapeRuns).values(storeScrapeRuns).run()
    if (storeHashes.length) await db.insert(hashes).values(storeHashes).run()
    if (storeApiUsage.length) await db.insert(apiUsage).values(storeApiUsage).run()
    if (storeScrapeTasks.length) await db.insert(scrapeTasks).values(storeScrapeTasks).run()

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

typedIpcMain.handle(CHANNEL_INVOKES.APP.CLEAR_LOCAL_STORAGE, async () => {
  store.clear()

  return {
    type: 'clear_local_storage',
    success: true,
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.APP.NUKE_DATABASE, async () => {
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
