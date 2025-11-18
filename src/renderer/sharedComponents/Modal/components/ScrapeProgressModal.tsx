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
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ScrapeProgressModalProps {
  id: typeof MODAL_ID.SCRAPE_PROGRESS_MODAL
  retryRunId?: string
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

  const startScraping = useCallback(async () => {
    try {
      logger.info('[ScrapeProgressModal] Starting scrape...')

      // If retryRunId is provided, call retry instead of start
      const result = props.retryRunId
        ? await ipcMessenger.invoke(CHANNEL.SCRAPER.RETRY, {
            scrapeRunId: props.retryRunId,
          })
        : await ipcMessenger.invoke(CHANNEL.SCRAPER.START, undefined)

      logger.info('[ScrapeProgressModal] Start result:', result)

      if (!result.success) {
        setError(result.error)
        return
      }

      if (!result.scrapeRunId) {
        setError('Failed to start scraping')
        return
      }

      logger.info('[ScrapeProgressModal] Setting scrapeRunId:', result.scrapeRunId)
      setScrapeRunId(result.scrapeRunId)
    } catch (error) {
      logger.error('Failed to start scraping:', error)
      setError(error instanceof Error ? error.message : 'Failed to start scraping')
    }
  }, [props.retryRunId])

  useEffect(() => {
    ;(async () => {
      await startScraping()
    })()
  }, [startScraping])

  const handleClose = () => {
    if (isComplete) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTINGS] })
    }
    activeModalSignal.value = null
  }

  const handleRetry = () => {
    if (scrapeRunId && isComplete && errorCount > 0) {
      activeModalSignal.value = {
        id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
        retryRunId: scrapeRunId,
      }
    }
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
    const isNoActiveSites = error.includes('No active sites')

    return (
      <DefaultModal title="Scraping Error">
        <Box sx={{ minWidth: 500 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Stack spacing={SPACING.SMALL.PX} sx={{ mt: SPACING.MEDIUM.PX }}>
            {isNoActiveSites && (
              <Button variant="contained" onClick={handleGoToSites} fullWidth>
                Go to Sites
              </Button>
            )}
            <Button variant={isNoActiveSites ? 'outlined' : 'contained'} onClick={handleClose} fullWidth>
              Close
            </Button>
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
              {errorCount > 0 && (
                <Button variant="outlined" color="warning" onClick={handleRetry} fullWidth>
                  Retry Failed Sites ({errorCount})
                </Button>
              )}
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
