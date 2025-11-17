import { Box, Button, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import type { ScrapedContentDTO } from 'src/shared/types'
import { CHANNEL } from '../../../../shared/messages.types'
import { TOOLTIPS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import Message from '../../../sharedComponents/Message'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'

const DebugSite = ({
  url,
  setUrl,
  selector,
  setSelector,
  siteTitle,
  setSiteTitle,
  scrapedContent,
  setScrapedContent,
}: {
  url: string
  setUrl: (url: string) => void
  selector: string
  setSelector: (selector: string) => void
  siteTitle: string
  setSiteTitle: (siteTitle: string) => void
  scrapedContent: ScrapedContentDTO
  setScrapedContent: (scrapedContent: ScrapedContentDTO) => void
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUrlAndTitleSync = () => {
    if (!siteTitle) {
      try {
        setSiteTitle(new URL(url).hostname)
      } catch {
        logger.error('Invalid URL provided')
      }
    }
  }

  const handleTest = async () => {
    setError(null)
    setScrapedContent([])

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
        setScrapedContent(result.scrapedContent)
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
        gap: SPACING.SMALL.PX,
      }}
    >
      <Stack direction="row" spacing={SPACING.SMALL.PX}>
        <TextField
          size="small"
          fullWidth
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          onBlur={handleUrlAndTitleSync}
          type="url"
        />

        <TextField
          size="small"
          fullWidth
          label="Site Title"
          value={siteTitle}
          onChange={(e) => setSiteTitle(e.target.value)}
        />
      </Stack>
      <Stack direction="row" spacing={SPACING.SMALL.PX}>
        <TextField
          size="small"
          fullWidth
          label="CSS Selector"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
        />
        <Typography variant="body2">
          New to selectors?{' '}
          <a
            href="https://www.youtube.com/watch?v=4rQ9Alr6GIk&feature=youtu.be"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'underline',
            }}
            onClick={(e) => {
              e.preventDefault()
              window.electron.shell.openExternal('https://www.youtube.com/watch?v=4rQ9Alr6GIk&feature=youtu.be')
            }}
          >
            Watch the tutorial
          </a>
        </Typography>

        <Tooltip title={TOOLTIPS.CSS_SELECTOR} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="info" size={20} />
          </Box>
        </Tooltip>
      </Stack>

      <Button variant="contained" onClick={handleTest} disabled={loading || !url} fullWidth>
        {loading ? 'Scraping...' : 'Scrape'}
      </Button>

      {/* SCROLL REGION */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          p: SPACING.SMALL.PX,
          minHeight: 0,
          border: '1px solid #ccc',
        }}
      >
        {scrapedContent.length > 0
          ? scrapedContent.map((item) => (item.link ? `${item.text} - ${item.link}` : item.text)).join('\n\n')
          : 'No HTML scraped yet.'}
      </Box>

      {error && <Message message={error} color="error" />}
    </Box>
  )
}

export default DebugSite
