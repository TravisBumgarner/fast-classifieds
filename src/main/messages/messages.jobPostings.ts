import { JOB_POSTING_DUPLICATE_STATUS } from '../../shared/types'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import queries from '../database/queries'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.SKIP_NOT_RECOMMENDED_POSTINGS, async () => {
  try {
    const result = await queries.skipNotRecommendedPostings()
    return {
      type: 'skip_not_recommended_postings',
      success: true as const,
      skippedCount: result.length,
    }
  } catch (error) {
    logger.error('Error skipping not recommended postings:', error)
    return {
      type: 'skip_not_recommended_postings',
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// Job postings handlers
typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.GET_ALL, async () => {
  try {
    const postings = await queries.getJobPostings({ duplicateStatusArray: [JOB_POSTING_DUPLICATE_STATUS.UNIQUE] })
    const suspectedDuplicatesCount = await queries.jobPostingsSuspectedDuplicatesCount()
    return {
      postings,
      suspectedDuplicatesCount: suspectedDuplicatesCount[0]?.count || 0,
    }
  } catch (error) {
    logger.error('Error getting job postings:', error)
    return {
      suspectedDuplicatesCount: 0,
      postings: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.GET_SUSPECTED_DUPLICATES, async () => {
  try {
    const groups = await queries.getSuspectedDuplicateGroups()
    return { groups }
  } catch (error) {
    logger.error('Error getting suspected duplicate groups:', error)
    return { groups: [] }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.GET_DUPLICATE_GROUP, async (_event, params) => {
  try {
    const postings = await queries.getJobPostings({ duplicationDetectionId: params.duplicationDetectionId })
    return { postings }
  } catch (error) {
    logger.error('Error getting duplicate group:', error)
    return { postings: [] }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.GET_BY_SITE_ID, async (_event, params) => {
  try {
    const postings = await queries.getJobPostings({ siteId: params.siteId })
    return {
      type: 'get_job_postings_by_site_id',
      postings,
    }
  } catch (error) {
    logger.error('Error getting job postings by site:', error)
    return {
      type: 'get_job_postings_by_site_id',
      postings: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, async (_event, params) => {
  try {
    await queries.updateJobPosting(params.id, params.data)
    return {
      type: 'update_job_posting',
      success: true,
    }
  } catch (error) {
    logger.error('Error updating job posting status:', error)
    return {
      type: 'update_JOB_POSTING_STATUS',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
