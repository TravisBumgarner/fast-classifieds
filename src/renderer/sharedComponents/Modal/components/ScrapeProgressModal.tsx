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
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ScrapeProgressModalProps {
  id: typeof MODAL_ID.SCRAPE_PROGRESS_MODAL
  onComplete?: () => void
  retryRunId?: number
}

type SiteProgress = {
  siteId: number
  siteUrl: string
  siteTitle: string
  status: 'pending' | 'scraping' | 'processing' | 'complete' | 'error'
  newJobsFound?: number
  errorMessage?: string
}

const ScrapeProgressModal = (props: ScrapeProgressModalProps) => {
  const [sites, setSites] = useState<SiteProgress[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [totalNewJobs, setTotalNewJobs] = useState(0)
  const [scrapeRunId, setScrapeRunId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startScraping()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrapeRunId === null) return

    console.log(
      '[ScrapeProgressModal] Setting up listeners for runId:',
      scrapeRunId,
    )

    // Listen for progress updates
    const unsubscribeProgress = window.electron.ipcRenderer.on(
      'scraper:progress',
      data => {
        console.log('[ScrapeProgressModal] Received progress update:', data)
        if (data.scrapeRunId === scrapeRunId) {
          console.log(
            '[ScrapeProgressModal] Updating sites:',
            data.progress.sites,
          )
          setSites(data.progress.sites)
        }
      },
    )

    const unsubscribeComplete = window.electron.ipcRenderer.on(
      'scraper:complete',
      data => {
        console.log('[ScrapeProgressModal] Received complete event:', data)
        if (data.scrapeRunId === scrapeRunId) {
          setTotalNewJobs(data.totalNewJobs)
          setIsComplete(true)
        }
      },
    )

    return () => {
      console.log('[ScrapeProgressModal] Cleaning up listeners')
      unsubscribeProgress()
      unsubscribeComplete()
    }
  }, [scrapeRunId])

  const startScraping = async () => {
    try {
      console.log('[ScrapeProgressModal] Starting scrape...')

      // If retryRunId is provided, call retry instead of start
      const result = props.retryRunId
        ? await ipcMessenger.invoke(CHANNEL.SCRAPER.RETRY, {
            scrapeRunId: props.retryRunId,
          })
        : await ipcMessenger.invoke(CHANNEL.SCRAPER.START, undefined)

      console.log('[ScrapeProgressModal] Start result:', result)

      if (!result.success) {
        setError(result.error || 'Failed to start scraping')
        return
      }

      console.log(
        '[ScrapeProgressModal] Setting scrapeRunId:',
        result.scrapeRunId,
      )
      setScrapeRunId(result.scrapeRunId!)
    } catch (error) {
      console.error('Failed to start scraping:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to start scraping',
      )
    }
  }

  const handleClose = () => {
    if (isComplete) {
      props.onComplete?.()
      activeModalSignal.value = null
    }
  }

  const handleRetry = () => {
    if (scrapeRunId && isComplete && errorCount > 0) {
      activeModalSignal.value = {
        id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
        onComplete: props.onComplete,
        retryRunId: scrapeRunId,
      }
    }
  }

  const getStatusColor = (
    status: SiteProgress['status'],
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

  const getStatusLabel = (status: SiteProgress['status']): string => {
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

  const completedCount = sites.filter(
    s => s.status === 'complete' || s.status === 'error',
  ).length
  const errorCount = sites.filter(s => s.status === 'error').length
  const progress = sites.length > 0 ? (completedCount / sites.length) * 100 : 0

  if (error) {
    return (
      <DefaultModal title="Scraping Error">
        <Box sx={{ minWidth: 500 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => (activeModalSignal.value = null)}
            fullWidth
          >
            Close
          </Button>
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
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mb: SPACING.SMALL.PX }}
            />
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
              {totalNewJobs !== 1 ? 's' : ''} across {sites.length - errorCount}{' '}
              site
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
          {sites.map((site, idx) => (
            <ListItem
              key={idx}
              secondaryAction={
                <Stack
                  direction="row"
                  spacing={SPACING.SMALL.PX}
                  alignItems="center"
                >
                  {site.status === 'complete' &&
                    site.newJobsFound !== undefined && (
                      <Typography variant="body2" color="textSecondary">
                        {site.newJobsFound} new job
                        {site.newJobsFound !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  {(site.status === 'scraping' ||
                    site.status === 'processing') && (
                    <CircularProgress size={16} />
                  )}
                  <Chip
                    label={getStatusLabel(site.status)}
                    color={getStatusColor(site.status)}
                    size="small"
                  />
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
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRetry}
                  fullWidth
                >
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
