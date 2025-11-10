import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ImportSitesModalProps {
  id: typeof MODAL_ID.IMPORT_SITES_MODAL
  onSuccess?: () => void
}

interface Prompt {
  id: number
  title: string
  content: string
}

const ImportSitesModal = (props: ImportSitesModalProps) => {
  const [urls, setUrls] = useState('')
  const [promptId, setPromptId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const result = await ipcMessenger.invoke(
        CHANNEL.PROMPTS.GET_ALL,
        undefined,
      )
      setPrompts(result.prompts)
      // Auto-select first prompt if available
      if (result.prompts.length > 0) {
        setPromptId(result.prompts[0].id)
      }
    } catch (err) {
      console.error('Failed to load prompts:', err)
    }
  }

  const fetchPageTitle = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, { mode: 'no-cors' })
      const html = await response.text()
      const match = html.match(/<title>([^<]*)<\/title>/)
      return match ? match[1].trim() : new URL(url).hostname
    } catch {
      // Fallback to hostname if fetch fails
      try {
        return new URL(url).hostname
      } catch {
        return 'Untitled Site'
      }
    }
  }

  const handleImport = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const selectedPrompt = prompts.find(p => p.id === promptId)
      if (!selectedPrompt) {
        setError('Please select a prompt')
        setLoading(false)
        return
      }

      // Parse URLs from textarea
      const urlList = urls
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (urlList.length === 0) {
        setError('Please enter at least one URL')
        setLoading(false)
        return
      }

      // Validate URLs
      const validUrls: string[] = []
      for (const url of urlList) {
        try {
          new URL(url)
          validUrls.push(url)
        } catch {
          console.warn(`Invalid URL: ${url}`)
        }
      }

      if (validUrls.length === 0) {
        setError('No valid URLs found')
        setLoading(false)
        return
      }

      // Fetch titles and create sites
      let successCount = 0
      let failCount = 0

      for (const url of validUrls) {
        try {
          const title = await fetchPageTitle(url)

          const result = await ipcMessenger.invoke(CHANNEL.SITES.CREATE, {
            siteTitle: title,
            siteUrl: url,
            prompt: selectedPrompt.content,
            selector: 'body',
          })

          if (result.success) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to create site for ${url}:`, result.error)
          }
        } catch (err) {
          failCount++
          console.error(`Error importing ${url}:`, err)
        }
      }

      if (successCount > 0) {
        setSuccess(
          `Successfully imported ${successCount} site${successCount > 1 ? 's' : ''}${
            failCount > 0 ? `. Failed to import ${failCount}.` : ''
          }`,
        )
        setUrls('')
        activeModalSignal.value = null
      } else {
        setError(`Failed to import all ${failCount} sites`)
      }
    } catch (err) {
      setError('An error occurred during import')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DefaultModal title="Import Sites">
      <Box sx={{ minWidth: 500 }}>
        <Stack spacing={SPACING.MEDIUM.PX}>
          <Typography variant="body2" color="textSecondary">
            Enter one URL per line. The site title will be fetched
            automatically, and the selector will be set to &apos;body&apos;.
          </Typography>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {success && (
            <Typography color="success.main" variant="body2">
              {success}
            </Typography>
          )}

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Prompt</InputLabel>
            <Select
              value={promptId}
              onChange={e => setPromptId(e.target.value as number)}
              label="Prompt"
            >
              {prompts.map(prompt => (
                <MenuItem key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="URLs"
            value={urls}
            onChange={e => setUrls(e.target.value)}
            required
            fullWidth
            multiline
            rows={8}
            disabled={loading}
            placeholder={`https://example.com/careers
https://another-company.com/jobs
https://company.com/openings`}
            helperText="One URL per line"
          />

          <Stack
            direction="row"
            spacing={SPACING.SMALL.PX}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              onClick={() => (activeModalSignal.value = null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={loading || !urls.trim() || !promptId}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Importing...' : 'Import Sites'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default ImportSitesModal
