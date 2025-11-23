import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { PromptDTO } from '../../../../shared/types'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import logger from '../../../logger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { createQueryKey } from '../../../utilities'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ImportSitesModalProps {
  id: typeof MODAL_ID.IMPORT_SITES_MODAL
}

interface ImportResult {
  url: string
  title?: string
  status: 'pending' | 'fetching-title' | 'creating-site' | 'success' | 'failed'
  error?: string
}

const isURLValid = (urlString: string): boolean => {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

const ImportSitesModal = (_props: ImportSitesModalProps) => {
  const [urls, setUrls] = useState('')
  const [promptId, setPromptId] = useState<string | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    currentUrl?: string
    results: ImportResult[]
  }>({ current: 0, total: 0, results: [] })
  const queryClient = useQueryClient()
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const resultItemsRef = useRef<(HTMLDivElement | null)[]>([])

  const showInputs = !loading && !isDone

  const { data: promptsData } = useQuery({
    queryKey: createQueryKey(QUERY_KEYS.PROMPTS, ['importSitesModal']),
    queryFn: async () => {
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.PROMPTS.GET_ALL, undefined)
      return result.prompts as PromptDTO[]
    },
    initialData: [],
  })

  useEffect(() => {
    if (promptsData.length > 0 && !promptId) {
      setPromptId(promptsData[0].id)
    }
  }, [promptsData, promptId])

  // Auto-scroll to the currently active item
  useEffect(() => {
    if (loading && progress.current < progress.total && progress.current > 0) {
      const currentIndex = progress.current - 1 // current is 0-based for the item being processed
      const itemElement = resultItemsRef.current[currentIndex]

      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'instant',
          block: 'start',
          inline: 'nearest',
        })
      }
    }
  }, [progress.current, loading, progress.total])

  const handleCloseModal = () => {
    setProgress({ current: 0, total: 0, results: [] })
    setError(null)
    setSuccess(null)
    activeModalSignal.value = null
  }

  const handleImport = async () => {
    setError(null)
    setSuccess(null)
    setProgress({ current: 0, total: 0, results: [] })
    setLoading(true)

    try {
      const selectedPrompt = promptsData.find((p) => p.id === promptId)
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

      // Initialize progress tracking
      const initialResults: ImportResult[] = urlList.map((url) => ({
        url,
        status: 'pending',
      }))

      setProgress({
        current: 0,
        total: urlList.length,
        results: initialResults,
      })

      // Process each URL with progress updates
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i]

        // Update current URL being processed
        setProgress((prev) => ({
          ...prev,
          current: i,
          currentUrl: url,
          results: prev.results.map((result, index) =>
            index === i ? { ...result, status: 'fetching-title' } : result,
          ),
        }))

        const isValid = isURLValid(url)
        if (!isValid) {
          failCount++
          const errorMsg = 'Invalid URL'
          logger.error(`Invalid URL provided: ${url}`)
          setProgress((prev) => ({
            ...prev,
            results: prev.results.map((result, index) =>
              index === i ? { ...result, status: 'failed', error: errorMsg } : result,
            ),
          }))
          continue
        }

        try {
          // Fetch title from main process to avoid CORS issues
          const titleResult = await ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.FETCH_PAGE_TITLE, { url })

          let title: string
          if (titleResult.success) {
            title = titleResult.title
          } else {
            // Fallback to hostname if title fetch fails
            try {
              title = new URL(url).hostname
            } catch {
              title = 'Untitled Site'
            }
            logger.warn(`Failed to fetch title for ${url}, using fallback: ${title}`)
          }

          // Update progress to show we're creating the site
          setProgress((prev) => ({
            ...prev,
            results: prev.results.map((result, index) =>
              index === i ? { ...result, status: 'creating-site', title } : result,
            ),
          }))

          const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SITES.CREATE, {
            siteTitle: title,
            siteUrl: url,
            promptId: selectedPrompt.id,
            selector: 'body',
            status: 'active',
          })

          if (result.success) {
            successCount++
            setProgress((prev) => ({
              ...prev,
              results: prev.results.map((result, index) =>
                index === i ? { ...result, status: 'success', title } : result,
              ),
            }))
          } else {
            failCount++
            const errorMsg = result.error || 'Unknown error'
            logger.error(`Failed to create site for ${url}:`, errorMsg)
            setProgress((prev) => ({
              ...prev,
              results: prev.results.map((result, index) =>
                index === i ? { ...result, status: 'failed', title, error: errorMsg } : result,
              ),
            }))
          }
        } catch (err) {
          failCount++
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          logger.error(`Error importing ${url}:`, err)
          setProgress((prev) => ({
            ...prev,
            results: prev.results.map((result, index) =>
              index === i ? { ...result, status: 'failed', error: errorMsg } : result,
            ),
          }))
        }
      }

      // Update final progress
      setProgress((prev) => ({
        ...prev,
        current: urlList.length,
        currentUrl: undefined,
      }))

      if (successCount > 0) {
        setSuccess(
          `Successfully imported ${successCount} site${successCount > 1 ? 's' : ''}${
            failCount > 0 ? `. Failed to import ${failCount}.` : ''
          }`,
        )
        if (successCount === urlList.length) {
          // If all sites were successful, clear the URLs
          setUrls('')
        }
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SITES] })
      } else {
        setError(`Failed to import all ${failCount} sites`)
      }
    } catch (err) {
      setError('An error occurred during import')
      logger.error(err)
    } finally {
      setLoading(false)
      setIsDone(true)
    }
  }

  return (
    <DefaultModal title="Import Sites">
      <Box sx={{ minWidth: 500, height: '80vh' }}>
        <Stack spacing={SPACING.MEDIUM.PX} sx={{ height: '100%' }}>
          {showInputs && (
            <Typography variant="body2" color="textSecondary">
              Enter one URL per line. The site title will be fetched automatically.
            </Typography>
          )}

          {showInputs && (
            <Typography variant="body2">Advanced Users: The selector will be set to &apos;body&apos;.</Typography>
          )}

          {loading && progress.total > 0 && (
            <Paper sx={{ p: SPACING.MEDIUM.PX, bgcolor: 'grey.50' }}>
              <Stack spacing={SPACING.SMALL.PX}>
                <Typography variant="subtitle2">
                  Processing Sites ({progress.current} of {progress.total})
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(progress.current / progress.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {progress.currentUrl && (
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                    Current: {progress.currentUrl}
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          {progress.results.length > 0 && (
            <Paper sx={{ p: SPACING.MEDIUM.PX, overflow: 'auto', flexGrow: 1 }} ref={resultsContainerRef}>
              <Typography variant="subtitle2" sx={{ mb: SPACING.SMALL.PX }}>
                Import Results
              </Typography>
              <Stack spacing={SPACING.SMALL.PX}>
                {progress.results.map((result, index) => {
                  // Ensure refs array is properly sized
                  if (resultItemsRef.current.length !== progress.results.length) {
                    resultItemsRef.current = new Array(progress.results.length).fill(null)
                  }

                  return (
                    <Box
                      key={result.url}
                      ref={(el) => {
                        resultItemsRef.current[index] = el as HTMLDivElement | null
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor:
                          result.status === 'fetching-title' || result.status === 'creating-site'
                            ? 'action.hover'
                            : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <Chip
                        size="small"
                        label={
                          result.status === 'pending'
                            ? 'Pending'
                            : result.status === 'fetching-title'
                              ? 'Fetching...'
                              : result.status === 'creating-site'
                                ? 'Creating...'
                                : result.status === 'success'
                                  ? 'Success'
                                  : 'Failed'
                        }
                        color={
                          result.status === 'success'
                            ? 'success'
                            : result.status === 'failed'
                              ? 'error'
                              : result.status === 'pending'
                                ? 'default'
                                : 'primary'
                        }
                        variant={result.status === 'pending' ? 'outlined' : 'filled'}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }} noWrap>
                          {result.title || result.url}
                        </Typography>
                        {result.error && (
                          <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                            {result.error}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </Paper>
          )}

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

          {showInputs && (
            <FormControl fullWidth required disabled={loading} size="small">
              <InputLabel>Prompt</InputLabel>
              <Select value={promptId} onChange={(e) => setPromptId(e.target.value)} label="Prompt">
                {promptsData.map((prompt) => (
                  <MenuItem key={prompt.id} value={prompt.id}>
                    {prompt.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {showInputs && (
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <TextField
                size="small"
                label="URLs"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                required
                fullWidth
                multiline
                rows={10}
                disabled={loading}
                placeholder={`https://example.com/careers
https://another-company.com/jobs
https://company.com/openings`}
                helperText="One URL per line"
              />
            </Box>
          )}

          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleCloseModal} disabled={loading}>
              {loading ? 'Cancel' : isDone ? 'Close' : 'Cancel'}
            </Button>
            {showInputs && (
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={loading || !urls.trim() || !promptId}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Importing...' : 'Import Sites'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default ImportSitesModal
