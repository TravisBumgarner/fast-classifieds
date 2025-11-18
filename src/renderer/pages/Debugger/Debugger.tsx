import { Alert, Box, Button, Divider, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ScrapedContentDTO } from 'src/shared/types'
import { CHANNEL } from '../../../shared/messages.types'
import { ROUTES } from '../../consts'
import ipcMessenger from '../../ipcMessenger'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import { logger } from '../../utilities'
import DebugAI from './components/DebugAI'
import DebugSite from './components/DebugSite'

const Debugger = () => {
  const [url, setUrl] = useState('http://localhost:3000')
  const [selector, setSelector] = useState('body')
  const [siteTitle, setSiteTitle] = useState('local')
  const [scrapedContent, setScrapedContent] = useState<ScrapedContentDTO>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [params] = useSearchParams()
  const [promptId, setPromptId] = useState<string | null>(null)
  const siteId = params.get('site_id')
  const navigate = useNavigate()

  useEffect(() => {
    if (siteId) {
      // Load site data by siteId and populate fields
      ipcMessenger
        .invoke(CHANNEL.SITES.GET_BY_ID, { id: siteId })
        .then(({ site }) => {
          if (site) {
            setUrl(site.siteUrl)
            setSelector(site.selector)
            setSiteTitle(site.siteTitle)
            setPromptId(site.promptId)
          } else {
            setError('Site not found')
          }
        })
        .catch((err) => {
          setError('Failed to load site')
          logger.error(err)
        })
    }
  }, [siteId])

  const handleUpdate = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    if (promptId === null) {
      setError('Please select a prompt')
      return
    }

    if (!siteId) {
      setError('Missing site ID for update')
      return
    }

    try {
      setLoading(true)
      const title = siteTitle || new URL(url).hostname

      const result = await ipcMessenger.invoke(CHANNEL.SITES.UPDATE, {
        id: siteId,
        siteTitle: title,
        siteUrl: url,
        selector,
        promptId,
        status: 'inactive',
      })

      if (result.success) {
        navigate(ROUTES.sites.href())
        setError(null)
      } else {
        setError(result.error || 'Failed to create site')
      }
    } catch (err) {
      setError('Failed to create site')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    if (promptId === null) {
      setError('Please select a prompt')
      return
    }

    try {
      setLoading(true)
      const title = siteTitle || new URL(url).hostname

      const result = await ipcMessenger.invoke(CHANNEL.SITES.CREATE, {
        siteTitle: title,
        siteUrl: url,
        selector,
        promptId,
        status: 'inactive',
      })

      if (result.success) {
        setError(null)
        navigate(ROUTES.sites.href())
      } else {
        setError(result.error || 'Failed to create site')
      }
    } catch (err) {
      setError('Failed to create site')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Typography variant="subtitle2" gutterBottom>
          This app is in development and not well polished. This page will help you to debug the postings finder and
          share data to help me debug.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: SPACING.MEDIUM.PX }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          gap: SPACING.MEDIUM.PX,
          marginBottom: SPACING.MEDIUM.PX,
        }}
      >
        <DebugSite
          setScraping={setScraping}
          url={url}
          setUrl={setUrl}
          selector={selector}
          setSelector={setSelector}
          siteTitle={siteTitle}
          setSiteTitle={setSiteTitle}
          scrapedContent={scrapedContent}
          setScrapedContent={setScrapedContent}
        />
        <Divider orientation="vertical" flexItem />

        <DebugAI
          scraping={scraping}
          url={url}
          scrapedContent={scrapedContent}
          promptId={promptId}
          setPromptId={setPromptId}
        />
      </Box>

      <Button
        variant="contained"
        onClick={siteId ? handleUpdate : handleSave}
        fullWidth
        disabled={loading || !url || !siteTitle || !selector}
      >
        {siteId ? 'Update Site' : 'Add Site'}
      </Button>
    </PageWrapper>
  )
}

export default Debugger
