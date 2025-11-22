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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ScraperTaskProgress } from '../../../../shared/types'
import { SCRAPER_RUN_PROGRESS, SCRAPER_TASK_STATUS } from '../../../../shared/types'
import { CHANNEL_FROM_MAIN } from '../../../../shared/types/messages.fromMain'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import { useIpcOn } from '../../../hooks/useIpcOn'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

const getScraperTaskColor = (status: ScraperTaskProgress): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  switch (status) {
    case SCRAPER_TASK_STATUS.PENDING:
      return 'default'
    case SCRAPER_TASK_STATUS.SCRAPING:
    case SCRAPER_TASK_STATUS.PROCESSING:
      return 'primary'
    case SCRAPER_TASK_STATUS.COMPLETE:
      return 'success'
    case SCRAPER_TASK_STATUS.ERROR:
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: ScraperTaskProgress): string => {
  switch (status) {
    case SCRAPER_TASK_STATUS.PENDING:
      return 'Pending'
    case SCRAPER_TASK_STATUS.SCRAPING:
      return 'Scraping'
    case SCRAPER_TASK_STATUS.PROCESSING:
      return 'Processing'
    case SCRAPER_TASK_STATUS.COMPLETE:
      return 'Complete'
    case SCRAPER_TASK_STATUS.ERROR:
      return 'Error'
    default:
      return 'Unknown'
  }
}

export interface ScrapeProgressModalProps {
  id: typeof MODAL_ID.SCRAPE_PROGRESS_MODAL
}

const ScrapeProgressModal = (_props: ScrapeProgressModalProps) => {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: [QUERY_KEYS.SCRAPE_PROGRESS],
    queryFn: async () => {
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPER.GET_ACTIVE_RUN, undefined)
      return result
    },
  })

  useIpcOn(CHANNEL_FROM_MAIN.SCRAPE.PROGRESS, () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCRAPE_PROGRESS] })
  })

  useIpcOn(CHANNEL_FROM_MAIN.SCRAPE.COMPLETE, () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCRAPE_PROGRESS] })
  })

  const handleClose = () => {
    activeModalSignal.value = null
  }

  const completedCount =
    data?.progress?.sites.filter(
      (s) => s.status === SCRAPER_TASK_STATUS.COMPLETE || s.status === SCRAPER_TASK_STATUS.ERROR,
    ).length || 0
  const errorCount = data?.progress?.sites.filter((s) => s.status === SCRAPER_TASK_STATUS.ERROR).length || 0
  const totalCount = data?.progress?.sites.length || 1
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const isComplete = data?.progress?.status === SCRAPER_RUN_PROGRESS.COMPLETED
  const isInProgress = data?.progress?.status === SCRAPER_RUN_PROGRESS.IN_PROGRESS

  return (
    <DefaultModal title="Finding Jobs">
      <Stack
        sx={{
          height: '100%',
          minHeight: 0, // ← REQUIRED
          display: 'flex',
        }}
      >
        {isInProgress && (
          <Box sx={{ mb: SPACING.MEDIUM.PX }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Scanning {totalCount} active site{totalCount !== 1 ? 's' : ''}
              ...
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: SPACING.SMALL.PX }} />
            <Typography variant="caption" color="textSecondary">
              {completedCount} of {totalCount} sites processed
            </Typography>
          </Box>
        )}
        {isComplete && (
          <Box sx={{ mb: SPACING.MEDIUM.PX }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              Scrape Complete! 🎉
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Found <strong>{totalCount}</strong> new job posting
              {totalCount !== 1 ? 's' : ''} across {totalCount - errorCount} site
              {totalCount - errorCount !== 1 ? 's' : ''}
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
        <List
          dense
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {data?.progress?.sites.map((site) => (
            <ListItem
              key={site.siteId}
              secondaryAction={
                <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
                  {site.status === SCRAPER_TASK_STATUS.COMPLETE && site.newJobsFound !== undefined && (
                    <Typography variant="body2" color="textSecondary">
                      {site.newJobsFound} new job
                      {site.newJobsFound !== 1 ? 's' : ''}
                    </Typography>
                  )}
                  {(site.status === SCRAPER_TASK_STATUS.SCRAPING || site.status === SCRAPER_TASK_STATUS.PROCESSING) && (
                    <CircularProgress size={16} />
                  )}
                  <Chip label={getStatusLabel(site.status)} color={getScraperTaskColor(site.status)} size="small" />
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
      </Stack>
    </DefaultModal>
  )
}

export default ScrapeProgressModal
