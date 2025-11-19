import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHANNEL, type SiteProgressDTO } from '../../../../shared/messages.types'
import { QUERY_KEYS, ROUTES } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ScrapeProgressModalProps {
  id: typeof MODAL_ID.SCRAPE_PROGRESS_MODAL
  initialError?: string
}

const ScrapeProgressModal = (props: ScrapeProgressModalProps) => {
  const navigate = useNavigate()
  const [sites, setSites] = useState<SiteProgressDTO[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [totalNewJobs, setTotalNewJobs] = useState(0)
  const [scrapeRunId, setScrapeRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (scrapeRunId === null) return

    logger.info('[ScrapeProgressModal] Setting up listeners for runId:', scrapeRunId)

    // Listen for progress updates
    const unsubscribeProgress = window.electron.ipcRenderer.on('scraper:progress', (data) => {
      logger.info('[ScrapeProgressModal] Received progress update:', data)
      if (data.scrapeRunId === scrapeRunId) {
        logger.info('[ScrapeProgressModal] Updating sites:', data.progress.sites)
        setSites(data.progress.sites)
      }
    })

    const unsubscribeComplete = window.electron.ipcRenderer.on('scraper:complete', (data) => {
      logger.info('[ScrapeProgressModal] Received complete event:', data)
      if (data.scrapeRunId === scrapeRunId) {
        setTotalNewJobs(data.totalNewJobs)
        setIsComplete(true)
      }
    })

    return () => {
      logger.info('[ScrapeProgressModal] Cleaning up listeners')
      unsubscribeProgress()
      unsubscribeComplete()
    }
  }, [scrapeRunId])

  const attachToActiveRun = useCallback(async () => {
    try {
      logger.info('[ScrapeProgressModal] Attaching to active scrape run...')
      const result = await ipcMessenger.invoke(CHANNEL.SCRAPER.GET_ACTIVE_RUN, undefined)
      if (!result.hasActive || !result.scrapeRunId) {
        // Only set the default error if we didn't get an initial error
        setError((prev) => prev ?? 'No active scrape run')
        return
      }
      setScrapeRunId(result.scrapeRunId)
      if (result.progress) setSites(result.progress.sites)
    } catch (error) {
      logger.error('Failed to attach to active run:', error)
      setError(error instanceof Error ? error.message : 'Failed to attach to active run')
    }
  }, [])

  useEffect(() => {
    // If an initial error is passed in (e.g., no sites configured), show it and don't attach.
    if (props.initialError) {
      setError(props.initialError)
      return
    }
    ;(async () => {
      await attachToActiveRun()
    })()
  }, [attachToActiveRun, props.initialError])

  const handleClose = () => {
    if (isComplete) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCRAPE_RUNS] })
    }
    activeModalSignal.value = null
  }

  const getStatusColor = (
    status: SiteProgressDTO['status'],
  ): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'scraping':
      case 'processing':
        return 'primary'
      case 'complete':
        return 'success'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: SiteProgressDTO['status']): string => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'scraping':
        return 'Scraping...'
      case 'processing':
        return 'Processing...'
      case 'complete':
        return 'Complete'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  const completedCount = sites.filter((s) => s.status === 'complete' || s.status === 'error').length
  const errorCount = sites.filter((s) => s.status === 'error').length
  const progress = sites.length > 0 ? (completedCount / sites.length) * 100 : 0

  const handleGoToSites = () => {
    activeModalSignal.value = null
    navigate(ROUTES.sites.href())
  }

  if (error) {
    const normalized = error.toLowerCase()
    const isNoActiveSites = normalized.includes('no') && normalized.includes('site')
    const isNoActiveRun = normalized.includes('no active scrape run')

    return (
      <DefaultModal
        title={isNoActiveSites ? 'No Sites Configured' : isNoActiveRun ? 'No Active Scrape' : 'Scraping Error'}
      >
        <Box sx={{ minWidth: 500 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Stack spacing={SPACING.SMALL.PX} sx={{ mt: SPACING.MEDIUM.PX }}>
            {isNoActiveSites ? (
              <>
                <Button variant="contained" onClick={handleGoToSites} fullWidth>
                  Go to Sites
                </Button>
                <Button variant="outlined" onClick={handleClose} fullWidth>
                  Close
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleClose} fullWidth>
                Close
              </Button>
            )}
          </Stack>
        </Box>
      </DefaultModal>
    )
  }

  return (
    <DefaultModal title="Finding Jobs">
      <Box sx={{ minWidth: 500, maxHeight: 500, overflow: 'auto' }}>
        {!isComplete && (
          <Box sx={{ mb: SPACING.MEDIUM.PX }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Scanning {sites.length} active site{sites.length !== 1 ? 's' : ''}
              ...
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: SPACING.SMALL.PX }} />
            <Typography variant="caption" color="textSecondary">
              {completedCount} of {sites.length} sites processed
            </Typography>
          </Box>
        )}

        {isComplete && (
          <Box sx={{ mb: SPACING.MEDIUM.PX }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              Scrape Complete! 🎉
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Found <strong>{totalNewJobs}</strong> new job posting
              {totalNewJobs !== 1 ? 's' : ''} across {sites.length - errorCount} site
              {sites.length - errorCount !== 1 ? 's' : ''}
              {errorCount > 0 && (
                <>
                  {' '}
                  ({errorCount} site{errorCount !== 1 ? 's' : ''} had errors)
                </>
              )}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: SPACING.SMALL.PX }} />

        <List dense>
          {sites.map((site) => (
            <ListItem
              key={site.siteId}
              secondaryAction={
                <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
                  {site.status === 'complete' && site.newJobsFound !== undefined && (
                    <Typography variant="body2" color="textSecondary">
                      {site.newJobsFound} new job
                      {site.newJobsFound !== 1 ? 's' : ''}
                    </Typography>
                  )}
                  {(site.status === 'scraping' || site.status === 'processing') && <CircularProgress size={16} />}
                  <Chip label={getStatusLabel(site.status)} color={getStatusColor(site.status)} size="small" />
                </Stack>
              }
            >
              <ListItemText
                primary={site.siteTitle}
                secondary={
                  site.errorMessage ? (
                    <Typography variant="caption" color="error">
                      {site.errorMessage}
                    </Typography>
                  ) : (
                    site.siteUrl
                  )
                }
              />
            </ListItem>
          ))}
        </List>

        {isComplete && (
          <Box sx={{ mt: SPACING.MEDIUM.PX }}>
            <Stack spacing={SPACING.SMALL.PX}>
              <Button variant="contained" onClick={handleClose} fullWidth>
                Close
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </DefaultModal>
  )
}

export default ScrapeProgressModal
