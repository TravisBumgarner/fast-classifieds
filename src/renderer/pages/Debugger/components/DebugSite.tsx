import { Box, Button, Stack, TextField, Tooltip } from '@mui/material'
import { logger } from '@sentry/electron'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import { TOOLTIPS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import Message from '../../../sharedComponents/Message'
import { SPACING } from '../../../styles/consts'

const DebugSite = ({
  url,
  setUrl,
  selector,
  setSelector,
  siteTitle,
  setSiteTitle,
  scrapedHtml,
  setScrapedHtml,
}: {
  url: string
  setUrl: (url: string) => void
  selector: string
  setSelector: (selector: string) => void
  siteTitle: string
  setSiteTitle: (siteTitle: string) => void
  scrapedHtml: string
  setScrapedHtml: (html: string) => void
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (url) {
      try {
        setSiteTitle(new URL(url).hostname)
      } catch {
        logger.error('Invalid URL provided')
      }
    }
  }, [url, setSiteTitle])

  const handleTest = async () => {
    setError(null)
    setScrapedHtml('')

    if (!url) {
      setError('Please enter a URL')
      return
    }

    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.DEBUG.SCRAPE, {
        url,
        selector,
      })

      if (result.success) {
        const formatted = result.html
          ? result.html
              .replace(/></g, '>\n<')
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n')
          : ''
        setScrapedHtml(formatted)
      } else {
        setError(result.error || 'Failed to scrape')
      }
    } catch {
      setError('Failed to scrape site')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={SPACING.SMALL.PX}>
        <TextField
          size="small"
          fullWidth
          label="URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
        />

        <TextField
          size="small"
          fullWidth
          label="Site Title"
          value={siteTitle}
          onChange={e => setSiteTitle(e.target.value)}
        />

        <TextField
          size="small"
          fullWidth
          label="CSS Selector"
          value={selector}
          onChange={e => setSelector(e.target.value)}
        />

        <Tooltip title={TOOLTIPS.CSS_SELECTOR} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="info" size={20} />
          </Box>
        </Tooltip>
      </Stack>

      <Button
        variant="contained"
        onClick={handleTest}
        disabled={loading || !url}
        fullWidth
        sx={{ mt: SPACING.SMALL.PX }}
      >
        {loading ? 'Scraping...' : 'Scrape'}
      </Button>

      {/* SCROLL REGION */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          mt: SPACING.SMALL.PX,
          p: SPACING.SMALL.PX,
          minHeight: 0,
          border: '1px solid #ccc',
        }}
      >
        {scrapedHtml || 'No HTML scraped yet.'}
      </Box>

      {error && <Message message={error} color="error" />}
    </Box>
  )
}

export default DebugSite
