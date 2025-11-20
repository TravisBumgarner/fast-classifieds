import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import type { PromptDTO } from '../../../../shared/types'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ImportSitesModalProps {
  id: typeof MODAL_ID.IMPORT_SITES_MODAL
}

const ImportSitesModal = (_props: ImportSitesModalProps) => {
  const [urls, setUrls] = useState('')
  const [promptId, setPromptId] = useState<string | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [failedDetails, setFailedDetails] = useState<Array<{ url: string; error: string }>>([])
  const [showFailures, setShowFailures] = useState(false)
  const [progressTotal, setProgressTotal] = useState<number | null>(null)
  const [progressProcessed, setProgressProcessed] = useState(0)
  const [prompts, setPrompts] = useState<PromptDTO[]>([])
  const queryClient = useQueryClient()

  const loadPrompts = useCallback(async () => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.GET_ALL, undefined)
      setPrompts(result.prompts)
      // Auto-select first prompt if available
      if (result.prompts.length > 0) {
        setPromptId(result.prompts[0].id)
      }
    } catch (err) {
      logger.error('Failed to load prompts:', err)
    }
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  useEffect(() => {
    if (!loading) return
    const unsubscribe = window.electron.ipcRenderer.on('sites:import-progress', (data) => {
      if (typeof data.total === 'number') setProgressTotal(data.total)
      setProgressProcessed(data.processed)
    })
    return () => {
      unsubscribe()
    }
  }, [loading])

  // Title fetching now handled in main process (bulk import IPC)

  const handleCloseModal = () => {
    activeModalSignal.value = null
  }

  const handleImport = async () => {
    setError(null)
    setSuccess(null)
    setFailedDetails([])
    setProgressTotal(null)
    setProgressProcessed(0)
    setLoading(true)

    try {
      const selectedPrompt = prompts.find((p) => p.id === promptId)
      if (!selectedPrompt) {
        setError('Please select a prompt')
        setLoading(false)
        return
      }

      // Parse URLs from textarea
      const urlList = urls
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

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
          logger.error(`Invalid URL: ${url}`)
        }
      }

      if (validUrls.length === 0) {
        setError('No valid URLs found')
        setLoading(false)
        return
      }

      // Bulk import via main process
      const result = await ipcMessenger.invoke(CHANNEL.SITES.IMPORT_BULK, {
        promptId: selectedPrompt.id,
        urls: validUrls,
      })

      const successCount = result.created.length
      const failCount = result.failed.length
      setFailedDetails(result.failed)

      if (successCount > 0) {
        setSuccess(
          `Successfully imported ${successCount} site${successCount > 1 ? 's' : ''}${
            failCount > 0 ? `. Failed to import ${failCount}.` : ''
          }`,
        )
        setUrls('')
        activeModalSignal.value = null
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SITES] })
      } else {
        setError(
          failCount > 0 ? `Failed to import all ${failCount} site${failCount > 1 ? 's' : ''}` : 'No sites imported',
        )
      }
    } catch (err) {
      setError('An error occurred during import')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyFailures = async () => {
    try {
      const text = failedDetails.map((f) => `${f.url} \t${f.error}`).join('\n')
      await navigator.clipboard.writeText(text)
      setSuccess((prev) => (prev ? prev + ' (Failure list copied)' : 'Failure list copied'))
    } catch (err) {
      logger.error('Failed to copy failures', err)
    }
  }

  return (
    <DefaultModal title="Import Sites">
      <Box sx={{ minWidth: 500 }}>
        <Stack spacing={SPACING.MEDIUM.PX}>
          <Typography variant="body2" color="textSecondary">
            Enter one URL per line. The site title will be fetched automatically.
          </Typography>

          <Typography variant="body2">Advanced Users: The selector will be set to &apos;body&apos;.</Typography>

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

          {failedDetails.length > 0 && (
            <Stack spacing={SPACING.SMALL.PX}>
              <Button size="small" variant="text" onClick={() => setShowFailures((s) => !s)}>
                {showFailures ? 'Hide Failed URLs' : `Show Failed (${failedDetails.length})`}
              </Button>
              {showFailures && (
                <Box
                  sx={{
                    maxHeight: 160,
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack spacing={0.5}>
                    {failedDetails.map((f) => (
                      <Typography key={f.url} variant="caption" color="error">
                        {f.url} – {f.error}
                      </Typography>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end" mt={1}>
                    <Button size="small" variant="outlined" onClick={handleCopyFailures}>
                      Copy Failed List
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          {loading && progressTotal && progressTotal > 0 && (
            <Stack spacing={SPACING.SMALL.PX}>
              <LinearProgress variant="determinate" value={(progressProcessed / progressTotal) * 100} />
              <Typography variant="caption" color="textSecondary">
                Imported {progressProcessed} / {progressTotal}
              </Typography>
            </Stack>
          )}

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Prompt</InputLabel>
            <Select value={promptId} onChange={(e) => setPromptId(e.target.value)} label="Prompt">
              {prompts.map((prompt) => (
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
            onChange={(e) => setUrls(e.target.value)}
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

          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleCloseModal} disabled={loading}>
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
