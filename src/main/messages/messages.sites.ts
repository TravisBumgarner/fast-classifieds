import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import queries from '../database/queries'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_ALL, async () => {
  try {
    const sites = await queries.getSites({})
    return {
      type: 'get_all_sites',
      sites,
    }
  } catch (error) {
    logger.error('Error getting sites:', error)
    return {
      type: 'get_all_sites',
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_ALL_WITH_JOB_COUNTS, async () => {
  try {
    const sites = await queries.getAllSitesWithJobCounts()
    return {
      type: 'get_all_sites_with_job_counts',
      sites,
    }
  } catch (error) {
    logger.error('Error getting sites with job counts:', error)
    return {
      type: 'get_all_sites_with_job_counts',
      sites: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.GET_BY_ID, async (_event, params) => {
  try {
    const site = await queries.getSiteById(params.id)
    return {
      type: 'get_site_by_id',
      site,
    }
  } catch (error) {
    logger.error('Error getting site:', error)
    return {
      type: 'get_site_by_id',
      site: null,
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.CREATE, async (_event, params) => {
  try {
    const result = await queries.insertSite(params)
    return {
      type: 'create_site',
      success: true,
      id: result[0]?.id,
    }
  } catch (error) {
    logger.error('Error creating site:', error)
    return {
      type: 'create_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.UPDATE, async (_event, params) => {
  try {
    const { id, ...updateData } = params
    await queries.updateSite(id, updateData)
    return {
      type: 'update_site',
      success: true,
    }
  } catch (error) {
    logger.error('Error updating site:', error)
    return {
      type: 'update_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.SITES.DELETE, async (_event, params) => {
  try {
    await queries.deleteSite(params.id)
    return {
      type: 'delete_site',
      success: true,
    }
  } catch (error) {
    logger.error('Error deleting site:', error)
    return {
      type: 'delete_site',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
