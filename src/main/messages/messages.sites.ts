import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import { humanizeDbError } from '../database/errors'
import queries from '../database/queries'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_ALL, async () => {
  try {
    const sites = await queries.getSites({})
    return {
      sites,
    }
  } catch (error) {
    logger.error('Error getting sites:', error)
    return {
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_ALL_WITH_JOB_COUNTS, async () => {
  try {
    const sites = await queries.getAllSitesWithJobCounts()
    return {
      sites,
    }
  } catch (error) {
    logger.error('Error getting sites with job counts:', error)
    return {
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_BY_ID, async (_event, params) => {
  try {
    const site = await queries.getSiteById(params.id)
    return {
      site,
    }
  } catch (error) {
    logger.error('Error getting site:', error)
    return {
      site: null,
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.CREATE, async (_event, params) => {
  try {
    const result = await queries.insertSite(params)
    return {
      success: true,
      id: result[0]?.id,
    }
  } catch (error) {
    logger.error('Error creating site:', error)
    return {
      success: false,
      error: humanizeDbError(error, 'site'),
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.UPDATE, async (_event, params) => {
  try {
    const { id, ...updateData } = params
    await queries.updateSite(id, updateData)
    return {
      success: true,
    }
  } catch (error) {
    logger.error('Error updating site:', error)
    return {
      success: false,
      error: humanizeDbError(error, 'site'),
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.DELETE, async (_event, params) => {
  try {
    await queries.deleteSite(params.id)
    return {
      success: true,
    }
  } catch (error) {
    logger.error('Error deleting site:', error)
    return {
      success: false,
      error: humanizeDbError(error, 'site'),
    }
  }
})
