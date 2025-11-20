import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import type { ScrapedContentDTO } from '../../../../shared/types'
import { TOOLTIPS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import logger from '../../../logger'
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
  scrapedContent,
  setScrapedContent,
  setScraping,
}: {
  url: string
  setUrl: (url: string) => void
  selector: string
  setSelector: (selector: string) => void
  siteTitle: string
  setSiteTitle: (siteTitle: string) => void
  scrapedContent: ScrapedContentDTO
  setScrapedContent: (scrapedContent: ScrapedContentDTO) => void
  setScraping: (scraping: boolean) => void
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [matchIndexes, setMatchIndexes] = useState<number[]>([])
  const [currentMatch, setCurrentMatch] = useState(0)
  const [highlightedHtml, setHighlightedHtml] = useState('')

  useEffect(() => {
    const raw = scrapedContent.map((i) => (i.link ? `${i.text} - ${i.link}` : i.text)).join('\n\n')

    if (!search || scrapedContent.length === 0) {
      setMatchIndexes([])
      setCurrentMatch(0)
      setHighlightedHtml(raw)
      return
    }

    const haystack = raw.toLowerCase()
    const needle = search.toLowerCase()

    const indexes: number[] = []
    let pos = haystack.indexOf(needle)
    while (pos !== -1) {
      indexes.push(pos)
      pos = haystack.indexOf(needle, pos + needle.length)
    }

    setMatchIndexes(indexes)
    setCurrentMatch(0)

    // highlight all
    const highlighted = raw.replace(
      new RegExp(needle, 'gi'),
      (match) => `<mark style="background:yellow">${match}</mark>`,
    )

    setHighlightedHtml(highlighted)
  }, [search, scrapedContent])

  useEffect(() => {
    if (matchIndexes.length === 0) return

    const el = document.getElementById('scrape-output')
    if (!el) return

    // find the Nth mark
    const marks = el.querySelectorAll('mark')
    const target = marks[currentMatch]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentMatch, matchIndexes])

  const goPrev = () => {
    if (matchIndexes.length === 0) return
    setCurrentMatch((i) => (i - 1 + matchIndexes.length) % matchIndexes.length)
  }

  const goNext = () => {
    if (matchIndexes.length === 0) return
    setCurrentMatch((i) => (i + 1) % matchIndexes.length)
  }

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
      setScraping(true)
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
      setScraping(false)
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

      <Box
        id="scrape-output"
        sx={{
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          p: SPACING.SMALL.PX,
          minHeight: 0,
          border: '1px solid #ccc',
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: The HTML here is generated on the backend.
        dangerouslySetInnerHTML={{
          __html: highlightedHtml || 'No HTML scraped yet.',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.SMALL.PX,
          mt: SPACING.SMALL.PX,
        }}
      >
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />

        <Tooltip title="Previous match" arrow>
          <IconButton size="small" onClick={goPrev} sx={{ cursor: 'pointer', opacity: matchIndexes.length ? 1 : 0.3 }}>
            <Icon name="left" size={20} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Next match" arrow>
          <IconButton size="small" onClick={goNext} sx={{ cursor: 'pointer', opacity: matchIndexes.length ? 1 : 0.3 }}>
            <Icon name="right" size={20} />
          </IconButton>
        </Tooltip>

        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', width: '60px' }}>
          {matchIndexes.length > 0 ? `${currentMatch + 1} / ${matchIndexes.length}` : '0 / 0'}
        </Typography>
      </Box>

      {error && <Message message={error} color="error" />}
    </Box>
  )
}

export default DebugSite
