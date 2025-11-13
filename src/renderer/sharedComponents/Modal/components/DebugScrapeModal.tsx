import { Box, Button, Paper, Stack, TextField, Tooltip } from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import { TOOLTIPS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import { SPACING } from '../../../styles/consts'
import Icon from '../../Icon'
import Message from '../../Message'
import DefaultModal from './DefaultModal'

interface DebugScrapeModalProps {
  siteId?: number
}

const DebugScrapeModal = ({ siteId }: DebugScrapeModalProps) => {
  const [url, setUrl] = useState('')
  const [selector, setSelector] = useState('body')
  const [siteTitle, setSiteTitle] = useState('')
  const [scrapedHtml, setScrapedHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedSite, setHasLoadedSite] = useState(false)
  const [hasUserEdited, setHasUserEdited] = useState(false)

  // Auto-generate title from URL
  useEffect(() => {
    if (url && !siteId) {
      try {
        const hostname = new URL(url).hostname
        setSiteTitle(hostname)
      } catch {
        // Invalid URL, don't update title
      }
    }
  }, [url, siteId])

  useEffect(() => {
    const loadSite = async () => {
      if (siteId && !hasLoadedSite) {
        try {
          const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_BY_ID, {
            id: siteId,
          })
          if (result.site) {
            setUrl(result.site.siteUrl)
            setSelector(result.site.selector)
            setSiteTitle(result.site.siteTitle)
          }
          setHasLoadedSite(true)
        } catch (err) {
          setError('Failed to load site')
          console.error(err)
        }
      }
    }
    loadSite()
  }, [siteId, hasLoadedSite])

  const handleTest = async () => {
    setError(null)
    setScrapedHtml('')

    if (!url) {
      setError('Please enter a URL')
      return
    }

    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.SCRAPER.DEBUG_SCRAPE, {
        url,
        selector,
      })

      if (result.success) {
        // Pretty print the HTML
        const formatted = result.html
          ? result.html
              .replace(/></g, '>\n<') // Add newlines between tags
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n')
          : ''
        setScrapedHtml(formatted)
      } else {
        setError(result.error || 'Failed to scrape')
      }
    } catch (err) {
      setError('Failed to scrape site')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    try {
      setLoading(true)
      const title = siteTitle || new URL(url).hostname

      if (siteId) {
        // Update existing site
        const result = await ipcMessenger.invoke(CHANNEL.SITES.UPDATE, {
          id: siteId,
          siteTitle: title,
          siteUrl: url,
          selector,
          prompt: '',
          status: 'inactive',
        })

        if (result.success) {
          setError(null)
        } else {
          setError(result.error || 'Failed to update site')
        }
      } else {
        // Create new site
        const result = await ipcMessenger.invoke(CHANNEL.SITES.CREATE, {
          siteTitle: title,
          siteUrl: url,
          selector,
          prompt: '',
          status: 'inactive',
        })

        if (result.success) {
          setError(null)
        } else {
          setError(result.error || 'Failed to create site')
        }
      }
    } catch (err) {
      setError(`Failed to ${siteId ? 'update' : 'create'} site`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange =
    (setter: (value: string) => void) => (value: string) => {
      setter(value)
      setHasUserEdited(true)
    }

  return (
    <DefaultModal
      title={siteId ? 'Debug & Update Site' : 'Debug & Add Site'}
      sx={{ width: '800px', maxWidth: '90%' }}
    >
      <Stack spacing={SPACING.MEDIUM.PX} sx={{ mt: 1 }}>
        <Stack direction="row" spacing={SPACING.SMALL.PX}>
          <TextField
            size="small"
            fullWidth
            label="URL"
            value={url}
            onChange={e => handleFieldChange(setUrl)(e.target.value)}
            placeholder="https://example.com"
          />

          <TextField
            size="small"
            fullWidth
            label="Site Title"
            value={siteTitle}
            onChange={e => handleFieldChange(setSiteTitle)(e.target.value)}
            placeholder="Auto-generated from URL"
          />

          <TextField
            size="small"
            fullWidth
            label="CSS Selector"
            value={selector}
            onChange={e => handleFieldChange(setSelector)(e.target.value)}
            placeholder="body"
          />
          <Tooltip title={TOOLTIPS.CSS_SELECTOR} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="info" size={20} />
            </Box>
          </Tooltip>
        </Stack>
        <Paper sx={{ p: SPACING.MEDIUM.PX }}>
          <Box
            component="pre"
            sx={{
              p: SPACING.SMALL.PX,
              borderRadius: 1,
              overflow: 'auto',
              height: '400px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {scrapedHtml}
          </Box>
        </Paper>

        <Stack direction="row" spacing={SPACING.SMALL.PX}>
          <Button
            variant="contained"
            onClick={handleTest}
            disabled={loading || !url}
            fullWidth
          >
            {loading ? 'Testing...' : 'Test'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleSave}
            fullWidth
            disabled={
              loading || !url || !siteTitle || !selector || !hasUserEdited
            }
          >
            {siteId ? 'Update' : 'Add'}
          </Button>
        </Stack>

        {error && <Message message={error} color="error" />}
      </Stack>
    </DefaultModal>
  )
}

export default DebugScrapeModal
