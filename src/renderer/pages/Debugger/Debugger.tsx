import { Alert, Box, Button, Divider, Typography } from '@mui/material'
import { useState } from 'react'
import { CHANNEL } from '../../../shared/messages.types'
import ipcMessenger from '../../ipcMessenger'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import DebugAI from './components/DebugAI'
import DebugSite from './components/DebugSite'

const Debugger = () => {
  const [url, setUrl] = useState('http://localhost:3000')
  const [selector, setSelector] = useState('body')
  const [siteTitle, setSiteTitle] = useState('')
  const [scrapedHtml, setScrapedHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    try {
      setLoading(true)
      const title = siteTitle || new URL(url).hostname

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
    } catch (err) {
      setError('Failed to create site')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (error) return <Typography>Error.</Typography>

  return (
    <PageWrapper>
      <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Typography variant="subtitle2" gutterBottom>
          This app is in development and not well polished. This page will help
          you to debug the postings finder and share data to help me debug.
        </Typography>
      </Alert>

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          gap: SPACING.MEDIUM.PX,
        }}
      >
        <DebugSite
          url={url}
          setUrl={setUrl}
          selector={selector}
          setSelector={setSelector}
          siteTitle={siteTitle}
          setSiteTitle={setSiteTitle}
          scrapedHtml={scrapedHtml}
          setScrapedHtml={setScrapedHtml}
        />
        <Divider orientation="vertical" flexItem />

        <DebugAI url={url} scrapedHtml={scrapedHtml} />
      </Box>

      <Button
        variant="contained"
        onClick={handleSave}
        fullWidth
        disabled={loading || !url || !siteTitle || !selector}
      >
        Add Site
      </Button>
    </PageWrapper>
  )
}

export default Debugger
