import { Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material'
import { useSignals } from '@preact/signals-react/runtime'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { SiteDTO } from '../../../../shared/types'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import logger from '../../../logger'
import { activeModalSignal, isScrapingSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { createQueryKey } from '../../../utilities'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface JobSearchSetupModalProps {
  id: typeof MODAL_ID.JOB_SEARCH_SETUP_MODAL
  siteIds?: string[]
}

const JobSearchSetupModal = (props: JobSearchSetupModalProps) => {
  useSignals()
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(props.siteIds || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: sites, isLoading } = useQuery({
    queryKey: createQueryKey(QUERY_KEYS.SITES, 'jobSearchSetupModal'),
    queryFn: async () => {
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SITES.GET_ALL, undefined)
      return result.sites as SiteDTO[]
    },
    initialData: [],
  })

  const activeSites = sites.filter((site) => site.status === 'active') || []

  const handleToggleSite = (siteId: string) => {
    setSelectedSiteIds((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
  }

  const handleSelectAll = () => {
    if (selectedSiteIds.length === activeSites.length) {
      setSelectedSiteIds([])
    } else {
      setSelectedSiteIds(activeSites.map((site) => site.id))
    }
  }

  const handleStartScraping = async () => {
    setLoading(true)
    try {
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPER.START, { siteIds: selectedSiteIds })
      if (result.success) {
        isScrapingSignal.value = true
        activeModalSignal.value = { id: MODAL_ID.SCRAPE_PROGRESS_MODAL }
      } else {
        setError(result.error)
      }
    } catch (error) {
      logger.error('Error starting scraper:', error)
      setError('An unexpected error occurred while starting the job search.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    activeModalSignal.value = null
  }

  if (isLoading) {
    return <DefaultModal title="Job Search Setup">Loading sites...</DefaultModal>
  }

  if (activeSites.length === 0) {
    return (
      <DefaultModal title="Job Search Setup">
        <Stack spacing={SPACING.MEDIUM.PX} alignItems="center">
          <Typography variant="h6" textAlign="center">
            No Active Sites Available
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            You need to have at least one active site before you can start a job search. Please add and activate some
            sites first.
          </Typography>
          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="center" width="100%">
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
          </Stack>
        </Stack>
      </DefaultModal>
    )
  }

  return (
    <DefaultModal title="Job Search Setup">
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={SPACING.MEDIUM.PX} sx={{ height: '100%', minHeight: 0 }}>
        <Typography variant="body1" color="text.secondary">
          Select which sites to include in your job search:
        </Typography>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedSiteIds.length === activeSites.length && activeSites.length > 0}
                indeterminate={selectedSiteIds.length > 0 && selectedSiteIds.length < activeSites.length}
                onChange={handleSelectAll}
              />
            }
            label={
              <Typography variant="subtitle2" fontWeight="bold">
                Select All ({activeSites.length} sites)
              </Typography>
            }
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            pr: 1, // avoid scrollbar overlap
          }}
        >
          <FormGroup>
            {activeSites.map((site) => (
              <FormControlLabel
                key={site.id}
                control={
                  <Checkbox checked={selectedSiteIds.includes(site.id)} onChange={() => handleToggleSite(site.id)} />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{site.siteTitle}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({site.siteUrl})
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Box>

        <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end" mt={SPACING.MEDIUM.PX}>
          <Button variant="outlined" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleStartScraping} disabled={loading || selectedSiteIds.length === 0}>
            {loading ? 'Starting...' : `Start Job Search (${selectedSiteIds.length} sites)`}
          </Button>
        </Stack>
      </Stack>
    </DefaultModal>
  )
}

export default JobSearchSetupModal
