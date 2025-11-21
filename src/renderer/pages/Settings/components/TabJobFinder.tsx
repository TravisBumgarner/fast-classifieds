import { Alert, Box, Button, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { SPACING } from '../../../styles/consts'

const TabJobFinder = ({
  initialScrapeDelay,
  loadStoreSettings,
}: {
  initialScrapeDelay: number
  loadStoreSettings: () => Promise<void>
}) => {
  const [scrapeDelay, setScrapeDelay] = useState<number>(initialScrapeDelay)
  const [scrapeMessage, setScrapeMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const hasChanges = scrapeDelay !== initialScrapeDelay

  const handleSubmit = async () => {
    try {
      await ipcMessenger.invoke(CHANNEL_INVOKES.STORE.SET, {
        scrapeDelay,
      })
      setScrapeMessage({
        type: 'success',
        text: 'Scraper settings saved successfully',
      })
      loadStoreSettings()
    } catch {
      setScrapeMessage({
        type: 'error',
        text: 'Failed to save scraper settings',
      })
    }
  }

  return (
    <Box sx={{ p: SPACING.MEDIUM.PX }}>
      <Typography variant="subtitle2" gutterBottom>
        Scraper Configuration
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
        Configure how the scraper behaves when loading pages
      </Typography>

      {scrapeMessage && (
        <Alert severity={scrapeMessage.type} sx={{ mb: SPACING.MEDIUM.PX }}>
          {scrapeMessage.text}
        </Alert>
      )}

      <Stack spacing={SPACING.SMALL.PX}>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <TextField
            label="Page Load Delay (ms)"
            type="number"
            value={scrapeDelay}
            onChange={(e) => setScrapeDelay(Number(e.target.value))}
            placeholder="3000"
            fullWidth
            size="small"
            inputProps={{ min: 0, step: 100 }}
          />
          <Tooltip
            title={
              <span>
                Time to wait after the page selector appears before scraping content. Some sites load content
                dynamically after the initial page load. Increase this value if you&apos;re missing content, decrease it
                to speed up scraping.
              </span>
            }
            arrow
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="info" size={20} />
            </Box>
          </Tooltip>
        </Stack>

        <Button variant="contained" onClick={handleSubmit} fullWidth disabled={!hasChanges}>
          Save Scraper Settings
        </Button>
      </Stack>
    </Box>
  )
}

export default TabJobFinder
